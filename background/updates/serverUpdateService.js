/**
 * SocialFocus
 * Copyright © 2026 Yevhen Tretiakov. All rights reserved.
 *
 * This source code is proprietary and confidential.
 * Unauthorized copying, modification, distribution, or use is strictly prohibited.
 */

import { localStateKeys, storageKeys } from "../../shared/constants/storageKeys.js";
import { compareVersions } from "../../shared/lifecycle/lifecycleConstants.js";
import {
  createServerUpdateMeta,
  getRetryDelay,
  resolveServerUpdateIntervalMs,
  SERVER_UPDATE_TEST_DELAYS_MS,
} from "./serverUpdateConstants.js";
import { validatePartialOptionsPayload } from "./optionsUpdateValidator.js";

function safeErrorCode(error) {
  return typeof error?.message === "string" && error.message
    ? error.message.slice(0, 120)
    : "server_update_failed";
}

function applyReleases(catalog, releases) {
  const next = { desktop: catalog.desktop.map((item) => ({ ...item })), mobile: catalog.mobile.map((item) => ({ ...item })) };
  for (const release of releases) {
    const target = release.is_mobile ? next.mobile : next.desktop;
    const index = target.findIndex((item) => item.settings_id === release.id);
    if (index < 0) throw new Error("server_update_option_not_in_catalog");
    target[index] = { ...target[index], styles: release.styles };
  }
  return next;
}

export function createServerUpdateService({ repository, fetchUpdates, loadOptions, rebuildRuntimeSnapshot, scheduleAlarm, clock = { now: () => Date.now() } }) {
  let updatePromise = null;

  async function overrideNextCheck(delayMs) {
    if (!SERVER_UPDATE_TEST_DELAYS_MS.includes(delayMs)) {
      throw new Error("server_update_invalid_test_delay");
    }
    const now = clock.now();
    const store = await repository.getAll();
    if (store[storageKeys.lifecycleMeta]?.optionsReleaseOverride) {
      throw new Error("release_override_active");
    }
    const nextCheckAt = now + delayMs;
    const meta = createServerUpdateMeta(store[storageKeys.serverUpdateMeta]);
    await repository.set({
      [storageKeys.serverUpdateMeta]: { ...meta, nextCheckAt },
    });
    await scheduleAlarm(nextCheckAt);
    return { scheduled: true, delayMs, nextCheckAt };
  }

  async function run({ force = false } = {}) {
    const now = clock.now();
    const store = await repository.getAll();
    const meta = createServerUpdateMeta(store[storageKeys.serverUpdateMeta]);
    if (store[storageKeys.lifecycleMeta]?.optionsReleaseOverride) {
      return { checked: false, reason: "release_override_active", meta };
    }
    if (!force && meta.nextCheckAt > now) {
      await scheduleAlarm(meta.nextCheckAt);
      return { checked: false, reason: "not_due", meta };
    }
    const bundled = await loadOptions();
    const lifecycle = store[storageKeys.lifecycleMeta] ?? {};
    const currentVersion = meta.lastAppliedVersion || lifecycle.optionsVersion || bundled.optionsVersion;
    try {
      const validated = validatePartialOptionsPayload(await fetchUpdates({ version: currentVersion }), { knownOptionIds: new Set(bundled.definitions.keys()) });
      const nextVersion = validated.version || currentVersion;
      if (compareVersions(nextVersion, currentVersion) < 0) throw new Error("server_update_version_regression");
      const latest = await repository.getAll();
      const latestLifecycle = latest[storageKeys.lifecycleMeta] ?? {};
      if (compareVersions(nextVersion, latestLifecycle.optionsVersion ?? currentVersion) < 0)
        throw new Error("server_update_version_regression");
      const storedCatalog = latest[storageKeys.remoteOptionsData];
      const catalog = storedCatalog?.desktop?.length && storedCatalog?.mobile?.length
        ? storedCatalog
        : bundled.remoteOptionsData;
      const nextCatalog = validated.releases.length ? applyReleases(catalog, validated.releases) : catalog;
      const isPro = Boolean(latest[storageKeys.notSyncingState]?.[localStateKeys.isUserPro]);
      const intervalMs = resolveServerUpdateIntervalMs(validated.updatePolicy, isPro);
      const nextCheckAt = now + intervalMs;
      const nextMeta = createServerUpdateMeta({ lastCheckedAt: now, nextCheckAt,
        lastAppliedVersion: nextVersion,
        policySource: validated.updatePolicy
          ? (validated.updatePolicy.revision > 0 ? "server" : "server_fallback")
          : "client_fallback",
        policyRevision: validated.updatePolicy?.revision ?? 0,
        policyIntervalSeconds: intervalMs / 1000 });
      await repository.set({ [storageKeys.remoteOptionsData]: nextCatalog, [storageKeys.serverUpdateMeta]: nextMeta,
        [storageKeys.lifecycleMeta]: { ...latestLifecycle, optionsVersion: nextVersion } });
      if (validated.releases.length || compareVersions(nextVersion, currentVersion) > 0) await rebuildRuntimeSnapshot();
      await scheduleAlarm(nextCheckAt);
      return {
        checked: true,
        applied: validated.releases.length,
        meta: nextMeta,
      };
    } catch (error) {
      const retryCount = meta.retryCount + 1;
      const nextCheckAt = now + getRetryDelay(retryCount);
      await repository.set({ [storageKeys.serverUpdateMeta]: createServerUpdateMeta({ ...meta, lastCheckedAt: now, nextCheckAt,
        retryCount, nextRetryAt: nextCheckAt, lastError: safeErrorCode(error) }) });
      await scheduleAlarm(nextCheckAt);
      throw error;
    }
  }
  return {
    check(options = {}) {
      if (!updatePromise) {
        updatePromise = run(options).finally(() => {
          updatePromise = null;
        });
      }
      return updatePromise;
    },
    overrideNextCheck,
  };
}

/**
 * SocialFocus
 * Copyright © 2026 Yevhen Tretiakov. All rights reserved.
 *
 * This source code is proprietary and confidential.
 * Unauthorized copying, modification, distribution, or use is strictly prohibited.
 */

import { storageKeys } from "../../shared/constants/storageKeys.js";
import {
  compareVersions,
  createLifecycleMeta,
  CURRENT_STORAGE_SCHEMA_VERSION,
  isRuntimeSnapshotCompatible,
} from "../../shared/lifecycle/lifecycleConstants.js";
import { createV0ToV1MigrationPlan } from "../../shared/migrations/migrateV0ToV1.js";
import { buildRuntimeSnapshot } from "../../shared/runtime/buildRuntimeSnapshot.js";

function createDefaultOptionsState(definitions) {
  const state = {};
  for (const definition of definitions.values()) {
    const defaultValue = definition.option?.defaultValue;
    if (defaultValue === undefined) continue;
    if (definition.categoryId === "global") {
      state[definition.id] = defaultValue;
    } else {
      state[definition.categoryId] ??= {};
      state[definition.categoryId][definition.id] = defaultValue;
    }
  }
  return state;
}

function repairOptionsState(current, definitions) {
  const defaults = createDefaultOptionsState(definitions);
  const source = current && typeof current === "object" ? current : {};
  const repaired = { ...defaults, ...source };

  for (const [categoryId, categoryDefaults] of Object.entries(defaults)) {
    if (!categoryDefaults || typeof categoryDefaults !== "object") continue;
    repaired[categoryId] = {
      ...categoryDefaults,
      ...(source[categoryId] && typeof source[categoryId] === "object"
        ? source[categoryId]
        : {}),
    };
  }

  return {
    state: repaired,
    changed: JSON.stringify(repaired) !== JSON.stringify(source),
  };
}

function hasCompleteCatalog(catalog) {
  return Boolean(
    catalog &&
      Array.isArray(catalog.desktop) &&
      catalog.desktop.length > 0 &&
      Array.isArray(catalog.mobile) &&
      catalog.mobile.length > 0,
  );
}

export function createLifecycleCoordinator({
  repository,
  loadOptions,
  extensionVersion,
  clock = { now: () => Date.now() },
}) {
  let readinessPromise = null;
  let forceSnapshotRequested = false;

  async function run({ forceSnapshot = false } = {}) {
    let store = await repository.getAll();
    const bundled = await loadOptions();
    const storedMeta = store[storageKeys.lifecycleMeta] ?? {};
    let meta = createLifecycleMeta({
      ...storedMeta,
      extensionVersion,
      optionsVersion: storedMeta.optionsVersion ?? "",
    });

    if (meta.storageSchemaVersion < CURRENT_STORAGE_SCHEMA_VERSION) {
      meta = {
        ...meta,
        migrationJournal: {
          fromVersion: meta.storageSchemaVersion,
          toVersion: CURRENT_STORAGE_SCHEMA_VERSION,
          phase: "prepared",
          startedAt: clock.now(),
        },
      };
      await repository.set({ [storageKeys.lifecycleMeta]: meta });

      const plan = createV0ToV1MigrationPlan({
        store,
        definitions: bundled.definitions,
      });
      if (Object.keys(plan.writes).length) await repository.set(plan.writes);
      if (plan.removeKeys.length) await repository.remove(plan.removeKeys);
      meta = {
        ...meta,
        storageSchemaVersion: CURRENT_STORAGE_SCHEMA_VERSION,
        migrationJournal: { ...meta.migrationJournal, phase: "written" },
      };
      await repository.set({ [storageKeys.lifecycleMeta]: meta });
      store = await repository.getAll();
    }

    const storedCatalog = store[storageKeys.remoteOptionsData];
    const storedVersion = store[storageKeys.lifecycleMeta]?.optionsVersion ?? "";
    const optionsReleaseOverride =
      store[storageKeys.lifecycleMeta]?.optionsReleaseOverride ?? null;
    const refreshCatalog =
      !hasCompleteCatalog(storedCatalog) ||
      (!optionsReleaseOverride &&
        compareVersions(bundled.optionsVersion, storedVersion) > 0);
    const remoteOptionsData = refreshCatalog
      ? bundled.remoteOptionsData
      : storedCatalog;
    const optionsVersion = refreshCatalog
      ? bundled.optionsVersion
      : storedVersion || bundled.optionsVersion;
    if (refreshCatalog) {
      await repository.set({ [storageKeys.remoteOptionsData]: remoteOptionsData });
    }

    const repairedOptions = repairOptionsState(
      store[storageKeys.optionsState],
      bundled.definitions,
    );
    const removedLegacyTesterFlag = Object.prototype.hasOwnProperty.call(
      repairedOptions.state,
      "socialFocus_get_testers_release",
    );
    delete repairedOptions.state.socialFocus_get_testers_release;
    const optionsState = repairedOptions.state;
    if (repairedOptions.changed || removedLegacyTesterFlag) {
      await repository.set({ [storageKeys.optionsState]: optionsState });
    }

    const currentSnapshot = store[storageKeys.runtimeSnapshot];
    const compatible = isRuntimeSnapshotCompatible(currentSnapshot, {
      extensionVersion,
      optionsVersion,
    });
    let snapshot = currentSnapshot;
    let rebuiltSnapshot = false;
    if (forceSnapshot || refreshCatalog || !compatible) {
      const revision =
        Math.max(meta.snapshotRevision ?? 0, currentSnapshot?.revision ?? 0) + 1;
      snapshot = buildRuntimeSnapshot({
        optionsState,
        remoteOptionsData,
        extensionVersion,
        optionsVersion,
        revision,
        createdAt: clock.now(),
      });
      rebuiltSnapshot = true;
      meta = { ...meta, snapshotRevision: revision };
      await repository.set({ [storageKeys.runtimeSnapshot]: snapshot });
    }

    meta = {
      ...meta,
      storageSchemaVersion: CURRENT_STORAGE_SCHEMA_VERSION,
      extensionVersion,
      optionsVersion,
      snapshotRevision: snapshot.revision,
      migrationJournal: null,
      lastReadyAt: clock.now(),
      lastError: null,
    };
    await repository.set({ [storageKeys.lifecycleMeta]: meta });
    return { ready: true, rebuiltSnapshot, lifecycleMeta: meta, snapshot };
  }

  return {
    ensureRuntimeReady(options = {}) {
      if (options.forceSnapshot) forceSnapshotRequested = true;
      if (!readinessPromise) {
        readinessPromise = (async () => {
          let result;
          do {
            const forceSnapshot = forceSnapshotRequested;
            forceSnapshotRequested = false;
            result = await run({ forceSnapshot });
          } while (forceSnapshotRequested);
          return result;
        })()
          .catch(async (error) => {
            const store = await repository.getAll();
            const currentMeta = createLifecycleMeta({
              ...store[storageKeys.lifecycleMeta],
            });
            await repository.set({
              [storageKeys.lifecycleMeta]: {
                ...currentMeta,
                lastError:
                  typeof error?.message === "string" && error.message
                    ? error.message.slice(0, 120)
                    : "runtime_readiness_failed",
              },
            });
            throw error;
          })
          .finally(() => {
            readinessPromise = null;
          });
      }
      return readinessPromise;
    },
  };
}

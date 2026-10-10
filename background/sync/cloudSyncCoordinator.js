/**
 * SocialFocus
 * Copyright © 2026 Yevhen Tretiakov. All rights reserved.
 *
 * This source code is proprietary and confidential.
 * Unauthorized copying, modification, distribution, or use is strictly prohibited.
 */

import {
  localStateKeys,
  sharedStateKeys,
  storageKeys,
  systemBuckets,
} from "../../shared/constants/storageKeys.js";
import {
  deserializeFeaturesSettings,
  mergeApplyPayloadWithLocal,
  serializeFeaturesSettings,
} from "../../shared/sync/syncSerialization.js";
import { syncableStorageRoots } from "../../shared/constants/stateBuckets.js";
import {
  canUseCloudSync,
  getSyncFields,
  shouldApplyRemoteSettings,
} from "../../shared/sync/syncApply.js";
import { filterSyncValue } from "../../shared/sync/syncFilter.js";
import { createCloudSyncMeta, getCloudSyncRetryDelay } from "./cloudSyncConstants.js";

function context(store) {
  const system = store[storageKeys.system] ?? {};
  const shared = system[systemBuckets.sharedState] ?? {};
  const local = store[storageKeys.notSyncingState] ?? {};
  const cloudSetting = local[localStateKeys.isCloudSyncing];
  return {
    local,
    uuid: shared[sharedStateKeys.userUniqueIdentifier] ?? "",
    lastSync: local[localStateKeys.lastSyncingDate] ?? "0",
    eligible: canUseCloudSync({
      appIsPro: local[localStateKeys.isUserPro] ?? false,
      uuid: shared[sharedStateKeys.userUniqueIdentifier] ?? "",
      isCloudSyncing: cloudSetting,
      isEnableExtension: local[localStateKeys.extensionIsEnabled] ?? true,
    }),
  };
}

function safeErrorCode(error) {
  return typeof error?.message === "string" && error.message
    ? error.message.slice(0, 120)
    : "cloud_sync_failed";
}

export function createCloudSyncCoordinator({
  repository,
  fetchSettings,
  updateSettings,
  rebuildRuntimeSnapshot,
  scheduleRetry,
  clock = { now: () => Date.now() },
}) {
  let queue = Promise.resolve();
  let localGeneration = 0;

  function serializeStore(store) {
    return serializeFeaturesSettings({
      store,
      storageEntityKeysList: syncableStorageRoots,
      filterObjectRecursively: filterSyncValue,
    });
  }

  async function clearRetry(lastSuccessAt = 0) {
    await repository.set({
      [storageKeys.cloudSyncMeta]: createCloudSyncMeta({ lastSuccessAt }),
    });
  }

  async function saveSuccess(store, timestamp) {
    const current = context(store);
    await repository.set({
      [storageKeys.notSyncingState]: {
        ...current.local,
        [localStateKeys.lastSyncingDate]: String(timestamp),
      },
      [storageKeys.cloudSyncMeta]: createCloudSyncMeta({ lastSuccessAt: timestamp }),
    });
  }

  async function saveFailure(operation, error) {
    const store = await repository.getAll();
    const current = createCloudSyncMeta(store[storageKeys.cloudSyncMeta]);
    const retryCount = current.retryCount + 1;
    const nextRetryAt = clock.now() + getCloudSyncRetryDelay(retryCount);
    await repository.set({
      [storageKeys.cloudSyncMeta]: createCloudSyncMeta({
        ...current,
        pendingOperation: operation,
        retryCount,
        nextRetryAt,
        lastError: safeErrorCode(error),
      }),
    });
    await scheduleRetry(nextRetryAt);
  }

  async function pull() {
    const generation = localGeneration;
    const before = await repository.getAll();
    const initial = context(before);
    if (!initial.eligible) {
      await clearRetry();
      return { synced: false, reason: "not_eligible" };
    }
    try {
      const remote = await fetchSettings({
        fields: getSyncFields(),
      });
      const latest = await repository.getAll();
      const latestContext = context(latest);
      if (generation !== localGeneration) return { synced: false, reason: "local_changed" };
      if (!latestContext.eligible || latestContext.uuid !== initial.uuid) {
        await clearRetry();
        return { synced: false, reason: "session_changed" };
      }
      const remoteTimestamp = Number(remote.socialfocus_LastSettingsModified) || 0;
      if (!shouldApplyRemoteSettings({
        remoteLastModified: remote.socialfocus_LastSettingsModified,
        localLastSync: latestContext.lastSync,
      })) {
        await clearRetry(Number(latestContext.lastSync) || 0);
        return { synced: false, reason: "local_is_current" };
      }
      if (typeof remote.socialfocus_FeaturesSettings !== "string") {
        throw new Error("cloud_sync_invalid_payload");
      }
      const payload = deserializeFeaturesSettings(
        remote.socialfocus_FeaturesSettings,
      );
      await repository.set(
        mergeApplyPayloadWithLocal({
          payload,
          localSystemConfig: latest[storageKeys.system],
        }),
      );
      await saveSuccess(await repository.getAll(), remoteTimestamp);
      await rebuildRuntimeSnapshot();
      return { synced: true, direction: "pull", timestamp: remoteTimestamp };
    } catch (error) {
      await saveFailure("pull", error);
      throw error;
    }
  }

  async function push() {
    const store = await repository.getAll();
    const current = context(store);
    if (!current.eligible) {
      await clearRetry();
      return { synced: false, reason: "not_eligible" };
    }
    const timestamp = Math.max(clock.now(), (Number(current.lastSync) || 0) + 1);
    const serialized = serializeStore(store);
    try {
      const result = await updateSettings({
        featuresSettings: serialized,
        lastModified: String(timestamp),
      });
      if (result !== "Updated") throw new Error("cloud_sync_update_rejected");
      const latestStore = await repository.getAll();
      const latestContext = context(latestStore);
      if (latestContext.uuid !== current.uuid) {
        await clearRetry();
        return { synced: false, reason: "session_changed" };
      }
      await saveSuccess(latestStore, timestamp);
      const hasPendingLocalChanges = serializeStore(latestStore) !== serialized;
      if (hasPendingLocalChanges) {
        await repository.set({
          [storageKeys.cloudSyncMeta]: createCloudSyncMeta({
            pendingOperation: "push",
            nextRetryAt: clock.now(),
            lastSuccessAt: timestamp,
          }),
        });
        await scheduleRetry(clock.now());
      }
      return {
        synced: true,
        direction: "push",
        timestamp,
        pendingLocalChanges: hasPendingLocalChanges,
      };
    } catch (error) {
      await saveFailure("push", error);
      throw error;
    }
  }

  function enqueue(operation) {
    const task = queue.then(() => (operation === "push" ? push() : pull()));
    queue = task.catch(() => undefined);
    return task;
  }

  return {
    pull: () => enqueue("pull"),
    push() {
      localGeneration += 1;
      return enqueue("push");
    },
    async retryPending() {
      const store = await repository.getAll();
      const meta = createCloudSyncMeta(store[storageKeys.cloudSyncMeta]);
      if (!meta.pendingOperation) return { synced: false, reason: "no_retry" };
      if (meta.nextRetryAt > clock.now()) {
        await scheduleRetry(meta.nextRetryAt);
        return { synced: false, reason: "not_due" };
      }
      return enqueue(meta.pendingOperation);
    },
  };
}

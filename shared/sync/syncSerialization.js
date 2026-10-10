/**
 * SocialFocus
 * Copyright © 2026 Yevhen Tretiakov. All rights reserved.
 *

 */

import { storageKeys, systemBuckets } from "../constants/storageKeys.js";
import { syncableStorageRoots } from "../constants/stateBuckets.js";

const syncableRoots = new Set(syncableStorageRoots);
const syncableSystemBuckets = new Set([
  systemBuckets.extensionUiState,
  systemBuckets.dailyLimitData,
]);

function pickSyncableSystemConfig(system) {
  if (!system || typeof system !== "object" || Array.isArray(system)) return undefined;
  const result = Object.fromEntries(
    Object.entries(system).filter(([key]) => syncableSystemBuckets.has(key)),
  );
  return Object.keys(result).length ? result : undefined;
}

export function getSyncableStorageKeys(keys) {
  return keys.filter((key) => syncableRoots.has(key));
}

export function buildSyncObjectsArray({ store, keys, filterObjectRecursively }) {
  const objects = [];
  for (const key of keys) {
    let value = store[key];
    if (value === undefined) continue;
    if (key === storageKeys.system) {
      value = pickSyncableSystemConfig(value);
      if (value === undefined) continue;
    }
    const filtered = filterObjectRecursively(value);
    if (filtered !== undefined) objects.push({ id: key, value: filtered });
  }
  return objects;
}

export function serializeFeaturesSettings({
  store,
  storageEntityKeysList,
  filterObjectRecursively,
}) {
  return JSON.stringify(
    buildSyncObjectsArray({
      store,
      keys: getSyncableStorageKeys(storageEntityKeysList),
      filterObjectRecursively,
    }),
  );
}

export function deserializeFeaturesSettings(serialized) {
  const parsed = JSON.parse(serialized ?? "[]");
  if (!Array.isArray(parsed)) throw new Error("cloud_sync_invalid_payload");
  const payload = {};
  for (const entry of parsed) {
    if (!entry || !syncableRoots.has(entry.id)) continue;
    if (!entry.value || typeof entry.value !== "object" || Array.isArray(entry.value)) {
      throw new Error("cloud_sync_invalid_payload");
    }
    payload[entry.id] =
      entry.id === storageKeys.system
        ? pickSyncableSystemConfig(entry.value) ?? {}
        : entry.value;
  }
  return payload;
}

export function mergeApplyPayloadWithLocal({ payload, localSystemConfig }) {
  const merged = { ...payload };
  if (payload[storageKeys.system]) {
    merged[storageKeys.system] = {
      ...(localSystemConfig ?? {}),
      ...payload[storageKeys.system],
    };
  }
  return merged;
}

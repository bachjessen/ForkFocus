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
} from "./storageKeys.js";

export const stateBuckets = Object.freeze({
  storage: storageKeys,
  system: systemBuckets,
  local: localStateKeys,
  shared: sharedStateKeys,
});

export const syncableStorageRoots = Object.freeze([
  storageKeys.optionsState,
  storageKeys.system,
]);

export const localOnlyStorageRoots = Object.freeze([
  storageKeys.notSyncingState,
  storageKeys.runtimeSnapshot,
  storageKeys.lifecycleMeta,
  storageKeys.cloudSyncMeta,
  storageKeys.serverUpdateMeta,
]);

/**
 * SocialFocus
 * Copyright © 2026 Yevhen Tretiakov. All rights reserved.
 *

 */

import {
  localStateKeys,
  sharedStateKeys,
  storageKeys,
  systemBuckets,
} from "../constants/storageKeys.js";

export function selectOptionsState(storage) {
  return storage?.[storageKeys.optionsState] ?? {};
}

export function selectSystemState(storage) {
  return storage?.[storageKeys.system] ?? {};
}

export function selectLocalState(storage) {
  return storage?.[storageKeys.notSyncingState] ?? {};
}

export function selectLifecycleMeta(storage) {
  return storage?.[storageKeys.lifecycleMeta] ?? {};
}

export function selectSharedState(storage) {
  return selectSystemState(storage)[systemBuckets.sharedState] ?? {};
}

export function selectSystemBucket(storage, bucket) {
  return selectSystemState(storage)[bucket] ?? {};
}

export function selectExtensionUiState(storage) {
  return selectSystemBucket(storage, systemBuckets.extensionUiState);
}

export function selectMetaState(storage) {
  return selectSystemBucket(storage, systemBuckets.meta);
}

export function selectUserIdentity(storage) {
  const shared = selectSharedState(storage);
  const local = selectLocalState(storage);
  return {
    uuid: shared[sharedStateKeys.userUniqueIdentifier] ?? "",
    username: local[localStateKeys.username] ?? "",
  };
}

export function selectDailyLimitState(storage) {
  return selectSystemBucket(storage, systemBuckets.dailyLimitData);
}

export function selectPendingVerification(storage) {
  const local = selectLocalState(storage);
  return {
    email: local[localStateKeys.temporaryUsername] ?? "",
    challengeId: local[localStateKeys.verificationChallengeId] ?? "",
    expiresAt: local[localStateKeys.verificationExpiresAt] ?? 0,
    type: local[localStateKeys.emailVerificationType] ?? "",
    isVisible: local[localStateKeys.showVerification] === true,
  };
}

export function selectPopupState(storage) {
  return {
    local: selectLocalState(storage),
    system: selectSystemState(storage),
    shared: selectSharedState(storage),
    extensionUi: selectExtensionUiState(storage),
    meta: selectMetaState(storage),
    dailyLimit: selectDailyLimitState(storage),
    identity: selectUserIdentity(storage),
    pendingVerification: selectPendingVerification(storage),
    lifecycle: selectLifecycleMeta(storage),
  };
}

export function createStorageSelectors({ storageService }) {
  return Object.freeze({
    async getPopupState() {
      const storage = await storageService.get([
        storageKeys.notSyncingState,
        storageKeys.system,
        storageKeys.lifecycleMeta,
      ]);
      return selectPopupState(storage);
    },

    async getLocalState() {
      return selectLocalState(
        await storageService.get(storageKeys.notSyncingState),
      );
    },

    async getSystemState() {
      return selectSystemState(await storageService.get(storageKeys.system));
    },

    async getSystemBucket(bucket) {
      return selectSystemBucket(
        await storageService.get(storageKeys.system),
        bucket,
      );
    },

    async getExtensionUiState() {
      return selectExtensionUiState(
        await storageService.get(storageKeys.system),
      );
    },

    async getOptionsState() {
      return selectOptionsState(
        await storageService.get(storageKeys.optionsState),
      );
    },

    async getDailyLimitState() {
      return selectDailyLimitState(
        await storageService.get(storageKeys.system),
      );
    },

    async getUserIdentity() {
      const storage = await storageService.get([
        storageKeys.notSyncingState,
        storageKeys.system,
      ]);
      return selectUserIdentity(storage);
    },

    async getPendingVerification() {
      return selectPendingVerification(
        await storageService.get(storageKeys.notSyncingState),
      );
    },

    async getRemoteOptionsData() {
      const storage = await storageService.get(storageKeys.remoteOptionsData);
      return storage?.[storageKeys.remoteOptionsData] ?? {};
    },
  });
}

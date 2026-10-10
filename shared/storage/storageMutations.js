/**
 * SocialFocus
 * Copyright © 2026 Yevhen Tretiakov. All rights reserved.
 *
 * This source code is proprietary and confidential.
 * Unauthorized copying, modification, distribution, or use is strictly prohibited.
 */

export function createStorageMutations({ storageService }) {
  const commands = storageService.semanticCommands;

  function execute(command, payload = {}, options) {
    return storageService.executeSemantic(command, payload, options);
  }

  return Object.freeze({
    setTokenIdentity({ email, uuid, isUserPro }) {
      return execute(commands.authSetTokenIdentity, {
        email,
        uuid,
        isUserPro,
      });
    },

    clearAuthSession() {
      return execute(commands.authClearSession);
    },

    setVerificationState({ email, challengeId, expiresAt, type }) {
      return execute(commands.authSetVerificationState, {
        email,
        challengeId,
        expiresAt,
        type,
      });
    },

    clearVerificationState() {
      return execute(commands.authClearVerificationState);
    },

    applyNativeEntitlement({ isPro, uuid, email }) {
      return execute(commands.entitlementApplyNative, { isPro, uuid, email });
    },

    patchLocalState(patch, { sync = false } = {}) {
      return execute(commands.patchLocalState, { patch }, { sync });
    },

    patchOptionsState(patch, { sync = true } = {}) {
      return execute(commands.patchOptionsState, { patch }, { sync });
    },

    patchOptionsCategory(categoryId, patch, { sync = true } = {}) {
      return execute(
        commands.patchOptionsCategory,
        { categoryId, patch },
        { sync },
      );
    },

    patchSystemBucket(bucket, patch, { sync = true } = {}) {
      return execute(
        commands.patchSystemBucket,
        { bucket, patch },
        { sync },
      );
    },

    patchDailyLimit(patch) {
      return execute(commands.dailyLimitPatchState, { patch });
    },

    configureDailyLimit({ categoryId, duration }) {
      return execute(
        commands.dailyLimitConfigure,
        { categoryId, duration },
        { sync: true },
      );
    },

    replaceCatalog(value) {
      return execute(commands.replaceCatalog, { value });
    },

    importOwnedState(values, { sync = false } = {}) {
      return execute(commands.importOwnedState, { values }, { sync });
    },

    factoryReset() {
      return execute(commands.factoryReset);
    },
  });
}

/**
 * SocialFocus
 * Copyright © 2026 Yevhen Tretiakov. All rights reserved.
 *
 * This source code is proprietary and confidential.
 * Unauthorized copying, modification, distribution, or use is strictly prohibited.
 */

function createStorageMutations({ storageService }) {
  return Object.freeze({
    async patchDailyLimit(patch) {
      await storageService.executeSemantic(
        storageService.semanticCommands.dailyLimitPatchState,
        { patch },
      );
    },

    async patchLocalState(patch) {
      await storageService.executeSemantic(
        storageService.semanticCommands.patchLocalState,
        { patch },
      );
    },

    async setExtensionEnabled(enabled) {
      await this.patchLocalState({
        [getConstNotSyncing.extensionIsEnabledData]: enabled,
        [getConstNotSyncing.extensionBlockTime]: 0,
        [getConstNotSyncing.extensionBlockLastedTime]: 0,
        [getConstNotSyncing.extensionEnableTime]: 0,
        [getConstNotSyncing.extensionEnableLastedTime]: 0,
      });
    },
  });
}

/**
 * SocialFocus
* SocialFocus
 * Copyright © 2026 
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

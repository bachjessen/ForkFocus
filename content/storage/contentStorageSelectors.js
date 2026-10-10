/**
 * SocialFocus
 * Copyright © 2026 Yevhen Tretiakov. All rights reserved.
 *

 */

function createStorageSelectors({ storageService }) {
  function getChangedValue(changes, storageKey, ...path) {
    const change = changes[storageKey];
    if (!change) return null;

    const select = (value) =>
      path.reduce((current, key) => current?.[key], value ?? {});

    return {
      newValue: select(change.newValue),
      oldValue: select(change.oldValue),
    };
  }

  return Object.freeze({
    getChangedValue,

    async getSystemState() {
      const result = await storageService.get(getConst.system);
      return result[getConst.system] ?? {};
    },

    async getLocalState() {
      const result = await storageService.get(getConstNotSyncing.notSyncingState);
      return result[getConstNotSyncing.notSyncingState] ?? {};
    },

    async getExtensionEnabled() {
      const localState = await this.getLocalState();
      return localState[getConstNotSyncing.extensionIsEnabledData] ?? true;
    },
  });
}

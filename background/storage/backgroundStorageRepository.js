/**
 * SocialFocus
 * Copyright © 2026 Yevhen Tretiakov. All rights reserved.
 *

 */

export function createBackgroundStorageRepository(browserApi) {
  return {
    getAll: () => browserApi.storage.local.get(null),
    get: (keys) => browserApi.storage.local.get(keys),
    set: (patch) => browserApi.storage.local.set(patch),
    remove: (keys) =>
      keys?.length ? browserApi.storage.local.remove(keys) : Promise.resolve(),
    clear: () => browserApi.storage.local.clear(),
  };
}

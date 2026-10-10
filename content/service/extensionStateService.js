/**
 * SocialFocus
 * Copyright © 2026 Yevhen Tretiakov. All rights reserved.
 *

 */

(function installExtensionStateService(root) {
  const mutations = root.SocialFocusContentRuntime.storageMutations;

  async function setEnabled(enabled) {
    await mutations.setExtensionEnabled(enabled);
    if (location.href.includes("news.ycombinator.com")) {
      document.documentElement.setAttribute("socialFocus_global_enable", String(enabled));
    }
  }

  root.SocialFocusContentRuntime.extensionStateService = Object.freeze({ setEnabled });
  root.enableExtension = (callback) => void setEnabled(true).then(() => callback?.());
  root.blockingExtension = (callback) => void setEnabled(false).then(() => callback?.());
})(globalThis);

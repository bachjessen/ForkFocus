/**
 * SocialFocus
* SocialFocus
 * Copyright © 2026 
 */

/**
 * Minimal per-frame storage broker.
 * Keeps content features independent from the full storage adapter while
 * preserving one physical browser.storage listener per frame.
 */
(function installStorageChangeBroker(root) {
  root.SocialFocusContentRuntime ??= {};
  if (root.SocialFocusContentRuntime.storageChangeBroker) return;

  const extensionApi = root.browser ?? root.chrome;
  if (!root.browser && extensionApi) root.browser = extensionApi;

  const listeners = new Set();
  let listening = false;

  function dispatch(changes, areaName) {
    for (const listener of [...listeners]) {
      try {
        listener(changes, areaName);
      } catch (_error) {
        root.SocialFocusContentDiagnostics?.count(
          "contentStorageService",
          "errors",
        );
      }
    }
  }

  function syncPhysicalListener() {
    if (!extensionApi?.storage?.onChanged) return;
    if (listeners.size > 0 && !listening) {
      extensionApi.storage.onChanged.addListener(dispatch);
      listening = true;
      root.SocialFocusContentDiagnostics?.subscription(
        "contentStorageService",
        "browser-storage",
        true,
      );
    } else if (listeners.size === 0 && listening) {
      extensionApi.storage.onChanged.removeListener(dispatch);
      listening = false;
      root.SocialFocusContentDiagnostics?.subscription(
        "contentStorageService",
        "browser-storage",
        false,
      );
    }
  }

  root.SocialFocusContentRuntime.storageChangeBroker = {
    get(keys) {
      return extensionApi.storage.local.get(keys);
    },
    subscribe(listener) {
      if (typeof listener !== "function" || listeners.has(listener)) return;
      listeners.add(listener);
      syncPhysicalListener();
    },
    unsubscribe(listener) {
      if (!listeners.delete(listener)) return;
      syncPhysicalListener();
    },
    get subscriberCount() {
      return listeners.size;
    },
    get physicalSubscriptionActive() {
      return listening;
    },
  };
})(globalThis);

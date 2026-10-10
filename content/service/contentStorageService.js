/**
 * SocialFocus
* SocialFocus
 * Copyright © 2026 
 */

(function installContentStorageService(root) {
  const broker = root.SocialFocusContentRuntime.storageChangeBroker;
  const contract = root.SocialFocusShared.storageMutationContract;
  const listeners = new Set();
  let subscribed = false;

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

  function synchronizeSubscription() {
    if (listeners.size > 0 && !subscribed) {
      broker.subscribe(dispatch);
      subscribed = true;
      root.SocialFocusContentDiagnostics?.subscription(
        "contentStorageService",
        "storage-broker",
        true,
      );
    } else if (listeners.size === 0 && subscribed) {
      broker.unsubscribe(dispatch);
      subscribed = false;
      root.SocialFocusContentDiagnostics?.subscription(
        "contentStorageService",
        "storage-broker",
        false,
      );
    }
  }

  const service = Object.freeze({
    semanticCommands: contract.semanticCommands,

    async executeSemantic(command, payload = {}) {
      const response = await browser.runtime.sendMessage(
        contract.createSemanticCommand(command, payload),
      );
      if (response?.ok !== true) {
        throw new Error(response?.error ?? "storage_mutation_failed");
      }
      return response;
    },

    get(keys) {
      return broker.get(keys);
    },

    subscribe(listener) {
      if (typeof listener !== "function" || listeners.has(listener)) return;
      listeners.add(listener);
      synchronizeSubscription();
    },

    unsubscribe(listener) {
      if (!listeners.delete(listener)) return;
      synchronizeSubscription();
    },

    get subscriberCount() {
      return listeners.size;
    },

    get physicalSubscriptionActive() {
      return subscribed;
    },
  });

  root.SocialFocusContentRuntime.contentStorageService = service;
  root.SocialFocusContentRuntime.storageSelectors =
    createStorageSelectors({ storageService: service });
  root.SocialFocusContentRuntime.storageMutations =
    createStorageMutations({ storageService: service });
})(globalThis);

const storageService = SocialFocusContentRuntime.contentStorageService;
const storageSelectors = SocialFocusContentRuntime.storageSelectors;
const storageMutations = SocialFocusContentRuntime.storageMutations;

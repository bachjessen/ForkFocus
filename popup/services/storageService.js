/**
 * SocialFocus
 * Copyright © 2026 Yevhen Tretiakov. All rights reserved.
 *
 * This source code is proprietary and confidential.
 * Unauthorized copying, modification, distribution, or use is strictly prohibited.
 */

const browserApi = globalThis.browser ?? globalThis.chrome;
const contract = globalThis.SocialFocusShared.storageMutationContract;
const listeners = new Set();
let subscribed = false;
let syncHook = null;

function dispatch(changes, areaName) {
  for (const listener of [...listeners]) {
    try { listener(changes, areaName); } catch (_) { /* isolate UI consumers */ }
  }
}

function updateSubscription() {
  if (listeners.size && !subscribed) {
    browserApi.storage.onChanged.addListener(dispatch);
    subscribed = true;
  } else if (!listeners.size && subscribed) {
    browserApi.storage.onChanged.removeListener(dispatch);
    subscribed = false;
  }
}

export const storageService = Object.freeze({
  semanticCommands: contract.semanticCommands,
  async executeSemantic(command, payload = {}, { sync = false } = {}) {
    const response = await browserApi.runtime.sendMessage(
      contract.createSemanticCommand(command, payload),
    );
    if (response?.ok !== true) throw new Error(response?.error ?? "storage_mutation_failed");
    if (sync && syncHook) void syncHook();
    return response;
  },
  setSyncHook(hook) { syncHook = typeof hook === "function" ? hook : null; },
  get(keys) { return browserApi.storage.local.get(keys); },
  getAll() { return browserApi.storage.local.get(null); },
  subscribe(listener) {
    if (typeof listener === "function") listeners.add(listener);
    updateSubscription();
  },
  unsubscribe(listener) { listeners.delete(listener); updateSubscription(); },
  get subscriberCount() { return listeners.size; },
  get physicalSubscriptionActive() { return subscribed; },
});

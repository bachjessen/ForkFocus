/**
 * SocialFocus
 * Copyright © 2026 Yevhen Tretiakov. All rights reserved.
 *

 */

export const RUNTIME_UPDATE_DIAGNOSTICS_KEY = "socialFocus_runtime_update_diagnostics";

export function createRuntimeUpdateDiagnostics({ storageArea, runtimeVersion, runtimeContractVersion, now = () => Date.now() }) {
  let writeQueue = Promise.resolve();
  async function read() { const stored = await storageArea.get(RUNTIME_UPDATE_DIAGNOSTICS_KEY); return stored?.[RUNTIME_UPDATE_DIAGNOSTICS_KEY] ?? null; }
  function merge(patch) {
    writeQueue = writeQueue.then(async () => { const next = { schemaVersion: 1, ...(await read() ?? {}), ...patch }; await storageArea.set({ [RUNTIME_UPDATE_DIAGNOSTICS_KEY]: next }); return next; });
    return writeQueue;
  }
  return Object.freeze({
    getSnapshot: read,
    recordBackgroundStart: () => merge({ background: { startedAt: now(), runtimeVersion, runtimeContractVersion } }),
    recordInstalledEvent: (details) => merge({ lastInstalledEvent: { receivedAt: now(), reason: details?.reason ?? "unknown", previousVersion: details?.previousVersion ?? null, runtimeVersion, status: "received" }, lastTabUpdate: null }),
    recordTabUpdate(outcome) { const results = outcome?.results ?? []; return merge({ lastTabUpdate: { completedAt: now(), supported: outcome?.supported === true, querySucceeded: outcome?.querySucceeded === true, matchedTabs: results.filter(({ tabId }) => Number.isInteger(tabId)).length, reloadedTabs: results.filter(({ reloaded }) => reloaded === true).length, failedTabs: results.filter((item) => Number.isInteger(item.tabId) && item.reloaded !== true).length } }); },
    recordFailure: (stage, error) => merge({ lastFailure: { occurredAt: now(), stage, message: error?.message ?? "unknown_error" } }),
  });
}

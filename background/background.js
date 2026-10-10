/**
 * ForkFocus local-only background runtime.
 */
import "../shared/runtime/storageMutationContract.js";
import { registerFirefoxLifecycle } from "./platform/firefoxLifecycle.js";
import { createLifecycleCoordinator } from "./core/lifecycleCoordinator.js";
import { createRuntimeUpdateDiagnostics } from "./core/runtimeUpdateDiagnostics.js";
import { createSnapshotRebuildScheduler } from "./core/snapshotRebuildScheduler.js";
import { createTabRuntimeUpdateCoordinator, shouldReloadTabsForInstallReason } from "./core/tabRuntimeUpdateCoordinator.js";
import { loadBundledOptions } from "./services/bundledOptionsService.js";
import { createBackgroundStateCoordinator } from "./storage/backgroundStateCoordinator.js";
import { createBackgroundStorageRepository } from "./storage/backgroundStorageRepository.js";
import { createStorageMutationPolicy } from "./storage/storageMutationPolicy.js";
import { createStorageSemanticMutationExecutor } from "./storage/storageSemanticMutationExecutor.js";
import { createExtensionTimerCoordinator, EXTENSION_BLOCK_ALARM, EXTENSION_ENABLE_ALARM } from "./timers/extensionTimerCoordinator.js";
import { CURRENT_RUNTIME_CONTRACT_VERSION } from "../shared/lifecycle/lifecycleConstants.js";
import { storageKeys } from "../shared/constants/storageKeys.js";

globalThis.browser ??= globalThis.chrome;
const browser = globalThis.browser;
registerFirefoxLifecycle({ browserApi: browser });
const repository = createBackgroundStorageRepository(browser);
let bundledOptionsPromise = null;
function getBundledOptions() {
  if (!bundledOptionsPromise) bundledOptionsPromise = loadBundledOptions(browser).catch((error) => { bundledOptionsPromise = null; throw error; });
  return bundledOptionsPromise;
}
const lifecycleCoordinator = createLifecycleCoordinator({ repository, loadOptions: getBundledOptions, extensionVersion: browser.runtime.getManifest().version });
const snapshotRebuildScheduler = createSnapshotRebuildScheduler({ rebuild: () => lifecycleCoordinator.ensureRuntimeReady({ forceSnapshot: true }), debounceMs: 100 });
const contract = globalThis.SocialFocusShared.storageMutationContract;
const stateCoordinator = createBackgroundStateCoordinator({ execute: createStorageSemanticMutationExecutor({ repository, contract, policy: createStorageMutationPolicy({ contract }) }) });
const applyLocalPatch = (patch) => stateCoordinator.enqueue(contract.createSemanticCommand(contract.semanticCommands.patchLocalState, { patch }), { source: "background" });
const timerCoordinator = createExtensionTimerCoordinator({ repository, alarms: browser.alarms, applyLocalPatch });
const tabCoordinator = createTabRuntimeUpdateCoordinator({ browserApi: browser });
const diagnostics = createRuntimeUpdateDiagnostics({ storageArea: browser.storage.local, runtimeVersion: browser.runtime.getManifest().version, runtimeContractVersion: CURRENT_RUNTIME_CONTRACT_VERSION });
const ensureRuntimeReady = (options) => lifecycleCoordinator.ensureRuntimeReady(options);
void diagnostics.recordBackgroundStart();
void ensureRuntimeReady().then(() => timerCoordinator.restore());
browser.runtime.onInstalled.addListener((details) => {
  void diagnostics.recordInstalledEvent(details);
  if (shouldReloadTabsForInstallReason(details?.reason)) void tabCoordinator.reloadUpdatedTabs().then((outcome) => diagnostics.recordTabUpdate(outcome)).catch((error) => diagnostics.recordFailure("tabReload", error));
  void ensureRuntimeReady().then(() => timerCoordinator.restore()).catch((error) => diagnostics.recordFailure("onInstalled", error));
});
if (browser.runtime.onStartup) browser.runtime.onStartup.addListener(() => { void ensureRuntimeReady().then(() => timerCoordinator.restore()); });
if (browser.alarms?.onAlarm) browser.alarms.onAlarm.addListener((alarm) => {
  if ([EXTENSION_BLOCK_ALARM, EXTENSION_ENABLE_ALARM].includes(alarm.name)) void timerCoordinator.handleAlarm(alarm.name);
});
browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message?.action === contract.diagnosticsAction) { sendResponse(stateCoordinator.getDiagnostics()); return false; }
  if (message?.action === contract.action) {
    stateCoordinator.enqueue(message, { source: sender?.url?.startsWith(browser.runtime.getURL("")) ? "extension" : "content" }).then(sendResponse).catch((error) => sendResponse({ ok: false, error: error.message ?? "mutation_failed" }));
    return true;
  }
  if (message?.action === "ensureRuntimeReady") { ensureRuntimeReady().then(sendResponse).catch((error) => sendResponse({ ready: false, error: error.message ?? "readiness_failed" })); return true; }
  if (message?.action === "rebuildRuntimeSnapshot") { snapshotRebuildScheduler.flush("runtime-message").then(sendResponse).catch((error) => sendResponse({ ready: false, error: error.message ?? "rebuild_failed" })); return true; }
  if (message?.action === "scheduleExtensionTimer") { timerCoordinator.schedule(message.turnType, message.blockTime).then(sendResponse).catch((error) => sendResponse({ scheduled: false, error: error.message })); return true; }
  if (message?.action === "getRuntimeUpdateDiagnostics") { diagnostics.getSnapshot().then(sendResponse); return true; }
  return false;
});
browser.storage.onChanged.addListener((changes, areaName) => {
  if (areaName !== "local") return;
  const reasons = [];
  if (changes[storageKeys.optionsState]) reasons.push("options-state");
  if (changes[storageKeys.remoteOptionsData]) reasons.push("options-catalog");
  if (reasons.length) void snapshotRebuildScheduler.request(reasons.join("+"));
});

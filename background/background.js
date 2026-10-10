/**
 * SocialFocus
* SocialFocus
 * Copyright © 2026 
 */

import "../shared/runtime/storageMutationContract.js";
import { registerFirefoxLifecycle } from "./platform/firefoxLifecycle.js";
import { registerSafariEntitlementBridge } from "./platform/safariEntitlementBridge.js";
import { createLifecycleCoordinator } from "./core/lifecycleCoordinator.js";
import { loadBundledOptions } from "./services/bundledOptionsService.js";
import { createBackgroundStorageRepository } from "./storage/backgroundStorageRepository.js";
import { createBackgroundStateCoordinator } from "./storage/backgroundStateCoordinator.js";
import { createStorageSemanticMutationExecutor } from "./storage/storageSemanticMutationExecutor.js";
import { createStorageMutationPolicy } from "./storage/storageMutationPolicy.js";
import { getPartialOptionsSettings } from "../shared/api/serverContract.js";
import { createCloudSyncCoordinator } from "./sync/cloudSyncCoordinator.js";
import { createCloudSyncAlarmScheduler } from "./sync/cloudSyncAlarmScheduler.js";
import { CLOUD_SYNC_ALARM } from "./sync/cloudSyncConstants.js";
import {
  createExtensionTimerCoordinator,
  EXTENSION_BLOCK_ALARM,
  EXTENSION_ENABLE_ALARM,
} from "./timers/extensionTimerCoordinator.js";
import { createServerUpdateService } from "./updates/serverUpdateService.js";
import { createAlarmScheduler } from "./updates/alarmScheduler.js";
import { SERVER_UPDATE_ALARM } from "./updates/serverUpdateConstants.js";
import { CURRENT_RUNTIME_CONTRACT_VERSION } from "../shared/lifecycle/lifecycleConstants.js";
import { createSnapshotRebuildScheduler } from "./core/snapshotRebuildScheduler.js";
import {
  createTabRuntimeUpdateCoordinator,
  shouldReloadTabsForInstallReason,
} from "./core/tabRuntimeUpdateCoordinator.js";
import { createRuntimeUpdateDiagnostics } from "./core/runtimeUpdateDiagnostics.js";
import { storageKeys } from "../shared/constants/storageKeys.js";
import { userAuthApi } from "../shared/auth/userAuthApi.js";
import {
  USER_AUTH_MESSAGE_ACTION,
  USER_AUTH_MESSAGE_COMMANDS,
} from "../shared/auth/userAuthMessages.js";
import { createTokenSessionCoordinator } from "./auth/tokenSessionCoordinator.js";
import { createOptionsReleaseController } from "./options/optionsReleaseController.js";
import {
  getSafariAccessToken,
  isSafariRuntime,
} from "./auth/safariTokenProvider.js";

globalThis.browser ??= globalThis.chrome;
const browser = globalThis.browser;

registerFirefoxLifecycle({ browserApi: browser });
registerSafariEntitlementBridge({ browserApi: browser });

const repository = createBackgroundStorageRepository(browser);
const isSafari = isSafariRuntime();
let bundledOptionsPromise = null;
function getBundledOptions() {
  if (!bundledOptionsPromise) bundledOptionsPromise = loadBundledOptions(browser).catch((error) => { bundledOptionsPromise = null; throw error; });
  return bundledOptionsPromise;
}
const lifecycleCoordinator = createLifecycleCoordinator({
  repository,
  loadOptions: getBundledOptions,
  extensionVersion: browser.runtime.getManifest().version,
});
const snapshotRebuildScheduler = createSnapshotRebuildScheduler({
  rebuild: () => lifecycleCoordinator.ensureRuntimeReady({ forceSnapshot: true }),
  debounceMs: 100,
});
const storageMutationContract =
  globalThis.SocialFocusShared.storageMutationContract;
const backgroundStateCoordinator = createBackgroundStateCoordinator({
  execute: createStorageSemanticMutationExecutor({
    repository,
    contract: storageMutationContract,
    policy: createStorageMutationPolicy({ contract: storageMutationContract }),
  }),
});

function clearPublishedAuthSession() {
  return backgroundStateCoordinator.enqueue(
    storageMutationContract.createSemanticCommand(
      storageMutationContract.semanticCommands.authClearSession,
    ),
    { source: "background" },
  );
}

const tokenSessionCoordinator = createTokenSessionCoordinator({
  repository,
  api: userAuthApi,
  onSessionInvalidated: clearPublishedAuthSession,
});
const tabRuntimeUpdateCoordinator = createTabRuntimeUpdateCoordinator({
  browserApi: browser,
});
const runtimeUpdateDiagnostics = createRuntimeUpdateDiagnostics({
  storageArea: browser.storage.local,
  runtimeVersion: browser.runtime.getManifest().version,
  runtimeContractVersion: CURRENT_RUNTIME_CONTRACT_VERSION,
});
void runtimeUpdateDiagnostics.recordBackgroundStart();
const applyLocalPatch = (patch) =>
  backgroundStateCoordinator.enqueue(
    storageMutationContract.createSemanticCommand(
      storageMutationContract.semanticCommands.patchLocalState,
      { patch },
    ),
    { source: "background" },
  );
async function fetchCloudSettings(request) {
  const response = await authorizedCloudRequest((accessToken) =>
    userAuthApi.getSettings({ accessToken }),
  );
  const settings = response?.settings;
  if (!settings || typeof settings !== "object") {
    throw new Error("cloud_sync_invalid_payload");
  }
  return {
    socialfocus_FeaturesSettings: settings.features,
    socialfocus_LastSettingsModified: settings.last_modified,
  };
}

async function updateCloudSettings(request) {
  const response = await authorizedCloudRequest((accessToken) =>
    userAuthApi.updateSettings({
      accessToken,
      settings: {
        features: request.featuresSettings,
        last_modified: request.lastModified,
      },
    }),
  );
  if (response?.updated !== true) {
    throw new Error("cloud_sync_update_rejected");
  }
  return "Updated";
}

async function authorizedCloudRequest(operation) {
  if (!isSafari) {
    if (!(await tokenSessionCoordinator.hasSession())) {
      throw new Error("cloud_sync_auth_required");
    }
    return await tokenSessionCoordinator.authorizedRequest(operation);
  }

  let accessToken = await getSafariAccessToken({ browserApi: browser });
  try {
    return await operation(accessToken);
  } catch (error) {
    if (
      error?.code !== "access_token_expired" &&
      error?.code !== "invalid_access_token"
    ) {
      throw error;
    }
    accessToken = await getSafariAccessToken({
      browserApi: browser,
      forceRefresh: true,
    });
    return await operation(accessToken);
  }
}

const cloudSyncCoordinator = createCloudSyncCoordinator({
  repository,
  fetchSettings: fetchCloudSettings,
  updateSettings: updateCloudSettings,
  rebuildRuntimeSnapshot: () => snapshotRebuildScheduler.flush("cloud-pull"),
  scheduleRetry: createCloudSyncAlarmScheduler(browser),
});
const extensionTimerCoordinator = createExtensionTimerCoordinator({
  repository,
  alarms: browser.alarms,
  applyLocalPatch,
});
const serverUpdateService = createServerUpdateService({
  repository,
  fetchUpdates: getPartialOptionsSettings,
  loadOptions: getBundledOptions,
  rebuildRuntimeSnapshot: () => snapshotRebuildScheduler.flush("server-update"),
  scheduleAlarm: createAlarmScheduler(browser),
});
const optionsReleaseController = createOptionsReleaseController({
  repository,
  api: userAuthApi,
  authorizedRequest: authorizedCloudRequest,
  rebuildRuntimeSnapshot: () => snapshotRebuildScheduler.flush("options-release-selection"),
  loadBundledOptions: getBundledOptions,
  product: "social",
  remoteOptionsKey: storageKeys.remoteOptionsData,
  lifecycleMetaKey: storageKeys.lifecycleMeta,
});
const TERMINAL_OPTIONS_RELEASE_ACCESS_CODES = new Set([
  "tester_access_required",
  "no_user_session",
  "invalid_refresh_token",
  "refresh_token_expired",
  "refresh_token_reused",
  "session_credentials_changed",
  "session_revoked",
  "cloud_sync_auth_required",
]);
async function reconcileOptionsReleaseAccess() {
  if (!(await optionsReleaseController.currentSelection())) return;
  try {
    await optionsReleaseController.list();
  } catch (error) {
    const code = error?.code ?? error?.message;
    if (!TERMINAL_OPTIONS_RELEASE_ACCESS_CODES.has(code)) return;
    try {
      await optionsReleaseController.restoreCurrent();
    } catch (_restoreError) {
      await optionsReleaseController.restoreBundled();
    }
  }
}

function checkServerUpdates(_options) {
  return Promise.resolve({ checked: false, reason: "local_only" });
}

function ensureRuntimeReady(options) {
  return lifecycleCoordinator.ensureRuntimeReady(options).catch((error) => {
    console.error("SocialFocus runtime readiness failed:", error);
    throw error;
  });
}

function tokenIdentityCommand(result) {
  return storageMutationContract.createSemanticCommand(
    storageMutationContract.semanticCommands.authSetTokenIdentity,
    {
      email: result.user.email,
      uuid: result.user.uuid,
      isUserPro: result.isPro,
    },
  );
}

async function publishTokenIdentity(result) {
  if (
    result?.active !== true ||
    typeof result?.isPro !== "boolean" ||
    !result?.user
  ) {
    return;
  }
  await backgroundStateCoordinator.enqueue(tokenIdentityCommand(result), {
    source: "background",
  });
}

function trustedExtensionSender(sender) {
  return (
    typeof sender?.url === "string" &&
    sender.url.startsWith(browser.runtime.getURL(""))
  );
}

async function handleUserAuthMessage(message, sender) {
  if (!trustedExtensionSender(sender)) {
    return { ok: false, error: { code: "untrusted_user_auth_sender" } };
  }
  try {
    if (message.command === USER_AUTH_MESSAGE_COMMANDS.login) {
      const result = await tokenSessionCoordinator.login({
        email: message.email,
        password: message.password,
      });
      await publishTokenIdentity(result);
      return { ok: true, ...result };
    }
    if (message.command === USER_AUTH_MESSAGE_COMMANDS.signup) {
      const result = await tokenSessionCoordinator.signup({
        email: message.email,
        password: message.password,
      });
      return { ok: true, ...result };
    }
    if (
      message.command ===
      USER_AUTH_MESSAGE_COMMANDS.requestEmailVerification
    ) {
      const result = await tokenSessionCoordinator.requestEmailVerification({
        email: message.email,
        password: message.password,
      });
      return { ok: true, ...result };
    }
    if (
      message.command ===
      USER_AUTH_MESSAGE_COMMANDS.confirmEmailVerification
    ) {
      const result = await tokenSessionCoordinator.confirmEmailVerification({
        challengeId: message.challengeId,
        code: message.code,
      });
      await publishTokenIdentity(result);
      return { ok: true, ...result };
    }
    if (
      message.command === USER_AUTH_MESSAGE_COMMANDS.requestPasswordReset
    ) {
      const result = await tokenSessionCoordinator.requestPasswordReset({
        email: message.email,
      });
      return { ok: true, ...result };
    }
    if (message.command === USER_AUTH_MESSAGE_COMMANDS.status) {
      const result = await tokenSessionCoordinator.status();
      await publishTokenIdentity(result);
      return { ok: true, ...result };
    }
    if (message.command === USER_AUTH_MESSAGE_COMMANDS.logout) {
      if (await optionsReleaseController.currentSelection()) {
        try {
          await optionsReleaseController.restoreCurrent();
        } catch (_error) {
          await optionsReleaseController.restoreBundled();
        }
      }
      const result = await tokenSessionCoordinator.logout();
      await clearPublishedAuthSession();
      return { ok: true, ...result };
    }
    if (message.command === USER_AUTH_MESSAGE_COMMANDS.updatePassword) {
      const result = await tokenSessionCoordinator.updatePassword({
        currentPassword: message.currentPassword,
        newPassword: message.newPassword,
      });
      return { ok: true, ...result };
    }
    if (message.command === USER_AUTH_MESSAGE_COMMANDS.deleteAccount) {
      const result = await tokenSessionCoordinator.deleteAccount();
      return { ok: true, ...result };
    }
    if (message.command === USER_AUTH_MESSAGE_COMMANDS.listOptionReleases) {
      return { ok: true, ...(await optionsReleaseController.list()) };
    }
    if (message.command === USER_AUTH_MESSAGE_COMMANDS.applyOptionRelease) {
      return { ok: true, ...(await optionsReleaseController.apply({
        channel: message.channel,
        version: message.version,
      })) };
    }
    if (message.command === USER_AUTH_MESSAGE_COMMANDS.restoreCurrentOptions) {
      return { ok: true, ...(await optionsReleaseController.restoreCurrent()) };
    }
    if (message.command === USER_AUTH_MESSAGE_COMMANDS.overrideNextOptionsUpdate) {
      await optionsReleaseController.list();
      return { ok: true, ...(await serverUpdateService.overrideNextCheck(message.delayMs)) };
    }
    return { ok: false, error: { code: "unknown_user_auth_command" } };
  } catch (error) {
    return {
      ok: false,
      error: {
        code:
          typeof error?.code === "string"
            ? error.code
            : "user_auth_unavailable",
        ...(Number.isInteger(error?.status) && error.status > 0
          ? { status: error.status }
          : {}),
      },
    };
  }
}

void ensureRuntimeReady().then(async () => {
  await reconcileOptionsReleaseAccess();
  await Promise.all([
    extensionTimerCoordinator.restore(),
    checkServerUpdates().catch(() => undefined),
  ]);
});

browser.runtime.onInstalled.addListener((details) => {
  void runtimeUpdateDiagnostics.recordInstalledEvent(details);
  // Safari may report an unchanged Xcode debug deployment as a fresh install.
  // Let the browser replace each affected tab's extension generation exactly
  // once instead of reloading from an outgoing content-script document.
  if (shouldReloadTabsForInstallReason(details?.reason)) {
    void tabRuntimeUpdateCoordinator.reloadUpdatedTabs().then(
      (outcome) => runtimeUpdateDiagnostics.recordTabUpdate(outcome),
    ).catch((error) => {
      void runtimeUpdateDiagnostics.recordFailure("tabReload", error);
    });
  }
  void ensureRuntimeReady().then(async () => {
    await extensionTimerCoordinator.restore();
  }).catch((error) => {
    void runtimeUpdateDiagnostics.recordFailure("onInstalled", error);
  });
});

if (browser.runtime.onStartup) {
  browser.runtime.onStartup.addListener(() => {
    void ensureRuntimeReady().then(() => extensionTimerCoordinator.restore());
  });
}

if (browser.alarms?.onAlarm) {
  browser.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name === CLOUD_SYNC_ALARM) {
      void cloudSyncCoordinator.retryPending().catch((error) =>
        console.error("SocialFocus cloud sync retry failed:", error),
      );
      return;
    }
    if (alarm.name === SERVER_UPDATE_ALARM) {
      void checkServerUpdates().catch(() => undefined);
      return;
    }
    if ([EXTENSION_BLOCK_ALARM, EXTENSION_ENABLE_ALARM].includes(alarm.name)) {
      void extensionTimerCoordinator.handleAlarm(alarm.name).catch((error) =>
        console.error("SocialFocus extension timer failed:", error),
      );
    }
  });
}

browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message?.action === USER_AUTH_MESSAGE_ACTION) {
    handleUserAuthMessage(message, sender).then(sendResponse);
    return true;
  }

  if (message?.action === storageMutationContract.diagnosticsAction) {
    sendResponse(backgroundStateCoordinator.getDiagnostics());
    return false;
  }

  if (message?.action === storageMutationContract.action) {
    backgroundStateCoordinator
      .enqueue(message, {
        source: sender?.url?.startsWith(browser.runtime.getURL(""))
          ? "extension"
          : "content",
      })
      .then(sendResponse)
      .catch((error) => {
        sendResponse({ ok: false, error: error.message ?? "mutation_failed" });
      });
    return true;
  }

  if (message?.action === "ensureRuntimeReady") {
    ensureRuntimeReady().then(sendResponse).catch((error) => {
      sendResponse({ ready: false, error: error.message ?? "readiness_failed" });
    });
    return true;
  }

  if (message?.action === "rebuildRuntimeSnapshot") {
    snapshotRebuildScheduler.flush("runtime-message")
      .then(sendResponse)
      .catch((error) => {
        sendResponse({ ready: false, error: error.message ?? "rebuild_failed" });
      });
    return true;
  }

  if (message?.action === "pullCloudSync" || message?.action === "pushCloudSync") {
    const operation = message.action === "pushCloudSync" ? "push" : "pull";
    cloudSyncCoordinator[operation]().then(sendResponse).catch((error) => {
      sendResponse({ synced: false, error: error.message ?? "cloud_sync_failed" });
    });
    return true;
  }

  if (message?.action === "scheduleExtensionTimer") {
    extensionTimerCoordinator
      .schedule(message.turnType, message.blockTime)
      .then(sendResponse)
      .catch((error) => sendResponse({ scheduled: false, error: error.message }));
    return true;
  }

  if (message?.action === "checkServerUpdates") {
    checkServerUpdates({ force: true }).then(sendResponse).catch((error) =>
      sendResponse({ checked: false, error: error.message ?? "server_update_failed" }),
    );
    return true;
  }

  if (message?.action === "getRuntimeUpdateDiagnostics") {
    runtimeUpdateDiagnostics.getSnapshot().then(sendResponse);
    return true;
  }
});

browser.storage.onChanged.addListener((changes, areaName) => {
  if (areaName !== "local") return;
  const reasons = [];
  if (changes[storageKeys.optionsState]) reasons.push("options-state");
  if (changes[storageKeys.remoteOptionsData]) reasons.push("options-catalog");
  if (!reasons.length) return;
  void snapshotRebuildScheduler.request(reasons.join("+")).catch((error) => {
    console.error("SocialFocus snapshot rebuild failed:", error);
    void runtimeUpdateDiagnostics.recordFailure("snapshot-rebuild", error);
  });
});

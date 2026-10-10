/**
 * SocialFocus
 * Copyright © 2026 Yevhen Tretiakov. All rights reserved.
 *
 * This source code is proprietary and confidential.
 * Unauthorized copying, modification, distribution, or use is strictly prohibited.
 */

import { extensionUiKeys, localStateKeys } from "../../shared/constants/storageKeys.js";
import { patchExtensionUi } from "./optionsFlow.js";
import { storageSelectors } from "../core/bootstrap.js";
import { messagingService } from "../services/messagingService.js";
import { uiStateService } from "../services/uiStateService.js";
import { themeService } from "../services/themeService.js";
import { refreshNativeEntitlement } from "../scripts/appleMethods.js";

function applyPopupUiState(state) {
  const { identity, local } = state;
  uiStateService.setDisableState(local[localStateKeys.extensionIsEnabled] === false);
  themeService.setThemeMode(local[localStateKeys.theme] ?? "auto");
  uiStateService.setProState(Boolean(local[localStateKeys.isUserPro]));
  uiStateService.setLoginState(Boolean(identity.uuid));
}

export async function preparePopupRuntime({ browserName } = {}) {
  let readiness;
  try {
    readiness = await messagingService.ensureRuntimeReady();
  } catch (error) {
    console.error("SocialFocus background readiness unavailable:", error);
  }
  if (readiness?.ready !== true) {
    readiness = await messagingService.ensureRuntimeReady({
      forceSnapshot: true,
    });
  }
  if (readiness?.ready !== true) throw new Error(readiness?.error ?? "runtime_not_ready");
  await refreshNativeEntitlement(browserName);
  const state = await storageSelectors.getPopupState();
  applyPopupUiState(state);
  return { readiness, state };
}

export async function refreshPopupUserSession({ browserName } = {}) {
  if (browserName === "safari") return { refreshed: false, supported: false };

  try {
    const status = await messagingService.userAuthStatus();
    const state = await storageSelectors.getPopupState();
    applyPopupUiState(state);
    return { refreshed: true, supported: true, status, state };
  } catch (error) {
    console.error("SocialFocus token session restore unavailable:", error);
    return {
      refreshed: false,
      supported: true,
      error: error?.message ?? "user_auth_status_unavailable",
    };
  }
}

function wait(seconds, onTick) {
  return new Promise((resolve) => {
    let remaining = Math.max(0, Number(seconds) || 0);
    onTick(remaining);
    if (!remaining) { resolve(); return; }
    const timer = setInterval(() => { remaining -= 1; onTick(remaining); if (remaining <= 0) { clearInterval(timer); resolve(); } }, 1000);
  });
}

export async function runStartupRouting({ navigate }) {
  const { extensionUi: ui, local } = await storageSelectors.getPopupState();
  if (ui[extensionUiKeys.openingTimerIsActive]) {
    const value = ui[extensionUiKeys.openingTimerValue] ?? 1;
    navigate("openingTimerWaitScreen", { message: ui[extensionUiKeys.openingTimerMessage] ?? "" });
    await wait(value, (remaining) => {
      const output = document.getElementById("openingTimerWaitScreen")?.querySelector("#openingTimerLeftSeconds");
      if (output) output.textContent = String(remaining);
    });
  }
  if (ui[extensionUiKeys.passwordLockingIsActive]) {
    const resetActive = ui[extensionUiKeys.passwordLockingResetIsActive] === true;
    const deadline = Date.parse(ui[extensionUiKeys.passwordLockingResetFinalDate] ?? "");
    if (resetActive && (!Number.isFinite(deadline) || deadline <= Date.now())) {
      await patchExtensionUi({
        [extensionUiKeys.passwordLockingIsActive]: false,
        [extensionUiKeys.passwordLockingPassword]: "",
        [extensionUiKeys.passwordLockingPrompt]: "",
        [extensionUiKeys.passwordLockingResetIsActive]: false,
        [extensionUiKeys.passwordLockingResetPeriod]: 9,
        [extensionUiKeys.passwordLockingResetFinalDate]: "",
      });
    } else { navigate("passwordUnlockingScreen"); return; }
  }
  navigate(local[localStateKeys.showVerification] ? "emailVerification" : "mainScreen");
}

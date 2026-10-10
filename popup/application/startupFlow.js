/**
 * SocialFocus
* SocialFocus
 * Copyright © 2026 
 */

import { extensionUiKeys, localStateKeys } from "../../shared/constants/storageKeys.js";
import { patchExtensionUi } from "./optionsFlow.js";
import { storageSelectors } from "../core/bootstrap.js";
import { messagingService } from "../services/messagingService.js";
import { uiStateService } from "../services/uiStateService.js";
import { themeService } from "../services/themeService.js";

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
  const state = await storageSelectors.getPopupState();
  applyPopupUiState(state);
  return { readiness, state };
}

export async function refreshPopupUserSession() {
  return { refreshed: false, supported: false };
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
  navigate("mainScreen");
}

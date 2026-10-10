/**
 * SocialFocus
 * Copyright © 2026 Yevhen Tretiakov. All rights reserved.
 *
 * This source code is proprietary and confidential.
 * Unauthorized copying, modification, distribution, or use is strictly prohibited.
 */

import { extensionUiKeys, localStateKeys, sharedStateKeys } from "../../shared/constants/storageKeys.js";
import { storageSelectors } from "../core/bootstrap.js";
import { localizationService } from "./localizationService.js";
import { formatShortcut } from "../application/shortcutPresenter.js";

function setValue(root, selector, value) { const element = root.querySelector(selector); if (element && value != null) element.value = String(value); }
export const initStateService = Object.freeze({
  async hydrate(root = document) {
    const { extensionUi: ui, local, shared } = await storageSelectors.getPopupState();
    const opening = root.querySelector("#openingTimerDurationSelect");
    if (opening) { opening.replaceChildren(); for (let value = 1; value <= 600; value += 1) { const option = new Option(String(value), String(value)); option.selected = value == (ui[extensionUiKeys.openingTimerValue] ?? 1); opening.add(option); } }
    setValue(root, "#openingTimerMessage", ui[extensionUiKeys.openingTimerMessage] ?? "");
    root.querySelector("#launchDelayState")?.toggleAttribute("active", ui[extensionUiKeys.openingTimerIsActive] === true);
    root.querySelector("#openingTimer-bottomButtons")?.toggleAttribute("active", ui[extensionUiKeys.openingTimerIsActive] === true);
    const reset = root.querySelector("#passwordResetPeriodSelect");
    if (reset) { reset.replaceChildren(); for (const variant of localizationService.resetDurationVariants) { const option = new Option(localizationService.localize(variant.label), String(variant.id)); option.selected = variant.id == (ui[extensionUiKeys.passwordLockingResetPeriod] ?? 9); reset.add(option); } }
    setValue(root, "#protectPasswordTextField", ui[extensionUiKeys.passwordLockingPassword] ?? "");
    setValue(root, "#protectPassword2TextField", ui[extensionUiKeys.passwordLockingPassword] ?? "");
    setValue(root, "#passwordPromptTextField", ui[extensionUiKeys.passwordLockingPrompt] ?? "");
    root.querySelector("#passwordProtectionStatusInfo")?.toggleAttribute("active", ui[extensionUiKeys.passwordLockingIsActive] === true);
    root.querySelector("#passwordLocking-bottomButtons")?.toggleAttribute("active", ui[extensionUiKeys.passwordLockingIsActive] === true);
    setValue(root, "#extensionThemeSelect", local[localStateKeys.theme] ?? "auto");
    setValue(root, "#extensionLanguageSelect", local[localStateKeys.extensionLanguage] ?? "auto");
    setValue(root, "#iCloudSyncingSelect", local[localStateKeys.isCloudSyncing] ?? "off");
    const email = root.querySelector("#userLoginEmail"); if (email) email.textContent = local[localStateKeys.username] ?? "";
    const otherApps = shared[sharedStateKeys.myOtherApps] ?? "showing"; document.documentElement.setAttribute("myOtherApps", otherApps); if (root.id === "moreScreen") root.setAttribute("isShowMyApp", String(otherApps !== "hide"));
    const shortcut = shared[sharedStateKeys.shortcutDisableEnable] ?? [];
    const shortcutButton = root.querySelector("#setHotkeyButton"); if (shortcutButton && shortcut.length) { shortcutButton.textContent = formatShortcut(shortcut); shortcutButton.closest(".hotKeyWrapper")?.classList.add("setted"); }
  },
});

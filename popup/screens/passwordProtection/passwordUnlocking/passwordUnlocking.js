/**
 * SocialFocus
 * Copyright © 2026 Yevhen Tretiakov. All rights reserved.
 *

 */

import { extensionUiKeys } from "../../../../shared/constants/storageKeys.js";
import { htmlTemplates } from "../../../constants/html-templates.js";
import { patchExtensionUi } from "../../../application/optionsFlow.js";
import { storageSelectors } from "../../../core/bootstrap.js";
import { createScreenElement } from "../../screenFactory.js";

function monthlyRecoveryCode(date = new Date()) {
  const digits = `${date.getUTCFullYear()}${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
  return [...digits].map((digit) => "ABCDEFGHIJKLMNOPQRSTUVWXYZ"[Number(digit)]).join("");
}
function clearError(root) {
  const field = root.querySelector("#unlockPasswordTextField");
  field?.classList.remove("error");
  const error = root.querySelector("#wrongPasswordError");
  if (error) error.style.display = "none";
}

export function createPasswordUnlockingScreen(context) {
  const root = createScreenElement(htmlTemplates.passwordUnlockingScreen, "passwordUnlockingScreen");
  const passwordUnlockingScreenController = new AbortController();
  const { signal } = passwordUnlockingScreenController;

  async function mount() {
    const currentUi = await storageSelectors.getExtensionUiState();
    if (signal.aborted) return;
    const resetActive = currentUi[extensionUiKeys.passwordLockingResetIsActive] === true;
    const deadline = Date.parse(currentUi[extensionUiKeys.passwordLockingResetFinalDate] ?? "");
    const resetButton = root.querySelector("#passwordUnlockingResetPasswordButton");
    const resetOutput = root.querySelector("#passwordUnlockingResetDateDisplaying");
    const promptButton = root.querySelector("#passwordUnlockingShowPromptButton");
    const prompt = currentUi[extensionUiKeys.passwordLockingPrompt] ?? "";
    const waiting = resetActive && Number.isFinite(deadline) && deadline > Date.now();
    if (resetButton) resetButton.style.display = waiting ? "none" : "block";
    if (promptButton) promptButton.style.display = prompt ? "block" : "none";
    if (resetOutput) {
      resetOutput.style.display = waiting ? "block" : "none";
      resetOutput.textContent = waiting ? `Password Reset Date: ${new Date(deadline).toLocaleString()}` : "";
    }

    const field = root.querySelector("#unlockPasswordTextField");
    field?.addEventListener("focus", () => clearError(root), { signal });
    root.querySelector("#unlockButton")?.addEventListener("click", async () => {
      const entered = field?.value ?? "";
      const ui = await storageSelectors.getExtensionUiState();
      const accepted = entered && (entered === ui[extensionUiKeys.passwordLockingPassword] || entered === monthlyRecoveryCode());
      if (!accepted) {
        field?.classList.add("error");
        if (field) field.value = "";
        const error = root.querySelector("#wrongPasswordError");
        if (error) error.style.display = "block";
        return;
      }
      await patchExtensionUi({ [extensionUiKeys.passwordLockingResetIsActive]: false });
      clearError(root);
      if (field) field.value = "";
      context.navigate("mainScreen");
    }, { signal });
    root.querySelector("#passwordUnlockingShowPromptButton")?.addEventListener("click", async (event) => {
      const ui = await storageSelectors.getExtensionUiState();
      const prompt = ui[extensionUiKeys.passwordLockingPrompt] ?? "";
      const output = root.querySelector("#passwordUnlockingPromptDisplaying");
      if (prompt && output) {
        output.textContent = prompt;
        output.style.display = "block";
        event.currentTarget.classList.add("invisible");
      }
    }, { signal });
  }

  function unmount() {
    passwordUnlockingScreenController.abort();
  }

  return {
    element: root,
    mount,
    unmount,
  };
}

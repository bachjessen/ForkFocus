/**
 * SocialFocus
 * Copyright © 2026 Yevhen Tretiakov. All rights reserved.
 *

 */

import { extensionUiKeys } from "../../../../shared/constants/storageKeys.js";
import { htmlTemplates } from "../../../constants/html-templates.js";
import { patchExtensionUi } from "../../../application/optionsFlow.js";
import { bindSelectRow } from "../../../application/selectPresenter.js";
import { initStateService } from "../../../services/initStateService.js";
import { createScreenElement } from "../../screenFactory.js";

function clearForm(root) {
  const mismatch = root.querySelector("#differentPasswordsError");
  if (mismatch) mismatch.style.display = "none";
  for (const selector of ["#protectPasswordTextField", "#protectPassword2TextField", "#passwordPromptTextField"]) {
    const field = root.querySelector(selector);
    field?.classList.remove("error");
    if (field) field.value = "";
  }
}

export function createPasswordLockingScreen() {
  const root = createScreenElement(htmlTemplates.passwordLockingScreen, "passwordLockingScreen");
  const passwordLockingScreenController = new AbortController();
  const { signal } = passwordLockingScreenController;

  async function mount() {
    await initStateService.hydrate(root);
    if (signal.aborted) return;
    root.querySelectorAll("#passwordLockingProtectButton, #passwordLockingUpdateButton").forEach((button) => {
      button.addEventListener("click", async () => {
        const first = root.querySelector("#protectPasswordTextField");
        const second = root.querySelector("#protectPassword2TextField");
        first?.classList.toggle("error", !first.value);
        second?.classList.toggle("error", !second.value);
        const mismatch = Boolean(first.value && second.value && first.value !== second.value);
        const error = root.querySelector("#differentPasswordsError");
        if (error) error.style.display = mismatch ? "block" : "none";
        if (!first.value || !second.value || mismatch) return;
        await patchExtensionUi({
          [extensionUiKeys.passwordLockingIsActive]: true,
          [extensionUiKeys.passwordLockingPassword]: first.value,
          [extensionUiKeys.passwordLockingPrompt]: root.querySelector("#passwordPromptTextField")?.value ?? "",
          [extensionUiKeys.passwordLockingResetPeriod]: Number(root.querySelector("#passwordResetPeriodSelect")?.value ?? 9),
        });
        root.querySelector("#passwordProtectionStatusInfo")?.setAttribute("active", "");
        root.querySelector("#passwordLocking-bottomButtons")?.setAttribute("active", "");
        first.classList.remove("error");
        second.classList.remove("error");
      }, { signal });
    });
    root.querySelector("#passwordLockingDestructButton")?.addEventListener("click", async () => {
      await patchExtensionUi({
        [extensionUiKeys.passwordLockingIsActive]: false,
        [extensionUiKeys.passwordLockingPassword]: "",
        [extensionUiKeys.passwordLockingPrompt]: "",
        [extensionUiKeys.passwordLockingResetIsActive]: false,
        [extensionUiKeys.passwordLockingResetPeriod]: 9,
      });
      clearForm(root);
      const reset = root.querySelector("#passwordResetPeriodSelect");
      if (reset) reset.value = "9";
      root.querySelector("#passwordProtectionStatusInfo")?.removeAttribute("active");
      root.querySelector("#passwordLocking-bottomButtons")?.removeAttribute("active");
    }, { signal });
    root.querySelectorAll(".textField").forEach((field) => field.addEventListener("focus", () => field.classList.remove("error"), { signal }));
    root.querySelectorAll(".modernFormBlockItemsWrapper select").forEach((select) =>
      bindSelectRow(select, { signal }),
    );
  }

  function unmount() {
    passwordLockingScreenController.abort();
  }

  return {
    element: root,
    mount,
    unmount,
  };
}

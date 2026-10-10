/**
 * SocialFocus
 * Copyright © 2026 Yevhen Tretiakov. All rights reserved.
 *

 */

import { extensionUiKeys } from "../../../../shared/constants/storageKeys.js";
import { htmlTemplates } from "../../../constants/html-templates.js";
import { patchExtensionUi } from "../../../application/optionsFlow.js";
import {
  createPasswordResetSchedule,
  renderPasswordResetSchedule,
} from "../../../application/passwordResetPresenter.js";
import { storageSelectors } from "../../../core/bootstrap.js";
import { localizationService } from "../../../services/localizationService.js";
import { createScreenElement } from "../../screenFactory.js";

export function createPasswordResetScreen(context) {
  const root = createScreenElement(htmlTemplates.passwordResetScreen, "passwordResetScreen");
  const passwordResetScreenController = new AbortController();
  const { signal } = passwordResetScreenController;

  async function mount() {
    const initialUi = await storageSelectors.getExtensionUiState();
    if (signal.aborted) return;
    renderPasswordResetSchedule(
      root,
      createPasswordResetSchedule({
        period: initialUi[extensionUiKeys.passwordLockingResetPeriod] ?? 9,
      }),
      (value) => localizationService.localize(value),
    );

    root.querySelector("#passwordResetActivateButton")?.addEventListener("click", async () => {
      const ui = await storageSelectors.getExtensionUiState();
      const period = Number(ui[extensionUiKeys.passwordLockingResetPeriod] ?? 9);
      const schedule = createPasswordResetSchedule({ period });
      if (!schedule) return;
      await patchExtensionUi({
        [extensionUiKeys.passwordLockingResetIsActive]: true,
        [extensionUiKeys.passwordLockingResetFinalDate]: schedule.finalDate.toISOString(),
      });
      context.navigate("passwordUnlockingScreen");
    }, { signal });
  }

  function unmount() {
    passwordResetScreenController.abort();
  }

  return {
    element: root,
    mount,
    unmount,
  };
}

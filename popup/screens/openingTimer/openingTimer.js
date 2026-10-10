/**
 * SocialFocus
 * Copyright © 2026 Yevhen Tretiakov. All rights reserved.
 *

 */

import { extensionUiKeys } from "../../../shared/constants/storageKeys.js";
import { htmlTemplates } from "../../constants/html-templates.js";
import { patchExtensionUi } from "../../application/optionsFlow.js";
import { bindSelectRow } from "../../application/selectPresenter.js";
import { initStateService } from "../../services/initStateService.js";
import { createScreenElement } from "../screenFactory.js";

function setActiveState(root, active) {
  root.querySelector("#launchDelayState")?.toggleAttribute("active", active);
  root.querySelector("#openingTimer-bottomButtons")?.toggleAttribute("active", active);
}

export function createOpeningTimerScreen() {
  const root = createScreenElement(htmlTemplates.openingTimerScreen, "openingTimerScreen");
  const openingTimerScreenController = new AbortController();
  const { signal } = openingTimerScreenController;

  async function mount() {
    await initStateService.hydrate(root);
    if (signal.aborted) return;
    root.querySelectorAll("#openingTimerSetButton, #openingTimerUpdateButton").forEach((button) => {
      button.addEventListener("click", async () => {
        await patchExtensionUi({
          [extensionUiKeys.openingTimerIsActive]: true,
          [extensionUiKeys.openingTimerValue]: root.querySelector("#openingTimerDurationSelect")?.value ?? "",
          [extensionUiKeys.openingTimerMessage]: root.querySelector("#openingTimerMessage")?.value ?? "",
        });
        setActiveState(root, true);
      }, { signal });
    });
    root.querySelector("#openingTimerDestructButton")?.addEventListener("click", async () => {
      await patchExtensionUi({ [extensionUiKeys.openingTimerIsActive]: false });
      setActiveState(root, false);
    }, { signal });
    root.querySelectorAll(".modernFormBlockItemsWrapper select").forEach((select) =>
      bindSelectRow(select, { signal }),
    );
  }

  function unmount() {
    openingTimerScreenController.abort();
  }

  return {
    element: root,
    mount,
    unmount,
  };
}

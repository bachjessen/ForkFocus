/**
 * SocialFocus
* SocialFocus
 * Copyright © 2026 
 */

import { localStateKeys, sharedStateKeys, storageKeys, systemBuckets } from "../../../shared/constants/storageKeys.js";
import { htmlTemplates } from "../../constants/html-templates.js";
import { patchSystemBucket } from "../../application/optionsFlow.js";
import { renderOptions } from "../../application/optionsRenderer.js";
import { storageSelectors } from "../../core/bootstrap.js";
import { initStateService } from "../../services/initStateService.js";
import { messagingService } from "../../services/messagingService.js";
import { storageService } from "../../services/storageService.js";
import { uiStateService } from "../../services/uiStateService.js";
import { createScreenElement } from "../screenFactory.js";

function localChange(changes) {
  return changes[storageKeys.notSyncingState]?.newValue ?? null;
}

export function createMainScreen() {
  const root = createScreenElement(htmlTemplates.mainScreen, "mainScreen");
  const mainScreenController = new AbortController();
  const { signal } = mainScreenController;

  async function mount() {
    await Promise.all([
      initStateService.hydrate(root),
      renderOptions(root, { signal }),
    ]);
    if (signal.aborted) return;
    root.querySelector("#activeCategoryButton")?.addEventListener("click", () => {
      root.setAttribute("categoryPickerIsShowing", String(root.getAttribute("categoryPickerIsShowing") === "false"));
    }, { signal });

    const { local, shared } = await storageSelectors.getPopupState();
    if (signal.aborted) return;
    uiStateService.setDisableState(local[localStateKeys.extensionIsEnabled] === false);
    let gradient = Number(shared[sharedStateKeys.gradientIndex]) || 0;
    const today = new Date().toISOString().split("T")[0];
    if (shared[sharedStateKeys.gradientCurrentDate] !== today) {
      gradient = gradient >= 16 ? 1 : gradient + 1;
      await patchSystemBucket(systemBuckets.sharedState, {
        [sharedStateKeys.gradientCurrentDate]: today,
        [sharedStateKeys.gradientIndex]: gradient,
      });
    }
    if (signal.aborted) return;

    const storageListener = (changes) => {
      const next = localChange(changes);
      if (next) uiStateService.setDisableState(next[localStateKeys.extensionIsEnabled] === false);
    };
    storageService.subscribe(storageListener);
    signal.addEventListener("abort", () => storageService.unsubscribe(storageListener), { once: true });

    root.querySelector("#powerButton")?.addEventListener("click", async () => {
      const latestLocal = await storageSelectors.getLocalState();
      const enabled = latestLocal[localStateKeys.extensionIsEnabled] !== false;
      root.querySelector(enabled ? ".turnOffPickerPopup" : ".turnOnPickerPopup")?.toggleAttribute("active");
    }, { signal });

    for (const [turnType, selector] of [["Off", ".turnOffElement"], ["On", ".turnOnElement"]]) {
      root.querySelectorAll(selector).forEach((choice) => choice.addEventListener("click", async () => {
        choice.closest(`.turn${turnType}PickerPopup`)?.removeAttribute("active");
        await messagingService.scheduleExtensionTimer({ durationMinutes: Number(choice.dataset.value), turnType });
      }, { signal }));
    }
  }

  function unmount() {
    mainScreenController.abort();
  }

  return {
    element: root,
    mount,
    unmount,
  };
}

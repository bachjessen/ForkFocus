/**
 * SocialFocus
 * Copyright © 2026 Yevhen Tretiakov. All rights reserved.
 *

 */

import { sharedStateKeys, systemBuckets } from "../../../shared/constants/storageKeys.js";
import { htmlTemplates } from "../../constants/html-templates.js";
import { patchSystemBucket } from "../../application/optionsFlow.js";
import { formatShortcut } from "../../application/shortcutPresenter.js";
import { initStateService } from "../../services/initStateService.js";
import { createScreenElement } from "../screenFactory.js";

export function createShortcutsScreen() {
  const root = createScreenElement(htmlTemplates.shortcutsScreen, "shortcutsScreen");
  const shortcutsScreenController = new AbortController();
  const { signal } = shortcutsScreenController;

  async function mount() {
    await initStateService.hydrate(root);
    if (signal.aborted) return;
    let listening = false;
    let keys = [];
    const button = root.querySelector("#setHotkeyButton");
    const wrapper = root.querySelector(".hotKeyWrapper");
    const emptyLabel = button?.textContent ?? "";
    button?.addEventListener("click", () => {
      listening = true;
      keys = [];
      const modal = root.querySelector("#shortcutsModal");
      if (modal) modal.style.display = "block";
    }, { signal });
    root.querySelector("#clearHotKey")?.addEventListener("click", async () => {
      await patchSystemBucket(systemBuckets.sharedState, { [sharedStateKeys.shortcutDisableEnable]: [] });
      if (button) button.textContent = emptyLabel;
      wrapper?.classList.remove("setted");
    }, { signal });
    document.addEventListener("keydown", (event) => {
      if (!listening) return;
      const id = ["Control", "Shift", "Alt", "Meta"].includes(event.key) ? event.key : event.code;
      if (!keys.includes(id)) keys.push(id);
    }, { signal });
    document.addEventListener("keyup", async () => {
      if (!listening) return;
      listening = false;
      await patchSystemBucket(systemBuckets.sharedState, { [sharedStateKeys.shortcutDisableEnable]: keys });
      const modal = root.querySelector("#shortcutsModal");
      if (modal) modal.style.display = "none";
      if (button) button.textContent = formatShortcut(keys);
      wrapper?.classList.add("setted");
      keys = [];
    }, { signal });
  }

  function unmount() {
    shortcutsScreenController.abort();
  }

  return {
    element: root,
    mount,
    unmount,
  };
}

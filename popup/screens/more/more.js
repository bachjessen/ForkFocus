/**
 * SocialFocus
* SocialFocus
 * Copyright © 2026 
 */

import { localStateKeys, metaStateKeys, sharedStateKeys, systemBuckets } from "../../../shared/constants/storageKeys.js";
import { htmlTemplates } from "../../constants/html-templates.js";
import { patchSystemBucket } from "../../application/optionsFlow.js";
import { bindSelectRow } from "../../application/selectPresenter.js";
import { storageMutations, storageSelectors } from "../../core/bootstrap.js";
import { initStateService } from "../../services/initStateService.js";
import { localizationService } from "../../services/localizationService.js";
import { uiStateService } from "../../services/uiStateService.js";
import { themeService } from "../../services/themeService.js";
import { createScreenElement } from "../screenFactory.js";

export function createMoreScreen() {
  const root = createScreenElement(htmlTemplates.moreScreen, "moreScreen");
  const moreScreenController = new AbortController();
  const { signal } = moreScreenController;

  async function mount() {
    await initStateService.hydrate(root);
    root.querySelectorAll(".popUpMenuList select").forEach((select) =>
      bindSelectRow(select, { signal }),
    );
    const theme = root.querySelector("#extensionThemeSelect");
    theme?.addEventListener("change", async () => {
      themeService.setThemeMode(theme.value);
      await storageMutations.patchLocalState({ [localStateKeys.theme]: theme.value });
    }, { signal });
    const language = root.querySelector("#extensionLanguageSelect");
    language?.addEventListener("change", async () => {
      await storageMutations.patchLocalState({ [localStateKeys.extensionLanguage]: language.value });
      localizationService.setLanguage(language.value);
      localizationService.apply(root);
    }, { signal });
  }

  function unmount() {
    moreScreenController.abort();
  }

  return {
    element: root,
    mount,
    unmount,
  };
}

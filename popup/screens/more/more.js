/**
 * SocialFocus
* SocialFocus
 * Copyright © 2026 
 */

import { localStateKeys, metaStateKeys, sharedStateKeys, systemBuckets } from "../../../shared/constants/storageKeys.js";
import { htmlTemplates } from "../../constants/html-templates.js";
import { patchSystemBucket } from "../../application/optionsFlow.js";
import { applyBrowserLinks } from "../../application/browserLinksPresenter.js";
import { bindSelectRow } from "../../application/selectPresenter.js";
import { storageMutations, storageSelectors } from "../../core/bootstrap.js";
import { initStateService } from "../../services/initStateService.js";
import { localizationService } from "../../services/localizationService.js";
import { messagingService } from "../../services/messagingService.js";
import { uiStateService } from "../../services/uiStateService.js";
import { themeService } from "../../services/themeService.js";
import { createScreenElement } from "../screenFactory.js";

function isSafari() {
  const agent = navigator.userAgent ?? "";
  return agent.includes("Safari") && !agent.includes("Chrome");
}

export function createMoreScreen(context) {
  const root = createScreenElement(htmlTemplates.moreScreen, "moreScreen");
  const moreScreenController = new AbortController();
  const { signal } = moreScreenController;

  async function mount() {
    await initStateService.hydrate(root);
    const state = await storageSelectors.getPopupState();
    if (signal.aborted) return;
    const { local, meta, identity, lifecycle } = state;
    const { uuid } = identity;
    applyBrowserLinks(
      root,
      document.documentElement.getAttribute("browser") ?? "chrome",
    );
    const offer = root.querySelector(".subScreenInfo .submitButton");
    if (offer) offer.setAttribute("href", isSafari() ? "socialfocus://plus" : `https://socialfocus.app/offer/?email=${encodeURIComponent(local[localStateKeys.username] ?? "")}&uuid=${encodeURIComponent(uuid)}`);
    root.querySelector("#extraLinksButton")?.addEventListener("click", () => root.querySelector("#appLinksWrapper")?.classList.toggle("clicked"), { signal });
    root.querySelector("#appLinksWrapper")?.addEventListener("click", () => root.querySelector(".linksPickerPopup")?.toggleAttribute("active"), { signal });
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
    root.querySelector(".popUpMenuListGroupHeaderContainer")?.addEventListener("click", async () => {
      const showing = root.getAttribute("isShowMyApp") === "true";
      const value = showing ? "hide" : "showing";
      root.setAttribute("isShowMyApp", String(!showing));
      uiStateService.setAttribute({ element: document.documentElement, key: "myOtherApps", value });
      await patchSystemBucket(systemBuckets.sharedState, { [sharedStateKeys.myOtherApps]: value });
    }, { signal });
    root.querySelector(".profileInfo")?.addEventListener("click", () => {
      if (!isSafari()) context.navigate(uuid ? "accountManageScreen" : "proLoginScreen");
    }, { signal });
    const cloud = root.querySelector("#iCloudSyncingSelect");
    if (cloud && !uuid) cloud.value = "off";
    cloud?.addEventListener("change", async () => {
      const latest = await storageSelectors.getPopupState();
      if (!latest.identity.uuid) {
        cloud.value = "off";
        await storageMutations.patchLocalState({ [localStateKeys.isCloudSyncing]: "off" });
        if (isSafari()) globalThis.open("socialfocus://account"); else context.navigate("proLoginScreen");
        return;
      }
      if (!latest.local[localStateKeys.isUserPro]) {
        cloud.value = "off";
        await storageMutations.patchLocalState({ [localStateKeys.isCloudSyncing]: "off" });
        context.navigate("plusPromoScreen");
        return;
      }
      await storageMutations.patchLocalState({
        [localStateKeys.isCloudSyncing]: cloud.value,
        ...(cloud.value === "on" ? { [localStateKeys.lastSyncingDate]: "0" } : {}),
      });
      if (cloud.value === "on") void messagingService.pullCloudSync();
    }, { signal });
    const release = lifecycle.optionsVersion ?? meta[metaStateKeys.currentOptionsVersion] ?? "";
    const support = root.querySelector("#ideas-bugs-link");
    if (support && release) support.href = `https://socialfocus.app/support?version=${encodeURIComponent(release)}&app_version=${encodeURIComponent(messagingService.getExtensionVersion())}`;
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

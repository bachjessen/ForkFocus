/**
 * SocialFocus
 * Copyright © 2026 Yevhen Tretiakov. All rights reserved.
 *
 * This source code is proprietary and confidential.
 * Unauthorized copying, modification, distribution, or use is strictly prohibited.
 */

import { htmlTemplates } from "../../constants/html-templates.js";
import { storageSelectors } from "../../core/bootstrap.js";
import { createScreenElement } from "../screenFactory.js";

function isSafari() {
  const agent = globalThis.navigator?.userAgent ?? "";
  return agent.includes("Safari") && !agent.includes("Chrome");
}

export function createPlusPromoScreen(context) {
  const root = createScreenElement(htmlTemplates.plusPromoScreen, "plusPromoScreen");
  const plusPromoScreenController = new AbortController();
  const { signal } = plusPromoScreenController;

  async function openOffer() {
    const { uuid, username } = await storageSelectors.getUserIdentity();
    if (!uuid) {
      if (isSafari()) globalThis.open("socialfocus://account");
      else context.navigate("proSignUpScreen");
      return;
    }
    const email = encodeURIComponent(username);
    const encodedUuid = encodeURIComponent(uuid);
    globalThis.open(
      isSafari() ? "socialfocus://plus" : `https://socialfocus.app/offer/?email=${email}&uuid=${encodedUuid}`,
      "_blank",
    );
  }

  function mount() {
    root.querySelector(".proButton")?.addEventListener("click", () => void openOffer(), { signal });
  }

  function unmount() {
    plusPromoScreenController.abort();
  }

  return {
    element: root,
    mount,
    unmount,
  };
}

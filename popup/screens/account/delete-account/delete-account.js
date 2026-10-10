/**
 * SocialFocus
* SocialFocus
 * Copyright © 2026 
 */

import { htmlTemplates } from "../../../constants/html-templates.js";
import { deleteAccount } from "../../../application/accountFlow.js";
import { createScreenElement } from "../../screenFactory.js";

function isSafari() {
  const agent = navigator.userAgent ?? "";
  return agent.includes("Safari") && !agent.includes("Chrome");
}

export function createDeleteAccountScreen(context) {
  const root = createScreenElement(htmlTemplates.deleteAccountScreen, "deleteAccountScreen");
  const deleteAccountScreenController = new AbortController();
  const { signal } = deleteAccountScreenController;

  function mount() {
    root.querySelector("#submitDeleteAccountButton")?.addEventListener("click", async () => {
      if (isSafari()) return;
      const error = root.querySelector("#deleteAccountError");
      try {
        await deleteAccount();
        context.navigate("moreScreen");
      } catch (requestError) {
        if (error) { error.textContent = requestError.message; error.style.display = "block"; }
      }
    }, { signal });
  }

  function unmount() {
    deleteAccountScreenController.abort();
  }

  return {
    element: root,
    mount,
    unmount,
  };
}

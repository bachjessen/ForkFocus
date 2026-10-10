/**
 * SocialFocus
 * Copyright © 2026 Yevhen Tretiakov. All rights reserved.
 *

 */

import { htmlTemplates } from "../../../constants/html-templates.js";
import { signIn } from "../../../application/authFlow.js";
import { createScreenElement } from "../../screenFactory.js";

function isSafari() {
  const agent = navigator.userAgent ?? "";
  return agent.includes("Safari") && !agent.includes("Chrome");
}
function showError(root, message) {
  const output = root.querySelector("#logInError");
  if (output) { output.textContent = message; output.style.display = "block"; }
}

export function createLoginScreen(context) {
  const root = createScreenElement(htmlTemplates.proLoginScreen, "proLoginScreen");
  const loginScreenController = new AbortController();
  const { signal } = loginScreenController;

  function mount() {
    const emailInput = root.querySelector("#proLoginEmail");
    const passwordInput = root.querySelector("#proLoginPassword");
    if (emailInput) emailInput.autocomplete = "username";
    if (passwordInput) passwordInput.autocomplete = "current-password";
    root.querySelector(".logInForm")?.addEventListener("submit", async (event) => {
      event.preventDefault();
      if (isSafari()) return;
      const button = root.querySelector("#logInButton");
      button?.setAttribute("disabled", "");
      const email = root.querySelector("#proLoginEmail")?.value ?? "";
      const password = root.querySelector("#proLoginPassword")?.value ?? "";
      try {
        const result = await signIn({ email, password });
        if (result.verificationRequired) {
          context.navigate("emailVerification");
        } else {
          root.querySelector(".logInForm")?.reset();
          const error = root.querySelector("#logInError");
          if (error) error.style.display = "none";
          context.navigate("moreScreen");
        }
      } catch (error) {
        showError(root, error.message);
      } finally {
        button?.removeAttribute("disabled");
      }
    }, { signal });
  }

  function unmount() {
    loginScreenController.abort();
  }

  return {
    element: root,
    mount,
    unmount,
  };
}

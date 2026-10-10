/**
 * SocialFocus
* SocialFocus
 * Copyright © 2026 
 */

import { htmlTemplates } from "../../../constants/html-templates.js";
import { signUp } from "../../../application/authFlow.js";
import { createScreenElement } from "../../screenFactory.js";

function isSafari() {
  const agent = navigator.userAgent ?? "";
  return agent.includes("Safari") && !agent.includes("Chrome");
}
function showError(root, message) {
  const output = root.querySelector("#signUpError");
  if (output) { output.textContent = message; output.style.display = "block"; }
}

export function createSignUpScreen(context) {
  const root = createScreenElement(htmlTemplates.proSignUpScreen, "proSignUpScreen");
  const signUpScreenController = new AbortController();
  const { signal } = signUpScreenController;

  function mount() {
    const emailInput = root.querySelector("#proSignUpEmail");
    const passwordInput = root.querySelector("#proSignUpPassword");
    const confirmationInput = root.querySelector("#proSignUpConfirmPassword");
    if (emailInput) emailInput.autocomplete = "username";
    for (const input of [passwordInput, confirmationInput]) {
      if (!input) continue;
      input.minLength = 8;
      input.autocomplete = "new-password";
    }
    root.querySelector(".signUpForm")?.addEventListener("submit", async (event) => {
      event.preventDefault();
      if (isSafari()) return;
      const button = root.querySelector("#signUpButton");
      button?.setAttribute("disabled", "");
      const email = root.querySelector("#proSignUpEmail")?.value ?? "";
      try {
        await signUp({
          email,
          password: root.querySelector("#proSignUpPassword")?.value ?? "",
          confirmation: root.querySelector("#proSignUpConfirmPassword")?.value ?? "",
        });
        context.navigate("emailVerification");
      } catch (error) {
        showError(root, error.message);
      } finally {
        button?.removeAttribute("disabled");
      }
    }, { signal });
  }

  function unmount() {
    signUpScreenController.abort();
  }

  return {
    element: root,
    mount,
    unmount,
  };
}

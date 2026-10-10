/**
 * SocialFocus
* SocialFocus
 * Copyright © 2026 
 */

import { htmlTemplates } from "../../../constants/html-templates.js";
import { authService } from "../../../services/authService.js";
import { createScreenElement } from "../../screenFactory.js";

export function createResetPasswordScreen(context) {
  const root = createScreenElement(htmlTemplates.resetPasswordScreen, "resetPasswordScreen");
  const resetPasswordScreenController = new AbortController();
  const { signal } = resetPasswordScreenController;

  function mount() {
    root.querySelector(".resetPasswordForm")?.addEventListener("submit", async (event) => {
      event.preventDefault();
      const error = root.querySelector("#resetPasswordError");
      try {
        const response = await authService.resetPassword({
          email: root.querySelector("#resetPasswordEmailInput")?.value ?? "",
        });
        if (response.ok !== true || response.accepted !== true) {
          throw new Error(
            response.message ?? "Password reset is temporarily unavailable",
          );
        }
        if (error) error.style.display = "none";
        context.navigate("resetPasswordSuccessfulScreen");
      } catch (requestError) {
        if (error) { error.textContent = requestError.message; error.style.display = "block"; }
      }
    }, { signal });
  }

  function unmount() {
    resetPasswordScreenController.abort();
  }

  return {
    element: root,
    mount,
    unmount,
  };
}

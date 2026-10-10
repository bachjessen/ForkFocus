/**
 * SocialFocus
* SocialFocus
 * Copyright © 2026 
 */

import { htmlTemplates } from "../../../constants/html-templates.js";
import { changePassword, logOut } from "../../../application/accountFlow.js";
import { createScreenElement } from "../../screenFactory.js";

function isSafari() {
  const agent = navigator.userAgent ?? "";
  return agent.includes("Safari") && !agent.includes("Chrome");
}
function show(root, selector, text) {
  const output = root.querySelector(selector);
  if (output) { output.textContent = text; output.style.display = "block"; }
}

function installCurrentPasswordField(root) {
  if (root.querySelector("#accountManageCurrentPassword")) return;
  const newPassword = root.querySelector("#accountManagePassword");
  const newPasswordBlock = newPassword?.closest(".formBlockContent");
  if (!newPasswordBlock) return;

  const block = document.createElement("div");
  block.className = "formBlockContent mbott";
  const input = document.createElement("input");
  input.type = "password";
  input.className = "textField";
  input.id = "accountManageCurrentPassword";
  input.placeholder = "Current password";
  input.autocomplete = "current-password";
  input.required = true;
  block.append(input);
  newPasswordBlock.before(block);

  newPassword.minLength = 8;
  newPassword.autocomplete = "new-password";
  const confirmation = root.querySelector("#accountManageConfirmPassword");
  if (confirmation) {
    confirmation.minLength = 8;
    confirmation.autocomplete = "new-password";
  }
}

export function createAccountScreen(context) {
  const root = createScreenElement(htmlTemplates.accountManageScreen, "accountManageScreen");
  const accountScreenController = new AbortController();
  const { signal } = accountScreenController;

  function mount() {
    installCurrentPasswordField(root);
    root.querySelector("#proLogOutButton")?.addEventListener("click", async () => {
      if (isSafari()) return;
      await logOut();
      context.navigate("moreScreen");
    }, { signal });
    root.querySelector(".updatePasswordForm")?.addEventListener("submit", async (event) => {
      event.preventDefault();
      if (isSafari()) return;
      const currentPassword = root.querySelector("#accountManageCurrentPassword")?.value ?? "";
      const password = root.querySelector("#accountManagePassword")?.value ?? "";
      const confirmation = root.querySelector("#accountManageConfirmPassword")?.value ?? "";
      const error = root.querySelector("#updatePasswordError");
      const success = root.querySelector("#updatePasswordSuccess");
      if (error) error.style.display = "none";
      if (success) success.style.display = "none";
      if (password !== confirmation) {
        show(root, "#updatePasswordError", "Error: The new password does not match the confirm password");
        return;
      }
      try {
        const result = await changePassword({
          currentPassword,
          newPassword: password,
        });
        show(root, "#updatePasswordSuccess", result.message ?? "Updated");
        root.querySelector(".updatePasswordForm")?.reset();
        if (result.requiresLogin) context.navigate("moreScreen");
      }
      catch (requestError) { show(root, "#updatePasswordError", requestError.message); }
    }, { signal });
  }

  function unmount() {
    accountScreenController.abort();
  }

  return {
    element: root,
    mount,
    unmount,
  };
}

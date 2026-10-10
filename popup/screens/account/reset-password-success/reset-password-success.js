/**
 * SocialFocus
 * Copyright © 2026 Yevhen Tretiakov. All rights reserved.
 *

 */

import { htmlTemplates } from "../../../constants/html-templates.js";
import { createScreenElement } from "../../screenFactory.js";

export function createResetPasswordSuccessfulScreen() {
  const root = createScreenElement(htmlTemplates.resetPasswordSuccessfulScreen, "resetPasswordSuccessfulScreen");
  const resetPasswordSuccessfulScreenController = new AbortController();

  function mount() {}

  function unmount() {
    resetPasswordSuccessfulScreenController.abort();
  }

  return {
    element: root,
    mount,
    unmount,
  };
}

/**
 * SocialFocus
 * Copyright © 2026 Yevhen Tretiakov. All rights reserved.
 *
 * This source code is proprietary and confidential.
 * Unauthorized copying, modification, distribution, or use is strictly prohibited.
 */

import { htmlTemplates } from "../../constants/html-templates.js";
import { createScreenElement } from "../screenFactory.js";

export function createOpeningTimerWaitScreen(context) {
  const root = createScreenElement(htmlTemplates.openingTimerWaitScreen, "openingTimerWaitScreen");
  const openingTimerWaitScreenController = new AbortController();

  function mount() {
    const message = root.querySelector("#openingTimerMessageDisplay");
    const text = context.props.message ?? "";
    if (message) {
      message.textContent = text;
      message.style.display = text ? "block" : "none";
    }
  }

  function unmount() {
    openingTimerWaitScreenController.abort();
  }

  return {
    element: root,
    mount,
    unmount,
  };
}

/**
 * SocialFocus
 * Copyright © 2026 Yevhen Tretiakov. All rights reserved.
 *
 * This source code is proprietary and confidential.
 * Unauthorized copying, modification, distribution, or use is strictly prohibited.
 */

function hideMessagingFloatPopup(value) {
  const interopOutlet = document.querySelector(
    'div[data-testid="interop-shadowdom"]',
  );
  if (!interopOutlet) return;

  const shadowRoot = interopOutlet.shadowRoot;
  if (!shadowRoot) return;

  const msgOverlay = shadowRoot.querySelector("aside#msg-overlay");
  if (msgOverlay) {
    if (value) {
      msgOverlay.style.display = "none";
    } else {
      msgOverlay.style.display = "flex";
    }
  }
}

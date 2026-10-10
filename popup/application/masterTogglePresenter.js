/**
 * SocialFocus
 * Copyright © 2026 Yevhen Tretiakov. All rights reserved.
 *
 * This source code is proprietary and confidential.
 * Unauthorized copying, modification, distribution, or use is strictly prohibited.
 */

export function setMasterToggleVisibility(section, disabled) {
  if (!section) return;

  for (const group of section.querySelectorAll(".settingsGroup")) {
    const isMasterGroup = Boolean(
      group.querySelector('input[id*="master_toggle"]'),
    );
    group.toggleAttribute("master-disabled", disabled && !isMasterGroup);
  }
}

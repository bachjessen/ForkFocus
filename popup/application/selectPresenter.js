/**
 * SocialFocus
 * Copyright © 2026 Yevhen Tretiakov. All rights reserved.
 *

 */

export function openSelect(select) {
  if (typeof select?.showPicker === "function") {
    try {
      select.showPicker();
      return;
    } catch {
      // Safari may reject showPicker even during a user gesture.
    }
  }
  select?.focus();
}

export function bindSelectRow(select, { signal, row } = {}) {
  const targetRow = row ?? select?.closest(
    ".optionWrapper, .popUpMenuList, .modernFormBlockItemsWrapper",
  );
  targetRow?.addEventListener("click", (event) => {
    if (event.target !== select) openSelect(select);
  }, { signal });
}

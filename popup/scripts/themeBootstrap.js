/**
 * SocialFocus
 * Copyright © 2026 Yevhen Tretiakov. All rights reserved.
 *
 * This source code is proprietary and confidential.
 * Unauthorized copying, modification, distribution, or use is strictly prohibited.
 */

(function applyInitialSystemTheme() {
  const root = document.documentElement;
  const prefersDarkTheme = window.matchMedia(
    "(prefers-color-scheme: dark)",
  ).matches;

  root.dataset.themeMode = "auto";
  root.dataset.theme = prefersDarkTheme ? "dark" : "light";
})();

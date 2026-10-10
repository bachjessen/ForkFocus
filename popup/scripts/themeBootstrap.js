/**
 * SocialFocus
* SocialFocus
 * Copyright © 2026 
 */

(function applyInitialSystemTheme() {
  const root = document.documentElement;
  const prefersDarkTheme = window.matchMedia(
    "(prefers-color-scheme: dark)",
  ).matches;

  root.dataset.themeMode = "auto";
  root.dataset.theme = prefersDarkTheme ? "dark" : "light";
})();

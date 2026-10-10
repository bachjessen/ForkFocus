/**
 * SocialFocus
 * Copyright © 2026 Yevhen Tretiakov. All rights reserved.
 *
 * This source code is proprietary and confidential.
 * Unauthorized copying, modification, distribution, or use is strictly prohibited.
 */

const DEFAULT_THEME_MODE = "auto";
const supportedThemeModes = new Set([DEFAULT_THEME_MODE, "light", "dark"]);
const systemDarkThemeQuery = window.matchMedia("(prefers-color-scheme: dark)");

let currentThemeMode = DEFAULT_THEME_MODE;
let resolvedTheme = systemDarkThemeQuery.matches ? "dark" : "light";

function normalizeThemeMode(value) {
  return supportedThemeModes.has(value) ? value : DEFAULT_THEME_MODE;
}

function resolveTheme(mode) {
  if (mode !== DEFAULT_THEME_MODE) return mode;
  return systemDarkThemeQuery.matches ? "dark" : "light";
}

function applyThemeMode(value) {
  currentThemeMode = normalizeThemeMode(value);
  resolvedTheme = resolveTheme(currentThemeMode);

  const root = document.documentElement;
  root.dataset.themeMode = currentThemeMode;
  root.dataset.theme = resolvedTheme;

  return resolvedTheme;
}

function handleSystemThemeChange() {
  if (currentThemeMode === DEFAULT_THEME_MODE) {
    applyThemeMode(currentThemeMode);
  }
}

if (typeof systemDarkThemeQuery.addEventListener === "function") {
  systemDarkThemeQuery.addEventListener("change", handleSystemThemeChange);
} else {
  systemDarkThemeQuery.addListener(handleSystemThemeChange);
}

export const themeService = Object.freeze({
  setThemeMode: applyThemeMode,
  getThemeMode: () => currentThemeMode,
  getResolvedTheme: () => resolvedTheme,
});

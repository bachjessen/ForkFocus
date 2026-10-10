/**
 * SocialFocus
 * Copyright © 2026 Yevhen Tretiakov. All rights reserved.
 *
 * This source code is proprietary and confidential.
 * Unauthorized copying, modification, distribution, or use is strictly prohibited.
 */

import { localStateKeys } from "../../shared/constants/storageKeys.js";
import { storageSelectors } from "../core/bootstrap.js";
import { resetDurationVariants, translateScreens } from "../scripts/screenTranslation.js";

function browserLocale() {
  const locale = navigator.language || "en";
  if (locale.startsWith("zh-CN")) return "zh-CN";
  if (locale.startsWith("zh-TW")) return "zh-TW";
  return locale.split("-")[0];
}

let currentLanguage = "en";
export const localizationService = Object.freeze({
  async resolveLanguage() {
    const local = await storageSelectors.getLocalState();
    const selected = local[localStateKeys.extensionLanguage] ?? "auto";
    currentLanguage = selected === "auto" ? browserLocale() : selected;
    return { selected, language: currentLanguage };
  },
  apply(root = document) {
    if (["ar", "he"].includes(currentLanguage)) document.documentElement.setAttribute("dir", "rtl");
    else document.documentElement.removeAttribute("dir");
    translateScreens(currentLanguage, root);
  },
  localize(value) { return value?.[currentLanguage] ?? value?.en ?? value; },
  setLanguage(language) { currentLanguage = language === "auto" ? browserLocale() : language; this.apply(); },
  get language() { return currentLanguage; },
  get resetDurationVariants() { return resetDurationVariants; },
});

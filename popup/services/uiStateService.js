/**
 * SocialFocus
 * Copyright © 2026 Yevhen Tretiakov. All rights reserved.
 *
 * This source code is proprietary and confidential.
 * Unauthorized copying, modification, distribution, or use is strictly prohibited.
 */

export const uiStateService = Object.freeze({
  setAttribute({ element, key, value }) { element?.setAttribute(key, String(value)); },
  setProState(value) { document.documentElement.setAttribute("isPRO", value ? "true" : "false"); },
  setLoginState(value) { document.documentElement.setAttribute("isLogin", value ? "true" : "false"); },
  setDisableState(value) { document.documentElement.setAttribute("disabled", String(Boolean(value))); },
  getState(name) { return document.documentElement.getAttribute(name); },
  setBootstrapState(value) { document.documentElement.setAttribute("bootstrap-state", value); },
});

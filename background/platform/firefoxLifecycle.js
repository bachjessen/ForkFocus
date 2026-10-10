/**
 * SocialFocus
 * Copyright © 2026 Yevhen Tretiakov. All rights reserved.
 *
 * This source code is proprietary and confidential.
 * Unauthorized copying, modification, distribution, or use is strictly prohibited.
 */

const UNINSTALL_ACTION = "uninstall_extension";
const PRIVACY_POLICY_URL = "iframes/privacy-policy.html";

function isFirefox(userAgent) {
  return userAgent.toLowerCase().includes("firefox");
}

export function registerFirefoxLifecycle({
  browserApi,
  userAgent = globalThis.navigator?.userAgent ?? "",
}) {
  if (!isFirefox(userAgent)) return false;

  browserApi.runtime.onInstalled.addListener((details) => {
    if (details.reason === "install") {
      void browserApi.tabs.create({ url: PRIVACY_POLICY_URL });
    }
  });

  browserApi.runtime.onMessage.addListener(
    (message, _sender, sendResponse) => {
      if (message?.action !== UNINSTALL_ACTION) return undefined;

      if (!browserApi.management?.uninstallSelf) {
        sendResponse({
          success: false,
          error: "API management.uninstallSelf not allowed",
        });
        return false;
      }

      void browserApi.management
        .uninstallSelf({ showConfirmDialog: true })
        .then(() => sendResponse({ success: true }))
        .catch((error) =>
          sendResponse({ success: false, error: error.message }),
        );
      return true;
    },
  );

  return true;
}

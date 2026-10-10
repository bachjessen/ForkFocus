/**
 * SocialFocus
 * Copyright © 2026 Yevhen Tretiakov. All rights reserved.
 *
 * This source code is proprietary and confidential.
 * Unauthorized copying, modification, distribution, or use is strictly prohibited.
 */

import { isSafariRuntime } from "../auth/safariTokenProvider.js";

const NATIVE_APPLICATION_ID = "application.id";
const GET_PRO_STATUS_COMMAND = "getProStatus";

export function registerSafariEntitlementBridge({
  browserApi,
  userAgent = globalThis.navigator?.userAgent ?? "",
}) {
  const isSafari = isSafariRuntime(userAgent);

  browserApi.runtime.onMessage.addListener(
    (message, _sender, sendResponse) => {
      if (message?.command !== GET_PRO_STATUS_COMMAND) return undefined;

      if (
        !isSafari ||
        typeof browserApi.runtime.sendNativeMessage !== "function"
      ) {
        sendResponse({ supported: false });
        return false;
      }

      browserApi.runtime.sendNativeMessage(
        NATIVE_APPLICATION_ID,
        { message: GET_PRO_STATUS_COMMAND },
        (response) => {
          const error = browserApi.runtime.lastError?.message;
          if (error) {
            sendResponse({ supported: true, error });
            return;
          }
          sendResponse({
            supported: true,
            isPRO: response?.isPRO === true,
            uuid: typeof response?.uuid === "string" ? response.uuid : "",
            email: typeof response?.email === "string" ? response.email : "",
          });
        },
      );
      return true;
    },
  );
}

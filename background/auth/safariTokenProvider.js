/**
 * SocialFocus
 * Copyright © 2026 Yevhen Tretiakov. All rights reserved.
 *
 * This source code is proprietary and confidential.
 * Unauthorized copying, modification, distribution, or use is strictly prohibited.
 */

import { UserAuthApiError } from "../../shared/auth/userAuthApi.js";

const NATIVE_APPLICATION_ID = "application.id";
const NATIVE_TIMEOUT_MS = 15_000;
const TERMINAL_NATIVE_AUTH_CODES = new Set([
  "no_user_session",
  "invalid_refresh_token",
  "refresh_token_expired",
  "refresh_token_reused",
  "session_credentials_changed",
  "session_revoked",
]);

export function isSafariRuntime(
  userAgent = globalThis.navigator?.userAgent ?? "",
) {
  return (
    userAgent.includes("Safari") &&
    !userAgent.includes("Chrome") &&
    !userAgent.includes("Chromium")
  );
}

export function isTerminalSafariAuthCode(code) {
  return TERMINAL_NATIVE_AUTH_CODES.has(code);
}

export async function getSafariAccessToken({
  browserApi = globalThis.browser,
  timeoutMs = NATIVE_TIMEOUT_MS,
  forceRefresh = false,
} = {}) {
  const runtime = browserApi?.runtime;
  if (typeof runtime?.sendNativeMessage !== "function") {
    throw new UserAuthApiError("native_auth_unavailable", 0);
  }

  const response = await new Promise((resolve, reject) => {
    let settled = false;
    let timerId;
    const finish = (callback) => (value) => {
      if (settled) return;
      settled = true;
      clearTimeout(timerId);
      callback(value);
    };
    const succeed = finish(resolve);
    const fail = finish(reject);
    timerId = setTimeout(
      () => fail(new UserAuthApiError("native_auth_timeout", 408)),
      timeoutMs,
    );

    try {
      const possiblePromise = runtime.sendNativeMessage(
        NATIVE_APPLICATION_ID,
        {
          message: forceRefresh
            ? "refreshUserAccessToken"
            : "getUserAccessToken",
        },
        succeed,
      );
      if (possiblePromise && typeof possiblePromise.then === "function") {
        possiblePromise.then(succeed, fail);
      }
    } catch (_error) {
      fail(new UserAuthApiError("native_auth_unavailable", 0));
    }
  });

  if (response?.ok !== true || typeof response?.accessToken !== "string") {
    const code =
      typeof response?.error === "string" ? response.error : "no_user_session";
    throw new UserAuthApiError(
      code,
      isTerminalSafariAuthCode(code) ? 401 : 503,
    );
  }
  if (!response.accessToken.trim()) {
    throw new UserAuthApiError("no_user_session", 401);
  }
  return response.accessToken;
}

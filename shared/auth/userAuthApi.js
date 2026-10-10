/**
 * SocialFocus
 * Copyright © 2026 Yevhen Tretiakov. All rights reserved.
 *
 * This source code is proprietary and confidential.
 * Unauthorized copying, modification, distribution, or use is strictly prohibited.
 */

import { fetchWithTimeout } from "../api/httpClient.js";

const DEFAULT_API_ROOT = "https://untrap.app/api/v2";

export class UserAuthApiError extends Error {
  constructor(code, status = 0) {
    super(code);
    this.name = "UserAuthApiError";
    this.code = code;
    this.status = status;
  }
}

async function requestJson(url, { method = "GET", body, accessToken } = {}) {
  const headers = { "Content-Type": "application/json" };
  if (accessToken) headers.Authorization = `Bearer ${accessToken}`;

  try {
    const response = await fetchWithTimeout(url, {
      method,
      headers,
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
    let payload = null;
    try {
      payload = await response.json();
    } catch (_error) {
      // Non-JSON failures are normalized without exposing response text.
    }
    if (!response.ok) {
      const code = payload?.error?.code ?? `user_auth_http_${response.status}`;
      throw new UserAuthApiError(code, response.status);
    }
    if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
      throw new UserAuthApiError("user_auth_invalid_response", 502);
    }
    return payload;
  } catch (error) {
    if (error instanceof UserAuthApiError) throw error;
    throw new UserAuthApiError(
      error?.name === "AbortError"
        ? "user_auth_timeout"
        : "user_auth_network_error",
    );
  }
}

export function createUserAuthApi({
  apiRoot = DEFAULT_API_ROOT,
  product = "social",
} = {}) {
  const root = `${apiRoot.replace(/\/$/, "")}/${product}`;

  return Object.freeze({
    login: ({ email, password }) =>
      requestJson(`${root}/auth/login`, {
        method: "POST",
        body: { email, password },
      }),

    signup: ({ email, password }) =>
      requestJson(`${root}/auth/signup`, {
        method: "POST",
        body: { email, password },
      }),

    requestEmailVerification: ({ email, password }) =>
      requestJson(`${root}/auth/email-verification/request`, {
        method: "POST",
        body: { email, password },
      }),

    confirmEmailVerification: ({ challengeId, code }) =>
      requestJson(`${root}/auth/email-verification/confirm`, {
        method: "POST",
        body: { challenge_id: challengeId, code },
      }),

    requestPasswordReset: ({ email }) =>
      requestJson(`${root}/auth/password-reset/request`, {
        method: "POST",
        body: { email },
      }),

    refresh: ({ refreshToken }) =>
      requestJson(`${root}/auth/refresh`, {
        method: "POST",
        body: { refresh_token: refreshToken },
      }),

    logout: ({ accessToken }) =>
      requestJson(`${root}/auth/logout`, {
        method: "POST",
        accessToken,
      }),

    getEntitlement: ({ accessToken }) =>
      requestJson(`${root}/me/entitlement`, { accessToken }),

    getSettings: ({ accessToken }) =>
      requestJson(`${root}/me/settings`, { accessToken }),

    updateSettings: ({ accessToken, settings }) =>
      requestJson(`${root}/me/settings`, {
        method: "PUT",
        accessToken,
        body: settings,
      }),

    updatePassword: ({ accessToken, currentPassword, newPassword }) =>
      requestJson(`${root}/me/password`, {
        method: "PUT",
        accessToken,
        body: {
          current_password: currentPassword,
          new_password: newPassword,
        },
      }),

    deleteAccount: ({ accessToken }) =>
      requestJson(`${root}/me`, {
        method: "DELETE",
        accessToken,
      }),

    listTesterReleases: ({ accessToken }) =>
      requestJson(`${root}/tester/releases`, { accessToken }),

    getTesterReleaseSnapshot: ({ accessToken, channel, version }) =>
      requestJson(
        `${root}/tester/releases/${encodeURIComponent(channel)}/${encodeURIComponent(version)}/snapshot`,
        { accessToken },
      ),

    getCurrentOptions: ({ accessToken }) =>
      requestJson(`${root}/options/current`, { accessToken }),
  });
}

export const userAuthApi = createUserAuthApi();

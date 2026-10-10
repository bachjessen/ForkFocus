/**
 * SocialFocus
 * Copyright © 2026 Yevhen Tretiakov. All rights reserved.
 *

 */

import { UserAuthApiError } from "../../shared/auth/userAuthApi.js";

export const TOKEN_SESSION_STORAGE_KEY = "socialFocus_user_auth_session_v2";
const TOKEN_SESSION_VERSION = 1;
const ACCESS_REFRESH_SKEW_MS = 30_000;
const CHALLENGE_ID_PATTERN = /^[0-9a-f]{32}$/;

const TERMINAL_SESSION_CODES = new Set([
  "invalid_refresh_token",
  "refresh_token_expired",
  "refresh_token_reused",
  "session_credentials_changed",
  "session_revoked",
]);

function isNonEmptyString(value) {
  return typeof value === "string" && value.length > 0;
}

function requirePositiveSeconds(value) {
  return Number.isFinite(value) && value > 0;
}

function validateTokenResponse(payload, product) {
  if (
    !payload ||
    !isNonEmptyString(payload.access_token) ||
    !isNonEmptyString(payload.refresh_token) ||
    !isNonEmptyString(payload.session_id) ||
    !requirePositiveSeconds(payload.expires_in) ||
    !requirePositiveSeconds(payload.refresh_expires_in) ||
    !payload.user ||
    !isNonEmptyString(payload.user.uuid) ||
    !isNonEmptyString(payload.user.email) ||
    payload.user.product !== product
  ) {
    throw new UserAuthApiError("user_auth_invalid_response", 502);
  }
}

function validStoredSession(value, product) {
  return Boolean(
    value &&
      value.version === TOKEN_SESSION_VERSION &&
      value.product === product &&
      isNonEmptyString(value.refreshToken) &&
      Number.isFinite(value.refreshExpiresAt) &&
      isNonEmptyString(value.sessionId) &&
      value.user?.product === product &&
      isNonEmptyString(value.user?.uuid) &&
      isNonEmptyString(value.user?.email),
  );
}

function errorCode(error) {
  return typeof error?.code === "string"
    ? error.code
    : "user_auth_unavailable";
}

function verificationChallenge(payload, email, product) {
  const verification = payload?.verification;
  if (
    !verification ||
    !CHALLENGE_ID_PATTERN.test(verification.challenge_id ?? "") ||
    !requirePositiveSeconds(verification.expires_in) ||
    !isNonEmptyString(email)
  ) {
    throw new UserAuthApiError("user_auth_invalid_response", 502);
  }
  if (payload?.user && payload.user.product !== product) {
    throw new UserAuthApiError("user_auth_invalid_response", 502);
  }
  return {
    verificationRequired: true,
    email,
    challengeId: verification.challenge_id,
    expiresIn: verification.expires_in,
  };
}

export function createTokenSessionCoordinator({
  repository,
  api,
  product = "social",
  clock = { now: () => Date.now() },
  onSessionInvalidated = async () => {},
}) {
  let accessState = null;
  let queue = Promise.resolve();

  function enqueue(operation) {
    const task = queue.then(operation);
    queue = task.catch(() => undefined);
    return task;
  }

  async function clearStoredSession({ notify = false } = {}) {
    accessState = null;
    await repository.remove([TOKEN_SESSION_STORAGE_KEY]);
    if (notify) await onSessionInvalidated();
  }

  async function loadStoredSession() {
    const result = await repository.get(TOKEN_SESSION_STORAGE_KEY);
    const session = result[TOKEN_SESSION_STORAGE_KEY];
    if (!validStoredSession(session, product)) {
      if (session !== undefined) await clearStoredSession({ notify: true });
      return null;
    }
    if (session.refreshExpiresAt <= clock.now()) {
      await clearStoredSession({ notify: true });
      return null;
    }
    return session;
  }

  async function saveTokenResponse(payload) {
    validateTokenResponse(payload, product);
    const now = clock.now();
    const session = {
      version: TOKEN_SESSION_VERSION,
      product,
      refreshToken: payload.refresh_token,
      refreshExpiresAt: now + payload.refresh_expires_in * 1000,
      sessionId: payload.session_id,
      user: {
        uuid: payload.user.uuid,
        email: payload.user.email,
        product,
        isTester: payload.user.is_tester === true,
      },
      updatedAt: now,
    };
    accessState = {
      token: payload.access_token,
      expiresAt: now + payload.expires_in * 1000,
      sessionId: payload.session_id,
    };
    await repository.set({ [TOKEN_SESSION_STORAGE_KEY]: session });
    return session;
  }

  async function refreshAccess(session) {
    try {
      const refreshed = await api.refresh({ refreshToken: session.refreshToken });
      return await saveTokenResponse(refreshed);
    } catch (error) {
      if (TERMINAL_SESSION_CODES.has(errorCode(error))) {
        await clearStoredSession({ notify: true });
      }
      throw error;
    }
  }

  async function ensureAccess() {
    const session = await loadStoredSession();
    if (!session) throw new UserAuthApiError("no_user_session", 401);
    if (
      accessState?.sessionId === session.sessionId &&
      accessState.expiresAt - ACCESS_REFRESH_SKEW_MS > clock.now()
    ) {
      return { accessToken: accessState.token, session };
    }
    const refreshedSession = await refreshAccess(session);
    return { accessToken: accessState.token, session: refreshedSession };
  }

  async function withAccess(operation) {
    let authorization = await ensureAccess();
    try {
      return await operation(authorization.accessToken);
    } catch (error) {
      const code = errorCode(error);
      if (code === "access_token_expired" || code === "invalid_access_token") {
        accessState = null;
        authorization = await ensureAccess();
        return await operation(authorization.accessToken);
      }
      if (TERMINAL_SESSION_CODES.has(code)) {
        await clearStoredSession({ notify: true });
      }
      throw error;
    }
  }

  async function entitlementSummary() {
    const payload = await withAccess((accessToken) =>
      api.getEntitlement({ accessToken }),
    );
    const entitlement = payload?.entitlement;
    if (
      !entitlement ||
      entitlement.key !== "pro" ||
      typeof entitlement.active !== "boolean" ||
      entitlement.authority !== "server"
    ) {
      throw new UserAuthApiError("user_auth_invalid_response", 502);
    }
    return entitlement;
  }

  async function activateTokenResponse(response) {
    const session = await saveTokenResponse(response);
    try {
      const entitlement = await entitlementSummary();
      return {
        active: true,
        mode: "token",
        user: session.user,
        isPro: entitlement.active,
        entitlementAvailable: true,
      };
    } catch (error) {
      if (TERMINAL_SESSION_CODES.has(errorCode(error))) throw error;
      return {
        active: true,
        mode: "token",
        user: session.user,
        isPro: false,
        entitlementAvailable: false,
        error: errorCode(error),
      };
    }
  }

  async function loginInternal({ email, password }) {
    if (!isNonEmptyString(email) || !isNonEmptyString(password)) {
      throw new UserAuthApiError("invalid_credentials", 401);
    }
    const response = await api.login({ email, password });
    const previousSession = await loadStoredSession();
    if (previousSession) {
      try {
        await withAccess((accessToken) => api.logout({ accessToken }));
      } catch (_error) {
        // A successful new login must not depend on revoking a stale session.
      }
    }
    return await activateTokenResponse(response);
  }

  async function signupInternal({ email, password }) {
    if (!isNonEmptyString(email) || !isNonEmptyString(password)) {
      throw new UserAuthApiError("invalid_request", 400);
    }
    const response = await api.signup({ email, password });
    const canonicalEmail = response?.user?.email;
    return verificationChallenge(response, canonicalEmail, product);
  }

  async function requestEmailVerificationInternal({ email, password }) {
    if (!isNonEmptyString(email) || !isNonEmptyString(password)) {
      throw new UserAuthApiError("invalid_credentials", 401);
    }
    const response = await api.requestEmailVerification({ email, password });
    return verificationChallenge(response, email, product);
  }

  async function confirmEmailVerificationInternal({ challengeId, code }) {
    if (
      !CHALLENGE_ID_PATTERN.test(challengeId ?? "") ||
      !/^\d{6}$/.test(code ?? "")
    ) {
      throw new UserAuthApiError("verification_code_invalid", 400);
    }
    const response = await api.confirmEmailVerification({
      challengeId,
      code,
    });
    return await activateTokenResponse(response);
  }

  async function requestPasswordResetInternal({ email }) {
    if (!isNonEmptyString(email)) {
      throw new UserAuthApiError("invalid_email", 400);
    }
    const response = await api.requestPasswordReset({ email });
    if (response?.accepted !== true) {
      throw new UserAuthApiError("user_auth_invalid_response", 502);
    }
    return { accepted: true };
  }

  async function statusInternal() {
    const session = await loadStoredSession();
    if (!session) return { active: false };
    try {
      const entitlement = await entitlementSummary();
      return {
        active: true,
        mode: "token",
        user: session.user,
        isPro: entitlement.active,
        entitlementAvailable: true,
      };
    } catch (error) {
      if (TERMINAL_SESSION_CODES.has(errorCode(error))) {
        return { active: false, error: errorCode(error) };
      }
      return {
        active: true,
        mode: "token",
        user: session.user,
        isPro: null,
        entitlementAvailable: false,
        error: errorCode(error),
      };
    }
  }

  async function logoutInternal() {
    const session = await loadStoredSession();
    if (!session) return { revoked: false, hadSession: false };
    let revoked = false;
    try {
      await withAccess((accessToken) => api.logout({ accessToken }));
      revoked = true;
    } catch (_error) {
      // Local credentials are always removed even when the network is down.
    } finally {
      await clearStoredSession();
    }
    return { revoked, hadSession: true };
  }

  async function updatePasswordInternal({ currentPassword, newPassword }) {
    if (!isNonEmptyString(currentPassword)) {
      throw new UserAuthApiError("invalid_current_password", 403);
    }
    if (!isNonEmptyString(newPassword)) {
      throw new UserAuthApiError("invalid_new_password", 400);
    }
    const result = await withAccess((accessToken) =>
      api.updatePassword({ accessToken, currentPassword, newPassword }),
    );
    if (result?.updated !== true || result?.sessions_revoked !== true) {
      throw new UserAuthApiError("user_auth_invalid_response", 502);
    }
    await clearStoredSession({ notify: true });
    return { updated: true, sessionsRevoked: true };
  }

  async function deleteAccountInternal() {
    const result = await withAccess((accessToken) =>
      api.deleteAccount({ accessToken }),
    );
    if (result?.deleted !== true) {
      throw new UserAuthApiError("user_auth_invalid_response", 502);
    }
    await clearStoredSession({ notify: true });
    return { deleted: true };
  }

  return Object.freeze({
    login: (credentials) => enqueue(() => loginInternal(credentials)),
    signup: (credentials) => enqueue(() => signupInternal(credentials)),
    requestEmailVerification: (credentials) =>
      enqueue(() => requestEmailVerificationInternal(credentials)),
    confirmEmailVerification: (verification) =>
      enqueue(() => confirmEmailVerificationInternal(verification)),
    requestPasswordReset: (request) =>
      enqueue(() => requestPasswordResetInternal(request)),
    status: () => enqueue(statusInternal),
    logout: () => enqueue(logoutInternal),
    hasSession: () => enqueue(async () => Boolean(await loadStoredSession())),
    getSettings: () =>
      enqueue(() =>
        withAccess((accessToken) => api.getSettings({ accessToken })),
      ),
    updateSettings: (settings) =>
      enqueue(() =>
        withAccess((accessToken) =>
          api.updateSettings({ accessToken, settings }),
        ),
      ),
    updatePassword: (passwords) =>
      enqueue(() => updatePasswordInternal(passwords)),
    deleteAccount: () => enqueue(deleteAccountInternal),
  });
}

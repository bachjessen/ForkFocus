/**
 * SocialFocus
 * Copyright © 2026 Yevhen Tretiakov. All rights reserved.
 *

 */

import { messagingService } from "./messagingService.js";

const AUTH_ERROR_MESSAGES = {
  invalid_request: "The request is invalid",
  invalid_email: "Enter a valid email address",
  invalid_credentials: "Incorrect email or password",
  login_rate_limited: "Too many login attempts. Please try again later.",
  account_already_exists: "An account with this email already exists",
  signup_unavailable: "Sign up is temporarily unavailable",
  email_already_verified: "This email is already verified",
  verification_delivery_unavailable:
    "The verification email could not be delivered. Please try again.",
  verification_resend_rate_limited:
    "Please wait before requesting another verification code.",
  verification_reauthentication_required:
    "Return to sign in and enter your password to request another code.",
  password_reset_unavailable: "Password reset is temporarily unavailable",
  user_auth_v2_not_configured: "Sign in is temporarily unavailable",
  user_auth_unavailable: "Sign in is temporarily unavailable",
  user_auth_network_error: "Could not connect. Please try again.",
  user_auth_timeout: "The sign-in request timed out. Please try again.",
  user_auth_invalid_response: "Sign in is temporarily unavailable",
};

const ACCOUNT_ERROR_MESSAGES = {
  invalid_current_password: "Current password is incorrect",
  invalid_new_password:
    "New password must be at least 8 characters and no more than 72 bytes",
  password_unchanged: "New password must be different from the current password",
  user_not_found: "User account was not found",
  account_update_unavailable: "Password update is temporarily unavailable",
  account_delete_unavailable: "Account deletion is temporarily unavailable",
};

const VERIFICATION_ERROR_MESSAGES = {
  verification_code_invalid: "Invalid verification code",
  verification_code_expired: "Verification code expired",
  verification_rate_limited:
    "Too many verification attempts. Please try again later.",
  verification_unavailable: "Email verification is temporarily unavailable",
};

let verificationCredential = null;

function authError(code, fallback = "Authentication is temporarily unavailable") {
  return {
    ok: false,
    code,
    message:
      AUTH_ERROR_MESSAGES[code] ?? VERIFICATION_ERROR_MESSAGES[code] ?? fallback,
  };
}

function verificationResult(response, email, password) {
  if (
    response?.ok !== true ||
    response.verificationRequired !== true ||
    typeof response.challengeId !== "string" ||
    !Number.isFinite(response.expiresIn)
  ) {
    return authError(
      response?.error?.code ?? "user_auth_invalid_response",
    );
  }
  verificationCredential = { email, password };
  return {
    ok: true,
    verificationRequired: true,
    email: response.email ?? email,
    challengeId: response.challengeId,
    expiresIn: response.expiresIn,
  };
}

async function requestVerification({ email, password }) {
  try {
    const response = await messagingService.userAuthRequestEmailVerification({
      email,
      password,
    });
    return verificationResult(response, email, password);
  } catch (_error) {
    return authError("user_auth_unavailable");
  }
}

async function tokenLogin({ email, password }) {
  let response;
  try {
    response = await messagingService.userAuthLogin({ email, password });
  } catch (_error) {
    return authError("user_auth_unavailable");
  }
  if (response?.ok === true && response.active === true) {
    return {
      ok: true,
      authenticated: true,
      uuid: response.user.uuid,
      isPRO: response.isPro ? 1 : 0,
      authMode: "token",
      entitlementAvailable: response.entitlementAvailable === true,
    };
  }
  const code = response?.error?.code ?? "user_auth_unavailable";
  if (code === "email_verification_required") {
    return await requestVerification({ email, password });
  }
  return authError(code, "Sign in is temporarily unavailable");
}

export const authService = Object.freeze({
  login: async ({ email, password }) => tokenLogin({ email, password }),

  signUp: async ({ email, password }) => {
    try {
      const response = await messagingService.userAuthSignup({
        email,
        password,
      });
      return verificationResult(response, email, password);
    } catch (_error) {
      return authError("signup_unavailable");
    }
  },

  logout: async () => {
    try {
      await messagingService.userAuthLogout();
    } catch (_error) {
      // Local cleanup remains available if the background is unavailable.
    }
  },

  updatePassword: async ({ currentPassword, newPassword }) => {
    let response;
    try {
      response = await messagingService.userAuthUpdatePassword({
        currentPassword,
        newPassword,
      });
    } catch (_error) {
      return {
        ok: false,
        code: "account_update_unavailable",
        message: ACCOUNT_ERROR_MESSAGES.account_update_unavailable,
      };
    }
    if (response?.ok === true && response.updated === true) {
      return {
        ok: true,
        updated: true,
        message: "Password updated. Please sign in again.",
        requiresLogin: true,
      };
    }
    const code = response?.error?.code ?? "account_update_unavailable";
    return {
      ok: false,
      code,
      message:
        ACCOUNT_ERROR_MESSAGES[code] ??
        "Password update is temporarily unavailable",
    };
  },

  deleteAccount: async () => {
    let response;
    try {
      response = await messagingService.userAuthDeleteAccount();
    } catch (_error) {
      return {
        ok: false,
        code: "account_delete_unavailable",
        message: ACCOUNT_ERROR_MESSAGES.account_delete_unavailable,
      };
    }
    if (response?.ok === true && response.deleted === true) {
      return { ok: true, deleted: true };
    }
    const code = response?.error?.code ?? "account_delete_unavailable";
    return {
      ok: false,
      code,
      message:
        ACCOUNT_ERROR_MESSAGES[code] ??
        "Account deletion is temporarily unavailable",
    };
  },

  verifyEmail: async ({ challengeId, code }) => {
    let response;
    try {
      response = await messagingService.userAuthConfirmEmailVerification({
        challengeId,
        code,
      });
    } catch (_error) {
      return authError("verification_unavailable");
    }
    if (response?.ok === true && response.active === true) {
      verificationCredential = null;
      return {
        ok: true,
        authenticated: true,
        authMode: "token",
        uuid: response.user.uuid,
        email: response.user.email,
        isPRO: response.isPro ? 1 : 0,
      };
    }
    const errorCode = response?.error?.code ?? "verification_unavailable";
    return authError(errorCode, "Email verification is temporarily unavailable");
  },

  resendVerificationCode: async ({ email }) => {
    if (
      verificationCredential?.email !== email ||
      typeof verificationCredential?.password !== "string" ||
      !verificationCredential.password
    ) {
      return authError("verification_reauthentication_required");
    }
    return await requestVerification(verificationCredential);
  },

  resetPassword: async ({ email }) => {
    try {
      const response = await messagingService.userAuthRequestPasswordReset({
        email,
      });
      if (response?.ok === true && response.accepted === true) {
        return { ok: true, accepted: true };
      }
      return authError(
        response?.error?.code ?? "password_reset_unavailable",
        "Password reset is temporarily unavailable",
      );
    } catch (_error) {
      return authError("password_reset_unavailable");
    }
  },

  clearVerificationCredential: () => {
    verificationCredential = null;
  },
});

/**
 * SocialFocus
 * Copyright © 2026 Yevhen Tretiakov. All rights reserved.
 *

 */

import { storageMutations, storageSelectors } from "../core/bootstrap.js";
import { authService } from "../services/authService.js";
import { messagingService } from "../services/messagingService.js";
import { uiStateService } from "../services/uiStateService.js";

function validateNewPassword(password) {
  const byteLength = new TextEncoder().encode(password).length;
  if (password.length < 8 || byteLength > 72) {
    throw new Error(
      "Password must be at least 8 characters and no more than 72 bytes",
    );
  }
}

async function saveSession({ email, uuid, isPro }) {
  await storageMutations.clearVerificationState();
  uiStateService.setLoginState(true);
  uiStateService.setProState(Boolean(isPro));
  globalThis.app_isLogin = "true";
  globalThis.app_isPRO = isPro ? "true" : "false";
  void messagingService.pullCloudSync();
  return { authenticated: true, email, uuid, isPro: Boolean(isPro) };
}

async function beginVerification({ email, challengeId, expiresIn, type }) {
  await storageMutations.setVerificationState({
    email,
    challengeId,
    expiresAt: Date.now() + expiresIn * 1000,
    type,
  });
  return { verificationRequired: true, email, type };
}

export async function signIn({ email, password }) {
  const response = await authService.login({ email, password });
  if (response.ok === true && response.authenticated === true) {
    return saveSession({
      email,
      uuid: response.uuid,
      isPro: response.isPRO === 1,
    });
  }
  if (response.ok === true && response.verificationRequired === true) {
    return beginVerification({
      email: response.email,
      challengeId: response.challengeId,
      expiresIn: response.expiresIn,
      type: "login",
    });
  }
  throw new Error(response.message ?? "login_failed");
}

export async function signUp({ email, password, confirmation }) {
  if (password !== confirmation) {
    throw new Error("Password does not match the confirm password");
  }
  validateNewPassword(password);
  const response = await authService.signUp({ email, password });
  if (response.ok !== true || response.verificationRequired !== true) {
    throw new Error(response.message ?? "signup_failed");
  }
  return beginVerification({
    email: response.email,
    challengeId: response.challengeId,
    expiresIn: response.expiresIn,
    type: "signUp",
  });
}

export async function getPendingVerification() {
  return storageSelectors.getPendingVerification();
}

export async function clearPendingVerification() {
  const pending = await getPendingVerification();
  authService.clearVerificationCredential();
  await storageMutations.clearVerificationState();
  return pending.type;
}

export async function verifyPendingCode(code) {
  const pending = await getPendingVerification();
  if (
    !/^[0-9a-f]{32}$/.test(pending.challengeId) ||
    !Number.isFinite(pending.expiresAt) ||
    pending.expiresAt <= Date.now()
  ) {
    await clearPendingVerification();
    throw new Error("Verification session expired. Return to sign in.");
  }
  const response = await authService.verifyEmail({
    challengeId: pending.challengeId,
    code,
  });
  if (response.ok !== true || response.authenticated !== true) {
    throw new Error(response.message ?? "verification_failed");
  }
  return saveSession({
    email: response.email ?? pending.email,
    uuid: response.uuid,
    isPro: response.isPRO === 1,
  });
}

export async function resendPendingCode() {
  const pending = await getPendingVerification();
  const response = await authService.resendVerificationCode({
    email: pending.email,
  });
  if (response.ok !== true || response.verificationRequired !== true) {
    throw new Error(response.message ?? "verification_send_failed");
  }
  await storageMutations.setVerificationState({
    email: response.email,
    challengeId: response.challengeId,
    expiresAt: Date.now() + response.expiresIn * 1000,
    type: pending.type,
  });
  return { resent: true };
}

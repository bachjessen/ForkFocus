/**
 * SocialFocus
* SocialFocus
 * Copyright © 2026 
 */

import { storageMutations } from "../core/bootstrap.js";
import { authService } from "../services/authService.js";
import { uiStateService } from "../services/uiStateService.js";

export async function logOut() {
  await authService.logout();
  await storageMutations.clearAuthSession();
  uiStateService.setLoginState(false);
  uiStateService.setProState(false);
}

export async function deleteAccount() {
  const response = await authService.deleteAccount();
  if (response.ok !== true || response.deleted !== true) {
    throw new Error(response.message ?? "account_delete_failed");
  }
  await storageMutations.clearAuthSession();
  uiStateService.setLoginState(false);
  uiStateService.setProState(false);
  return response;
}

export async function changePassword({ currentPassword, newPassword }) {
  if (!currentPassword) {
    throw new Error("Current password is required");
  }
  const byteLength = new TextEncoder().encode(newPassword).length;
  if (newPassword.length < 8 || byteLength > 72) {
    throw new Error(
      "New password must be at least 8 characters and no more than 72 bytes",
    );
  }
  const response = await authService.updatePassword({
    currentPassword,
    newPassword,
  });
  if (response.ok !== true || response.updated !== true) {
    throw new Error(response.message || "password_update_failed");
  }
  await storageMutations.clearAuthSession();
  uiStateService.setLoginState(false);
  uiStateService.setProState(false);
  return response;
}

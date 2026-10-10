/**
 * SocialFocus
 * Copyright © 2026 Yevhen Tretiakov. All rights reserved.
 *
 * This source code is proprietary and confidential.
 * Unauthorized copying, modification, distribution, or use is strictly prohibited.
 */

export const USER_AUTH_MESSAGE_ACTION = "socialFocusUserAuthV2";

export const USER_AUTH_MESSAGE_COMMANDS = Object.freeze({
  login: "login",
  signup: "signup",
  requestEmailVerification: "requestEmailVerification",
  confirmEmailVerification: "confirmEmailVerification",
  requestPasswordReset: "requestPasswordReset",
  logout: "logout",
  status: "status",
  updatePassword: "updatePassword",
  deleteAccount: "deleteAccount",
  listOptionReleases: "listOptionReleases",
  applyOptionRelease: "applyOptionRelease",
  restoreCurrentOptions: "restoreCurrentOptions",
  overrideNextOptionsUpdate: "overrideNextOptionsUpdate",
});

/**
 * SocialFocus
 * Copyright © 2026 Yevhen Tretiakov. All rights reserved.
 *
 * This source code is proprietary and confidential.
 * Unauthorized copying, modification, distribution, or use is strictly prohibited.
 */

import { createMoreScreen } from "../screens/more/more.js";
import { createAccountScreen } from "../screens/account/accountManage/accountManage.js";
import { createDeleteAccountScreen } from "../screens/account/delete-account/delete-account.js";
import { createLoginScreen } from "../screens/account/proLogin/proLogin.js";
import { createSignUpScreen } from "../screens/account/proSignUp/proSignUp.js";
import { createResetPasswordScreen } from "../screens/account/reset-password/reset-password.js";
import { createResetPasswordSuccessfulScreen } from "../screens/account/reset-password-success/reset-password-success.js";
import { createVerificationScreen } from "../screens/verification/verification.js";
import { createImportExportScreen } from "../screens/importExport/importExport.js";
import { createPasswordLockingScreen } from "../screens/passwordProtection/passwordLocking/passwordLocking.js";
import { createPasswordResetScreen } from "../screens/passwordProtection/passwordReset/passwordReset.js";
import { createPasswordUnlockingScreen } from "../screens/passwordProtection/passwordUnlocking/passwordUnlocking.js";
import { createPlusPromoScreen } from "../screens/plusPromo/plusPromoScreen.js";
import { createShortcutsScreen } from "../screens/shortcuts/shortcuts.js";
import { createMainScreen } from "../screens/main/main.js";
import { createOpeningTimerScreen } from "../screens/openingTimer/openingTimer.js";
import { createOpeningTimerWaitScreen } from "../screens/openingTimerWait/openingTimerWait.js";

export const routes = Object.freeze({
  mainScreen: createMainScreen,
  plusPromoScreen: createPlusPromoScreen,
  moreScreen: createMoreScreen,
  passwordUnlockingScreen: createPasswordUnlockingScreen,
  passwordLockingScreen: createPasswordLockingScreen,
  passwordResetScreen: createPasswordResetScreen,
  importExportScreen: createImportExportScreen,
  openingTimerScreen: createOpeningTimerScreen,
  openingTimerWaitScreen: createOpeningTimerWaitScreen,
  shortcutsScreen: createShortcutsScreen,
  accountManageScreen: createAccountScreen,
  proLoginScreen: createLoginScreen,
  proSignUpScreen: createSignUpScreen,
  emailVerification: createVerificationScreen,
  deleteAccountScreen: createDeleteAccountScreen,
  resetPasswordScreen: createResetPasswordScreen,
  resetPasswordSuccessfulScreen: createResetPasswordSuccessfulScreen,
});

export const routeNames = Object.freeze(Object.keys(routes));

export const routeLayouts = Object.freeze(Object.fromEntries(
  routeNames.map((name) => [name, ["mainScreen", "moreScreen"].includes(name) ? "default" : "blank"]),
));

export const topLevelScreens = Object.freeze(["mainScreen", "moreScreen"]);

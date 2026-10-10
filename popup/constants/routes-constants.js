/**
 * SocialFocus
* SocialFocus
 * Copyright © 2026 
 */

import { createMoreScreen } from "../screens/more/more.js";
import { createImportExportScreen } from "../screens/importExport/importExport.js";
import { createPasswordLockingScreen } from "../screens/passwordProtection/passwordLocking/passwordLocking.js";
import { createPasswordResetScreen } from "../screens/passwordProtection/passwordReset/passwordReset.js";
import { createPasswordUnlockingScreen } from "../screens/passwordProtection/passwordUnlocking/passwordUnlocking.js";
import { createShortcutsScreen } from "../screens/shortcuts/shortcuts.js";
import { createMainScreen } from "../screens/main/main.js";
import { createOpeningTimerScreen } from "../screens/openingTimer/openingTimer.js";
import { createOpeningTimerWaitScreen } from "../screens/openingTimerWait/openingTimerWait.js";

export const routes = Object.freeze({
  mainScreen: createMainScreen,
  moreScreen: createMoreScreen,
  passwordUnlockingScreen: createPasswordUnlockingScreen,
  passwordLockingScreen: createPasswordLockingScreen,
  passwordResetScreen: createPasswordResetScreen,
  importExportScreen: createImportExportScreen,
  openingTimerScreen: createOpeningTimerScreen,
  openingTimerWaitScreen: createOpeningTimerWaitScreen,
  shortcutsScreen: createShortcutsScreen,
});

export const routeNames = Object.freeze(Object.keys(routes));

export const routeLayouts = Object.freeze(Object.fromEntries(
  routeNames.map((name) => [name, ["mainScreen", "moreScreen"].includes(name) ? "default" : "blank"]),
));

export const topLevelScreens = Object.freeze(["mainScreen", "moreScreen"]);

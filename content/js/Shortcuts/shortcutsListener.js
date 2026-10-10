/**
 * SocialFocus
 * Copyright © 2026 Yevhen Tretiakov. All rights reserved.
 *
 * This source code is proprietary and confidential.
 * Unauthorized copying, modification, distribution, or use is strictly prohibited.
 */

const shortcutsRuntimeScope = SocialFocusContentRuntime.createLifecycleScope({ featureId: "shortcuts" });
let shouldListen = false;
let pressedKeys = [];

function arraysAreEqualIgnoreCase(arr1, arr2) {
  if (!Array.isArray(arr1) || !Array.isArray(arr2)) return false;

  if (arr1.length !== arr2.length) {
    return false;
  }

  const lowerCaseArr1 = arr1.map((item) => item.toLowerCase()).sort();
  const lowerCaseArr2 = arr2.map((item) => item.toLowerCase()).sort();

  for (let i = 0; i < lowerCaseArr1.length; i++) {
    if (lowerCaseArr1[i] !== lowerCaseArr2[i]) {
      return false;
    }
  }

  return true;
}

// MARK: - Actions

shortcutsRuntimeScope.listen("keydown", document, "keydown", function (event) {
  shouldListen = true;

  const identifier = getKeyIdentifier(event);
  if (!pressedKeys.includes(identifier)) {
    pressedKeys.push(identifier);
  }
});

shortcutsRuntimeScope.listen("keyup", document, "keyup", function (event) {
  if (shouldListen) {
    storageService.get(
      [getConst.system, getConstNotSyncing.notSyncingState],
    ).then(function (obj) {
        const systemState = obj[getConst.system] ?? {};
        const notSyncingState = obj[getConstNotSyncing.notSyncingState] ?? {};

        const extensionEnableStatus =
          notSyncingState[getConstNotSyncing.extensionIsEnabledData] ?? true;

        const sharedState = systemState[getConst.sharedState] ?? {};

        const data = sharedState[getConst.shortcuts[0]] ?? null;

        if (arraysAreEqualIgnoreCase(data, pressedKeys)) {
          if (extensionEnableStatus) {
            blockingExtension();
          } else {
            enableExtension();
          }
        }

        pressedKeys = [];
      });

    shouldListen = false;
  }
});

shortcutsRuntimeScope.listen("blur", window, "blur", () => { shouldListen = false; pressedKeys = []; });
shortcutsRuntimeScope.listen("pagehide", window, "pagehide", () => shortcutsRuntimeScope.dispose(), { once: true });

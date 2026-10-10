/**
 * SocialFocus
 * Copyright © 2026 Yevhen Tretiakov. All rights reserved.
 *
 * This source code is proprietary and confidential.
 * Unauthorized copying, modification, distribution, or use is strictly prohibited.
 */

(function installStorageMutationContract(root) {
  root.SocialFocusShared ??= {};
  if (root.SocialFocusShared.storageMutationContract) return;

  const action = "socialFocusApplyStorageMutation";
  const diagnosticsAction = "socialFocusGetStorageMutationDiagnostics";
  const semanticCommands = Object.freeze({
    authSetTokenIdentity: "authSetTokenIdentity",
    authClearSession: "authClearSession",
    authSetVerificationState: "authSetVerificationState",
    authClearVerificationState: "authClearVerificationState",
    entitlementApplyNative: "entitlementApplyNative",
    replaceOptionsState: "replaceOptionsState",
    patchOptionsState: "patchOptionsState",
    patchOptionsCategory: "patchOptionsCategory",
    replaceSystemState: "replaceSystemState",
    patchSystemBucket: "patchSystemBucket",
    replaceLocalState: "replaceLocalState",
    patchLocalState: "patchLocalState",
    dailyLimitPatchState: "dailyLimitPatchState",
    dailyLimitConfigure: "dailyLimitConfigure",
    replaceCatalog: "replaceCatalog",
    importOwnedState: "importOwnedState",
    removeOwnedKeys: "removeOwnedKeys",
    privacyAccept: "privacyAccept",
    factoryReset: "factoryReset",
  });

  function createSemanticCommand(command, payload = {}) {
    return Object.freeze({ action, command, payload });
  }

  root.SocialFocusShared.storageMutationContract = Object.freeze({
    action,
    diagnosticsAction,
    semanticCommands,
    createSemanticCommand,
  });
})(globalThis);

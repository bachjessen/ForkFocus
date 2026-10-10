/**
 * SocialFocus
* SocialFocus
 * Copyright © 2026 
 */

(function installRuntimeContract(root) {
  root.browser ??= root.chrome;
  if (root.SocialFocusRuntimeContract) return;
  root.SocialFocusRuntimeContract = Object.freeze({
    contractVersion: 1,
    snapshotKey: "socialFocus_runtime_snapshot",
    localStateKey: "socialFocus_not_syncing_state",
    enabledKey: "socialFocus_global_enable",
  });
})(globalThis);

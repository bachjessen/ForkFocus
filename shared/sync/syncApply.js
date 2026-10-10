/**
 * SocialFocus
* SocialFocus
 * Copyright © 2026 
 */

export function canUseCloudSync({
  appIsPro,
  uuid,
  isCloudSyncing,
  isEnableExtension,
}) {
  const cloudEnabled = isCloudSyncing === true || isCloudSyncing === "on";
  return (
    Boolean(appIsPro) &&
    Boolean(uuid) &&
    cloudEnabled &&
    Boolean(isEnableExtension)
  );
}

export function shouldApplyRemoteSettings({
  remoteLastModified,
  localLastSync,
}) {
  return Number(remoteLastModified) > Number(localLastSync ?? "0");
}

export function getSyncFields() {
  return ["socialfocus_LastSettingsModified", "socialfocus_FeaturesSettings"];
}

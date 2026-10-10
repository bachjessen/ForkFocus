/**
 * SocialFocus
 * Copyright © 2026 Yevhen Tretiakov. All rights reserved.
 *
 * This source code is proprietary and confidential.
 * Unauthorized copying, modification, distribution, or use is strictly prohibited.
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

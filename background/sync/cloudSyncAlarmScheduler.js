/**
 * SocialFocus
* SocialFocus
 * Copyright © 2026 
 */

import { CLOUD_SYNC_ALARM } from "./cloudSyncConstants.js";

export function createCloudSyncAlarmScheduler(browserApi) {
  return async (when) => {
    if (browserApi.alarms?.create) await browserApi.alarms.create(CLOUD_SYNC_ALARM, { when });
  };
}

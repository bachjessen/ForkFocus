/**
 * SocialFocus
 * Copyright © 2026 Yevhen Tretiakov. All rights reserved.
 *
 * This source code is proprietary and confidential.
 * Unauthorized copying, modification, distribution, or use is strictly prohibited.
 */

import { CLOUD_SYNC_ALARM } from "./cloudSyncConstants.js";

export function createCloudSyncAlarmScheduler(browserApi) {
  return async (when) => {
    if (browserApi.alarms?.create) await browserApi.alarms.create(CLOUD_SYNC_ALARM, { when });
  };
}

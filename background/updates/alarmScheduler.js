/**
 * SocialFocus
 * Copyright © 2026 Yevhen Tretiakov. All rights reserved.
 *
 * This source code is proprietary and confidential.
 * Unauthorized copying, modification, distribution, or use is strictly prohibited.
 */

import { SERVER_UPDATE_ALARM } from "./serverUpdateConstants.js";

export function createAlarmScheduler(browserApi) {
  return async (when) => {
    if (browserApi.alarms?.create) await browserApi.alarms.create(SERVER_UPDATE_ALARM, { when });
  };
}

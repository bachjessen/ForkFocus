/**
 * SocialFocus
 * Copyright © 2026 Yevhen Tretiakov. All rights reserved.
 *

 */

export const CLOUD_SYNC_ALARM = "socialfocus-cloud-sync-retry";
export const CLOUD_SYNC_RETRY_BASE_MS = 30_000;
export const CLOUD_SYNC_RETRY_MAX_MS = 3_600_000;

export function createCloudSyncMeta(overrides = {}) {
  return {
    pendingOperation: null,
    retryCount: 0,
    nextRetryAt: 0,
    lastSuccessAt: 0,
    lastError: null,
    ...overrides,
  };
}

export function getCloudSyncRetryDelay(retryCount) {
  return Math.min(
    CLOUD_SYNC_RETRY_BASE_MS * 2 ** Math.max(0, retryCount - 1),
    CLOUD_SYNC_RETRY_MAX_MS,
  );
}

/**
 * SocialFocus
 * Copyright © 2026 Yevhen Tretiakov. All rights reserved.
 *
 * This source code is proprietary and confidential.
 * Unauthorized copying, modification, distribution, or use is strictly prohibited.
 */

export const SERVER_UPDATE_ALARM = "socialfocus-server-options-update";
export const SERVER_UPDATE_FALLBACK_INTERVAL_MS = Object.freeze({
  pro: 24 * 60 * 60 * 1000,
  standard: 7 * 24 * 60 * 60 * 1000,
});
export const SERVER_UPDATE_RETRY_BASE_MS = 15 * 60 * 1000;
export const SERVER_UPDATE_RETRY_MAX_MS = 24 * 60 * 60 * 1000;
export const SERVER_UPDATE_TEST_DELAYS_MS = Object.freeze([15 * 1000, 60 * 1000]);

export function createServerUpdateMeta(overrides = {}) {
  return { lastCheckedAt: 0, nextCheckAt: 0, lastAppliedVersion: "", retryCount: 0,
    nextRetryAt: 0, lastError: null, policySource: "unknown", policyRevision: 0,
    policyIntervalSeconds: 0, ...overrides };
}
export function resolveServerUpdateIntervalMs(updatePolicy, isPro) {
  const fallback = isPro
    ? SERVER_UPDATE_FALLBACK_INTERVAL_MS.pro
    : SERVER_UPDATE_FALLBACK_INTERVAL_MS.standard;
  if (!updatePolicy || typeof updatePolicy !== "object") return fallback;
  const seconds = isPro
    ? updatePolicy.proIntervalSeconds
    : updatePolicy.standardIntervalSeconds;
  if (!Number.isSafeInteger(seconds) || seconds < 60 * 60 ||
      seconds > 30 * 24 * 60 * 60)
    return fallback;
  return seconds * 1000;
}
export function getRetryDelay(retryCount) {
  return Math.min(
    SERVER_UPDATE_RETRY_BASE_MS * 2 ** Math.max(0, retryCount - 1),
    SERVER_UPDATE_RETRY_MAX_MS,
  );
}

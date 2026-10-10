/**
 * SocialFocus
 * Copyright © 2026 Yevhen Tretiakov. All rights reserved.
 *

 */

function isStyleArray(value) {
  return Array.isArray(value) && value.every((style) =>
    typeof style === "string" || Array.isArray(style) || (style && typeof style === "object"),
  );
}

const MIN_POLICY_INTERVAL_SECONDS = 60 * 60;
const MAX_POLICY_INTERVAL_SECONDS = 30 * 24 * 60 * 60;

function normalizeUpdatePolicy(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  if (value.schema_version !== 1 || value.product !== "socialfocus") return null;
  if (!Number.isSafeInteger(value.revision) || value.revision < 0) return null;
  for (const interval of [
    value.standard_interval_seconds,
    value.pro_interval_seconds,
  ]) {
    if (!Number.isSafeInteger(interval) ||
        interval < MIN_POLICY_INTERVAL_SECONDS ||
        interval > MAX_POLICY_INTERVAL_SECONDS)
      return null;
  }
  return {
    standardIntervalSeconds: value.standard_interval_seconds,
    proIntervalSeconds: value.pro_interval_seconds,
    revision: value.revision,
  };
}

export function validatePartialOptionsPayload(payload, { knownOptionIds }) {
  if (!payload || typeof payload !== "object" || Array.isArray(payload))
    throw new Error("server_update_invalid_payload");
  if (!Array.isArray(payload.releases)) throw new Error("server_update_invalid_releases");
  if (payload.version_release != null && typeof payload.version_release !== "string")
    throw new Error("server_update_invalid_version");
  const releases = payload.releases.map((release) => {
    if (!release || typeof release.id !== "string" || !release.id.startsWith("socialFocus_") || !knownOptionIds.has(release.id) ||
        !isStyleArray(release.styles) || ![0, 1, false, true].includes(release.is_mobile))
      throw new Error("server_update_invalid_release");
    return { id: release.id, styles: structuredClone(release.styles),
      is_mobile: release.is_mobile === 1 || release.is_mobile === true };
  });
  return {
    releases,
    version: payload.version_release ?? "",
    updatePolicy: normalizeUpdatePolicy(payload.update_policy),
  };
}

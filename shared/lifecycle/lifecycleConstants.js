/**
 * SocialFocus
* SocialFocus
 * Copyright © 2026 
 */

export const CURRENT_STORAGE_SCHEMA_VERSION = 1;
export const CURRENT_RUNTIME_SNAPSHOT_SCHEMA_VERSION = 1;
export const CURRENT_RUNTIME_CONTRACT_VERSION = 1;

export function compareVersions(left = "", right = "") {
  const leftParts = String(left).split(".").map((part) => Number(part) || 0);
  const rightParts = String(right).split(".").map((part) => Number(part) || 0);
  const length = Math.max(leftParts.length, rightParts.length);

  for (let index = 0; index < length; index += 1) {
    const difference = (leftParts[index] ?? 0) - (rightParts[index] ?? 0);
    if (difference !== 0) return Math.sign(difference);
  }
  return 0;
}

export function createLifecycleMeta({
  storageSchemaVersion = 0,
  extensionVersion = "",
  optionsVersion = "",
  snapshotRevision = 0,
  migrationJournal = null,
  lastReadyAt = 0,
  lastError = null,
  optionsReleaseOverride = null,
} = {}) {
  return {
    storageSchemaVersion,
    extensionVersion,
    optionsVersion,
    snapshotRevision,
    migrationJournal,
    lastReadyAt,
    lastError,
    optionsReleaseOverride,
  };
}

export function isRuntimeSnapshotCompatible(
  snapshot,
  { extensionVersion, optionsVersion },
) {
  return Boolean(
    snapshot &&
      snapshot.schemaVersion === CURRENT_RUNTIME_SNAPSHOT_SCHEMA_VERSION &&
      snapshot.contractVersion === CURRENT_RUNTIME_CONTRACT_VERSION &&
      snapshot.extensionVersion === extensionVersion &&
      snapshot.optionsVersion === optionsVersion &&
      Number.isInteger(snapshot.revision) &&
      snapshot.revision > 0 &&
      snapshot.css &&
      typeof snapshot.css === "object" &&
      snapshot.flags &&
      typeof snapshot.flags === "object",
  );
}

/**
 * SocialFocus
 * Copyright © 2026 Yevhen Tretiakov. All rights reserved.
 *
 * This source code is proprietary and confidential.
 * Unauthorized copying, modification, distribution, or use is strictly prohibited.
 */

import {
  localStateKeys,
  sharedStateKeys,
  storageKeys,
  systemBuckets,
} from "../../shared/constants/storageKeys.js";
import { siteIds } from "../../shared/constants/sites.js";

const privacyAgreementKey = "untrap_is_agree_privacy_policy";
const localStateKeySet = new Set(Object.values(localStateKeys));
const contentLocalStateKeySet = new Set([
  localStateKeys.extensionIsEnabled,
  localStateKeys.extensionBlockTime,
  localStateKeys.extensionBlockLastedTime,
  localStateKeys.extensionEnableTime,
  localStateKeys.extensionEnableLastedTime,
]);
const systemBucketSet = new Set(Object.values(systemBuckets));
const siteIdSet = new Set(siteIds);
const dailyLimitOptionId = "socialFocus_daily_limit";

function objectAt(store, key) {
  const value = store[key];
  return value && typeof value === "object" && !Array.isArray(value)
    ? value
    : {};
}

function requireObject(value, errorCode) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(errorCode);
  }
  return value;
}

function requireString(value, errorCode) {
  if (typeof value !== "string") throw new Error(errorCode);
  return value;
}

function requireAllowedKeys(value, allowedKeys, errorCode) {
  const object = requireObject(value, errorCode);
  for (const key of Object.keys(object)) {
    if (!allowedKeys.has(key)) throw new Error(errorCode);
  }
  return object;
}

export function createStorageSemanticMutationExecutor({ repository, contract, policy }) {
  const commands = contract.semanticCommands;
  const replaceTargets = new Map([
    [commands.replaceOptionsState, storageKeys.optionsState],
    [commands.replaceSystemState, storageKeys.system],
    [commands.replaceLocalState, storageKeys.notSyncingState],
    [commands.replaceCatalog, storageKeys.remoteOptionsData],
  ]);
  const importableRoots = new Set([
    storageKeys.optionsState,
    storageKeys.system,
    storageKeys.notSyncingState,
    storageKeys.remoteOptionsData,
  ]);
  const removableRoots = new Set([...importableRoots, storageKeys.runtimeSnapshot]);

  return async function execute(message, { source }) {
    policy.assertAllowed(message.command, { source });

    if (message.command === commands.authSetTokenIdentity) {
      const email = requireString(message.payload?.email, "invalid_auth_email");
      const uuid = requireString(message.payload?.uuid, "invalid_auth_uuid");
      const stored = await repository.get([
        storageKeys.notSyncingState,
        storageKeys.system,
      ]);
      const local = objectAt(stored, storageKeys.notSyncingState);
      const system = objectAt(stored, storageKeys.system);
      const shared = objectAt(system, systemBuckets.sharedState);
      await repository.set({
        [storageKeys.notSyncingState]: {
          ...local,
          [localStateKeys.username]: email,
          [localStateKeys.password]: "",
          [localStateKeys.isUserPro]: Boolean(message.payload?.isUserPro),
          [localStateKeys.temporaryUsername]: "",
          [localStateKeys.temporaryPassword]: "",
          [localStateKeys.temporaryUuid]: "",
          [localStateKeys.verificationChallengeId]: "",
          [localStateKeys.verificationExpiresAt]: 0,
          [localStateKeys.showVerification]: false,
          [localStateKeys.emailVerificationType]: "",
        },
        [storageKeys.system]: {
          ...system,
          [systemBuckets.sharedState]: {
            ...shared,
            [sharedStateKeys.userUniqueIdentifier]: uuid,
          },
        },
      });
      return { ok: true, rebuildSnapshot: true };
    }

    if (message.command === commands.authClearSession) {
      const stored = await repository.get([
        storageKeys.notSyncingState,
        storageKeys.system,
      ]);
      const local = objectAt(stored, storageKeys.notSyncingState);
      const system = objectAt(stored, storageKeys.system);
      const shared = objectAt(system, systemBuckets.sharedState);
      await repository.set({
        [storageKeys.notSyncingState]: {
          ...local,
          [localStateKeys.isUserPro]: false,
          [localStateKeys.isCloudSyncing]: "off",
          [localStateKeys.username]: "",
          [localStateKeys.password]: "",
          [localStateKeys.temporaryUsername]: "",
          [localStateKeys.temporaryPassword]: "",
          [localStateKeys.temporaryUuid]: "",
          [localStateKeys.verificationChallengeId]: "",
          [localStateKeys.verificationExpiresAt]: 0,
          [localStateKeys.showVerification]: false,
          [localStateKeys.emailVerificationType]: "",
        },
        [storageKeys.system]: {
          ...system,
          [systemBuckets.sharedState]: {
            ...shared,
            [sharedStateKeys.userUniqueIdentifier]: "",
          },
        },
      });
      return { ok: true, rebuildSnapshot: true };
    }

    if (message.command === commands.authSetVerificationState) {
      const email = requireString(message.payload?.email, "invalid_auth_email");
      const challengeId = requireString(
        message.payload?.challengeId,
        "invalid_verification_challenge",
      );
      const expiresAt = message.payload?.expiresAt;
      if (!Number.isFinite(expiresAt)) {
        throw new Error("invalid_verification_expiry");
      }
      const type = requireString(message.payload?.type, "invalid_verification_type");
      const stored = await repository.get(storageKeys.notSyncingState);
      const local = objectAt(stored, storageKeys.notSyncingState);
      await repository.set({
        [storageKeys.notSyncingState]: {
          ...local,
          [localStateKeys.temporaryUsername]: email,
          [localStateKeys.temporaryPassword]: "",
          [localStateKeys.temporaryUuid]: "",
          [localStateKeys.verificationChallengeId]: challengeId,
          [localStateKeys.verificationExpiresAt]: expiresAt,
          [localStateKeys.showVerification]: true,
          [localStateKeys.emailVerificationType]: type,
        },
      });
      return { ok: true, rebuildSnapshot: true };
    }

    if (message.command === commands.authClearVerificationState) {
      const stored = await repository.get(storageKeys.notSyncingState);
      const local = objectAt(stored, storageKeys.notSyncingState);
      await repository.set({
        [storageKeys.notSyncingState]: {
          ...local,
          [localStateKeys.temporaryUsername]: "",
          [localStateKeys.temporaryPassword]: "",
          [localStateKeys.temporaryUuid]: "",
          [localStateKeys.verificationChallengeId]: "",
          [localStateKeys.verificationExpiresAt]: 0,
          [localStateKeys.showVerification]: false,
          [localStateKeys.emailVerificationType]: "",
        },
      });
      return { ok: true, rebuildSnapshot: true };
    }

    if (message.command === commands.entitlementApplyNative) {
      const uuid = requireString(message.payload?.uuid, "invalid_entitlement_uuid");
      const email = requireString(message.payload?.email, "invalid_entitlement_email");
      const stored = await repository.get([
        storageKeys.notSyncingState,
        storageKeys.system,
      ]);
      const local = objectAt(stored, storageKeys.notSyncingState);
      const system = objectAt(stored, storageKeys.system);
      const shared = objectAt(system, systemBuckets.sharedState);
      await repository.set({
        [storageKeys.notSyncingState]: {
          ...local,
          [localStateKeys.username]: uuid ? email : "",
          [localStateKeys.password]: "",
          [localStateKeys.isUserPro]: message.payload?.isPro === true,
          [localStateKeys.temporaryUsername]: "",
          [localStateKeys.temporaryPassword]: "",
          [localStateKeys.temporaryUuid]: "",
          [localStateKeys.verificationChallengeId]: "",
          [localStateKeys.verificationExpiresAt]: 0,
          [localStateKeys.showVerification]: false,
          [localStateKeys.emailVerificationType]: "",
        },
        [storageKeys.system]: {
          ...system,
          [systemBuckets.sharedState]: {
            ...shared,
            [sharedStateKeys.userUniqueIdentifier]: uuid,
          },
        },
      });
      return { ok: true, rebuildSnapshot: false };
    }

    const replaceTarget = replaceTargets.get(message.command);
    if (replaceTarget) {
      const value = requireObject(message.payload?.value, "invalid_replacement");
      await repository.set({ [replaceTarget]: value });
      return { ok: true, rebuildSnapshot: replaceTarget !== storageKeys.notSyncingState };
    }

    if (message.command === commands.patchOptionsState) {
      const patch = requireObject(message.payload?.patch, "invalid_options_patch");
      const stored = await repository.get(storageKeys.optionsState);
      const current = objectAt(stored, storageKeys.optionsState);
      await repository.set({
        [storageKeys.optionsState]: { ...current, ...patch },
      });
      return { ok: true, rebuildSnapshot: true };
    }

    if (message.command === commands.patchOptionsCategory) {
      const categoryId = requireString(
        message.payload?.categoryId,
        "invalid_options_category",
      );
      if (!categoryId) throw new Error("invalid_options_category");
      const patch = requireObject(
        message.payload?.patch,
        "invalid_options_category_patch",
      );
      const stored = await repository.get(storageKeys.optionsState);
      const current = objectAt(stored, storageKeys.optionsState);
      const category = objectAt(current, categoryId);
      await repository.set({
        [storageKeys.optionsState]: {
          ...current,
          [categoryId]: { ...category, ...patch },
        },
      });
      return { ok: true, rebuildSnapshot: true };
    }

    if (message.command === commands.patchSystemBucket) {
      const bucket = requireString(message.payload?.bucket, "invalid_system_bucket");
      if (!systemBucketSet.has(bucket)) throw new Error("invalid_system_bucket");
      const patch = requireObject(message.payload?.patch, "invalid_system_patch");
      const stored = await repository.get(storageKeys.system);
      const system = objectAt(stored, storageKeys.system);
      const current = objectAt(system, bucket);
      await repository.set({
        [storageKeys.system]: {
          ...system,
          [bucket]: { ...current, ...patch },
        },
      });
      return { ok: true, rebuildSnapshot: true };
    }

    if (message.command === commands.patchLocalState) {
      const patch = requireAllowedKeys(
        message.payload?.patch,
        source === "content" ? contentLocalStateKeySet : localStateKeySet,
        "invalid_local_patch",
      );
      const stored = await repository.get(storageKeys.notSyncingState);
      const current = objectAt(stored, storageKeys.notSyncingState);
      await repository.set({
        [storageKeys.notSyncingState]: { ...current, ...patch },
      });
      return { ok: true, rebuildSnapshot: true };
    }

    if (message.command === commands.dailyLimitPatchState) {
      const patch = requireObject(message.payload?.patch, "invalid_daily_limit_patch");
      const stored = await repository.get(storageKeys.system);
      const systemState = stored[storageKeys.system] ?? {};
      const dailyLimitState = systemState[systemBuckets.dailyLimitData] ?? {};
      await repository.set({
        [storageKeys.system]: {
          ...systemState,
          [systemBuckets.dailyLimitData]: { ...dailyLimitState, ...patch },
        },
      });
      return { ok: true, rebuildSnapshot: false };
    }

    if (message.command === commands.dailyLimitConfigure) {
      const categoryId = requireString(
        message.payload?.categoryId,
        "invalid_daily_limit_category",
      );
      if (!siteIdSet.has(categoryId)) {
        throw new Error("invalid_daily_limit_category");
      }
      const requestedDuration = message.payload?.duration;
      const numericDuration = Number(requestedDuration);
      const duration = requestedDuration === "noLimit"
        ? "noLimit"
        : String(numericDuration);
      if (
        requestedDuration !== "noLimit" &&
        (!Number.isFinite(numericDuration) ||
          numericDuration < 5 ||
          numericDuration > 500 ||
          numericDuration % 5 !== 0)
      ) {
        throw new Error("invalid_daily_limit_duration");
      }

      const durationKey = `socialFocus_${categoryId}_dailyLimitDuration`;
      const lastedKey = `socialFocus_${categoryId}_dailyLimitLastedTime`;
      const stored = await repository.get([
        storageKeys.optionsState,
        storageKeys.system,
      ]);
      const optionsState = objectAt(stored, storageKeys.optionsState);
      const category = objectAt(optionsState, categoryId);
      const system = objectAt(stored, storageKeys.system);
      const daily = objectAt(system, systemBuckets.dailyLimitData);
      const storedLastedTime = Number(daily[lastedKey]);
      const lastedTime = Number.isFinite(storedLastedTime) && storedLastedTime >= 0
        ? storedLastedTime
        : 0;
      await repository.set({
        [storageKeys.optionsState]: {
          ...optionsState,
          [categoryId]: {
            ...category,
            [dailyLimitOptionId]: duration,
          },
        },
        [storageKeys.system]: {
          ...system,
          [systemBuckets.dailyLimitData]: {
            ...daily,
            [durationKey]: duration,
            [lastedKey]: lastedTime,
          },
        },
      });
      return { ok: true, rebuildSnapshot: true, duration, lastedTime };
    }

    if (message.command === commands.importOwnedState) {
      const input = requireObject(message.payload?.values, "invalid_import");
      const patch = Object.fromEntries(
        Object.entries(input).filter(([key]) => importableRoots.has(key)),
      );
      if (Object.keys(patch).length === 0) throw new Error("empty_owned_import");
      await repository.set(patch);
      return { ok: true, rebuildSnapshot: true, importedKeys: Object.keys(patch) };
    }

    if (message.command === commands.removeOwnedKeys) {
      const keys = (message.payload?.keys ?? []).filter((key) => removableRoots.has(key));
      if (keys.length) await repository.remove(keys);
      return { ok: true, rebuildSnapshot: keys.length > 0, removedKeys: keys };
    }

    if (message.command === commands.privacyAccept) {
      await repository.set({ [privacyAgreementKey]: true });
      return { ok: true, rebuildSnapshot: false };
    }

    if (message.command === commands.factoryReset) {
      await repository.clear();
      return { ok: true, rebuildSnapshot: true };
    }

    throw new Error("unhandled_semantic_command");
  };
}

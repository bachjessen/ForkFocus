/**
 * SocialFocus
 * Copyright © 2026 Yevhen Tretiakov. All rights reserved.
 *

 */

import { siteIds } from "../constants/sites.js";
import {
  localStateKeys,
  metaStateKeys,
  sharedStateKeys,
  storageKeys,
  systemBuckets,
} from "../constants/storageKeys.js";
import { deepClone, isPlainObject } from "../utils/objectUtils.js";

const extensionUiKeys = new Set([
  "socialFocus_openingTimerIsActiveData",
  "socialFocus_openingTimerValueData",
  "socialFocus_openingTimerMessageData",
  "socialFocus_passwordLockingIsActiveData",
  "socialFocus_passwordLockingPasswordData",
  "socialFocus_passwordLockingPromptData",
  "socialFocus_passwordLockingResetIsActiveData",
  "socialFocus_passwordLockingResetPeriodData",
  "socialFocus_passwordLockingResetFinalDateData",
]);

const dailyLimitKeys = new Set(
  siteIds.flatMap((siteId) => [
    `socialFocus_${siteId}_dailyLimitDuration`,
    `socialFocus_${siteId}_dailyLimitLastedTime`,
    `socialFocus_${siteId}_dailyCurrentDate`,
    `socialFocus_${siteId}_dailyLimitModalCoordinate_top`,
    `socialFocus_${siteId}_dailyLimitModalCoordinate_left`,
  ]),
);

const localKeys = new Set(Object.values(localStateKeys));
const sharedKeys = new Set(Object.values(sharedStateKeys));
const metaKeys = new Set([
  metaStateKeys.currentOptionsVersion,
  metaStateKeys.nextUpdateDate,
]);
const initKeys = new Set([metaStateKeys.initDate, metaStateKeys.initTime]);
const scheduleKeys = new Set([
  metaStateKeys.scheduleHour,
  metaStateKeys.scheduleWeekDay,
]);
const obsoleteKeys = new Set([
  "socialFocus_settings_styles_array",
  "socialFocus_settings_styles_array_mobile",
]);
const ownedRoots = new Set(Object.values(storageKeys));

function objectOrEmpty(value) {
  return isPlainObject(value) ? deepClone(value) : {};
}

function mergeBucket(system, bucket, patch) {
  if (Object.keys(patch).length === 0) return;
  system[bucket] = { ...objectOrEmpty(system[bucket]), ...patch };
}

export function createV0ToV1MigrationPlan({ store, definitions }) {
  const writes = {};
  const removeKeys = [];
  const optionsState = objectOrEmpty(store[storageKeys.optionsState]);
  const system = objectOrEmpty(store[storageKeys.system]);
  const localState = objectOrEmpty(store[storageKeys.notSyncingState]);
  const sharedPatch = {};
  const metaPatch = {};
  const initPatch = {};
  const schedulePatch = {};
  const extensionUiPatch = {};
  const dailyLimitPatch = {};
  let optionsChanged = false;
  let localChanged = false;

  for (const [key, value] of Object.entries(store)) {
    if (ownedRoots.has(key)) continue;
    if (obsoleteKeys.has(key)) {
      removeKeys.push(key);
      continue;
    }

    const definition = definitions.get(key);
    if (definition) {
      const categoryId = definition.categoryId ?? "global";
      if (categoryId === "global") {
        optionsState[key] = deepClone(value);
      } else {
        optionsState[categoryId] = {
          ...objectOrEmpty(optionsState[categoryId]),
          [key]: deepClone(value),
        };
      }
      optionsChanged = true;
      removeKeys.push(key);
      continue;
    }

    if (localKeys.has(key)) {
      localState[key] = deepClone(value);
      localChanged = true;
      removeKeys.push(key);
    } else if (sharedKeys.has(key)) {
      sharedPatch[key] = deepClone(value);
      removeKeys.push(key);
    } else if (metaKeys.has(key)) {
      metaPatch[key] = deepClone(value);
      removeKeys.push(key);
    } else if (initKeys.has(key)) {
      initPatch[key] = deepClone(value);
      removeKeys.push(key);
    } else if (scheduleKeys.has(key)) {
      schedulePatch[key] = deepClone(value);
      removeKeys.push(key);
    } else if (extensionUiKeys.has(key)) {
      extensionUiPatch[key] = deepClone(value);
      removeKeys.push(key);
    } else if (dailyLimitKeys.has(key)) {
      dailyLimitPatch[key] = deepClone(value);
      removeKeys.push(key);
    }
  }

  if (Object.keys(initPatch).length || Object.keys(schedulePatch).length) {
    const currentMeta = objectOrEmpty(system[systemBuckets.meta]);
    if (Object.keys(initPatch).length) {
      metaPatch[metaStateKeys.init] = {
        ...objectOrEmpty(currentMeta[metaStateKeys.init]),
        ...initPatch,
      };
    }
    if (Object.keys(schedulePatch).length) {
      metaPatch[metaStateKeys.updateSchedule] = {
        ...objectOrEmpty(currentMeta[metaStateKeys.updateSchedule]),
        ...schedulePatch,
      };
    }
  }

  mergeBucket(system, systemBuckets.sharedState, sharedPatch);
  mergeBucket(system, systemBuckets.meta, metaPatch);
  mergeBucket(system, systemBuckets.extensionUiState, extensionUiPatch);
  mergeBucket(system, systemBuckets.dailyLimitData, dailyLimitPatch);

  if (optionsChanged) writes[storageKeys.optionsState] = optionsState;
  if (localChanged) writes[storageKeys.notSyncingState] = localState;
  if (
    Object.keys(sharedPatch).length ||
    Object.keys(metaPatch).length ||
    Object.keys(extensionUiPatch).length ||
    Object.keys(dailyLimitPatch).length
  ) {
    writes[storageKeys.system] = system;
  }

  return {
    fromVersion: 0,
    toVersion: 1,
    writes,
    removeKeys: [...new Set(removeKeys)],
    changed: Object.keys(writes).length > 0 || removeKeys.length > 0,
  };
}

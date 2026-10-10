/**
 * SocialFocus
* SocialFocus
 * Copyright © 2026 
 */

import { localStateKeys, storageKeys } from "../../shared/constants/storageKeys.js";

export const EXTENSION_BLOCK_ALARM = "socialfocus-extension-block-deadline";
export const EXTENSION_ENABLE_ALARM = "socialfocus-extension-enable-deadline";

const timerDefinitions = Object.freeze({
  Off: {
    alarm: EXTENSION_BLOCK_ALARM,
    enabledNow: false,
    enabledAtDeadline: true,
    durationKey: localStateKeys.extensionBlockTime,
    elapsedKey: localStateKeys.extensionBlockLastedTime,
    deadlineKey: localStateKeys.extensionBlockDeadline,
    oppositeAlarm: EXTENSION_ENABLE_ALARM,
    oppositeDurationKey: localStateKeys.extensionEnableTime,
    oppositeElapsedKey: localStateKeys.extensionEnableLastedTime,
    oppositeDeadlineKey: localStateKeys.extensionEnableDeadline,
  },
  On: {
    alarm: EXTENSION_ENABLE_ALARM,
    enabledNow: true,
    enabledAtDeadline: false,
    durationKey: localStateKeys.extensionEnableTime,
    elapsedKey: localStateKeys.extensionEnableLastedTime,
    deadlineKey: localStateKeys.extensionEnableDeadline,
    oppositeAlarm: EXTENSION_BLOCK_ALARM,
    oppositeDurationKey: localStateKeys.extensionBlockTime,
    oppositeElapsedKey: localStateKeys.extensionBlockLastedTime,
    oppositeDeadlineKey: localStateKeys.extensionBlockDeadline,
  },
});

export function createExtensionTimerCoordinator({
  repository,
  alarms,
  applyLocalPatch,
  clock = { now: () => Date.now() },
}) {
  async function clearAlarm(name) {
    if (alarms?.clear) await alarms.clear(name);
  }

  async function schedule(turnType, durationMinutes) {
    const definition = timerDefinitions[turnType];
    if (!definition) throw new Error("invalid_extension_timer_type");
    const duration = Number(durationMinutes);
    if (!Number.isFinite(duration) || duration < 0) {
      throw new Error("invalid_extension_timer_duration");
    }

    await clearAlarm(definition.alarm);
    await clearAlarm(definition.oppositeAlarm);
    const deadline = duration > 0 ? clock.now() + duration * 60_000 : 0;
    await applyLocalPatch({
      [localStateKeys.extensionIsEnabled]: definition.enabledNow,
      [definition.durationKey]: duration,
      [definition.elapsedKey]: 0,
      [definition.deadlineKey]: deadline,
      [definition.oppositeDurationKey]: 0,
      [definition.oppositeElapsedKey]: 0,
      [definition.oppositeDeadlineKey]: 0,
    });
    if (deadline && alarms?.create) await alarms.create(definition.alarm, { when: deadline });
    return { scheduled: Boolean(deadline), deadline, enabled: definition.enabledNow };
  }

  async function complete(definition) {
    await clearAlarm(definition.alarm);
    await applyLocalPatch({
      [localStateKeys.extensionIsEnabled]: definition.enabledAtDeadline,
      [definition.durationKey]: 0,
      [definition.elapsedKey]: 0,
      [definition.deadlineKey]: 0,
    });
    return { completed: true, enabled: definition.enabledAtDeadline };
  }

  async function handleAlarm(name) {
    const definition = Object.values(timerDefinitions).find((item) => item.alarm === name);
    return definition ? complete(definition) : { completed: false };
  }

  async function restore() {
    const store = await repository.get(storageKeys.notSyncingState);
    const local = store[storageKeys.notSyncingState] ?? {};
    for (const definition of Object.values(timerDefinitions)) {
      const deadline = Number(local[definition.deadlineKey]) || 0;
      if (!deadline) continue;
      if (deadline <= clock.now()) await complete(definition);
      else if (alarms?.create) await alarms.create(definition.alarm, { when: deadline });
    }
  }

  return { schedule, handleAlarm, restore };
}

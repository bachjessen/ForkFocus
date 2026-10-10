/**
 * SocialFocus
 * Copyright © 2026 Yevhen Tretiakov. All rights reserved.
 *

 */

export const dailyLimitOptionId = "socialFocus_daily_limit";
export const noDailyLimitValue = "noLimit";

const firstDailyLimitMinutes = 5;
const lastDailyLimitMinutes = 500;
const dailyLimitStepMinutes = 5;

export function createDailyLimitChoices(catalogChoices = []) {
  const choices = Array.isArray(catalogChoices) ? [...catalogChoices] : [];
  const existingIds = new Set(choices.map((choice) => String(choice.id)));

  for (
    let minutes = firstDailyLimitMinutes;
    minutes <= lastDailyLimitMinutes;
    minutes += dailyLimitStepMinutes
  ) {
    const id = String(minutes);
    if (!existingIds.has(id)) {
      choices.push({ id, name: id });
    }
  }

  return choices;
}

export function getDailyLimitRuntimeAction({ duration, elapsedSeconds }) {
  if (duration === noDailyLimitValue) return "stopBlockingSiteTimer";

  const durationMinutes = Number(duration);
  const elapsed = Number(elapsedSeconds);
  if (!Number.isFinite(durationMinutes) || durationMinutes <= 0) {
    throw new Error("invalid_daily_limit_duration");
  }

  return Number.isFinite(elapsed) && elapsed >= durationMinutes * 60
    ? "startBlockingSite"
    : "startBlockingSiteTimer";
}

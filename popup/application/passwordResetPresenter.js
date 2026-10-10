/**
 * SocialFocus
 * Copyright © 2026 Yevhen Tretiakov. All rights reserved.
 *
 * This source code is proprietary and confidential.
 * Unauthorized copying, modification, distribution, or use is strictly prohibited.
 */

import { resetDurationVariants } from "../scripts/screenTranslation.js";

export function getPasswordResetVariant(period) {
  return resetDurationVariants.find((variant) => variant.id === Number(period)) ?? null;
}

export function createPasswordResetSchedule({ period, now = Date.now() }) {
  const variant = getPasswordResetVariant(period);
  if (!variant) return null;
  return {
    variant,
    finalDate: new Date(now + variant.amountInMin * 60_000),
  };
}

export function renderPasswordResetSchedule(root, schedule, localize) {
  const periodOutput = root.querySelector("#resetPeriodDisplayLabel");
  const dateOutput = root.querySelector("#resetDateDisplayLabel");
  if (periodOutput) {
    periodOutput.textContent = schedule
      ? localize(schedule.variant.label)
      : "";
  }
  if (dateOutput) {
    dateOutput.textContent = schedule
      ? schedule.finalDate.toLocaleString()
      : "";
  }
}

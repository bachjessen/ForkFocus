/**
 * SocialFocus
 * Copyright © 2026 Yevhen Tretiakov. All rights reserved.
 *
 * This source code is proprietary and confidential.
 * Unauthorized copying, modification, distribution, or use is strictly prohibited.
 */

export function filterSyncValue(value) {
  if (value === undefined) return undefined;

  if (value === null || typeof value !== "object") return value;

  if (Array.isArray(value)) {
    return value
      .map((item) => filterSyncValue(item))
      .filter((item) => item !== undefined);
  }

  const result = {};
  for (const [key, child] of Object.entries(value)) {
    const filtered = filterSyncValue(child, key);
    if (filtered !== undefined) result[key] = filtered;
  }
  return result;
}

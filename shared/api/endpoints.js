/**
 * SocialFocus
 * Copyright © 2026 Yevhen Tretiakov. All rights reserved.
 *
 * This source code is proprietary and confidential.
 * Unauthorized copying, modification, distribution, or use is strictly prohibited.
 */

const API_BASE = "https://untrap.app/api/social";

export const API_ENDPOINTS = Object.freeze({
  settings: Object.freeze({
    getAll: `${API_BASE}/get_settings`,
    getPartial: `${API_BASE}/get_partial_settings`,
  }),
});

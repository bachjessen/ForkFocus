/**
 * SocialFocus
* SocialFocus
 * Copyright © 2026 
 */

const API_BASE = "https://untrap.app/api/social";

export const API_ENDPOINTS = Object.freeze({
  settings: Object.freeze({
    getAll: `${API_BASE}/get_settings`,
    getPartial: `${API_BASE}/get_partial_settings`,
  }),
});

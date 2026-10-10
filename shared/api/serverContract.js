/**
 * SocialFocus
* SocialFocus
 * Copyright © 2026 
 */

import { API_ENDPOINTS } from "./endpoints.js";
import {
  ensureSuccessfulResponse,
  fetchWithTimeout,
  normalizeHttpError,
} from "./httpClient.js";
import {
  buildGetRequest,
  buildUrlWithQuery,
} from "./requestBuilders.js";

async function requestJson(url, options) {
  try {
    const response = await fetchWithTimeout(url, options);
    ensureSuccessfulResponse(response);
    return await response.json();
  } catch (error) {
    throw normalizeHttpError(error);
  }
}

export async function getPartialOptionsSettings({ version }) {
  return await requestJson(
    buildUrlWithQuery(API_ENDPOINTS.settings.getPartial, { version }),
    buildGetRequest(),
  );
}

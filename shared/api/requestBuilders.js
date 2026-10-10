/**
 * SocialFocus
 * Copyright © 2026 Yevhen Tretiakov. All rights reserved.
 *
 * This source code is proprietary and confidential.
 * Unauthorized copying, modification, distribution, or use is strictly prohibited.
 */

export function buildJsonRequest(bodyObject) {
  return {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(bodyObject),
  };
}

export function buildGetRequest() {
  return {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  };
}

export function buildDeleteRequest() {
  return {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
    },
  };
}

export function buildUrlWithQuery(baseUrl, params = {}) {
  const url = new URL(baseUrl);

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      url.searchParams.set(key, value);
    }
  });

  return url.toString();
}

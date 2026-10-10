/**
 * SocialFocus
 * Copyright © 2026 Yevhen Tretiakov. All rights reserved.
 *
 * This source code is proprietary and confidential.
 * Unauthorized copying, modification, distribution, or use is strictly prohibited.
 */

export async function fetchWithTimeout(url, options = {}, timeoutMs = 6000) {
  const controller = new AbortController();
  const timerId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(url, {
      ...options,
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timerId);
  }
}

export class HttpStatusError extends Error {
  constructor(response) {
    const statusText = response.statusText
      ? ` ${response.statusText}`
      : "";

    super(`HTTP ${response.status}${statusText}`);
    this.name = "HttpStatusError";
    this.status = response.status;
    this.statusText = response.statusText ?? "";
  }
}

export function ensureSuccessfulResponse(response) {
  if (!response.ok) {
    throw new HttpStatusError(response);
  }

  return response;
}

export async function parseJsonResponse(response) {
  ensureSuccessfulResponse(response);
  return await response.json();
}

export async function parseTextResponse(response) {
  ensureSuccessfulResponse(response);
  return await response.text();
}

export function normalizeHttpError(error) {
  if (error?.name === "AbortError") {
    return new Error("Request timeout expired");
  }

  return error;
}

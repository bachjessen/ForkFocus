/**
 * SocialFocus
 * Copyright © 2026 Yevhen Tretiakov. All rights reserved.
 *

 */

export const siteIds = Object.freeze([
  "youtube",
  "facebook",
  "instagram",
  "linkedin",
  "reddit",
  "twitter",
  "gmail",
  "hacker-news",
  "twitch",
  "pinterest",
  "netflix",
  "tikTok",
  "blueSky",
]);

export const siteAliases = Object.freeze({
  x: "twitter",
  tiktok: "tikTok",
  bluesky: "blueSky",
  hackerNews: "hacker-news",
});

export function normalizeSiteId(siteId) {
  if (typeof siteId !== "string") return null;
  if (siteIds.includes(siteId)) return siteId;
  return siteAliases[siteId] ?? null;
}

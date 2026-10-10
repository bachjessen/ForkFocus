/**
 * SocialFocus
 * Copyright © 2026 Yevhen Tretiakov. All rights reserved.
 *
 * This source code is proprietary and confidential.
 * Unauthorized copying, modification, distribution, or use is strictly prohibited.
 */

export const productConfig = Object.freeze({
  id: "socialfocus",
  name: "ForkFocus",
  storagePrefix: "socialFocus",
  supportedHosts: Object.freeze([
    "youtube.com",
    "facebook.com",
    "linkedin.com",
    "twitter.com",
    "x.com",
    "reddit.com",
    "instagram.com",
    "google.com",
    "news.ycombinator.com",
    "twitch.tv",
    "pinterest.com",
    "netflix.com",
    "tiktok.com",
    "bsky.app",
  ]),
  capabilities: Object.freeze({
    authentication: false,
    cloudSync: false,
    entitlement: false,
    timers: true,
  }),
});

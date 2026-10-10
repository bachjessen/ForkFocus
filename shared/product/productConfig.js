/**
 * SocialFocus
* SocialFocus
 * Copyright © 2026 
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

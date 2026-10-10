/**
 * SocialFocus
 * Copyright © 2026 Yevhen Tretiakov. All rights reserved.
 *
 * This source code is proprietary and confidential.
 * Unauthorized copying, modification, distribution, or use is strictly prohibited.
 */

export const PREPARE_RUNTIME_RELOAD = "socialFocusPrepareRuntimeReload";

export const SOCIALFOCUS_URLS = Object.freeze([
  "*://*.youtube.com/*", "*://*.facebook.com/*", "*://*.linkedin.com/*",
  "*://*.twitter.com/*", "*://twitter.com/*", "*://*.x.com/*", "*://x.com/*",
  "*://*.reddit.com/*", "*://*.instagram.com/*", "*://*.google.com/*",
  "*://news.ycombinator.com/*", "*://*.twitch.tv/*", "*://*.pinterest.com/*",
  "*://*.netflix.com/*", "*://*.tiktok.com/*", "*://*.bsky.app/*",
]);

export function shouldReloadTabsForInstallReason(reason) {
  return reason === "update" || reason === "install";
}

export function createTabRuntimeUpdateCoordinator({ browserApi, urls = SOCIALFOCUS_URLS }) {
  async function reloadUpdatedTabs() {
    if (!browserApi.tabs?.query || !browserApi.tabs?.reload) return { supported: false, querySucceeded: false, results: [] };
    let tabs;
    try { tabs = await browserApi.tabs.query({ url: [...urls] }); }
    catch (_) { return { supported: true, querySucceeded: false, results: [] }; }
    const results = await Promise.all(tabs.map(async (tab) => {
      if (!Number.isInteger(tab?.id)) return { tabId: null, reloaded: false };
      try {
        await browserApi.tabs.reload(tab.id);
        return { tabId: tab.id, reloaded: true };
      } catch (_) {
        return { tabId: tab.id, reloaded: false };
      }
    }));
    return { supported: true, querySucceeded: true, results };
  }
  return Object.freeze({ reloadUpdatedTabs });
}

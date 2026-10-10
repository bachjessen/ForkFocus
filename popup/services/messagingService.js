/** ForkFocus local-only messaging. */
const browserApi = globalThis.browser ?? globalThis.chrome;
const supportedHosts = [
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
];

function isSupportedTabUrl(rawUrl) {
  try {
    const hostname = new URL(rawUrl).hostname;
    return supportedHosts.some(
      (host) => hostname === host || hostname.endsWith(`.${host}`),
    );
  } catch {
    return false;
  }
}

async function send(action, payload = {}) {
  return browserApi.runtime.sendMessage({ action, ...payload });
}

export const messagingService = Object.freeze({
  ensureRuntimeReady: ({ forceSnapshot = false } = {}) =>
    send(forceSnapshot ? "rebuildRuntimeSnapshot" : "ensureRuntimeReady"),
  scheduleExtensionTimer: ({ durationMinutes, turnType }) =>
    send("scheduleExtensionTimer", { blockTime: durationMinutes, turnType }),
  async getCurrentTab() {
    return browserApi.tabs.query({ currentWindow: true, active: true });
  },
  async getActiveTab() { return (await this.getCurrentTab())[0] ?? null; },
  async sendToActiveTab(message) {
    const tab = await this.getActiveTab();
    if (!tab?.id) return { delivered: false };
    if (!isSupportedTabUrl(tab.url ?? "")) {
      return { supported: false, delivered: false, tabId: tab.id };
    }
    try {
      const response = await browserApi.tabs.sendMessage(tab.id, message);
      return {
        supported: true,
        delivered: true,
        tabId: tab.id,
        response,
      };
    } catch (error) {
      return {
        supported: true,
        delivered: false,
        tabId: tab.id,
        error: error?.message ?? "active_tab_unreachable",
      };
    }
  },
  getExtensionVersion() { return browserApi.runtime.getManifest().version; },
});

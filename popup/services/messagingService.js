/**
 * SocialFocus
* SocialFocus
 * Copyright © 2026 
 */

import {
  USER_AUTH_MESSAGE_ACTION,
  USER_AUTH_MESSAGE_COMMANDS,
} from "../../shared/auth/userAuthMessages.js";

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
  userAuthLogin: ({ email, password }) =>
    send(USER_AUTH_MESSAGE_ACTION, {
      command: USER_AUTH_MESSAGE_COMMANDS.login,
      email,
      password,
    }),
  userAuthSignup: ({ email, password }) =>
    send(USER_AUTH_MESSAGE_ACTION, {
      command: USER_AUTH_MESSAGE_COMMANDS.signup,
      email,
      password,
    }),
  userAuthRequestEmailVerification: ({ email, password }) =>
    send(USER_AUTH_MESSAGE_ACTION, {
      command: USER_AUTH_MESSAGE_COMMANDS.requestEmailVerification,
      email,
      password,
    }),
  userAuthConfirmEmailVerification: ({ challengeId, code }) =>
    send(USER_AUTH_MESSAGE_ACTION, {
      command: USER_AUTH_MESSAGE_COMMANDS.confirmEmailVerification,
      challengeId,
      code,
    }),
  userAuthRequestPasswordReset: ({ email }) =>
    send(USER_AUTH_MESSAGE_ACTION, {
      command: USER_AUTH_MESSAGE_COMMANDS.requestPasswordReset,
      email,
    }),
  userAuthLogout: () =>
    send(USER_AUTH_MESSAGE_ACTION, {
      command: USER_AUTH_MESSAGE_COMMANDS.logout,
    }),
  userAuthStatus: () =>
    send(USER_AUTH_MESSAGE_ACTION, {
      command: USER_AUTH_MESSAGE_COMMANDS.status,
    }),
  userAuthUpdatePassword: ({ currentPassword, newPassword }) =>
    send(USER_AUTH_MESSAGE_ACTION, {
      command: USER_AUTH_MESSAGE_COMMANDS.updatePassword,
      currentPassword,
      newPassword,
    }),
  userAuthDeleteAccount: () =>
    send(USER_AUTH_MESSAGE_ACTION, {
      command: USER_AUTH_MESSAGE_COMMANDS.deleteAccount,
    }),
  listOptionReleases: () =>
    send(USER_AUTH_MESSAGE_ACTION, {
      command: USER_AUTH_MESSAGE_COMMANDS.listOptionReleases,
    }),
  applyOptionRelease: ({ channel, version }) =>
    send(USER_AUTH_MESSAGE_ACTION, {
      command: USER_AUTH_MESSAGE_COMMANDS.applyOptionRelease,
      channel,
      version,
    }),
  restoreCurrentOptions: () =>
    send(USER_AUTH_MESSAGE_ACTION, {
      command: USER_AUTH_MESSAGE_COMMANDS.restoreCurrentOptions,
    }),
  overrideNextOptionsUpdate: ({ delayMs }) =>
    send(USER_AUTH_MESSAGE_ACTION, {
      command: USER_AUTH_MESSAGE_COMMANDS.overrideNextOptionsUpdate,
      delayMs,
    }),
  getNativeEntitlement: () =>
    browserApi.runtime.sendMessage({ command: "getProStatus" }),
  ensureRuntimeReady: ({ forceSnapshot = false } = {}) =>
    send(forceSnapshot ? "rebuildRuntimeSnapshot" : "ensureRuntimeReady"),
  pullCloudSync: () => send("pullCloudSync"),
  pushCloudSync: () => send("pushCloudSync"),
  checkServerUpdates: ({ force = true } = {}) => send("checkServerUpdates", { force }),
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

/**
 * SocialFocus
 * Copyright © 2026 Yevhen Tretiakov. All rights reserved.
 *

 */

// MARK: - Set Site Attribute
const currentHref = window.location.href;
const websiteObject = getSiteInfo();
const hackerNewsOptionsWithVerticalLinesList = [
  "socialFocus_hacker-news_navigation_hide_new",
  "socialFocus_hacker-news_navigation_hide_past",
  "socialFocus_hacker-news_navigation_hide_comments",
  "socialFocus_hacker-news_navigation_hide_ask",
  "socialFocus_hacker-news_navigation_hide_show",
  "socialFocus_hacker-news_navigation_hide_jobs",
  "socialFocus_hacker-news_post_hide_hide_button",
  "socialFocus_hacker-news_navigation_hide_submit",
];

let isMobile = false;
const contentRuntimeScope = SocialFocusContentRuntime.createLifecycleScope({
  featureId: "htmlAttributesManager",
});
const contentStyleService = SocialFocusContentRuntime.createStyleService({
  siteName: websiteObject.name,
  isMobile: () => isMobile,
});
function reportRuntimeApplyError(stage, error) {
  SocialFocusContentDiagnostics?.count("htmlAttributesManager", "errors");
  console.error(`SocialFocus runtime apply failed at ${stage}`, error);
}

if (isUserAgentMobile()) {
  isMobile = true;
} else {
  isMobile = false;
}

// Start observer by desktop and mobile tags

contentRuntimeScope.interval("device-detection", function () {
  // Check mobile selectors

  for (const selector of websiteObject.mobileSelectorCheck) {
    if (selector != "") {
      const checkSelect = document.querySelector(selector);
      if (checkSelect) {
        isMobile = true;
        contentRuntimeScope.cancel("interval", "device-detection");
        break;
      }
    }
  }

  // Check desktop selectors

  for (const selector of websiteObject.desktopSelectorCheck) {
    if (selector != "") {
      const checkSelect = document.querySelector(selector);
      if (checkSelect) {
        isMobile = false;
        contentRuntimeScope.cancel("interval", "device-detection");
        break;
      }
    }
  }
}, 10);

contentRuntimeScope.timeout("device-detection-deadline", function () {
  contentRuntimeScope.cancel("interval", "device-detection");
}, 5000);

contentRuntimeScope.listen("pagehide", window, "pagehide", () => {
  contentRuntimeScope.dispose();
  contentStyleService.dispose();
}, { once: true });

// MARK: - Set options values to HTML

function applyAllSettings() {
  return runtimeSnapshotService.ready.then(() => {
    const runtimeSnapshot = runtimeSnapshotService.getCurrent();
    if (runtimeSnapshot) applyRuntime(runtimeSnapshot);
  });
}

function applyRuntime(runtime) {
  let errors = 0;
  const attempt = (stage, callback) => {
    try {
      callback();
    } catch (error) {
      errors += 1;
      reportRuntimeApplyError(stage, error);
    }
  };
  if (runtime) {
    const { flags, css } = runtime;

    if (flags[`socialFocus_${websiteObject.name}_master_toggle`]) {
      attempt("styles:remove", () => contentStyleService.remove());
    } else {
      attempt("styles:apply", () => contentStyleService.apply(css[websiteObject.name]));
    }

    if (flags && typeof flags === "object") {
      Object.entries(flags).forEach(([settingId, attribute]) => {
        attempt(`flag:${settingId}`, () => applyFlags(settingId, attribute));
      });
    }
  }
  return { applied: errors === 0, errors };
}

function setInitialExtensionState() {
  storageService.get(getConstNotSyncing.notSyncingState).then(function (obj) {
    const notSyncingState = obj[getConstNotSyncing.notSyncingState] ?? {};
    const isExtensionEnable =
      notSyncingState[getConstNotSyncing.extensionIsEnabledData] ?? true;

    if (isExtensionEnable) {
      applyAllSettings();
    }
  });
}

if (currentHref.includes("news.ycombinator.com")) {
  storageService.get(getConstNotSyncing.notSyncingState).then(function (obj) {
    const notSyncingState = obj[getConstNotSyncing.notSyncingState] ?? {};

    const status =
      notSyncingState[getConstNotSyncing.extensionIsEnabledData] ?? true;

    document
      .querySelector("html")
      .setAttribute("socialFocus_site_is", websiteObject.name);

    document
      .querySelector("html")
      .setAttribute("socialFocus_global_enable", status);
  });
}

setInitialExtensionState();

// MARK: - Update in html

function applyFlags(settingId, attribute, flags, css) {
  const currentLocation = window.location.href;

  // Set in html

  if (
    currentLocation.includes("news.ycombinator.com") &&
    settingId.includes("hacker-news")
  ) {
    document.documentElement.setAttribute(settingId, attribute);

    if (hackerNewsOptionsWithVerticalLinesList.includes(settingId)) {
      formatHackerNewsNavigationElements(settingId, attribute);
    }
  }

  // Special for facebook feed posts

  if (currentLocation.includes("facebook")) {
    if (
      settingId == "socialFocus_facebook_feed_hide_posts_from_people_to_follow"
    ) {
      triggerFilterFacebookPosts();
    }
  }

  if (currentLocation.includes("linkedin")) {
    if (settingId === "socialFocus_linkedin_other_hide_messaging_popup")
      hideMessagingFloatPopup(attribute);
  }

  if (currentLocation.includes("instagram")) {
    if (settingId === "socialFocus_instagram_feed_hide_suggested_posts") {
      hideSuggestedPostInstagram(attribute);
    }
  }

  if (currentLocation.includes("reddit")) {
    if (settingId === "socialFocus_reddit_header_hide_trending_today") {
      handleRedditTrendingToday(
        attribute,
        isMobile,
        "socialFocus_reddit_header_hide_trending_today",
      );
    }
  }

  if (currentLocation.includes("youtube")) {
    if (settingId === "socialFocus_youtube_hide_shorts") {
      hideShortsMenuTabs();
    }
  }

  if (
    settingId ==
      `socialFocus_${websiteObject.name}_daily_limit_show_timer_draggable` &&
    !isMobile
  ) {
    if (attribute) {
      createTimerModal({ isDesktop: true });
    } else {
      removeTimerModal();
    }
  }

  if (
    settingId == `socialFocus_${websiteObject.name}_daily_limit_show_timer` &&
    isMobile
  ) {
    if (attribute) {
      createTimerModal({ isDesktop: false });
    } else {
      removeTimerModal();
    }
  }

  if (settingId == `socialFocus_${websiteObject.name}_master_toggle`) {
    storageService.get(getConst.system).then(function (obj) {
      const systemState = obj[getConst.system] ?? {};
      const dailyLimitState = systemState[getConst.dailyLimitData] ?? {};

      const dailyLimitDuration =
        dailyLimitState[getConst.dailyLimitDuration[websiteObject.name]] ?? null;

      const dailyLimitLastedTime =
        dailyLimitState[getConst.dailyLimitLastedTime[websiteObject.name]] ?? null;

      if (
        !currentLocation.includes("news.ycombinator.com") &&
        !attribute &&
        dailyLimitDuration !== "noLimit" &&
        dailyLimitDuration !== null &&
        dailyLimitLastedTime !== null
      ) {
        stopTimer();
        startSiteBlockingTimer(websiteObject.name);
      }
    });
  }
}

async function applyLatestSnapshot(snapshot) {
  const obj = await storageService.get(getConstNotSyncing.notSyncingState);
  // Storage delivery and a popup confirmation can request the same revision at
  // nearly the same time. Always apply the newest atomic snapshot after the
  // asynchronous storage read instead of invalidating one duplicate request.
  const currentSnapshot = runtimeSnapshotService.getCurrent();
  const targetSnapshot =
    Number(currentSnapshot?.revision) >= Number(snapshot?.revision)
      ? currentSnapshot
      : snapshot;
  if (!targetSnapshot) {
    return { applied: false, error: "runtime_snapshot_missing", revision: -1 };
  }
  const localState = obj[getConstNotSyncing.notSyncingState] ?? {};
  const enabled =
    (localState[getConstNotSyncing.extensionIsEnabledData] ?? true) === true;
  const result = enabled
    ? applyRuntime(targetSnapshot)
    : { applied: true, errors: 0 };
  return { ...result, revision: targetSnapshot.revision ?? -1 };
}

runtimeSnapshotService.subscribe((snapshot) => {
  void applyLatestSnapshot(snapshot).catch((error) => {
    reportRuntimeApplyError("snapshot-delivery", error);
  });
});

storageService.subscribe((changes) => {
  const values = storageSelectors.getChangedValue(
    changes,
    getConstNotSyncing.notSyncingState,
    getConstNotSyncing.extensionIsEnabledData,
  );

  if (!values) return;

  const { newValue, oldValue } = values;
  const newEnabled = newValue ?? true;
  const oldEnabled = oldValue ?? true;

  if (newEnabled === oldEnabled) return;

  if (currentHref.includes("news.ycombinator.com")) {
    document.documentElement.setAttribute(
      "socialFocus_global_enable",
      newEnabled,
    );
  }

  if (newEnabled) {
    applyAllSettings();
  } else {
    contentStyleService.remove();
  }
});

// MARK: - Receive Requests from popup

browser.runtime.onMessage.addListener((message) => {
  if (message.action === "applyRuntime") {
    return (async () => {
      const expectedRevision = Number(message.expectedRevision);
      const snapshot = Number.isFinite(expectedRevision)
        ? await runtimeSnapshotService.waitForRevision(expectedRevision)
        : await runtimeSnapshotService.ready.then(() =>
            runtimeSnapshotService.getCurrent(),
          );
      if (!snapshot) {
        return { applied: false, error: "runtime_snapshot_missing", revision: -1 };
      }
      return await applyLatestSnapshot(snapshot);
    })().catch((error) => ({
      applied: false,
      error: error?.message ?? "runtime_apply_failed",
      revision: runtimeSnapshotService.revision,
    }));
  }
  return undefined;
});

browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action == "checkSelectors") {
    sendResponse({ isDesktop: !isMobile });
  }
});

browser.runtime.onMessage.addListener((message) => {
  if (message.action === "removeStyles") {
    contentStyleService.remove();
  }
});

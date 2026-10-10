/**
 * SocialFocus
* SocialFocus
 * Copyright © 2026 
 */

const shortsButtonTitles = [
  "KORTVIDEO'S",
  "SHORTS",
  "CURTS",
  "LÜHIVIDEOD",
  "COURTES VIDÉOS",
  "SHORTS VIDEOZAPISI",
  "AMA-SHORT",
  "VIDEO FUPI",
  "SHORTS-VIDEOER",
  "КЫСКА ВИДЕОЛОР",
  "YOUTUBE SHORTS",
  "SHORTS",
  "ԿԱՐՃ ՀՈԼՈՎԱԿՆԵՐ",
  "فیلم‌های کوتاه YOUTUBE",
  "ᲛᲝᲙᲚᲔ ᲕᲘᲓᲔᲝᲔᲑᲘ",
  "ショート",
  "SHORTS",
];

let tabGroupObserver = null;
let bootstrapObserver = null;
const youtubeShortsRuntimeScope = SocialFocusContentRuntime.createLifecycleScope({ featureId: "youtubeShortsTabs" });

function applyHideShortsTabs(isHideShorts) {
  const tabs = document.querySelectorAll(
    "ytd-browse[page-subtype='channels'] yt-tab-group-shape yt-tab-shape",
  );

  const tabsMobile = document.querySelectorAll(
    "ytm-browse:has(yt-decorated-avatar-view-model) yt-tab-group-shape yt-tab-shape",
  );

  const actualTabs = tabs.length == 0 ? tabsMobile : tabs;

  for (const tab of actualTabs) {
    const inTab = tab.querySelector(".ytTabShapeTab");

    if (inTab) {
      const preparedTitle = inTab.innerHTML.trim().toUpperCase();

      if (shortsButtonTitles.includes(preparedTitle)) {
        tab.style.display = isHideShorts ? "none" : "inline-flex";
      }
    }
  }
}

function disconnectObservers() {
  youtubeShortsRuntimeScope.cancel("observer", "tab-group");
  youtubeShortsRuntimeScope.cancel("observer", "bootstrap");
  tabGroupObserver = null;
  bootstrapObserver = null;
}

function attachTabGroupObserver(tabGroup, isHideShorts) {
  if (tabGroupObserver) {
    youtubeShortsRuntimeScope.cancel("observer", "tab-group");
  }

  tabGroupObserver = new MutationObserver(function () {
    applyHideShortsTabs(isHideShorts);
  });

  youtubeShortsRuntimeScope.observe("tab-group", tabGroupObserver, tabGroup, {
    childList: true,
    subtree: true,
  });

  requestAnimationFrame(() => {
    applyHideShortsTabs(isHideShorts);
  });
}

function hideShortsMenuTabs() {
  const shortsButtonId = "socialFocus_youtube_hide_shorts";

  runtimeSnapshotService.ready.then(() => {
    const { flags } = runtimeSnapshotService.getCurrent() ?? { flags: {} };
    const isHideShorts = flags[shortsButtonId] ?? false;

    disconnectObservers();

    if (!isHideShorts) {
      applyHideShortsTabs(isHideShorts);
      return;
    }

    const tabGroup = document.querySelector("yt-tab-group-shape");

    if (tabGroup) {
      attachTabGroupObserver(tabGroup, isHideShorts);
      return;
    }

    bootstrapObserver = new MutationObserver(function () {
      const appearedTabGroup = document.querySelector("yt-tab-group-shape");

      if (appearedTabGroup) {
        youtubeShortsRuntimeScope.cancel("observer", "bootstrap");
        bootstrapObserver = null;
        attachTabGroupObserver(appearedTabGroup, isHideShorts);
      }
    });

    youtubeShortsRuntimeScope.observe("bootstrap", bootstrapObserver, document.documentElement, {
      childList: true,
      subtree: true,
    });
  });
}

function runContentChangesObserver() {
  const pageObserver = new MutationObserver(() => {
    const url = location.href;

    if (
      url.includes(channelPageUrlPart1) ||
      url.includes(channelPageUrlPart2)
    ) {
      hideShortsMenuTabs();
    }
  });
  youtubeShortsRuntimeScope.observe("page", pageObserver, document.body, { subtree: true, childList: true });
}

youtubeShortsRuntimeScope.listen("load", window, "load", function () {
  storageService.get(getConstNotSyncing.notSyncingState).then(function (obj) {
    const notSyncingState = obj[getConstNotSyncing.notSyncingState] ?? {};
    const isEnabled =
      notSyncingState[getConstNotSyncing.extensionIsEnabledData] ?? true;

    if (isEnabled) {
      runContentChangesObserver();
    }
  });
}, { once: true });
youtubeShortsRuntimeScope.listen("pagehide", window, "pagehide", () => youtubeShortsRuntimeScope.dispose(), { once: true });

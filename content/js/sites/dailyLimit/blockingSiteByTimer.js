/**
 * SocialFocus
 * Copyright © 2026 Yevhen Tretiakov. All rights reserved.
 *

 */

const dailyLimitRuntimeScope = SocialFocusContentRuntime.createLifecycleScope({
  featureId: "dailyLimitTimer",
});

function initializeDailyLimit() {
  if (websiteObject) {
    initSiteTimeSpendLimit(websiteObject.name);
  }
}

if (document.readyState === "loading") {
  dailyLimitRuntimeScope.listen("dom-ready", document, "DOMContentLoaded", initializeDailyLimit, { once: true });
} else {
  initializeDailyLimit();
}

function initSiteTimeSpendLimit(websiteName) {
  const limitDurationKey = getConst.dailyLimitDuration[websiteName];
  const lastedTimeKey = getConst.dailyLimitLastedTime[websiteName];
  const currentDate = getConst.dailyCurrentDate[websiteName];

  const dateNow = formatDate();

  storageService.get(getConst.system).then(function (obj) {
    const systemState = obj[getConst.system] ?? {};
    const dailyLimitState = systemState[getConst.dailyLimitData] ?? {};

    const dailyLimitDuration = dailyLimitState[limitDurationKey];
    let dailyLimitLastedTime = dailyLimitState[lastedTimeKey];
    const dailyLimitCurrentDate = dailyLimitState[currentDate];

    if (
      typeof dailyLimitCurrentDate === "string" &&
      typeof dateNow === "string" &&
      dailyLimitCurrentDate !== dateNow
    ) {
      dailyLimitLastedTime = 0;
    }

    if (dailyLimitDuration !== undefined) {
      void storageMutations.patchDailyLimit({
        [getConst.dailyCurrentDate[websiteName]]: dateNow,
        [getConst.dailyLimitLastedTime[websiteName]]: dailyLimitLastedTime,
      }).catch(() =>
        SocialFocusContentDiagnostics?.count("dailyLimitTimer", "errors"),
      );
    }

    checkIfLastedTimeLessThanLimitDuration(
      dailyLimitLastedTime,
      dailyLimitDuration,
      websiteName,
    );
  });
}

function stopTimer() {
  dailyLimitRuntimeScope.cancel("interval", "elapsed-time");
}

function messageTargetsCurrentSite(message) {
  return !message.categoryId || message.categoryId === websiteObject?.name;
}

function startSiteBlockingTimer(websiteName) {
  const limitDurationKey = getConst.dailyLimitDuration[websiteName];
  const lastedTimeKey = getConst.dailyLimitLastedTime[websiteName];
  const masterToggleKey = `socialFocus_${websiteName}_master_toggle`;

  stopTimer();
  dailyLimitRuntimeScope.interval("elapsed-time", () => {
    storageService.get(
      [getConst.system, getConst.runtimeSnapshot],
    ).then(function (obj) {
        const systemState = obj[getConst.system] ?? {};
        const { flags } = runtimeSnapshotService.getCurrent() ?? obj[getConst.runtimeSnapshot] ?? { flags: {} };

        const dailyLimitState = systemState[getConst.dailyLimitData] ?? {};

        const dailyLimitDuration = dailyLimitState[limitDurationKey];
        let dailyLimitLastedTime = dailyLimitState[lastedTimeKey];
        const masterToggle = flags[masterToggleKey];

        if (
          dailyLimitDuration === "noLimit" ||
          masterToggle ||
          typeof dailyLimitLastedTime !== "number"
        ) {
          stopTimer();
        } else {
          dailyLimitLastedTime++;

          void storageMutations.patchDailyLimit({
            [getConst.dailyLimitLastedTime[websiteName]]:
              dailyLimitLastedTime,
          }).catch(() =>
            SocialFocusContentDiagnostics?.count("dailyLimitTimer", "errors"),
          );
        }

        if (
          dailyLimitLastedTime >= minutesToSeconds(dailyLimitDuration) &&
          !masterToggle
        ) {
          blockingSite();
        }
      });
  }, 1000);
}

dailyLimitRuntimeScope.subscribe("start-blocking", browser.runtime.onMessage, (message) => {
  if (
    message.action === "startBlockingSite" &&
    messageTargetsCurrentSite(message)
  ) {
    blockingSite();
  }
});

dailyLimitRuntimeScope.subscribe("restart-timer", browser.runtime.onMessage, (message) => {
  if (
    message.action === "startBlockingSiteTimer" &&
    messageTargetsCurrentSite(message) &&
    websiteObject
  ) {
    stopTimer();
    startSiteBlockingTimer(websiteObject.name);
  }
});

dailyLimitRuntimeScope.subscribe("stop-timer", browser.runtime.onMessage, (message) => {
  if (
    message.action === "stopBlockingSiteTimer" &&
    messageTargetsCurrentSite(message)
  ) {
    stopTimer();
    if (typeof removeTimerModal === "function") removeTimerModal();
  }
});

function blockingSite() {
  stopTimer();

  const element = document.querySelector("body");

  if (element) {
    (async () => {
      const replaceContent = await getBlockingContent();
      element.replaceChildren(replaceContent);
    })();
  }
}

function formatDate() {
  const date = new Date();

  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();

  return `${day}.${month}.${year}`;
}

function checkIfLastedTimeLessThanLimitDuration(
  lastedTime,
  limitDuration,
  websiteName,
) {
  if (
    limitDuration !== undefined &&
    lastedTime !== undefined &&
    limitDuration !== "noLimit"
  ) {
    if (lastedTime < minutesToSeconds(limitDuration)) {
      startSiteBlockingTimer(websiteName);
    } else {
      blockingSite();
    }
  }
}

function handleVisibilityChange() {
  if (document.visibilityState === "visible") {
    storageService.get(getConst.system).then(function (obj) {
      const systemState = obj[getConst.system] ?? {};
      const dailyLimitState = systemState[getConst.dailyLimitData] ?? {};

      const dailyLimitDuration =
        dailyLimitState[getConst.dailyLimitDuration[websiteObject.name]];
      const dailyLimitLastedTime =
        dailyLimitState[getConst.dailyLimitLastedTime[websiteObject.name]];

      checkIfLastedTimeLessThanLimitDuration(
        dailyLimitLastedTime,
        dailyLimitDuration,
        websiteObject.name,
      );
    });
  } else {
    stopTimer();
  }
}

dailyLimitRuntimeScope.listen("visibility", document, "visibilitychange", handleVisibilityChange);
dailyLimitRuntimeScope.listen("pagehide", window, "pagehide", () => dailyLimitRuntimeScope.dispose(), { once: true });

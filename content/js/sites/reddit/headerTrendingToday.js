/**
 * SocialFocus
 * Copyright © 2026 Yevhen Tretiakov. All rights reserved.
 *
 * This source code is proprietary and confidential.
 * Unauthorized copying, modification, distribution, or use is strictly prohibited.
 */

const redditTrendingRuntimeScope = SocialFocusContentRuntime.createLifecycleScope({ featureId: "redditTrending" });

function handleRedditTrendingToday(checkedValue, isMobile, id) {
  runtimeSnapshotService.ready.then(() => {
    const { flags } = runtimeSnapshotService.getCurrent() ?? { flags: {} };
    const masterToogle = flags["socialFocus_reddit_master_toggle"] ?? false;

    function getTrendingTodayContainer() {
      const redditSearch = document.querySelector(
        `reddit-search-${isMobile ? "small" : "large"}`,
      );

      if (!redditSearch || !redditSearch.shadowRoot) {
        return null;
      }

      return [
        redditSearch.shadowRoot.querySelectorAll(
          `div[data-faceplate-tracking-context] faceplate-loader[name*="SearchSduiTrendingQuery"] + li`,
        ),
        redditSearch.shadowRoot.querySelectorAll(
          `div[data-faceplate-tracking-context] search-telemetry-tracker:has(li[data-testid*="typeahead-suggestion"])`,
        ),
        redditSearch.shadowRoot.querySelectorAll(
          `div[data-faceplate-tracking-context] div[id*="trending_query"]`,
        ),
        redditSearch.shadowRoot.querySelectorAll(
          `div[data-faceplate-tracking-context] div[id*="subreddit_typeahead_section"]`,
        ),
      ];
    }

    if (!document.body) {
      redditTrendingRuntimeScope.interval("wait-for-trending", () => {
        const trendingTodayContainer = getTrendingTodayContainer();

        if (trendingTodayContainer && trendingTodayContainer[0]) {
          redditTrendingRuntimeScope.cancel("interval", "wait-for-trending");
          hideCheckRedditTrendingToday(
            masterToogle ? false : checkedValue,
            trendingTodayContainer,
          );
        }
      }, 100);
    } else {
      const trendingTodayContainer = getTrendingTodayContainer();

      if (trendingTodayContainer && trendingTodayContainer[0]) {
        hideCheckRedditTrendingToday(
          masterToogle ? false : checkedValue,
          trendingTodayContainer,
        );
      }
    }
  });
}

function hideCheckRedditTrendingToday(checkedValue, trendingTodayContainer) {
  for (const sectionToHide of trendingTodayContainer) {
    sectionToHide.forEach((element) => {
      if (element) {
        element.style.cssText = checkedValue
          ? "display: none !important;"
          : "display: block !important;";
      }
    });
  }
}

runtimeSnapshotService.subscribe(({ flags }) => {
    const headerTrendingValue =
      flags["socialFocus_reddit_header_hide_trending_today"] ?? false;
    const masterToggle = flags["socialFocus_reddit_master_toggle"] ?? false;

    handleRedditTrendingToday(
      masterToggle ? false : headerTrendingValue,
      isMobileVersion(),
      "socialFocus_reddit_header_hide_trending_today",
    );
});

redditTrendingRuntimeScope.listen("pagehide", window, "pagehide", () => redditTrendingRuntimeScope.dispose(), { once: true });

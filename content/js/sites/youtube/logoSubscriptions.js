/**
 * Redirect YouTube Home navigation to Subscriptions when enabled.
 */

const youtubeHomeRedirectRuntimeScope =
  SocialFocusContentRuntime.createLifecycleScope({
    featureId: "youtubeHomeRedirect",
  });

const hideHomeOptionId = "socialFocus_youtube_hide_home_button";
const logoSubscriptionsOptionId =
  "socialFocus_youtube_logo_opens_subscriptions";
const subscriptionsPath = "/feed/subscriptions";

function isHomeLocation() {
  return location.pathname === "/";
}

function redirectHomeToSubscriptions() {
  if (isHomeLocation()) {
    location.replace(subscriptionsPath);
  }
}

runtimeSnapshotService.ready.then(() => {
  const { flags } = runtimeSnapshotService.getCurrent() ?? { flags: {} };
  const hideHome = flags[hideHomeOptionId] ?? false;
  const redirectLogo = flags[logoSubscriptionsOptionId] ?? false;

  if (!hideHome && !redirectLogo) return;

  if (hideHome) {
    redirectHomeToSubscriptions();
    youtubeHomeRedirectRuntimeScope.listen(
      "youtube-navigation",
      document,
      "yt-navigate-finish",
      redirectHomeToSubscriptions,
    );
  }

  youtubeHomeRedirectRuntimeScope.listen(
    "home-link-click",
    document,
    "click",
    (event) => {
      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      ) {
        return;
      }

      const target = event.target instanceof Element ? event.target : null;
      const homeLink = target?.closest(
        'ytd-topbar-logo-renderer a, a#logo, a#logo-icon, ytd-guide-entry-renderer a[href="/"], ytd-mini-guide-entry-renderer a[href="/"]',
      );

      if (!homeLink) return;
      if (!hideHome && !homeLink.closest("ytd-topbar-logo-renderer, a#logo, a#logo-icon")) return;

      event.preventDefault();
      event.stopPropagation();
      location.assign(subscriptionsPath);
    },
    true,
  );
});

youtubeHomeRedirectRuntimeScope.listen(
  "pagehide",
  window,
  "pagehide",
  () => youtubeHomeRedirectRuntimeScope.dispose(),
  { once: true },
);

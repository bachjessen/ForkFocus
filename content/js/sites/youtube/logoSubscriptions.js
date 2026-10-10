/**
 * Redirect normal YouTube logo clicks to Subscriptions when enabled.
 */

const youtubeLogoSubscriptionsRuntimeScope =
  SocialFocusContentRuntime.createLifecycleScope({
    featureId: "youtubeLogoSubscriptions",
  });

const youtubeLogoSubscriptionsOptionId =
  "socialFocus_youtube_logo_opens_subscriptions";

runtimeSnapshotService.ready.then(() => {
  const { flags } = runtimeSnapshotService.getCurrent() ?? { flags: {} };

  if (!(flags[youtubeLogoSubscriptionsOptionId] ?? false)) return;

  youtubeLogoSubscriptionsRuntimeScope.listen(
    "logo-click",
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
      const logoLink = target?.closest(
        "ytd-topbar-logo-renderer a#logo, ytd-topbar-logo-renderer a, a#logo, a#logo-icon",
      );

      if (!logoLink) return;

      event.preventDefault();
      event.stopPropagation();
      window.location.assign("/feed/subscriptions");
    },
    true,
  );
});

youtubeLogoSubscriptionsRuntimeScope.listen(
  "pagehide",
  window,
  "pagehide",
  () => youtubeLogoSubscriptionsRuntimeScope.dispose(),
  { once: true },
);


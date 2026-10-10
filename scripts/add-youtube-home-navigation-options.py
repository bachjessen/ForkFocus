import json
import sys
from pathlib import Path

phase = sys.argv[1]
options_path = Path("shared/options/options.json")
data = json.loads(options_path.read_text())
youtube = next(item for item in data["data"] if item["categoryId"] == "youtube")
options_group = next(
    group for group in youtube["categoryDesktopGroups"]
    if group["groupId"] == "options"
)
options = options_group["options"]

if phase == "hide-home":
    data["currentVersion"] = "1.0.10"
    anchor = next(i for i, option in enumerate(options) if option["id"] == "socialFocus_youtube_hide_subscriptions_most_relevant")
    options.insert(anchor, {
        "type": "checkbox",
        "name": {"da": "Skjul knappen Startside", "en": "Hide Home Button"},
        "id": "socialFocus_youtube_hide_home_button",
        "defaultValue": False,
        "styles": [
            "tp-yt-app-drawer#guide[role=\"navigation\"] ytd-guide-entry-renderer:has(a[href=\"/\"])",
            "ytd-mini-guide-renderer[role=\"navigation\"] ytd-mini-guide-entry-renderer:has(a[href=\"/\"])",
        ],
    })
elif phase == "logo-subscriptions":
    data["currentVersion"] = "1.0.11"
    anchor = next(i for i, option in enumerate(options) if option["id"] == "socialFocus_youtube_hide_subscriptions_most_relevant")
    options.insert(anchor, {
        "type": "checkbox",
        "name": {"da": "Åbn Abonnementer via YouTube-logoet", "en": "Open Subscriptions from YouTube Logo"},
        "id": "socialFocus_youtube_logo_opens_subscriptions",
        "defaultValue": False,
    })
    Path("content/js/sites/youtube/logoSubscriptions.js").write_text('''/**
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

''')
    manifest_path = Path("manifest.json")
    manifest = json.loads(manifest_path.read_text())
    youtube_scripts = manifest["content_scripts"][1]["js"]
    youtube_scripts.append("content/js/sites/youtube/logoSubscriptions.js")
    manifest_path.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n")
else:
    raise SystemExit(f"Unknown phase: {phase}")

options_path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n")

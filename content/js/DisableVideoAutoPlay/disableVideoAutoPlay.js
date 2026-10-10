/**
 * SocialFocus
 * Copyright © 2026 Yevhen Tretiakov. All rights reserved.
 *

 */

(function installAutoplayFeature() {
  const featureId = "youtubePreviewAutoplay";
  const scope = SocialFocusContentRuntime.createLifecycleScope({ featureId });
  const optionId = "socialFocus_youtube_hide_thumbnails";
  let disabled = false;

  function players() {
    const preview = document.querySelector(`${isUserAgentMobile() ? "ytm-video-preview" : "ytd-video-preview"} video`);
    const channel = isUserAgentMobile() ? null : document.querySelector("ytd-channel-video-player-renderer video");
    return [preview, channel].filter(Boolean);
  }

  function updatePlayers() {
    for (const player of players()) {
      if (disabled) { player.pause(); player.muted = true; }
      else { void player.play().catch(() => {}); player.muted = false; }
    }
  }

  const observer = new MutationObserver(updatePlayers);
  function apply(nextDisabled) {
    disabled = nextDisabled === true;
    updatePlayers();
    if (disabled && document.body) scope.observe("players", observer, document.body, { childList: true, subtree: true });
    else scope.cancel("observer", "players");
  }

  function applySnapshot(snapshot = runtimeSnapshotService.getCurrent()) {
    apply(snapshot?.flags?.[optionId] ?? false);
  }

  runtimeSnapshotService.subscribe(applySnapshot);
  scope.subscribe("runtime-message", browser.runtime.onMessage, (message) => {
    if (message.id === optionId && message.type === "toggle") applySnapshot();
  });
  const initialize = () => runtimeSnapshotService.ready.then(applySnapshot);
  if (document.readyState === "loading") scope.listen("dom-ready", document, "DOMContentLoaded", initialize, { once: true });
  else initialize();
  scope.listen("pagehide", window, "pagehide", () => scope.dispose(), { once: true });
})(globalThis);

/**
 * SocialFocus
 * Copyright © 2026 Yevhen Tretiakov. All rights reserved.
 *

 */

(function installTabRuntimeReloadGuard(root) {
  if (root !== root.top) return;
  if (root.SocialFocusRuntimeReloadGuard) {
    // The background update coordinator owns the single tabs.reload(). A
    // location.reload() from this outgoing Safari generation can bind the next
    // document to the same stale scripts and create an unbounded reload loop.
    root.SocialFocusRuntimeReloadGuard.reinjectionDetected = true;
    return;
  }

  const ACTION = "socialFocusPrepareRuntimeReload";
  const runtimeContractVersion = root.SocialFocusRuntimeContract.contractVersion;
  const capturedVersion = browser.runtime.getManifest().version;
  let pendingVersion = null; let pendingContractVersion = null; let pendingMode = null; let cleanupListeners = null;
  const markerKey = (version, contract) => `socialfocus-runtime-reloaded:${version}:${contract}`;
  function wasReloaded(version, contract) { try { return sessionStorage.getItem(markerKey(version, contract)) === "1"; } catch (_) { return false; } }
  function markReloaded(version, contract) { try { sessionStorage.setItem(markerKey(version, contract), "1"); } catch (_) {} }
  function isEditing() { const active = document.activeElement; return Boolean(active && (active.matches?.("input, textarea, select") || active.isContentEditable)); }
  function hasBlockingUi() { return Boolean(document.querySelector("#timeModal")); }
  function hasPlayingMedia() { return [...document.querySelectorAll("video, audio")].some((media) => !media.paused && !media.ended); }
  function canReload({ navigation = false } = {}) { const immediate = pendingMode === "immediate"; return (immediate || document.visibilityState === "visible") && !document.fullscreenElement && !isEditing() && !hasBlockingUi() && (immediate || navigation || !hasPlayingMedia()); }
  function reloadOnce() {
    if (!pendingVersion || wasReloaded(pendingVersion, pendingContractVersion)) return false;
    const version = pendingVersion; const contract = pendingContractVersion;
    pendingVersion = null; pendingContractVersion = null; pendingMode = null; cleanupListeners?.(); cleanupListeners = null;
    markReloaded(version, contract); root.location.reload(); return true;
  }
  function tryReload(options) { return pendingVersion && canReload(options) ? reloadOnce() : false; }
  function waitForSafeMoment() {
    if (cleanupListeners) return;
    const regularEvents = ["visibilitychange", "fullscreenchange", "focusout", "pause", "ended"];
    const navigationEvents = ["popstate", "hashchange"];
    const onRegular = () => tryReload(); const onNavigation = () => tryReload({ navigation: true });
    for (const event of regularEvents) document.addEventListener(event, onRegular, true);
    for (const event of navigationEvents) root.addEventListener(event, onNavigation, true);
    cleanupListeners = () => { for (const event of regularEvents) document.removeEventListener(event, onRegular, true); for (const event of navigationEvents) root.removeEventListener(event, onNavigation, true); };
  }
  function prepare(targetVersion, targetContractVersion) {
    const normalizedContract = Number(targetContractVersion);
    const contractChanged = Number.isFinite(normalizedContract) && normalizedContract !== runtimeContractVersion;
    if (typeof targetVersion !== "string" || !targetVersion || (!contractChanged && targetVersion === capturedVersion) || wasReloaded(targetVersion, normalizedContract)) return { pending: false, reason: "current" };
    pendingVersion = targetVersion; pendingContractVersion = normalizedContract; pendingMode = contractChanged ? "immediate" : "deferred";
    if (tryReload()) return { pending: false, reason: "reloading" };
    waitForSafeMoment(); return { pending: true, reason: "unsafe", mode: pendingMode };
  }
  browser.runtime.onMessage.addListener((message) => message?.action === ACTION ? prepare(message.targetVersion, message.targetContractVersion) : undefined);
  root.SocialFocusRuntimeReloadGuard = { capturedVersion, runtimeContractVersion, reinjectionDetected: false, prepare, tryReload, get pendingVersion() { return pendingVersion; }, get pendingMode() { return pendingMode; } };
})(globalThis);

/**
 * SocialFocus
* SocialFocus
 * Copyright © 2026 
 */

const VALID_CHANNELS = new Set(["production", "testers"]);
const STATE_TOKEN_PATTERN = /^[0-9a-f]{64}$/;

function isObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function validateCatalog(catalog) {
  if (!isObject(catalog) || !Array.isArray(catalog.desktop) || !Array.isArray(catalog.mobile)) {
    throw new Error("options_release_invalid_catalog");
  }
  const seen = new Set();
  for (const [platform, entries] of Object.entries(catalog)) {
    for (const entry of entries) {
      if (!isObject(entry) || typeof entry.settings_id !== "string" || !entry.settings_id || !Array.isArray(entry.styles)) {
        throw new Error("options_release_invalid_catalog");
      }
      const expectedMobile = platform === "mobile" ? 1 : 0;
      if (Number(Boolean(entry.is_mobile)) !== expectedMobile) {
        throw new Error("options_release_platform_mismatch");
      }
      const target = `${entry.settings_id}:${expectedMobile}`;
      if (seen.has(target)) throw new Error("options_release_duplicate_target");
      seen.add(target);
    }
  }
  if (seen.size === 0) throw new Error("options_release_empty_catalog");
  return {
    desktop: catalog.desktop.map((entry) => ({ ...entry, is_mobile: 0 })),
    mobile: catalog.mobile.map((entry) => ({ ...entry, is_mobile: 1 })),
  };
}

function validateSnapshot(snapshot, { product, channel, version }) {
  if (!isObject(snapshot) || snapshot.product !== product || snapshot.channel !== channel || snapshot.version !== version || !STATE_TOKEN_PATTERN.test(snapshot.state_token ?? "")) {
    throw new Error("options_release_invalid_snapshot");
  }
  return validateCatalog(snapshot.catalog);
}

export function createOptionsReleaseController({ repository, api, authorizedRequest, rebuildRuntimeSnapshot, loadBundledOptions,
  product, remoteOptionsKey, lifecycleMetaKey, clock = { now: () => Date.now() } }) {
  async function currentSelection() {
    const store = await repository.get(lifecycleMetaKey);
    return store[lifecycleMetaKey]?.optionsReleaseOverride ?? null;
  }

  async function installSnapshot(snapshot, { pinned }) {
    const catalog = validateSnapshot(snapshot, { product, channel: snapshot.channel, version: snapshot.version });
    const before = await repository.get([remoteOptionsKey, lifecycleMetaKey]);
    const previousCatalog = before[remoteOptionsKey];
    const previousMeta = before[lifecycleMetaKey] ?? {};
    const optionsReleaseOverride = pinned ? {
      channel: snapshot.channel,
      version: snapshot.version,
      stateToken: snapshot.state_token,
      appliedAt: clock.now(),
    } : null;
    try {
      await repository.set({
        [remoteOptionsKey]: catalog,
        [lifecycleMetaKey]: { ...previousMeta, optionsVersion: snapshot.version, optionsReleaseOverride },
      });
      await rebuildRuntimeSnapshot();
    } catch (error) {
      await repository.set({ [remoteOptionsKey]: previousCatalog, [lifecycleMetaKey]: previousMeta });
      await rebuildRuntimeSnapshot().catch(() => undefined);
      throw error;
    }
    return { applied: true, selection: optionsReleaseOverride, version: snapshot.version,
      channel: snapshot.channel, targets: snapshot.targets };
  }

  async function list() {
    const payload = await authorizedRequest((accessToken) => api.listTesterReleases({ accessToken }));
    if (!Array.isArray(payload?.versions) || payload.product !== product) throw new Error("options_release_invalid_list");
    return { ...payload, selection: await currentSelection() };
  }

  async function apply({ channel, version }) {
    if (!VALID_CHANNELS.has(channel) || typeof version !== "string" || !version) throw new Error("options_release_invalid_selection");
    const snapshot = await authorizedRequest((accessToken) => api.getTesterReleaseSnapshot({ accessToken, channel, version }));
    return installSnapshot(snapshot, { pinned: true });
  }

  async function restoreCurrent() {
    const snapshot = await authorizedRequest((accessToken) => api.getCurrentOptions({ accessToken }));
    return installSnapshot(snapshot, { pinned: false });
  }

  async function restoreBundled() {
    const bundled = await loadBundledOptions();
    const catalog = validateCatalog(bundled.remoteOptionsData);
    const before = await repository.get(lifecycleMetaKey);
    const meta = before[lifecycleMetaKey] ?? {};
    await repository.set({
      [remoteOptionsKey]: catalog,
      [lifecycleMetaKey]: { ...meta, optionsVersion: bundled.optionsVersion, optionsReleaseOverride: null },
    });
    await rebuildRuntimeSnapshot();
    return { restored: true, source: "bundled" };
  }

  return Object.freeze({ list, apply, restoreCurrent, restoreBundled, currentSelection });
}

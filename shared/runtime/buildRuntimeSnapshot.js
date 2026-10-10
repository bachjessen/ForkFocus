/**
 * SocialFocus
 * Copyright © 2026 Yevhen Tretiakov. All rights reserved.
 *

 */

import { siteIds } from "../constants/sites.js";
import {
  CURRENT_RUNTIME_CONTRACT_VERSION,
  CURRENT_RUNTIME_SNAPSHOT_SCHEMA_VERSION,
} from "../lifecycle/lifecycleConstants.js";

function isObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

export function processRuntimeStyles(styles) {
  const selectors = [];
  const custom = [];
  for (const style of styles) {
    if (typeof style !== "string" || !style) continue;
    if (style.includes("!important") || style.includes("{")) custom.push(style);
    else selectors.push(style);
  }
  return [
    selectors.length
      ? `${selectors.join(",\n")} {\n  display: none !important;\n}`
      : "",
    custom.join("\n"),
  ]
    .filter(Boolean)
    .join("\n");
}

function appendStyle(target, style, selectedValue) {
  if (typeof style === "string") {
    if (style) target.add(style);
    return;
  }
  if (!isObject(style) || style.id !== selectedValue) return;

  if (Array.isArray(style.styles)) {
    for (const inner of style.styles) if (inner) target.add(inner);
  } else if (isObject(style.styles)) {
    for (const inner of style.styles[style.id] ?? []) if (inner) target.add(inner);
  }
}

function buildCategoryRuntime({ categoryId, state, catalogItems }) {
  const styles = new Set();
  const flags = { ...state };
  const masterToggle = Object.keys(state).find(
    (id) => id.includes("master_toggle") && state[id],
  );
  if (masterToggle) {
    for (const id of Object.keys(flags)) {
      if (id !== masterToggle) flags[id] = false;
    }
  }

  for (const item of catalogItems) {
    if (item.category_id !== categoryId) continue;
    const selectedValue = state[item.settings_id];
    if (!selectedValue) continue;
    for (const style of item.styles ?? []) appendStyle(styles, style, selectedValue);
  }
  return { css: processRuntimeStyles(styles), flags };
}

export function buildRuntimeSnapshot({
  optionsState = {},
  remoteOptionsData = {},
  extensionVersion,
  optionsVersion,
  revision,
  createdAt,
}) {
  const catalogItems = [
    ...(remoteOptionsData.desktop ?? []),
    ...(remoteOptionsData.mobile ?? []),
  ];
  const css = {};
  const flags = {};

  for (const categoryId of siteIds) {
    const runtime = buildCategoryRuntime({
      categoryId,
      state: isObject(optionsState[categoryId]) ? optionsState[categoryId] : {},
      catalogItems,
    });
    css[categoryId] = runtime.css;
    Object.assign(flags, runtime.flags);
  }

  return {
    schemaVersion: CURRENT_RUNTIME_SNAPSHOT_SCHEMA_VERSION,
    contractVersion: CURRENT_RUNTIME_CONTRACT_VERSION,
    extensionVersion,
    optionsVersion,
    revision,
    createdAt,
    css,
    flags,
  };
}

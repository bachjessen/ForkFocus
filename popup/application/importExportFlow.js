/**
 * SocialFocus
 * Copyright © 2026 Yevhen Tretiakov. All rights reserved.
 *
 * This source code is proprietary and confidential.
 * Unauthorized copying, modification, distribution, or use is strictly prohibited.
 */

import { storageKeys } from "../../shared/constants/storageKeys.js";
import { storageMutations } from "../core/bootstrap.js";
import { messagingService } from "../services/messagingService.js";
import { rebuildAndConfirmRuntime } from "../services/optionsService.js";
import { storageService } from "../services/storageService.js";

const exportableRoots = Object.freeze([
  storageKeys.optionsState,
  storageKeys.system,
  storageKeys.notSyncingState,
]);
const exportableRootSet = new Set(exportableRoots);
function encode(value) {
  const bytes = new TextEncoder().encode(value); let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}
function decode(value) { const bytes = Uint8Array.from(atob(value), (character) => character.charCodeAt(0)); return new TextDecoder().decode(bytes); }

export async function exportSettings() {
  const store = await storageService.get(exportableRoots);
  return encode(JSON.stringify(exportableRoots.filter((key) => store[key] !== undefined).map((id) => ({ id, value: store[id] }))));
}
export async function importSettings(serialized) {
  const entries = JSON.parse(decode(serialized.trim()));
  if (!Array.isArray(entries)) throw new Error("import_invalid_payload");
  const values = Object.fromEntries(entries.filter((entry) =>
    entry &&
    typeof entry.id === "string" &&
    exportableRootSet.has(entry.id) &&
    entry.value &&
    typeof entry.value === "object" &&
    !Array.isArray(entry.value),
  ).map((entry) => [entry.id, entry.value]));
  if (Object.keys(values).length === 0) throw new Error("import_invalid_payload");
  await messagingService.sendToActiveTab({ action: "removeStyles" });
  const result = await storageMutations.importOwnedState(values);
  await rebuildAndConfirmRuntime();
  return result;
}
export async function resetSettings() {
  await messagingService.sendToActiveTab({ action: "removeStyles" });
  return storageMutations.factoryReset();
}

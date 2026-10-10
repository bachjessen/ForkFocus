/**
 * SocialFocus
 * Copyright © 2026 Yevhen Tretiakov. All rights reserved.
 *

 */

export function shortcutCodeDisplayName(code) {
  if (typeof code !== "string") return "";
  if (code.startsWith("Key")) return code.slice(3);
  if (code.startsWith("Digit")) return code.slice(5);
  return code;
}

export function formatShortcut(keys) {
  if (!Array.isArray(keys)) return "";
  return keys.map(shortcutCodeDisplayName).filter(Boolean).join("+").toUpperCase();
}

/**
 * SocialFocus
 * Copyright © 2026 Yevhen Tretiakov. All rights reserved.
 *

 */

export function getChangedValues(changes, storageKey, ...path) {
  const change = changes?.[storageKey];
  if (!change) return null;

  const nested = (value) =>
    path.reduce((current, key) => current?.[key], value ?? {});

  return {
    oldValue: nested(change.oldValue),
    newValue: nested(change.newValue),
  };
}

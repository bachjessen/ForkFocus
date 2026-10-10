/**
 * SocialFocus
 * Copyright © 2026 Yevhen Tretiakov. All rights reserved.
 *
 * This source code is proprietary and confidential.
 * Unauthorized copying, modification, distribution, or use is strictly prohibited.
 */

export function createDefaultLayout() {
  const root = document.createElement("div");
  root.className = "layout layout--default";

  const outlet = document.createElement("div");
  outlet.className = "outlet";
  root.appendChild(outlet);

  function mount() {
    document.getElementById("app")?.setAttribute("popup-layout", "default");
  }

  function unmount() {}

  return { element: root, outlet, mount, unmount };
}

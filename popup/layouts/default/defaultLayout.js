/**
 * SocialFocus
* SocialFocus
 * Copyright © 2026 
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

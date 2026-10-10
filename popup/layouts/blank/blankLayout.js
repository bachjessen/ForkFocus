/**
 * SocialFocus
* SocialFocus
 * Copyright © 2026 
 */

export function createBlankLayout() {
  const root = document.createElement("div");
  root.className = "layout layout--blank";

  const outlet = document.createElement("div");
  outlet.className = "outlet";
  root.appendChild(outlet);

  function mount() {
    document.getElementById("app")?.setAttribute("popup-layout", "blank");
  }

  function unmount() {}

  return { element: root, outlet, mount, unmount };
}

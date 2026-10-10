/**
 * SocialFocus
 * Copyright © 2026 Yevhen Tretiakov. All rights reserved.
 *

 */

import { routeLayouts, routes, topLevelScreens } from "../constants/routes-constants.js";
import { getLayout } from "../layouts/layoutsFactory.js";
import { localizationService } from "../services/localizationService.js";

let currentScreen = null;
let currentLayout = null;
let routeController = null;

function bindRouteInteractions(root) {
  routeController?.abort();
  routeController = new AbortController();
  const { signal } = routeController;

  root.querySelectorAll(".routerButton[routeto]").forEach((button) => {
    button.addEventListener("click", () => {
      if (!button.hasAttribute("route-handler-owned")) navigate(button.getAttribute("routeto"));
    }, { signal });
  });
  root.querySelectorAll(".subScreenNavigation .infoButton").forEach((button) => {
    button.addEventListener("click", () => button.parentElement?.querySelector(".subScreenInfo")?.toggleAttribute("active"), { signal });
  });
  root.querySelectorAll(".subScreenInfo").forEach((info) => {
    info.addEventListener("click", () => info.removeAttribute("active"), { signal });
  });
}

export function navigate(routeName, props = {}) {
  const app = document.getElementById("app");
  if (!app) { console.error("#app container not found"); return false; }
  const factory = routes[routeName];
  if (!factory) { console.error(`Route not found: ${routeName}`); return false; }
  const layoutName = routeLayouts[routeName] ?? "blank";
  const isNewLayout = currentLayout?.name !== layoutName;

  if (isNewLayout) {
    routeController?.abort();
    currentScreen?.unmount?.();
    currentScreen?.element.remove();
    currentScreen = null;
    currentLayout?.unmount?.();
    currentLayout?.element.remove();
    currentLayout = getLayout(layoutName, { navigate })();
    currentLayout.name = layoutName;
    app.appendChild(currentLayout.element);
  }

  routeController?.abort();
  currentScreen?.unmount?.();
  currentScreen?.element.remove();

  const screen = factory({ navigate, props });
  screen.element.setAttribute("active", "");
  screen.element.toggleAttribute("top-level", topLevelScreens.includes(routeName));
  currentLayout.outlet.appendChild(screen.element);
  currentLayout.outlet.classList.toggle("outlet--top-level", topLevelScreens.includes(routeName));
  currentScreen = screen;
  bindRouteInteractions(screen.element);
  const mounted = screen.mount?.();
  if (mounted?.catch) mounted.catch((error) => console.error(`Screen mount failed: ${routeName}`, error));
  if (isNewLayout) currentLayout.mount?.();
  localizationService.apply(screen.element);
  document.body.scrollTo?.({ top: 0 });
  return true;
}

export function initializeRouter() {
  globalThis.showScreen = navigate;
  return { routes: Object.keys(routes) };
}

export function destroyRouter() {
  routeController?.abort();
  currentScreen?.unmount?.();
  currentLayout?.unmount?.();
  currentScreen?.element.remove();
  currentLayout?.element.remove();
  currentScreen = null;
  currentLayout = null;
  routeController = null;
}

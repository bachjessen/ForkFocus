/**
 * SocialFocus
 * Copyright © 2026 
 */

export function createScreenElement(html, expectedId) {
  const documentFragment = new DOMParser().parseFromString(html.trim(), "text/html");
  const element = documentFragment.body.firstElementChild;
  if (!element || element.id !== expectedId || !element.classList.contains("appScreen")) {
    throw new Error(`screen_template_invalid:${expectedId}`);
  }
  element.classList.add("screen");
  element.removeAttribute("active");
  return element;
}

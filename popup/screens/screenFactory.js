/**
 * SocialFocus
 * Copyright © 2026 
 */

export function createScreenElement(html, expectedId) {
  const template = document.createElement("template");
  template.innerHTML = html.trim();
  const element = template.content.firstElementChild;
  if (!element || element.id !== expectedId || !element.classList.contains("appScreen")) {
    throw new Error(`screen_template_invalid:${expectedId}`);
  }
  element.classList.add("screen");
  element.removeAttribute("active");
  return element;
}

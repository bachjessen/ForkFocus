/**
 * ForkFocus
 * Copyright © 2026 Yevhen Tretiakov. All rights reserved.
 *

 */

function getErrorCode(error) {
  const message = error?.message;
  return typeof message === "string" && message.trim()
    ? message.trim().slice(0, 160)
    : "popup_startup_failed";
}

export function renderStartupError(
  error,
  {
    documentRef = globalThis.document,
    reload = () => globalThis.location.reload(),
  } = {},
) {
  const app = documentRef?.getElementById("app");
  if (!app) return false;

  documentRef.documentElement?.removeAttribute("disabled");

  const container = documentRef.createElement("section");
  container.className = "startupError";
  container.setAttribute("role", "alert");

  const icon = documentRef.createElement("div");
  icon.className = "startupErrorIcon";
  icon.setAttribute("aria-hidden", "true");
  icon.textContent = "!";

  const title = documentRef.createElement("h1");
  title.className = "startupErrorTitle";
  title.textContent = "ForkFocus couldn't start";

  const message = documentRef.createElement("p");
  message.className = "startupErrorMessage";
  message.textContent =
    "Reload the extension. If the problem continues, include the error code in your support message.";

  const details = documentRef.createElement("code");
  details.className = "startupErrorCode";
  details.textContent = getErrorCode(error);

  const retryButton = documentRef.createElement("button");
  retryButton.type = "button";
  retryButton.className = "submitButton startupErrorRetry";
  retryButton.textContent = "Reload";
  retryButton.addEventListener("click", reload, { once: true });

  container.append(icon, title, message, details, retryButton);
  app.replaceChildren(container);
  return true;
}

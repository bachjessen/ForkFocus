/**
 * SocialFocus
 * Copyright © 2026 Yevhen Tretiakov. All rights reserved.
 *
 * This source code is proprietary and confidential.
 * Unauthorized copying, modification, distribution, or use is strictly prohibited.
 */

const ALERT_ID = "runtimeActionError";
const TITLE_ID = "runtimeActionErrorTitle";
const MESSAGE_ID = "runtimeActionErrorMessage";

async function reloadActivePage() {
  const api = globalThis.browser ?? globalThis.chrome;
  const tabs = await api.tabs.query({ currentWindow: true, active: true });
  if (Number.isInteger(tabs[0]?.id)) await api.tabs.reload(tabs[0].id);
  window.close();
}

export function clearRuntimeActionError(documentRef = document) {
  documentRef.getElementById(ALERT_ID)?.remove();
}

function ensureRuntimeActionFeedback(documentRef) {
  let alert = documentRef.getElementById(ALERT_ID);
  if (!alert) {
    alert = documentRef.createElement("section");
    alert.id = ALERT_ID;
    alert.className = "runtimeActionError";
    alert.setAttribute("aria-labelledby", TITLE_ID);
    alert.setAttribute("aria-describedby", MESSAGE_ID);

    const dialog = documentRef.createElement("div");
    dialog.className = "runtimeActionErrorDialog";

    const header = documentRef.createElement("div");
    header.className = "runtimeActionErrorHeader";

    const heading = documentRef.createElement("div");
    heading.className = "runtimeActionErrorHeading";

    const icon = documentRef.createElement("span");
    icon.className = "runtimeActionErrorIcon";
    icon.setAttribute("aria-hidden", "true");

    const iconGlyph = documentRef.createElement("i");
    iconGlyph.className = "fa-solid fa-triangle-exclamation";
    icon.append(iconGlyph);

    const title = documentRef.createElement("h2");
    title.id = TITLE_ID;
    title.className = "runtimeActionErrorTitle";
    title.textContent = "Page update needed";
    heading.append(icon, title);

    const close = documentRef.createElement("button");
    close.type = "button";
    close.className = "runtimeActionErrorClose outlinedButton";
    close.setAttribute("aria-label", "Close");

    const closeIcon = documentRef.createElement("i");
    closeIcon.className = "fa-solid fa-xmark";
    closeIcon.setAttribute("aria-hidden", "true");
    close.append(closeIcon);
    close.addEventListener("click", () => alert.remove());
    header.append(heading, close);

    const body = documentRef.createElement("div");
    body.className = "runtimeActionErrorBody";

    const message = documentRef.createElement("p");
    message.id = MESSAGE_ID;
    message.className = "runtimeActionErrorMessage";
    message.textContent =
      "The setting was saved, but this page did not confirm the update.";

    const details = documentRef.createElement("div");
    details.className = "runtimeActionErrorDetails";

    const detailsLabel = documentRef.createElement("span");
    detailsLabel.className = "runtimeActionErrorDetailsLabel";
    detailsLabel.textContent = "Technical details";

    const code = documentRef.createElement("code");
    code.className = "runtimeActionErrorCode";

    details.append(detailsLabel, code);
    body.append(message, details);

    const footer = documentRef.createElement("div");
    footer.className = "runtimeActionErrorFooter";

    const dismiss = documentRef.createElement("button");
    dismiss.type = "button";
    dismiss.className = "runtimeActionErrorDismiss outlinedButton";
    dismiss.textContent = "Close";
    dismiss.addEventListener("click", () => alert.remove());

    const reload = documentRef.createElement("button");
    reload.type = "button";
    reload.className = "runtimeActionErrorReload submitButton";
    reload.textContent = "Reload page";
    reload.addEventListener("click", () => {
      void reloadActivePage().catch(() => globalThis.location.reload());
    });

    footer.append(dismiss, reload);
    dialog.append(header, body, footer);
    alert.append(dialog);
    alert.addEventListener("click", (event) => {
      if (event.target === alert) alert.remove();
    });
    alert.addEventListener("keydown", (event) => {
      if (event.key === "Escape") alert.remove();
    });
    (documentRef.body ?? documentRef.documentElement)?.prepend(alert);
  }

  return alert;
}

export function reportRuntimeActionError(error, documentRef = document) {
  const alert = ensureRuntimeActionFeedback(documentRef);
  alert.setAttribute("role", "alertdialog");
  alert.setAttribute("aria-modal", "true");
  alert.querySelector(".runtimeActionErrorCode").textContent = String(
    error?.message ?? error ?? "runtime_apply_failed",
  ).slice(0, 120);
  alert.querySelector(".runtimeActionErrorReload").focus?.();
  return alert;
}

export function installRuntimeActionErrorBoundary(windowRef = window) {
  if (windowRef.__socialFocusRuntimeActionBoundaryInstalled) return;
  windowRef.__socialFocusRuntimeActionBoundaryInstalled = true;
  windowRef.addEventListener("unhandledrejection", (event) => {
    reportRuntimeActionError(event.reason);
    event.preventDefault();
  });
}

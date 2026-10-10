/**
 * SocialFocus
* SocialFocus
 * Copyright © 2026 
 */

(function installContentStyleService(root) {
  root.SocialFocusContentRuntime ??= {};
  if (root.SocialFocusContentRuntime.createStyleService) return;

  root.SocialFocusContentRuntime.createStyleService = function ({ siteName, isMobile }) {
    const featureId = "contentStyleService";
    const scope = root.SocialFocusContentRuntime.createLifecycleScope({ featureId });
    const styleAttribute = `social-${siteName}-data-runtime-styles`;
    let linkedInStyles = null;
    let pendingStyles = null;
    let retryRegistered = false;

    function iframeDocument() {
      const iframe = document.querySelector('iframe[data-testid="interop-iframe"]');
      try { return iframe?.contentDocument || iframe?.contentWindow?.document || null; } catch (_) { return null; }
    }

    function injectIntoLinkedInIframe(styles) {
      const target = iframeDocument();
      if (!target?.head) return;
      let style = target.querySelector(`style[${styleAttribute}]`);
      if (!style) { style = target.createElement("style"); style.setAttribute(styleAttribute, ""); target.head.appendChild(style); }
      style.textContent = styles ?? "";
    }

    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) for (const node of mutation.addedNodes) {
        if (node.nodeName === "IFRAME" && node.dataset?.testid === "interop-iframe" && linkedInStyles) {
          node.addEventListener("load", () => injectIntoLinkedInIframe(linkedInStyles), { once: true });
        }
      }
    });

    function beginLinkedInObservation() {
      if (siteName !== "linkedin" || isMobile()) return;
      if (document.body) { scope.observe("linkedin-iframe", observer, document.body, { childList: true, subtree: true }); return; }
      scope.interval("wait-for-body", () => {
        if (!document.body) return;
        scope.cancel("interval", "wait-for-body");
        scope.observe("linkedin-iframe", observer, document.body, { childList: true, subtree: true });
      }, 100);
    }

    function apply(styles = "") {
      pendingStyles = typeof styles === "string" ? styles : "";
      if (siteName === "linkedin" && !isMobile()) { linkedInStyles = styles; injectIntoLinkedInIframe(styles); }
      let style = document.querySelector(`style[${styleAttribute}]`);
      if (!style) {
        const mountTarget = document.head || document.documentElement;
        if (!mountTarget) {
          if (!retryRegistered) {
            retryRegistered = true;
            document.addEventListener("readystatechange", () => {
              retryRegistered = false;
              if (pendingStyles !== null) apply(pendingStyles);
            }, { once: true });
          }
          return false;
        }
        style = document.createElement("style"); style.setAttribute(styleAttribute, ""); mountTarget.appendChild(style);
      }
      style.textContent = pendingStyles;
      return true;
    }

    function remove() {
      pendingStyles = null;
      linkedInStyles = null;
      iframeDocument()?.querySelector(`style[${styleAttribute}]`)?.remove();
      document.querySelector(`style[${styleAttribute}]`)?.remove();
      root.removeTimerModal?.();
    }

    beginLinkedInObservation();
    root.SocialFocusContentDiagnostics?.start(featureId);
    return Object.freeze({ apply, remove, dispose() { scope.dispose(); remove(); root.SocialFocusContentDiagnostics?.stop(featureId); } });
  };
})(globalThis);

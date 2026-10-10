/**
 * SocialFocus
* SocialFocus
 * Copyright © 2026 
 */

/**
 * Zero-build lifecycle owner for content-script resources.
 */
(function installLifecycleScope(root) {
  root.SocialFocusContentRuntime ??= {};
  if (root.SocialFocusContentRuntime.createLifecycleScope) return;

  root.SocialFocusContentRuntime.createLifecycleScope = function ({
    featureId,
    diagnostics = root.SocialFocusContentDiagnostics,
  }) {
    const resources = new Map();
    let disposed = false;

    function key(type, id) {
      return `${type}:${id}`;
    }

    function register(type, id, cleanup) {
      if (disposed) return false;
      const resourceKey = key(type, id);
      if (resources.has(resourceKey)) return false;
      resources.set(resourceKey, cleanup);
      return true;
    }

    function release(type, id) {
      const resourceKey = key(type, id);
      const cleanup = resources.get(resourceKey);
      if (!cleanup) return false;
      resources.delete(resourceKey);
      cleanup();
      return true;
    }

    return {
      listen(id, target, eventName, listener, options) {
        if (!register("listener", id, () =>
          target.removeEventListener(eventName, listener, options),
        )) return false;
        target.addEventListener(eventName, listener, options);
        return true;
      },

      subscribe(id, event, listener) {
        if (!register("subscription", id, () => {
          event.removeListener(listener);
          diagnostics?.subscription(featureId, id, false);
        })) return false;
        event.addListener(listener);
        diagnostics?.subscription(featureId, id, true);
        return true;
      },

      observe(id, observer, target, options) {
        if (!register("observer", id, () => {
          observer.disconnect();
          diagnostics?.observer(featureId, id, false);
        })) return false;
        observer.observe(target, options);
        diagnostics?.observer(featureId, id, true);
        return true;
      },

      visibility(id, { pause, resume }) {
        if (typeof document === "undefined" || typeof window === "undefined") {
          return false;
        }
        let paused = document.visibilityState === "hidden";
        const setPaused = (nextPaused) => {
          if (paused === nextPaused) return;
          paused = nextPaused;
          if (paused) pause?.();
          else resume?.();
        };
        const onVisibilityChange = () =>
          setPaused(document.visibilityState === "hidden");
        const onPageHide = () => setPaused(true);
        const onPageShow = () =>
          setPaused(document.visibilityState === "hidden");
        if (!register("visibility", id, () => {
          document.removeEventListener("visibilitychange", onVisibilityChange);
          window.removeEventListener("pagehide", onPageHide);
          window.removeEventListener("pageshow", onPageShow);
        })) return false;
        document.addEventListener("visibilitychange", onVisibilityChange);
        window.addEventListener("pagehide", onPageHide);
        window.addEventListener("pageshow", onPageShow);
        return true;
      },

      animationFrame(id, callback) {
        let frameId = null;
        if (!register("animationFrame", id, () => {
          if (frameId !== null) cancelAnimationFrame(frameId);
        })) return false;
        frameId = requestAnimationFrame(() => {
          resources.delete(key("animationFrame", id));
          frameId = null;
          if (!disposed) callback();
        });
        return true;
      },

      timeout(id, callback, delay) {
        let timeoutId = null;
        if (!register("timeout", id, () => {
          if (timeoutId !== null) clearTimeout(timeoutId);
          diagnostics?.timeout(featureId, id, false);
        })) return false;
        timeoutId = setTimeout(() => {
          resources.delete(key("timeout", id));
          timeoutId = null;
          diagnostics?.timeout(featureId, id, false);
          if (!disposed) callback();
        }, delay);
        diagnostics?.timeout(featureId, id, true);
        return true;
      },

      interval(id, callback, delay) {
        let intervalId = null;
        if (!register("interval", id, () => {
          if (intervalId !== null) clearInterval(intervalId);
          diagnostics?.interval(featureId, id, false);
        })) return false;
        intervalId = setInterval(callback, delay);
        diagnostics?.interval(featureId, id, true);
        return true;
      },

      cancel(type, id) {
        return release(type, id);
      },

      dispose() {
        if (disposed) return;
        disposed = true;
        for (const cleanup of [...resources.values()].reverse()) cleanup();
        resources.clear();
      },

      get isDisposed() {
        return disposed;
      },

      get activeResourceCount() {
        return resources.size;
      },
    };
  };
})(globalThis);

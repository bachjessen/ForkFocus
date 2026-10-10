/**
 * SocialFocus
 * Copyright © 2026 Yevhen Tretiakov. All rights reserved.
 *

 */

/**
 * Lightweight in-memory diagnostics for the content runtime.
 * No page content, URLs, account data, or storage values are collected.
 */
(function installContentDiagnostics(root) {
  if (root.SocialFocusContentDiagnostics) return;

  const startedAt = Date.now();
  const features = new Map();
  const activeResources = {
    observers: new Set(),
    intervals: new Set(),
    timeouts: new Set(),
    subscriptions: new Set(),
  };

  function feature(id) {
    if (!features.has(id)) {
      features.set(id, {
        starts: 0,
        stops: 0,
        observerConnects: 0,
        observerDisconnects: 0,
        intervalStarts: 0,
        intervalStops: 0,
        timeoutStarts: 0,
        timeoutStops: 0,
        mutationCallbacks: 0,
        processedMutations: 0,
        totalExecutionMs: 0,
        maxExecutionMs: 0,
        errors: 0,
        storageReads: 0,
        scheduledChecks: 0,
        coalescedCallbacks: 0,
        actualChecks: 0,
        pauseActions: 0,
        videosScanned: 0,
        controlsWrites: 0,
        subscriptionStarts: 0,
        subscriptionStops: 0,
        requestsStarted: 0,
        requestsAborted: 0,
        staleResponses: 0,
        iframeMounts: 0,
        iframeUnmounts: 0,
        iframeReuses: 0,
        renderAttempts: 0,
        renders: 0,
        renderRejected: 0,
      });
    }
    return features.get(id);
  }

  function setResource(type, featureId, resourceId, active) {
    const key = `${featureId}:${resourceId}`;
    const resources = activeResources[type];
    const metrics = feature(featureId);
    const metricKeys = {
      observers: ["observerConnects", "observerDisconnects"],
      intervals: ["intervalStarts", "intervalStops"],
      timeouts: ["timeoutStarts", "timeoutStops"],
      subscriptions: ["subscriptionStarts", "subscriptionStops"],
    };
    const [startKey, stopKey] = metricKeys[type];

    if (active && !resources.has(key)) {
      resources.add(key);
      metrics[startKey] += 1;
    } else if (!active && resources.delete(key)) {
      metrics[stopKey] += 1;
    }
  }

  function countActive(type, featureId) {
    const prefix = `${featureId}:`;
    let count = 0;
    for (const key of activeResources[type]) {
      if (key.startsWith(prefix)) count += 1;
    }
    return count;
  }

  const resourceInvariants = [
    ["observers", "observerConnects", "observerDisconnects", "activeObservers"],
    ["intervals", "intervalStarts", "intervalStops", "activeIntervals"],
    ["timeouts", "timeoutStarts", "timeoutStops", "activeTimeouts"],
    [
      "subscriptions",
      "subscriptionStarts",
      "subscriptionStops",
      "activeSubscriptions",
    ],
  ];

  function rounded(value) {
    return Number(value.toFixed(3));
  }

  function topExecutionFeatures(snapshotFeatures, metric, limit = 5) {
    return Object.entries(snapshotFeatures)
      .filter(([, metrics]) => metrics[metric] > 0)
      .sort((left, right) =>
        right[1][metric] - left[1][metric] ||
        left[0].localeCompare(right[0]),
      )
      .slice(0, limit)
      .map(([featureId, metrics]) => ({
        featureId,
        totalExecutionMs: rounded(metrics.totalExecutionMs),
        maxExecutionMs: rounded(metrics.maxExecutionMs),
        actualChecks: metrics.actualChecks,
      }));
  }

  const api = {
    start(featureId) {
      feature(featureId).starts += 1;
    },

    stop(featureId) {
      feature(featureId).stops += 1;
    },

    observer(featureId, observerId, active) {
      setResource("observers", featureId, observerId, active);
    },

    interval(featureId, intervalId, active) {
      setResource("intervals", featureId, intervalId, active);
    },

    timeout(featureId, timeoutId, active) {
      setResource("timeouts", featureId, timeoutId, active);
    },

    subscription(featureId, subscriptionId, active) {
      setResource("subscriptions", featureId, subscriptionId, active);
    },

    count(featureId, metric, amount = 1) {
      const metrics = feature(featureId);
      if (typeof metrics[metric] === "number") metrics[metric] += amount;
    },

    measureMutations(featureId, mutationCount, callback) {
      const metrics = feature(featureId);
      const before = performance.now();
      metrics.mutationCallbacks += 1;
      metrics.processedMutations += mutationCount;
      try {
        return callback();
      } catch (error) {
        metrics.errors += 1;
        throw error;
      } finally {
        const duration = performance.now() - before;
        metrics.totalExecutionMs += duration;
        metrics.maxExecutionMs = Math.max(metrics.maxExecutionMs, duration);
      }
    },

    measureExecution(featureId, callback) {
      const metrics = feature(featureId);
      const before = performance.now();
      try {
        return callback();
      } catch (error) {
        metrics.errors += 1;
        throw error;
      } finally {
        const duration = performance.now() - before;
        metrics.totalExecutionMs += duration;
        metrics.maxExecutionMs = Math.max(metrics.maxExecutionMs, duration);
      }
    },

    getSnapshot() {
      const result = {};
      for (const [id, metrics] of features) {
        result[id] = {
          ...metrics,
          activeObservers: countActive("observers", id),
          activeIntervals: countActive("intervals", id),
          activeTimeouts: countActive("timeouts", id),
          activeSubscriptions: countActive("subscriptions", id),
        };
      }
      return {
        schemaVersion: 1,
        startedAt,
        uptimeMs: Date.now() - startedAt,
        frame: {
          isTop: root.top === root,
          visibilityState: root.document?.visibilityState ?? "unknown",
        },
        features: result,
      };
    },

    getHealthReport() {
      const snapshot = api.getSnapshot();
      const violations = [];
      const errors = [];
      const active = [];

      for (const [featureId, metrics] of Object.entries(snapshot.features)) {
        if (metrics.errors > 0) {
          errors.push({ featureId, count: metrics.errors });
        }

        const activeMetrics = {};
        for (const [
          resourceType,
          startMetric,
          stopMetric,
          activeMetric,
        ] of resourceInvariants) {
          const expected = metrics[startMetric] - metrics[stopMetric];
          const actual = metrics[activeMetric];
          if (actual < 0 || expected !== actual) {
            violations.push({
              featureId,
              resourceType,
              starts: metrics[startMetric],
              stops: metrics[stopMetric],
              expectedActive: expected,
              actualActive: actual,
            });
          }
          if (actual > 0) activeMetrics[activeMetric] = actual;
        }
        if (Object.keys(activeMetrics).length > 0) {
          active.push({ featureId, ...activeMetrics });
        }
      }

      return {
        schemaVersion: 1,
        healthy: violations.length === 0 && errors.length === 0,
        runtime: {
          manifestVersion:
            browserApi?.runtime?.getManifest?.().version ?? "unknown",
          contractVersion:
            root.SocialFocusRuntimeReloadGuard?.runtimeContractVersion ??
            root.SocialFocusRuntimeContract?.contractVersion ??
            null,
          uptimeMs: snapshot.uptimeMs,
          isTop: snapshot.frame.isTop,
          visibilityState: snapshot.frame.visibilityState,
        },
        violations,
        errors,
        activeResources: active,
        performance: {
          byTotalExecution: topExecutionFeatures(
            snapshot.features,
            "totalExecutionMs",
          ),
          byMaxExecution: topExecutionFeatures(
            snapshot.features,
            "maxExecutionMs",
          ),
        },
      };
    },

    async getUpdateLifecycleSnapshot() {
      if (!browserApi?.runtime?.sendMessage) return null;
      return await browserApi.runtime.sendMessage({
        action: "getRuntimeUpdateDiagnostics",
      });
    },
  };

  root.SocialFocusContentDiagnostics = api;

  const browserApi = root.browser ?? root.chrome;
  browserApi?.runtime?.onMessage?.addListener((message) => {
    if (message?.action === "getContentDiagnostics") {
      return Promise.resolve(api.getSnapshot());
    }
    if (message?.action === "getContentHealthReport") {
      return Promise.resolve(api.getHealthReport());
    }
  });
})(globalThis);

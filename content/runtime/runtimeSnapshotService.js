/**
 * SocialFocus
 * Copyright © 2026 Yevhen Tretiakov. All rights reserved.
 *

 */

(function installRuntimeSnapshotService(root) {
  if (root.runtimeSnapshotService) return;
  const snapshotKey = root.SocialFocusRuntimeContract.snapshotKey;
  const broker = root.SocialFocusContentRuntime.storageChangeBroker;
  const subscribers = new Set(); let snapshot = null; let revision = -1; let generation = 0; let pending = null; let scheduled = false;
  function reportError(stage, error) { root.SocialFocusContentDiagnostics?.count("runtimeSnapshotService", "errors"); console.error(`SocialFocus runtime snapshot ${stage} failed`, error); }
  function notify(listener, value) { try { listener(value); return true; } catch (error) { reportError("subscriber", error); return false; } }
  function valid(value) { return Boolean(value && Number.isFinite(value.revision) && value.flags && typeof value.flags === "object" && value.css && typeof value.css === "object"); }
  function flush() { scheduled = false; const value = pending; pending = null; if (!valid(value) || value.revision <= revision) return; snapshot = value; revision = value.revision; for (const subscriber of [...subscribers]) notify(subscriber, value); }
  function enqueue(value) { if (!valid(value) || value.revision <= revision) return; if (!pending || value.revision > pending.revision) pending = value; if (!scheduled) { scheduled = true; Promise.resolve().then(flush); } }
  function resetStorageGeneration() { pending = null; snapshot = null; revision = -1; }
  broker.subscribe((changes, areaName) => { if (areaName && areaName !== "local") return; const change = changes[snapshotKey]; if (!change) return; generation += 1; if (change.newValue === undefined) { resetStorageGeneration(); return; } enqueue(change.newValue); });
  const ready = (async () => { try { const readGeneration = generation; const result = await broker.get(snapshotKey); if (readGeneration === generation) enqueue(result[snapshotKey]); await Promise.resolve(); } catch (error) { reportError("initial read", error); } return snapshot; })();
  root.runtimeSnapshotService = Object.freeze({
    ready,
    getCurrent: () => snapshot,
    subscribe(listener, { emitCurrent = true } = {}) { if (typeof listener !== "function") throw new TypeError("Snapshot subscriber must be a function"); subscribers.add(listener); if (emitCurrent && snapshot) notify(listener, snapshot); return () => subscribers.delete(listener); },
    waitForRevision(targetRevision, { timeoutMs = 2000 } = {}) {
      const normalized = Number(targetRevision);
      if (!Number.isFinite(normalized)) return Promise.reject(new Error("runtime_revision_invalid"));
      if (snapshot && revision >= normalized) return Promise.resolve(snapshot);
      return new Promise((resolve, reject) => {
        let timerId = null;
        const unsubscribe = this.subscribe((value) => {
          if (value.revision < normalized) return;
          if (timerId !== null) clearTimeout(timerId);
          unsubscribe(); resolve(value);
        }, { emitCurrent: false });
        timerId = setTimeout(() => { unsubscribe(); reject(new Error("runtime_snapshot_delivery_timeout")); }, timeoutMs);
      });
    },
    get revision() { return revision; },
    get subscriberCount() { return subscribers.size; },
  });
})(globalThis);

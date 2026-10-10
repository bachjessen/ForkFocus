/**
 * SocialFocus
* SocialFocus
 * Copyright © 2026 
 */

export function createSnapshotRebuildScheduler({ rebuild, debounceMs = 100, setTimeoutFn = setTimeout, clearTimeoutFn = clearTimeout }) {
  let timerId = null; let drainPromise = null; let pendingReasons = new Set(); let pendingWaiters = [];
  const stats = { requests: 0, rebuilds: 0, coalescedRequests: 0, lastReasons: [] };
  function clearTimer() { if (timerId === null) return; clearTimeoutFn(timerId); timerId = null; }
  function startDrain() {
    clearTimer(); if (drainPromise) return drainPromise;
    drainPromise = (async () => {
      let lastResult;
      while (pendingWaiters.length) {
        const reasons = [...pendingReasons]; const waiters = pendingWaiters;
        pendingReasons = new Set(); pendingWaiters = []; stats.rebuilds += 1;
        stats.coalescedRequests += Math.max(0, waiters.length - 1); stats.lastReasons = reasons;
        try { lastResult = await rebuild({ reasons }); for (const waiter of waiters) waiter.resolve(lastResult); }
        catch (error) { for (const waiter of waiters) waiter.reject(error); }
      }
      return lastResult;
    })().finally(() => { drainPromise = null; });
    return drainPromise;
  }
  function enqueue(reason, immediate) {
    stats.requests += 1; if (reason) pendingReasons.add(reason);
    const promise = new Promise((resolve, reject) => pendingWaiters.push({ resolve, reject }));
    if (immediate) void startDrain();
    else if (!drainPromise) { clearTimer(); timerId = setTimeoutFn(() => { timerId = null; void startDrain(); }, debounceMs); }
    return promise;
  }
  return Object.freeze({
    request: (reason = "storage-change") => enqueue(reason, false),
    flush: (reason = "explicit") => enqueue(reason, true),
    getStats: () => ({ ...stats, lastReasons: [...stats.lastReasons] }),
  });
}

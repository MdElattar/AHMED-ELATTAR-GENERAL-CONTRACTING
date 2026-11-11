"use client";

/**
 * Reference-counted scroll locking.
 *
 * A modal and the mobile navigation can be open at the same time. Releasing
 * either one must not unlock the page while the other is still open, so locks
 * are counted instead of toggled.
 */
let activeLocks = 0;

export function acquireScrollLock(stop: () => void) {
  activeLocks += 1;
  stop();
}

export function releaseScrollLock(start: () => void) {
  activeLocks = Math.max(0, activeLocks - 1);
  if (activeLocks === 0) start();
}

export function resetScrollLocks() {
  activeLocks = 0;
}

"use client";

/**
 * Reference-counted scroll locking.
 *
 * A modal and the mobile navigation can be open at the same time. Releasing
 * either one must not unlock the page while the other is still open, so locks
 * are counted instead of toggled.
 */
let activeLocks = 0;
let originalBodyOverflow = "";
let originalBodyPaddingRight = "";
let originalHtmlOverflow = "";

function lockPage() {
  if (typeof document === "undefined") return;

  originalBodyOverflow = document.body.style.overflow;
  originalBodyPaddingRight = document.body.style.paddingRight;
  originalHtmlOverflow = document.documentElement.style.overflow;

  const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
  document.body.style.overflow = "hidden";
  document.documentElement.style.overflow = "hidden";
  if (scrollbarWidth > 0) {
    document.body.style.paddingRight = `${scrollbarWidth}px`;
  }
  document.body.dataset.scrollLocked = "true";
}

function unlockPage() {
  if (typeof document === "undefined") return;

  document.body.style.overflow = originalBodyOverflow;
  document.body.style.paddingRight = originalBodyPaddingRight;
  document.documentElement.style.overflow = originalHtmlOverflow;
  delete document.body.dataset.scrollLocked;
}

export function acquireScrollLock(stop: () => void) {
  if (activeLocks === 0) lockPage();
  activeLocks += 1;
  stop();
}

export function releaseScrollLock(start: () => void) {
  activeLocks = Math.max(0, activeLocks - 1);
  if (activeLocks === 0) {
    unlockPage();
    start();
  }
}

export function resetScrollLocks() {
  activeLocks = 0;
  unlockPage();
}

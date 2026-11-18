"use client";

import { useSyncExternalStore } from "react";

const QUERY = "(prefers-reduced-motion: reduce)";
const listeners = new Set<() => void>();
let mediaQuery: MediaQueryList | null = null;

function notify() {
  listeners.forEach((listener) => listener());
}

function getMediaQuery(): MediaQueryList | null {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") return null;
  if (!mediaQuery) {
    mediaQuery = window.matchMedia(QUERY);
    mediaQuery.addEventListener("change", notify);
  }
  return mediaQuery;
}

function subscribe(listener: () => void) {
  getMediaQuery();
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function getSnapshot() {
  return getMediaQuery()?.matches ?? false;
}

function getServerSnapshot() {
  return false;
}

/**
 * Single source of truth for the visitor's motion preference.
 *
 * Unlike a one-off `matchMedia(...).matches` check, this subscribes to OS
 * changes so animations, smooth scrolling and the theme cross-fade stop as
 * soon as the preference flips — without a reload.
 */
export function useReducedMotion() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

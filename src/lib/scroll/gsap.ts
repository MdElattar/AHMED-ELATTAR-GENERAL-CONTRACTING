"use client";

type GsapModule = typeof import("gsap");
type ScrollTriggerModule = typeof import("gsap/ScrollTrigger");

export type GsapBundle = {
  gsap: GsapModule["gsap"];
  ScrollTrigger: ScrollTriggerModule["ScrollTrigger"];
};

let bundlePromise: Promise<GsapBundle> | null = null;
let configured = false;

/**
 * Loads GSAP + ScrollTrigger exactly once and registers the plugin a single
 * time. Every pinned section calls this instead of importing GSAP directly,
 * which avoids duplicate registration and keeps the plugin out of the server
 * bundle (the function is only ever called from client effects).
 */
export function loadGsap(): Promise<GsapBundle> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("gsap_unavailable_on_server"));
  }

  if (!bundlePromise) {
    bundlePromise = Promise.all([
      import("gsap"),
      import("gsap/ScrollTrigger"),
    ])
      .then(([gsapModule, triggerModule]) => {
        const gsap = gsapModule.gsap;
        const ScrollTrigger = triggerModule.ScrollTrigger;

        gsap.registerPlugin(ScrollTrigger);

        if (!configured) {
          configured = true;
          // Mobile browser chrome (the collapsing URL bar) fires resize events
          // that make ScrollTrigger re-measure mid-scroll. That is the classic
          // cause of pinned sections jumping or appearing to repeat, so ignore
          // those viewport-only resizes and refresh on real layout changes.
          ScrollTrigger.config({ ignoreMobileResize: true });
        }

        return { gsap, ScrollTrigger };
      })
      .catch((error: unknown) => {
        // Allow a later mount to retry a failed chunk load.
        bundlePromise = null;
        throw error;
      });
  }

  return bundlePromise;
}

let refreshTimer: number | null = null;
let scrollTracking = false;
let lastScrollAt = 0;

function ensureScrollTracking() {
  if (scrollTracking) return;
  scrollTracking = true;
  window.addEventListener(
    "scroll",
    () => {
      lastScrollAt = performance.now();
    },
    { passive: true },
  );
}

/**
 * Debounces ScrollTrigger.refresh(). Three pinned sections mounting together
 * would otherwise force several full-page re-measures in the same tick.
 *
 * A refresh re-measures every pin and can restore the scroll position. If that
 * happens while Lenis is still animating, Lenis keeps pulling toward its own
 * target and the pinned section appears to replay or fight the wheel. So defer
 * the measurement until the page has been quiet for a moment.
 */
export function scheduleScrollRefresh(delay = 120) {
  if (typeof window === "undefined") return;

  ensureScrollTracking();

  if (refreshTimer !== null) window.clearTimeout(refreshTimer);

  const run = () => {
    refreshTimer = null;

    if (performance.now() - lastScrollAt < 180) {
      refreshTimer = window.setTimeout(run, 120);
      return;
    }

    loadGsap()
      .then(({ ScrollTrigger }) => ScrollTrigger.refresh())
      .catch(() => undefined);
  };

  refreshTimer = window.setTimeout(run, delay);
}

/**
 * Kills every trigger owned by the app. Only safe during a full teardown
 * (provider unmount); per-component cleanup must stay scoped so one section
 * cannot destroy another section's pin.
 */
export async function killAllScrollTriggers() {
  if (typeof window === "undefined") return;
  try {
    const { ScrollTrigger } = await loadGsap();
    ScrollTrigger.getAll().forEach((trigger) => trigger.kill());
  } catch {
    // GSAP never loaded; there is nothing to tear down.
  }
}

"use client";

import { useEffect, type MutableRefObject } from "react";
import { usePathname } from "next/navigation";
import Lenis from "lenis";
import {
  killAllScrollTriggers,
  loadGsap,
  scheduleScrollRefresh,
} from "@/lib/scroll/gsap";
import { resetScrollLocks } from "@/lib/scroll/lock";

type SmoothScrollEngineProps = {
  lenisRef: MutableRefObject<Lenis | null>;
  lockedRef: MutableRefObject<boolean>;
};

/**
 * Client-only smooth-scroll engine. This module is loaded through
 * `next/dynamic` with `ssr: false` so Lenis and GSAP never enter the server
 * bundle or the critical client path.
 */
export function SmoothScrollEngine({ lenisRef, lockedRef }: SmoothScrollEngineProps) {
  const pathname = usePathname();

  // Re-measure every trigger after a route transition. Without this, a pin
  // created on one page can keep the measurements of the previous page and
  // overlap the next page's content.
  useEffect(() => {
    let cancelled = false;
    let firstFrame = 0;
    let secondFrame = 0;

    loadGsap()
      .then(() => {
        if (cancelled) return;
        firstFrame = window.requestAnimationFrame(() => {
          secondFrame = window.requestAnimationFrame(() => {
            if (!cancelled) scheduleScrollRefresh(0);
          });
        });
      })
      .catch(() => undefined);

    return () => {
      cancelled = true;
      window.cancelAnimationFrame(firstFrame);
      window.cancelAnimationFrame(secondFrame);
    };
  }, [pathname]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    let disposed = false;
    let teardown: (() => void) | undefined;

    const boot = async () => {
      const { gsap, ScrollTrigger } = await loadGsap();
      if (disposed) return;

      const reducedMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
      ).matches;
      const root = document.documentElement;

      if (reducedMotion) {
        lenisRef.current = null;
        root.style.overflow = lockedRef.current ? "hidden" : "";
        teardown = () => {
          lenisRef.current = null;
          root.style.overflow = "";
          resetScrollLocks();
        };
        scheduleScrollRefresh(400);
        return;
      }

      const lenis = new Lenis({
        lerp: 0.085,
        smoothWheel: true,
        wheelMultiplier: 1,
        touchMultiplier: 1.35,
        anchors: { offset: -96 },
      });

      lenisRef.current = lenis;

      // If a menu locked scrolling before this chunk finished loading, keep
      // the lock. Otherwise clear the fallback lock applied by the provider.
      if (lockedRef.current) {
        lenis.stop();
        root.style.overflow = "hidden";
      } else {
        root.style.overflow = "";
      }

      const onScroll = () => ScrollTrigger.update();
      lenis.on("scroll", onScroll);

      const raf = (time: number) => {
        lenis.raf(time * 1000);
        // Lenis writes the native scroll position inside raf(); update the
        // triggers immediately afterwards so a pin never renders one frame
        // behind the wheel/touch input.
        ScrollTrigger.update();
      };

      gsap.ticker.add(raf);
      gsap.ticker.lagSmoothing(0);

      if (document.fonts?.ready) {
        document.fonts.ready
          .then(() => scheduleScrollRefresh(0))
          .catch(() => undefined);
      }

      scheduleScrollRefresh(700);

      teardown = () => {
        gsap.ticker.remove(raf);
        // Restore GSAP's default lag smoothing so a remount (or any consumer
        // that relies on the ticker) does not inherit our override.
        gsap.ticker.lagSmoothing(500, 33);
        lenis.off("scroll", onScroll);
        lenis.destroy();
        lenisRef.current = null;
        root.style.overflow = "";

        // The engine lives for the lifetime of the app, so this is the only
        // place where killing every trigger is safe. Component-level cleanup
        // stays scoped to its own gsap.context().
        void killAllScrollTriggers();
        resetScrollLocks();
      };
    };

    boot().catch(() => {
      // Native scrolling remains fully functional if GSAP/Lenis fail to load.
    });

    return () => {
      disposed = true;
      teardown?.();
      teardown = undefined;
    };
  }, [lenisRef, lockedRef]);

  return null;
}

"use client";

import { useEffect, type MutableRefObject } from "react";
import Lenis from "lenis";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

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
  useEffect(() => {
    if (typeof window === "undefined") return;

    gsap.registerPlugin(ScrollTrigger);

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const root = document.documentElement;

    if (reducedMotion) {
      lenisRef.current = null;
      root.style.overflow = lockedRef.current ? "hidden" : "";
      return () => {
        lenisRef.current = null;
        root.style.overflow = "";
      };
    }

    const lenis = new Lenis({
      lerp: 0.085,
      smoothWheel: true,
      wheelMultiplier: 1,
      touchMultiplier: 1.35,
      anchors: { offset: -96 },
    });

    lenisRef.current = lenis;

    // If a menu locked scrolling before this chunk finished loading, keep the
    // lock. Otherwise clear the fallback lock applied by the provider.
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
    };

    gsap.ticker.add(raf);
    gsap.ticker.lagSmoothing(0);

    let active = true;
    const refresh = () => {
      if (active) ScrollTrigger.refresh();
    };

    if (document.fonts?.ready) {
      document.fonts.ready.then(refresh).catch(() => undefined);
    }

    const refreshTimer = window.setTimeout(refresh, 700);

    return () => {
      active = false;
      window.clearTimeout(refreshTimer);
      gsap.ticker.remove(raf);
      lenis.off("scroll", onScroll);
      lenis.destroy();
      lenisRef.current = null;
      root.style.overflow = "";
    };
  }, [lenisRef, lockedRef]);

  return null;
}

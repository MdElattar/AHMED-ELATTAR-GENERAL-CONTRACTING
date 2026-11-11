"use client";

import { useEffect, type MutableRefObject } from "react";
import Lenis from "lenis";
import { resetScrollLocks } from "@/lib/scroll/lock";

type SmoothScrollEngineProps = {
  lenisRef: MutableRefObject<Lenis | null>;
  lockedRef: MutableRefObject<boolean>;
};

/**
 * Passive smooth-scroll engine.
 *
 * Lenis only — no GSAP, no ScrollTrigger, no pinning. It smooths native wheel
 * input and then steps out of the way; touch devices keep their native
 * momentum, reduced-motion users get the browser default, and every section
 * remains a normal document flow. The module is loaded through `next/dynamic`
 * with `ssr: false` so it never enters the server bundle.
 */
export function SmoothScrollEngine({ lenisRef, lockedRef }: SmoothScrollEngineProps) {
  useEffect(() => {
    if (typeof window === "undefined") return;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const root = document.documentElement;

    if (reducedMotion) {
      lenisRef.current = null;
      root.style.overflow = lockedRef.current ? "hidden" : "";
      return () => {
        lenisRef.current = null;
        root.style.overflow = "";
        resetScrollLocks();
      };
    }

    const lenis = new Lenis({
      lerp: 0.1,
      smoothWheel: true,
      wheelMultiplier: 1,
      touchMultiplier: 1.2,
      anchors: { offset: -90 },
    });

    lenisRef.current = lenis;

    if (lockedRef.current) {
      lenis.stop();
      root.style.overflow = "hidden";
    } else {
      root.style.overflow = "";
    }

    let frame = 0;
    const raf = (time: number) => {
      lenis.raf(time);
      frame = window.requestAnimationFrame(raf);
    };
    frame = window.requestAnimationFrame(raf);

    return () => {
      window.cancelAnimationFrame(frame);
      lenis.destroy();
      lenisRef.current = null;
      root.style.overflow = "";
      resetScrollLocks();
    };
  }, [lenisRef, lockedRef]);

  return null;
}

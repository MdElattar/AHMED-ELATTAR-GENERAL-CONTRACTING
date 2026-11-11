"use client";

import { useEffect, useRef, type MutableRefObject, type RefObject } from "react";
import { loadGsap, scheduleScrollRefresh } from "@/lib/scroll/gsap";

type PinBounds = {
  start: number;
  end: number;
};

type PinnedScrollOptions = {
  sectionRef: RefObject<HTMLElement | null>;
  progressRef: MutableRefObject<number>;
  fillRef: RefObject<HTMLDivElement | null>;
  stepCount: number;
  end: string;
  onActive?: (index: number) => void;
};

/**
 * Creates a pinned GSAP ScrollTrigger without pulling GSAP into the initial
 * client bundle. GSAP is imported dynamically once the section mounts, so the
 * server render and first paint stay light.
 *
 * Cleanup is deliberately scoped to the context created by this hook. A global
 * `ScrollTrigger.getAll().forEach(kill)` on every mount would destroy the pins
 * owned by the other sections on the same page, which is exactly how sections
 * end up unpinned, stacked, or replayed.
 */
export function usePinnedScroll({
  sectionRef,
  progressRef,
  fillRef,
  stepCount,
  end,
  onActive,
}: PinnedScrollOptions) {
  const triggerRef = useRef<PinBounds | null>(null);
  const stepCountRef = useRef(stepCount);
  const onActiveRef = useRef(onActive);

  useEffect(() => {
    stepCountRef.current = stepCount;
    onActiveRef.current = onActive;
  }, [onActive, stepCount]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    let cancelled = false;
    let cleanup: (() => void) | undefined;

    const boot = async () => {
      const { gsap, ScrollTrigger } = await loadGsap();

      if (cancelled) return;

      const section = sectionRef.current;
      if (!section) return;

      let lastActive = -1;

      const context = gsap.context(() => {
        const trigger = ScrollTrigger.create({
          trigger: section,
          start: "top top",
          end,
          pin: true,
          pinSpacing: true,
          anticipatePin: 1,
          // A fast flick must not leave the pin mid-transition: snap the
          // trigger to its end state instead of interpolating through every
          // step while the page is already past the section.
          fastScrollEnd: true,
          // Keeps this pin from fighting a neighbouring pinned section when
          // their start/end measurements touch after a refresh.
          preventOverlaps: true,
          invalidateOnRefresh: true,
          onRefresh: (self) => {
            triggerRef.current = { start: self.start, end: self.end };

            if (fillRef.current) {
              fillRef.current.style.width = `${self.progress * 100}%`;
            }
          },
          onUpdate: (self) => {
            progressRef.current = self.progress;

            if (fillRef.current) {
              fillRef.current.style.width = `${self.progress * 100}%`;
            }

            const count = Math.max(1, stepCountRef.current);
            const next = Math.max(
              0,
              Math.min(count - 1, Math.floor(self.progress * count)),
            );

            if (next !== lastActive) {
              lastActive = next;
              onActiveRef.current?.(next);
            }
          },
        });

        triggerRef.current = { start: trigger.start, end: trigger.end };

        cleanup = () => {
          // Reset shared state so a remount starts from a clean slate instead
          // of inheriting the previous pin's progress.
          progressRef.current = 0;
          if (fillRef.current) fillRef.current.style.width = "0%";
          triggerRef.current = null;

          trigger.kill();
          context.revert();
        };
      }, section);

      // Fonts and the WebGL canvases settle after the first paint; re-measure
      // once so the pin distance matches the final layout. The scheduler is
      // shared so several pinned sections coalesce into one refresh.
      scheduleScrollRefresh(400);
    };

    boot().catch(() => {
      // The experience remains usable with native scrolling if GSAP fails to
      // load (slow network, blocked chunk, reduced-motion fallback, etc.).
    });

    return () => {
      cancelled = true;
      cleanup?.();
      cleanup = undefined;
    };
  }, [end, fillRef, progressRef, sectionRef]);

  return triggerRef;
}

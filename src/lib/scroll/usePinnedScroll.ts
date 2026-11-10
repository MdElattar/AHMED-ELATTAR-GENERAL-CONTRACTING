"use client";

import { useEffect, useRef, type MutableRefObject, type RefObject } from "react";

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
    let cancelled = false;
    let cleanup: (() => void) | undefined;

    const boot = async () => {
      const [{ gsap }, { ScrollTrigger }] = await Promise.all([
        import("gsap"),
        import("gsap/ScrollTrigger"),
      ]);

      if (cancelled) return;

      gsap.registerPlugin(ScrollTrigger);

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
          invalidateOnRefresh: true,
          onRefresh: (self) => {
            triggerRef.current = { start: self.start, end: self.end };
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
      }, section);

      const refreshTimer = window.setTimeout(() => ScrollTrigger.refresh(), 400);

      cleanup = () => {
        window.clearTimeout(refreshTimer);
        triggerRef.current = null;
        context.revert();
      };
    };

    boot().catch(() => {
      // The experience remains usable with native scrolling if GSAP fails to
      // load (slow network, blocked chunk, reduced-motion fallback, etc.).
    });

    return () => {
      cancelled = true;
      cleanup?.();
    };
  }, [end, fillRef, progressRef, sectionRef]);

  return triggerRef;
}

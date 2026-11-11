"use client";

import { useEffect, useRef, type MutableRefObject, type RefObject } from "react";
import { loadGsap, scheduleScrollRefresh, type GsapBundle } from "@/lib/scroll/gsap";

type ScrollTriggerInstance = InstanceType<GsapBundle["ScrollTrigger"]>;

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
  /**
   * Smoothed scrub time, in seconds. A real tween is scrubbed by the trigger
   * so the progress consumed by the 3D scenes, the DOM fills, and the step
   * index all share one inertial value instead of jumping with raw scroll.
   */
  scrub?: number;
  onActive?: (index: number) => void;
  /** Imperative per-frame progress sink (timeline rails, counters, etc.). */
  onProgress?: (progress: number) => void;
};

/**
 * Creates a pinned, scrubbed GSAP sequence without pulling GSAP into the
 * initial client bundle. GSAP is imported dynamically once the section mounts,
 * so the server render and first paint stay light.
 *
 * The pin is attached to a tween (`{ value: 0 } → 1`) rather than a bare
 * ScrollTrigger. With `scrub`, the tween becomes the single source of truth:
 * its smoothed `onUpdate` writes the progress ref, the bottom fill, and the
 * timeline rail, while the discrete step index is derived from the same value.
 * That keeps the 3D scenes, the progress bar, and the cards perfectly in sync.
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
  scrub = 0.5,
  onActive,
  onProgress,
}: PinnedScrollOptions) {
  const triggerRef = useRef<PinBounds | null>(null);
  const stepCountRef = useRef(stepCount);
  const onActiveRef = useRef(onActive);
  const onProgressRef = useRef(onProgress);

  useEffect(() => {
    stepCountRef.current = stepCount;
    onActiveRef.current = onActive;
    onProgressRef.current = onProgress;
  }, [onActive, onProgress, stepCount]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    let cancelled = false;
    let cleanup: (() => void) | undefined;

    const boot = async () => {
      const { gsap } = await loadGsap();

      if (cancelled) return;

      const section = sectionRef.current;
      if (!section) return;

      let lastActive = -1;
      let trigger: ScrollTriggerInstance | null = null;

      const applyProgress = (value: number) => {
        const progress = Math.max(0, Math.min(1, value));

        progressRef.current = progress;

        if (fillRef.current) {
          fillRef.current.style.width = `${progress * 100}%`;
        }

        onProgressRef.current?.(progress);

        const count = Math.max(1, stepCountRef.current);
        const next = Math.max(
          0,
          Math.min(count - 1, Math.floor(progress * count)),
        );

        if (next !== lastActive) {
          lastActive = next;
          onActiveRef.current?.(next);
        }
      };

      const context = gsap.context(() => {
        // The tween target is intentionally tiny: GSAP only animates a scalar,
        // and every consumer reads that scalar imperatively. React never
        // re-renders on scroll.
        const proxy = { value: 0 };

        const tween = gsap.to(proxy, {
          value: 1,
          ease: "none",
          scrollTrigger: {
            trigger: section,
            start: "top top",
            end,
            // Inertial scrub: the section follows the gesture with a 0.5s
            // settle instead of snapping to the raw scroll position.
            scrub,
            pin: true,
            pinSpacing: true,
            anticipatePin: 1,
            // A fast flick must not leave the pin mid-transition: jump to the
            // end state instead of interpolating through every step while the
            // page is already past the section.
            fastScrollEnd: true,
            // Keeps this pin from fighting a neighbouring pinned section when
            // their start/end measurements touch after a refresh.
            preventOverlaps: true,
            invalidateOnRefresh: true,
            onRefresh: (self) => {
              triggerRef.current = { start: self.start, end: self.end };

              // Seed the smoothed value when the page loads mid-pin (deep
              // link, refresh, route restore) so the first frame is correct.
              proxy.value = self.progress;
              applyProgress(proxy.value);
            },
            onUpdate: (self) => {
              triggerRef.current = { start: self.start, end: self.end };
            },
          },
          onUpdate: () => applyProgress(proxy.value),
        });

        trigger =
          (tween as typeof tween & { scrollTrigger?: ScrollTriggerInstance })
            .scrollTrigger ?? null;

        if (trigger) {
          triggerRef.current = { start: trigger.start, end: trigger.end };
        }

        cleanup = () => {
          // Reset shared state so a remount starts from a clean slate instead
          // of inheriting the previous pin's progress.
          progressRef.current = 0;
          if (fillRef.current) fillRef.current.style.width = "0%";
          onProgressRef.current?.(0);
          triggerRef.current = null;

          trigger?.kill();
          tween.kill();
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
  }, [end, fillRef, progressRef, scrub, sectionRef]);

  return triggerRef;
}

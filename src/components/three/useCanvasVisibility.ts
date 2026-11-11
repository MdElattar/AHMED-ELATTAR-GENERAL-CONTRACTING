"use client";

import { useEffect, useState, type RefObject } from "react";

/**
 * Pauses a WebGL canvas while it is outside the viewport. Both the hero and
 * the pinned crane section mount a renderer, and only one of them needs to
 * burn GPU time at a time.
 *
 * A `ResizeObserver` is layered on top of the intersection check because a
 * route cache (or a modal) can hide the section with `display: none` without
 * unmounting it. In that case the element's box collapses to zero and the
 * renderer is paused even if the intersection observer never fires again.
 */
export function useCanvasVisibility(ref: RefObject<HTMLElement | null>) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    let intersection: IntersectionObserver | null = null;
    let resize: ResizeObserver | null = null;

    // Older browsers (and some embedded webviews) have no
    // IntersectionObserver. Keep the canvas rendering rather than hiding it.
    if (typeof IntersectionObserver !== "undefined") {
      intersection = new IntersectionObserver(
        ([entry]) => setVisible(entry.isIntersecting),
        { rootMargin: "240px 0px" },
      );
      intersection.observe(element);
    }

    if (typeof ResizeObserver !== "undefined") {
      resize = new ResizeObserver(([entry]) => {
        if (entry.contentRect.width === 0 || entry.contentRect.height === 0) {
          setVisible(false);
        }
      });
      resize.observe(element);
    }

    return () => {
      intersection?.disconnect();
      resize?.disconnect();
    };
  }, [ref]);

  return visible;
}

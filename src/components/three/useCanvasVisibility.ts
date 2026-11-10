"use client";

import { useEffect, useState, type RefObject } from "react";

/**
 * Pauses a WebGL canvas while it is outside the viewport. Both the hero and
 * the pinned crane section mount a renderer, and only one of them needs to
 * burn GPU time at a time.
 */
export function useCanvasVisibility(ref: RefObject<HTMLElement | null>) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => setVisible(entry.isIntersecting),
      { rootMargin: "240px 0px" },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, [ref]);

  return visible;
}

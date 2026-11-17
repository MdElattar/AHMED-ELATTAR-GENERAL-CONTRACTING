"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Tracks the rendered width of an element with a ResizeObserver.
 *
 * Admin tables must respond to the space they actually get (collapsing the
 * sidebar, opening a drawer, browser zoom) rather than the viewport width.
 */
export function useContainerWidth<T extends HTMLElement = HTMLDivElement>() {
  const ref = useRef<T | null>(null);
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const measure = (next?: number) => {
      const value = next ?? element.getBoundingClientRect().width;
      setWidth((current) => (Math.abs(current - value) < 0.5 ? current : value));
    };

    measure();

    if (typeof ResizeObserver === "undefined") {
      const onResize = () => measure();
      window.addEventListener("resize", onResize);
      return () => window.removeEventListener("resize", onResize);
    }

    const observer = new ResizeObserver((entries) => {
      measure(entries[0]?.contentRect.width);
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return [ref, width] as const;
}

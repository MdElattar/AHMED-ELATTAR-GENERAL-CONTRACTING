"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";

const useIsomorphicLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

/**
 * Tracks the rendered width of an element with a ResizeObserver.
 *
 * Admin tables must respond to the space they actually get (collapsing the
 * sidebar, opening a drawer, browser zoom) rather than the viewport width.
 *
 * The callback ref is intentional: some measured surfaces (the bulk action
 * bar) mount conditionally, and a plain object ref would leave the observer
 * attached to `null` forever.
 */
export function useContainerWidth<T extends HTMLElement = HTMLDivElement>() {
  const [node, setNode] = useState<T | null>(null);
  const [width, setWidth] = useState(0);
  const observerRef = useRef<ResizeObserver | null>(null);
  const ref = useCallback((next: T | null) => setNode(next), []);

  useIsomorphicLayoutEffect(() => {
    if (!node) {
      setWidth(0);
      return;
    }

    const measure = () => {
      const value = node.getBoundingClientRect().width;
      setWidth((current) => (Math.abs(current - value) < 0.5 ? current : value));
    };

    measure();

    if (typeof ResizeObserver === "undefined") {
      const onResize = () => measure();
      window.addEventListener("resize", onResize);
      return () => window.removeEventListener("resize", onResize);
    }

    const observer = new ResizeObserver(() => measure());
    observer.observe(node);
    observerRef.current = observer;

    return () => {
      observer.disconnect();
      if (observerRef.current === observer) observerRef.current = null;
    };
  }, [node]);

  return [ref, width] as const;
}

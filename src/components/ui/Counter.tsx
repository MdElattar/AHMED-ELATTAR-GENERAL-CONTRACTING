"use client";

import { useEffect, useRef, useState } from "react";
import { formatNumber } from "@/lib/utils";

type CounterProps = {
  value: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  duration?: number;
  className?: string;
};

/** Commit at ~20fps instead of every animation frame. */
const COMMIT_INTERVAL = 50;

export function Counter({
  value,
  decimals = 0,
  prefix = "",
  suffix = "",
  duration = 1800,
  className,
}: CounterProps) {
  const ref = useRef<HTMLSpanElement | null>(null);
  const [display, setDisplay] = useState(0);
  const started = useRef(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    if (typeof window === "undefined") return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      // Reduced motion is only knowable after mount.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setDisplay(value);
      return;
    }

    if (typeof IntersectionObserver === "undefined") {
      setDisplay(value);
      return;
    }

    let frame = 0;
    let startTime = 0;
    let lastCommit = 0;
    started.current = false;

    const tick = (now: number) => {
      if (!startTime) startTime = now;
      const progress = Math.min((now - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 4);

      if (progress >= 1 || now - lastCommit >= COMMIT_INTERVAL) {
        lastCommit = now;
        setDisplay(progress >= 1 ? value : value * eased);
      }

      if (progress < 1) frame = requestAnimationFrame(tick);
    };

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !started.current) {
            started.current = true;
            frame = requestAnimationFrame(tick);
            observer.unobserve(node);
          }
        });
      },
      { threshold: 0.5 },
    );

    observer.observe(node);

    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
    };
  }, [duration, value]);

  return (
    <span ref={ref} className={className} dir="ltr">
      {prefix}
      {formatNumber(display, decimals)}
      {suffix}
    </span>
  );
}

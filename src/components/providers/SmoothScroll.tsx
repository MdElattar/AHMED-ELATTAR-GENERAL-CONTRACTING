"use client";

import {
  createContext,
  useContext,
  useMemo,
  useRef,
  type ReactNode,
} from "react";
import dynamic from "next/dynamic";
import type Lenis from "lenis";

const SmoothScrollEngine = dynamic(
  () => import("./SmoothScrollEngine").then((module) => module.SmoothScrollEngine),
  { ssr: false },
);

type SmoothScrollContextValue = {
  scrollTo: (target: string | number | HTMLElement, offset?: number) => void;
  stop: () => void;
  start: () => void;
};

const SmoothScrollContext = createContext<SmoothScrollContextValue | null>(null);

export function SmoothScrollProvider({ children }: { children: ReactNode }) {
  const lenisRef = useRef<Lenis | null>(null);
  const lockedRef = useRef(false);

  const value = useMemo<SmoothScrollContextValue>(
    () => ({
      scrollTo: (target, offset = 0) => {
        if (typeof window === "undefined") return;

        if (lenisRef.current) {
          lenisRef.current.scrollTo(target, { offset, duration: 1.35 });
          return;
        }

        if (typeof target === "number") {
          window.scrollTo({ top: target, behavior: "smooth" });
          return;
        }

        let element: Element | null = null;

        if (typeof target === "string") {
          try {
            element = document.querySelector(target);
          } catch {
            element = null;
          }
        } else {
          element = target;
        }

        if (element instanceof HTMLElement) {
          const top = element.getBoundingClientRect().top + window.scrollY + offset;
          window.scrollTo({ top, behavior: "smooth" });
        }
      },
      stop: () => {
        if (typeof document === "undefined") return;

        lockedRef.current = true;

        if (lenisRef.current) {
          lenisRef.current.stop();
        } else {
          document.documentElement.style.overflow = "hidden";
        }
      },
      start: () => {
        if (typeof document === "undefined") return;

        lockedRef.current = false;

        if (lenisRef.current) {
          lenisRef.current.start();
          document.documentElement.style.overflow = "";
        } else {
          document.documentElement.style.overflow = "";
        }
      },
    }),
    [],
  );

  return (
    <SmoothScrollContext.Provider value={value}>
      <SmoothScrollEngine lenisRef={lenisRef} lockedRef={lockedRef} />
      {children}
    </SmoothScrollContext.Provider>
  );
}

export function useSmoothScroll() {
  const context = useContext(SmoothScrollContext);
  if (!context) {
    throw new Error("useSmoothScroll must be used within a SmoothScrollProvider");
  }
  return context;
}

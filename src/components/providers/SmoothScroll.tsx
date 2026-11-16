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
);

type SmoothScrollContextValue = {
  scrollTo: (target: string | number | HTMLElement, offset?: number) => void;
  scrollToTop: (immediate?: boolean) => void;
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
      scrollToTop: (immediate = false) => {
        if (typeof window === "undefined") return;

        if (lenisRef.current) {
          lenisRef.current.scrollTo(0, {
            immediate,
            force: true,
            duration: immediate ? 0 : 0.95,
          });
          return;
        }

        window.scrollTo({
          top: 0,
          left: 0,
          behavior: immediate ? "auto" : "smooth",
        });
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

const noopSmoothScroll: SmoothScrollContextValue = {
  scrollTo: () => {},
  scrollToTop: () => {},
  stop: () => {},
  start: () => {},
};

/**
 * Public chrome mounts the Lenis engine. The admin shell deliberately does
 * not, because it owns fixed, nested scroll containers. Admin overlays still
 * call this hook, so outside the provider it resolves to a harmless no-op
 * instead of throwing.
 */
export function useSmoothScroll() {
  return useContext(SmoothScrollContext) ?? noopSmoothScroll;
}

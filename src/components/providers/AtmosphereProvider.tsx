"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type Vibe = "golden" | "blue" | "studio";

export const VIBES: readonly Vibe[] = ["golden", "blue", "studio"];

type AtmosphereContextValue = {
  vibe: Vibe;
  setVibe: (vibe: Vibe) => void;
  cycleVibe: () => void;
};

const AtmosphereContext = createContext<AtmosphereContextValue | null>(null);

const STORAGE_KEY = "alattar-atmosphere";

function isVibe(value: unknown): value is Vibe {
  return value === "golden" || value === "blue" || value === "studio";
}

function readVibe(): Vibe {
  if (typeof window === "undefined") return "golden";

  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (isVibe(stored)) return stored;
  } catch {
    // Storage can be unavailable in private mode.
  }

  // The inline bootstrap script in the root layout has already applied the
  // stored value before paint; mirror it so the first React render matches.
  const attribute = document.documentElement.dataset.vibe;
  return isVibe(attribute) ? attribute : "golden";
}

/**
 * Global architectural-lighting atmosphere.
 *
 * The provider does two jobs:
 * 1. Persists the visitor's grade (golden hour / blue hour / studio) and
 *    mirrors it to `<html data-vibe>`, where the CSS token overrides live.
 * 2. Publishes the pointer position as two root CSS variables. The cinematic
 *    glow layers and the card spotlights consume those variables, so the
 *    light follows the cursor without React re-rendering on every movement.
 */
export function AtmosphereProvider({ children }: { children: ReactNode }) {
  const [vibe, setVibeState] = useState<Vibe>("golden");

  useEffect(() => {
    // The bootstrap script already set the attribute; sync React to it.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setVibeState(readVibe());
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    root.dataset.vibe = vibe;

    try {
      window.localStorage.setItem(STORAGE_KEY, vibe);
    } catch {
      // Ignore storage failures.
    }
  }, [vibe]);

  useEffect(() => {
    let frame = 0;

    const onPointerMove = (event: PointerEvent) => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const root = document.documentElement;
        root.style.setProperty(
          "--pointer-x",
          `${(event.clientX / Math.max(1, window.innerWidth)) * 100}%`,
        );
        root.style.setProperty(
          "--pointer-y",
          `${(event.clientY / Math.max(1, window.innerHeight)) * 100}%`,
        );
      });
    };

    window.addEventListener("pointermove", onPointerMove, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("pointermove", onPointerMove);
    };
  }, []);

  const setVibe = useCallback((next: Vibe) => setVibeState(next), []);

  const cycleVibe = useCallback(() => {
    setVibeState(
      (current) => VIBES[(VIBES.indexOf(current) + 1) % VIBES.length],
    );
  }, []);

  const value = useMemo<AtmosphereContextValue>(
    () => ({ vibe, setVibe, cycleVibe }),
    [cycleVibe, setVibe, vibe],
  );

  return <AtmosphereContext.Provider value={value}>{children}</AtmosphereContext.Provider>;
}

export function useAtmosphere() {
  const context = useContext(AtmosphereContext);
  if (!context) {
    throw new Error("useAtmosphere must be used within an AtmosphereProvider");
  }
  return context;
}

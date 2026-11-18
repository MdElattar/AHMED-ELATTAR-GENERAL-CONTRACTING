"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

export type Theme = "system" | "light" | "dark";
export type ResolvedTheme = "light" | "dark";

type ThemeContextValue = {
  theme: Theme;
  resolvedTheme: ResolvedTheme;
  setTheme: (theme: Theme) => void;
  cycleTheme: () => void;
};

const THEME_CONTEXT = createContext<ThemeContextValue | null>(null);

export const THEME_STORAGE_KEY = "alattar-theme";
const THEME_ORDER: readonly Theme[] = ["system", "light", "dark"];
const TRANSITION_MS = 200;

function isTheme(value: unknown): value is Theme {
  return value === "system" || value === "light" || value === "dark";
}

/** The inline bootstrap already applied the resolved palette before paint. */
function readInitialTheme(): Theme {
  if (typeof window === "undefined") return "system";
  const preloaded = document.documentElement.dataset.themePreference;
  if (isTheme(preloaded)) return preloaded;
  try {
    const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
    if (isTheme(stored)) return stored;
  } catch {
    // Storage can be unavailable in private mode.
  }
  return "system";
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("system");
  const [systemDark, setSystemDark] = useState(false);
  const [ready, setReady] = useState(false);
  const transitionTimer = useRef<number | null>(null);

  useEffect(() => {
    // Sync React with the pre-paint bootstrap and keep an eye on OS changes.
    // Marking ready only after the stored preference has been read prevents the
    // provider from briefly writing a light palette over a dark bootstrap (and
    // vice versa), which otherwise animates through mixed fg/bg colors.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setThemeState(readInitialTheme());
    if (!window.matchMedia) {
      setReady(true);
      return;
    }

    const query = window.matchMedia("(prefers-color-scheme: dark)");
    setSystemDark(query.matches);
    const onChange = (event: MediaQueryListEvent) => setSystemDark(event.matches);
    query.addEventListener("change", onChange);
    setReady(true);
    return () => query.removeEventListener("change", onChange);
  }, []);

  const resolvedTheme: ResolvedTheme =
    theme === "system" ? (systemDark ? "dark" : "light") : theme;

  useEffect(() => {
    if (!ready) return;
    const root = document.documentElement;
    root.dataset.theme = resolvedTheme;
    root.style.colorScheme = resolvedTheme;
    root.dataset.themePreference = theme;
    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch {
      // Ignore storage failures.
    }
  }, [ready, resolvedTheme, theme]);

  useEffect(
    () => () => {
      if (transitionTimer.current !== null) {
        window.clearTimeout(transitionTimer.current);
      }
    },
    [],
  );

  const queueThemeChange = useCallback((next: Theme | ((current: Theme) => Theme)) => {
    const root = document.documentElement;
    const reduceMotion =
      typeof window !== "undefined" &&
      window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (!reduceMotion) {
      root.classList.add("theme-transition");
      if (transitionTimer.current !== null) {
        window.clearTimeout(transitionTimer.current);
      }
      transitionTimer.current = window.setTimeout(() => {
        root.classList.remove("theme-transition");
        transitionTimer.current = null;
      }, TRANSITION_MS);
    }

    setThemeState(next);
  }, []);

  const setTheme = useCallback(
    (next: Theme) => queueThemeChange(next),
    [queueThemeChange],
  );

  const cycleTheme = useCallback(
    () =>
      queueThemeChange(
        (current) => THEME_ORDER[(THEME_ORDER.indexOf(current) + 1) % THEME_ORDER.length],
      ),
    [queueThemeChange],
  );

  const value = useMemo<ThemeContextValue>(
    () => ({ theme, resolvedTheme, setTheme, cycleTheme }),
    [cycleTheme, resolvedTheme, setTheme, theme],
  );

  return <THEME_CONTEXT.Provider value={value}>{children}</THEME_CONTEXT.Provider>;
}

export function useTheme(): ThemeContextValue {
  const context = useContext(THEME_CONTEXT);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}

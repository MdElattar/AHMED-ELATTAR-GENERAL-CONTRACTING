"use client";

import { usePathname } from "next/navigation";
import { useReducedMotion } from "@/hooks/useReducedMotion";
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

/** The public shell is always dark; only the Admin Panel can opt into light. */
export type Theme = "dark" | "light";
export type ResolvedTheme = "dark" | "light";

type ThemeContextValue = {
  theme: Theme;
  resolvedTheme: ResolvedTheme;
  setTheme: (theme: Theme) => void;
  cycleTheme: () => void;
};

const THEME_CONTEXT = createContext<ThemeContextValue | null>(null);

export const THEME_STORAGE_KEY = "alattar-theme";
const TRANSITION_MS = 200;

function isAdminPath(pathname: string) {
  return pathname === "/admin" || pathname.startsWith("/admin/");
}

function persistTheme(theme: Theme) {
  try {
    window.localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    // Storage can be unavailable in private mode.
  }
  try {
    document.cookie = `${THEME_STORAGE_KEY}=${theme}; path=/; max-age=31536000; SameSite=Lax`;
  } catch {
    // Cookie writes are best-effort; the inline bootstrap still applies the DOM.
  }
}

export function ThemeProvider({
  children,
  initialTheme = "dark",
}: {
  children: ReactNode;
  /** Read from the cookie on the server so client markup matches first paint. */
  initialTheme?: Theme;
}) {
  const pathname = usePathname();
  const reducedMotion = useReducedMotion();
  const [theme, setThemeState] = useState<Theme>(initialTheme);
  const applied = useRef(false);
  const firstRender = useRef(true);
  const admin = isAdminPath(pathname);

  const setTheme = useCallback((next: Theme) => setThemeState(next), []);
  const cycleTheme = useCallback(
    () => setThemeState((current) => (current === "dark" ? "light" : "dark")),
    [],
  );

  // The inline bootstrap already resolved the palette before paint. Scope the
  // preference to /admin and clean it up when the visitor returns to the site.
  useEffect(() => {
    const root = document.documentElement;
    root.dataset.theme = "dark";
    root.dataset.themePreference = theme;
    if (admin) {
      root.dataset.adminTheme = theme;
      root.style.colorScheme = theme;
    } else {
      root.removeAttribute("data-admin-theme");
      root.style.colorScheme = "dark";
    }
    if (applied.current) persistTheme(theme);
    applied.current = true;
  }, [admin, theme]);

  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    if (reducedMotion) return;
    const root = document.documentElement;
    root.classList.add("theme-transition");
    const timer = window.setTimeout(
      () => root.classList.remove("theme-transition"),
      TRANSITION_MS,
    );
    return () => {
      window.clearTimeout(timer);
      root.classList.remove("theme-transition");
    };
  }, [theme, reducedMotion]);

  const value = useMemo<ThemeContextValue>(
    () => ({ theme, resolvedTheme: theme, setTheme, cycleTheme }),
    [cycleTheme, setTheme, theme],
  );

  return <THEME_CONTEXT.Provider value={value}>{children}</THEME_CONTEXT.Provider>;
}

export function useTheme() {
  const context = useContext(THEME_CONTEXT);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}

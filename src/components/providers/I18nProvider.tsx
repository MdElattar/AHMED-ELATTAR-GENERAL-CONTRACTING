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
import {
  dictionary,
  dirFor,
  pick,
  type Dictionary,
  type Locale,
  type Localized,
} from "@/lib/dictionary";
import { applyCopyOverrides } from "@/lib/cms";
import { useWorkspace } from "@/components/providers/WorkspaceProvider";

type I18nContextValue = {
  locale: Locale;
  dir: "rtl" | "ltr";
  isRTL: boolean;
  ready: boolean;
  t: Dictionary;
  setLocale: (locale: Locale) => void;
  toggleLocale: () => void;
  l: (value: Localized) => string;
};

const I18nContext = createContext<I18nContextValue | null>(null);

const STORAGE_KEY = "alattar-locale";
const COOKIE_KEY = "alattar-locale";

function writeLocale(locale: Locale) {
  try {
    window.localStorage.setItem(STORAGE_KEY, locale);
  } catch {
    // Ignore storage failures.
  }
  try {
    document.cookie = `${COOKIE_KEY}=${locale}; path=/; max-age=31536000; SameSite=Lax`;
  } catch {
    // Ignore cookie failures.
  }
}

export function I18nProvider({
  children,
  initialLocale = "ar",
}: {
  children: ReactNode;
  /** Resolved on the server from the locale cookie, so the first paint matches. */
  initialLocale?: Locale;
}) {
  const { content } = useWorkspace();
  const [locale, setLocaleState] = useState<Locale>(initialLocale);
  const mounted = useRef(false);
  const ready = true;

  useEffect(() => {
    // The server rendered this locale and the inline script applied dir/lang
    // before paint. Keep the DOM attributes aligned on client navigations.
    const dir = dirFor(locale);
    const root = document.documentElement;
    root.lang = locale;
    root.dir = dir;
    root.dataset.locale = locale;

    if (!mounted.current) {
      mounted.current = true;
      // A stored preference without a cookie is the only case the server could
      // not know about. Adopt it once; the next refresh is server-rendered.
      let stored: string | null = null;
      try {
        stored = window.localStorage.getItem(STORAGE_KEY);
      } catch {
        // Storage may be unavailable.
      }
      if ((stored === "ar" || stored === "en") && stored !== locale) {
        setLocaleState(stored);
        return;
      }
      return;
    }
    writeLocale(locale);

    // Keep shareable ?lang= links in sync when the visitor toggles locale.
    try {
      const params = new URLSearchParams(window.location.search);
      if (params.has("lang") && params.get("lang") !== locale) {
        params.set("lang", locale);
        const search = params.toString();
        window.history.replaceState(
          window.history.state,
          "",
          `${window.location.pathname}${search ? `?${search}` : ""}${window.location.hash}`,
        );
      }
    } catch {
      // Ignore history failures.
    }
  }, [locale]);

  const setLocale = useCallback((next: Locale) => setLocaleState(next), []);
  const toggleLocale = useCallback(
    () => setLocaleState((current) => (current === "ar" ? "en" : "ar")),
    [],
  );

  const heroOverrides = useMemo(
    () => ({
      "hero.eyebrow": content.heroEyebrow,
      "hero.titleTop": content.heroTitleTop,
      "hero.titleAccent": content.heroTitleAccent,
      "hero.description": content.heroDescription,
    }),
    [
      content.heroDescription,
      content.heroEyebrow,
      content.heroTitleAccent,
      content.heroTitleTop,
    ],
  );

  const mergedOverrides = useMemo(
    () => ({ ...heroOverrides, ...content.copyOverrides }),
    [content.copyOverrides, heroOverrides],
  );

  const value = useMemo<I18nContextValue>(
    () => ({
      locale,
      dir: dirFor(locale),
      isRTL: locale === "ar",
      ready,
      t: applyCopyOverrides(dictionary[locale], mergedOverrides, locale),
      setLocale,
      toggleLocale,
      l: (localized: Localized) => pick(localized, locale),
    }),
    [locale, mergedOverrides, ready, setLocale, toggleLocale],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error("useI18n must be used within an I18nProvider");
  }
  return context;
}

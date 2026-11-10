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
import {
  dictionary,
  dirFor,
  pick,
  type Dictionary,
  type Locale,
  type Localized,
} from "@/lib/dictionary";

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

function readCookieLocale(): Locale | null {
  try {
    const match = document.cookie
      .split("; ")
      .find((row) => row.startsWith(`${COOKIE_KEY}=`));
    const value = match?.split("=")[1];
    return value === "ar" || value === "en" ? value : null;
  } catch {
    return null;
  }
}

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

function readInitialLocale(): Locale {
  if (typeof window === "undefined") return "ar";
  try {
    const query = new URLSearchParams(window.location.search).get("lang");
    if (query === "ar" || query === "en") {
      writeLocale(query);
      return query;
    }
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored === "ar" || stored === "en") return stored;
    const cookie = readCookieLocale();
    if (cookie) return cookie;
    const preloaded = document.documentElement.dataset.locale;
    if (preloaded === "ar" || preloaded === "en") return preloaded;
  } catch {
    // Storage can be unavailable in private mode.
  }
  return readCookieLocale() ?? "ar";
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("ar");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // The inline script in the root layout has already applied the stored
    // locale to <html> before paint. Sync React to the same value.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLocaleState(readInitialLocale());
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    const dir = dirFor(locale);
    const root = document.documentElement;
    root.lang = locale;
    root.dir = dir;
    root.dataset.locale = locale;
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
  }, [locale, ready]);

  const setLocale = useCallback((next: Locale) => setLocaleState(next), []);
  const toggleLocale = useCallback(
    () => setLocaleState((current) => (current === "ar" ? "en" : "ar")),
    [],
  );

  const value = useMemo<I18nContextValue>(
    () => ({
      locale,
      dir: dirFor(locale),
      isRTL: locale === "ar",
      ready,
      t: dictionary[locale],
      setLocale,
      toggleLocale,
      l: (localized: Localized) => pick(localized, locale),
    }),
    [locale, ready, setLocale, toggleLocale],
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

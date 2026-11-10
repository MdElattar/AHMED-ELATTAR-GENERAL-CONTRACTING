"use client";

import { useEffect, useState } from "react";
import { useI18n } from "@/components/providers/I18nProvider";
import { dictionary } from "@/lib/dictionary";
import { Logo } from "@/components/ui/Logo";
import { cn } from "@/lib/utils";

const STORAGE_KEY = "alattar-intro-seen";

type Phase = "loading" | "leaving" | "gone";

export function Preloader() {
  const { t, ready } = useI18n();
  const [phase, setPhase] = useState<Phase>("loading");
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!ready) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let seen = false;
    try {
      seen = window.sessionStorage.getItem(STORAGE_KEY) === "1";
    } catch {
      seen = false;
    }

    if (reduced || seen) {
      // Hydration-safe: sessionStorage is only readable after mount.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setPhase("gone");
      return;
    }

    const start = performance.now();
    const duration = 1500;

    // Interval rather than rAF so the intro still completes when the tab is
    // backgrounded and requestAnimationFrame is paused by the browser.
    const timer = window.setInterval(() => {
      const value = Math.min((performance.now() - start) / duration, 1);
      setProgress(Math.round(value * 100));
      if (value < 1) return;

      window.clearInterval(timer);
      try {
        window.sessionStorage.setItem(STORAGE_KEY, "1");
      } catch {
        // Ignore storage failures.
      }
      window.setTimeout(() => setPhase("leaving"), 220);
    }, 60);

    return () => window.clearInterval(timer);
  }, [ready]);

  useEffect(() => {
    if (phase !== "leaving") return;
    const timer = window.setTimeout(() => setPhase("gone"), 900);
    return () => window.clearTimeout(timer);
  }, [phase]);

  if (phase === "gone") return null;

  return (
    <div
      className={cn(
        "fixed inset-0 z-[200] flex flex-col items-center justify-center bg-obsidian transition-transform duration-[850ms] ease-[cubic-bezier(0.76,0,0.24,1)]",
        phase === "leaving" && "-translate-y-full",
      )}
      aria-hidden="true"
    >
      <div className="blueprint-grid pointer-events-none absolute inset-0 opacity-40" />
      <div className="relative flex flex-col items-center">
        <div className="i18n-ar">
          <Logo locale="ar" />
        </div>
        <div className="i18n-en">
          <Logo locale="en" />
        </div>
        <div className="mt-10 h-px w-[180px] overflow-hidden bg-white/10">
          <div
            className="h-full origin-left bg-gold transition-[width] duration-100 ease-linear"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="mt-4 flex w-[180px] items-center justify-between text-[0.58rem] uppercase tracking-[0.24em] text-ivory/35">
          {ready ? (
            <span>{t.common.loading}</span>
          ) : (
            <>
              <span className="i18n-ar">{dictionary.ar.common.loading}</span>
              <span className="i18n-en">{dictionary.en.common.loading}</span>
            </>
          )}
          <span className="tabular text-gold">{String(progress).padStart(3, "0")}</span>
        </div>
      </div>
    </div>
  );
}

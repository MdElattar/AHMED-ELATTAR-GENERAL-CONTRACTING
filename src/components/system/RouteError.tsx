"use client";

import { useEffect } from "react";
import Link from "next/link";
import { ArrowUpRight, RotateCcw } from "lucide-react";
import { useI18n } from "@/components/providers/I18nProvider";
import { cn } from "@/lib/utils";

export function RouteError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const { t, locale, isRTL } = useI18n();

  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <section className="relative flex min-h-[100svh] items-center overflow-hidden bg-obsidian pt-24">
      <div className="blueprint-grid pointer-events-none absolute inset-0 opacity-40" />
      <div className="pointer-events-none absolute start-1/2 top-1/2 h-[520px] w-[520px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-gold/[0.05] blur-[150px]" />

      <div className="container-lux relative">
        <div className="mx-auto flex max-w-xl flex-col items-center text-center">
          <span className="eyebrow">{t.errors.code}</span>
          <h1 className="display-title mt-7 text-[clamp(2.6rem,5.4vw,5rem)] text-ivory">
            {t.errors.generic}
          </h1>
          <p className="mt-5 max-w-md text-[0.9rem] leading-[1.9] text-ivory/45">
            {locale === "ar"
              ? "لم نفقد بياناتك. أعد المحاولة أو عد إلى الصفحة الرئيسية."
              : "Your data is safe. Try again or return to the homepage."}
          </p>
          <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={reset}
              className="inline-flex h-12 items-center gap-2.5 bg-gold px-7 text-[0.66rem] font-semibold uppercase tracking-[0.16em] text-obsidian transition-colors hover:bg-gold-light"
            >
              <RotateCcw className="h-4 w-4" />
              {t.errors.retry}
            </button>
            <Link
              href="/"
              className="group inline-flex h-12 items-center gap-2 border border-white/15 px-7 text-[0.66rem] font-semibold uppercase tracking-[0.16em] text-ivory/65 transition-colors hover:border-gold/50 hover:text-gold"
            >
              {locale === "ar" ? "الصفحة الرئيسية" : "Homepage"}
              <ArrowUpRight
                className={cn(
                  "h-4 w-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5",
                  isRTL && "-scale-x-100",
                )}
              />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

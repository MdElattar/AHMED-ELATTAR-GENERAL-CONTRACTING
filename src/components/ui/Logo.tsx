"use client";

import Image from "next/image";
import { cn } from "@/lib/utils";
import { useI18n } from "@/components/providers/I18nProvider";
import type { Locale } from "@/lib/dictionary";

type LogoProps = {
  className?: string;
  compact?: boolean;
  tone?: "light" | "dark";
  locale?: Locale;
};

export function Logo({ className, compact = false, tone = "light", locale: localeOverride }: LogoProps) {
  const { locale: contextLocale } = useI18n();
  const locale = localeOverride ?? contextLocale;
  const isArabic = locale === "ar";

  return (
    <span className={cn("flex items-center gap-3.5", className)}>
      <span className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-amber-500/30 bg-zinc-950/90 p-1.5 shadow-[0_0_15px_rgba(245,158,11,0.12)] sm:h-10 sm:w-10">
        <Image
          src="/aa-logo-v5.svg"
          alt={compact ? (isArabic ? "أحمد العطار" : "Ahmed Elattar") : ""}
          width={64}
          height={64}
          unoptimized
          priority
          className="h-full w-full object-contain"
        />
      </span>

      {!compact ? (
        <span className="flex flex-col leading-none">
          <span
            className={cn(
              "font-semibold",
              tone === "light" ? "text-ivory" : "text-ink",
              isArabic
                ? "text-[1.1rem] font-bold tracking-normal sm:text-[1.35rem]"
                : "text-[0.78rem] tracking-[0.16em] sm:text-[0.9rem] sm:tracking-[0.18em]",
            )}
          >
            {isArabic ? "أحمد العطار" : "AHMED ELATTAR"}
          </span>
          <span
            className={cn(
              "mt-1.5 text-[0.47rem] font-medium uppercase tracking-[0.24em]",
              "hidden sm:block",
              tone === "light" ? "text-ivory/55" : "text-ink/45",
              isArabic && "tracking-[0.02em] text-[0.56rem]",
            )}
          >
            {isArabic ? "للمقاولات العامة" : "General Contracting"}
          </span>
        </span>
      ) : null}
    </span>
  );
}

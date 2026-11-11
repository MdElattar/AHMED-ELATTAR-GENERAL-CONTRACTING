"use client";

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
      <svg
        viewBox="0 0 48 48"
        aria-hidden="true"
        className="h-10 w-10 shrink-0"
        fill="none"
      >
        <path
          d="M24 2.5 45.5 24 24 45.5 2.5 24 24 2.5Z"
          stroke="#c9a45c"
          strokeWidth="1"
          opacity="0.55"
        />
        <path
          d="M13.5 34.5 24 11.5l10.5 23"
          stroke={tone === "light" ? "#f3eee4" : "#0a0b0e"}
          strokeWidth="1.6"
          strokeLinecap="square"
        />
        <path d="M18.2 27.4h11.6" stroke="#c9a45c" strokeWidth="1.2" />
        <path d="M24 11.5V5.8h9.2" stroke="#c9a45c" strokeWidth="1" />
        <circle cx="33.4" cy="5.8" r="1.6" fill="#c9a45c" />
      </svg>

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
              tone === "light" ? "text-ivory/45" : "text-ink/45",
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

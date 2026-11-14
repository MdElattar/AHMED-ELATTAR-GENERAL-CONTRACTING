"use client";

import Image from "next/image";
import { cn } from "@/lib/utils";
import { useI18n } from "@/components/providers/I18nProvider";
import type { Locale } from "@/lib/dictionary";

export type BrandLogoVariant = "full" | "mark";

type BrandLogoProps = {
  variant?: BrandLogoVariant;
  tone?: "light" | "dark";
  locale?: Locale;
  priority?: boolean;
  collapsed?: boolean;
  className?: string;
};

/**
 * The single source of truth for the company logo.
 *
 * The mark is always the canonical SVG from `public/brand/logo-mark.svg`; the
 * full lockup keeps the public-site wordmark next to it while allowing the
 * admin shell to animate the wordmark away at the 76px collapsed width.
 */
export function BrandLogo({
  variant = "full",
  tone = "light",
  locale: localeOverride,
  priority = false,
  collapsed = false,
  className,
}: BrandLogoProps) {
  const { locale: contextLocale } = useI18n();
  const locale = localeOverride ?? contextLocale;
  const isArabic = locale === "ar";

  return (
    <span
      className={cn("flex min-h-[44px] min-w-0 items-center overflow-visible", collapsed ? "gap-0" : "gap-3", className)}
      aria-label={isArabic ? "أحمد العطار للمقاولات العامة" : "Ahmed Elattar General Contracting"}
    >
      <Image
        src="/brand/logo-mark.svg"
        alt={variant === "mark" || collapsed ? (isArabic ? "أحمد العطار" : "Ahmed Elattar") : ""}
        width={390}
        height={328}
        priority={priority}
        unoptimized
        className="h-9 w-auto shrink-0 object-contain"
      />

      {variant === "full" ? (
        <span
          aria-hidden={collapsed || undefined}
          className={cn(
            "flex min-w-0 flex-col overflow-hidden leading-none transition-[max-width,opacity] duration-200",
            collapsed ? "max-w-0 opacity-0" : "max-w-[220px] opacity-100",
          )}
        >
          <span
            className={cn(
              "whitespace-nowrap font-bold",
              tone === "light" ? "text-ivory" : "text-ink",
              isArabic ? "text-[1.1rem] sm:text-[1.3rem]" : "text-[0.82rem] tracking-[0.16em] sm:text-[0.92rem] sm:tracking-[0.18em]",
            )}
          >
            {isArabic ? "أحمد العطار" : "AHMED ELATTAR"}
          </span>
          <span
            className={cn(
              "mt-1.5 whitespace-nowrap text-[0.56rem] font-medium",
              isArabic ? "tracking-[0.02em]" : "uppercase tracking-[0.2em]",
              tone === "light" ? "text-ivory/55" : "text-ink/45",
            )}
          >
            {isArabic ? "للمقاولات العامة" : "General Contracting"}
          </span>
        </span>
      ) : null}
    </span>
  );
}

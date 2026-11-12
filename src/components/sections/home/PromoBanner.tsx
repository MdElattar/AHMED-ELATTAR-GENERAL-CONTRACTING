"use client";

import Link from "next/link";
import { ArrowUpRight, Sparkles } from "lucide-react";
import { useI18n } from "@/components/providers/I18nProvider";
import { useWorkspace } from "@/components/providers/WorkspaceProvider";
import { cn } from "@/lib/utils";

export function PromoBanner() {
  const { t, l, isRTL } = useI18n();
  const { content } = useWorkspace();

  if (!content.promoVisible) return null;

  return (
    <section className="relative overflow-hidden border-y border-gold/20 bg-gold/[0.06]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,rgba(166,124,26,0.14),transparent_65%)]" />
      <div className="container-lux relative flex flex-col items-start justify-between gap-5 py-7 sm:flex-row sm:items-center">
        <div className="flex items-start gap-4">
          <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-gold/30 bg-gold/10 text-gold">
            <Sparkles className="h-4 w-4" />
          </span>
          <div>
            <p className="text-sm font-medium text-ivory">{l(content.promoTitle)}</p>
            <p className="mt-1 max-w-2xl text-[0.72rem] leading-relaxed text-ivory/55">
              {l(content.promoText)}
            </p>
          </div>
        </div>
        <Link
          href={content.promoHref || "/contact"}
          className="group inline-flex shrink-0 items-center gap-2 border border-gold/40 px-4 py-2.5 text-[0.6rem] font-semibold uppercase tracking-[0.14em] text-gold transition-colors hover:bg-gold hover:text-obsidian"
        >
          {t.sections.inline.promoBannerCta}
          <ArrowUpRight
            className={cn(
              "h-3.5 w-3.5 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5",
              isRTL && "-scale-x-100",
            )}
          />
        </Link>
      </div>
    </section>
  );
}

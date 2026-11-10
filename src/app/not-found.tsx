"use client";

import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { useI18n } from "@/components/providers/I18nProvider";
import { cn } from "@/lib/utils";

export default function NotFound() {
  const { t, isRTL } = useI18n();

  return (
    <section className="relative flex min-h-[100svh] items-center overflow-hidden bg-obsidian pt-24">
      <div className="blueprint-grid pointer-events-none absolute inset-0 opacity-40" />
      <div className="pointer-events-none absolute start-1/2 top-1/2 h-[560px] w-[560px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-gold/[0.05] blur-[150px]" />
      <div className="pointer-events-none absolute inset-x-0 top-1/2 -translate-y-1/2 select-none text-center text-[32vw] font-semibold leading-none tracking-tighter text-white/[0.02]">
        404
      </div>

      <div className="container-lux relative">
        <div className="mx-auto flex max-w-xl flex-col items-center text-center">
          <span className="eyebrow">{t.notFound.code}</span>
          <h1 className="display-title mt-7 text-[clamp(2.8rem,6vw,5.6rem)] text-ivory">
            {t.notFound.title}
          </h1>
          <p className="mt-5 max-w-md text-[0.9rem] leading-[1.9] text-ivory/50">
            {t.notFound.text}
          </p>
          <Link
            href="/"
            className="btn-shine group mt-9 inline-flex h-12 items-center gap-2.5 bg-gold px-7 text-[0.66rem] font-semibold uppercase tracking-[0.16em] text-obsidian transition-colors hover:bg-gold-light"
          >
            {t.notFound.button}
            <ArrowUpRight
              className={cn(
                "h-4 w-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5",
                isRTL && "-scale-x-100",
              )}
            />
          </Link>
        </div>
      </div>
    </section>
  );
}

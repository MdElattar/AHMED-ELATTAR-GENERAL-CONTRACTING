"use client";

import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { useI18n } from "@/components/providers/I18nProvider";
import { cn } from "@/lib/utils";

type LegalKind = "privacy" | "terms";

export function LegalPage({ kind }: { kind: LegalKind }) {
  const { t, isRTL } = useI18n();
  const c = t.sections.legal[kind];
  const back = t.sections.legal.back;
  const BackIcon = isRTL ? ArrowRight : ArrowLeft;

  return (
    <section className="relative overflow-hidden bg-obsidian pb-20 pt-32 text-ivory sm:pt-40">
      <div className="blueprint-grid pointer-events-none absolute inset-0 opacity-30" />
      <div className="container-lux relative max-w-4xl">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-[0.6rem] uppercase tracking-[0.18em] text-ivory/40 transition-colors hover:text-gold"
        >
          <BackIcon className="h-3.5 w-3.5" />
          {back}
        </Link>
        <span className="eyebrow mt-10 block">{c.eyebrow}</span>
        <h1 className="display-title mt-5 text-[clamp(2.6rem,5vw,4.6rem)] text-ivory">
          {c.title}
        </h1>
        <p className="mt-3 text-[0.68rem] uppercase tracking-[0.16em] text-gold/70">
          {c.updated}
        </p>

        <div className="mt-12 divide-y divide-white/10 border-y border-white/10">
          {c.sections.map((section, index) => (
            <article key={section.title} className="grid gap-4 py-8 sm:grid-cols-[auto_1fr]">
              <span className={cn("tabular text-[0.62rem] text-gold/70", "sm:pt-1")}>
                {String(index + 1).padStart(2, "0")}
              </span>
              <div>
                <h2 className="font-display text-xl text-ivory">{section.title}</h2>
                <p className="mt-2 text-[0.86rem] leading-[1.9] text-ivory/50">
                  {section.text}
                </p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

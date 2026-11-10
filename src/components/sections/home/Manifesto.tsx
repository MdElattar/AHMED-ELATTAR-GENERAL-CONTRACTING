"use client";

import Link from "next/link";
import { ArrowUpRight, Quote } from "lucide-react";
import { useI18n } from "@/components/providers/I18nProvider";
import { Reveal } from "@/components/ui/Reveal";
import { cn } from "@/lib/utils";

const pillars = [
  { number: "01", ar: "الدقة", en: "Precision" },
  { number: "02", ar: "الحجم", en: "Scale" },
  { number: "03", ar: "السلامة", en: "Safety" },
  { number: "04", ar: "الإرث", en: "Legacy" },
];

export function Manifesto() {
  const { t, locale, isRTL } = useI18n();

  return (
    <section id="philosophy" className="grain relative overflow-hidden bg-ivory text-ink">
      <div className="pointer-events-none absolute -end-24 top-10 select-none text-[20rem] font-semibold leading-none tracking-tighter text-ink/[0.035] sm:text-[28rem]">
        1987
      </div>
      <div className="pointer-events-none absolute inset-0 opacity-[0.35] [background-image:linear-gradient(rgba(10,11,14,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(10,11,14,0.04)_1px,transparent_1px)] [background-size:80px_80px]" />

      <div className="container-lux section-pad relative">
        <div className="grid gap-14 lg:grid-cols-[1.15fr_0.85fr] lg:gap-20">
          <div>
            <Reveal>
              <span className="eyebrow text-gold-dark">{t.manifesto.eyebrow}</span>
            </Reveal>
            <Reveal delay={90}>
              <h2 className="display-title mt-7 max-w-3xl text-[clamp(2.4rem,5.2vw,5rem)] text-ink">
                {t.manifesto.title}
              </h2>
            </Reveal>
            <Reveal delay={180}>
              <Link
                href="/about"
                className="group mt-10 inline-flex items-center gap-3 text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-ink/60 transition-colors hover:text-gold-dark"
              >
                {t.manifesto.link}
                <span className="flex h-8 w-8 items-center justify-center rounded-full border border-ink/15 transition-colors group-hover:border-gold-dark">
                  <ArrowUpRight className={cn("h-3.5 w-3.5", isRTL && "-scale-x-100")} />
                </span>
              </Link>
            </Reveal>
          </div>

          <div className="flex flex-col justify-end gap-8 lg:pb-2">
            <Reveal delay={120}>
              <p className="text-[0.95rem] leading-[2] text-ink/65">{t.manifesto.body1}</p>
            </Reveal>
            <Reveal delay={200}>
              <p className="text-[0.95rem] leading-[2] text-ink/65">{t.manifesto.body2}</p>
            </Reveal>

            <Reveal delay={280}>
              <figure className="mt-4 border-s-2 border-gold-dark/70 ps-6">
                <Quote className="h-5 w-5 text-gold-dark/60" />
                <blockquote className="mt-3 font-display text-[clamp(1.35rem,2.4vw,1.9rem)] italic leading-snug text-ink/80">
                  “{t.manifesto.quote}”
                </blockquote>
                <figcaption className="mt-5 flex flex-col">
                  <span className="text-sm font-semibold text-ink">{t.manifesto.signature}</span>
                  <span className="mt-1 text-[0.62rem] uppercase tracking-[0.16em] text-ink/40">
                    {t.manifesto.role}
                  </span>
                </figcaption>
              </figure>
            </Reveal>
          </div>
        </div>

        <div className="mt-20 grid grid-cols-2 gap-y-8 border-t border-ink/10 pt-8 sm:grid-cols-4">
          {pillars.map((pillar, index) => (
            <Reveal key={pillar.number} delay={index * 80}>
              <div className="flex items-baseline gap-3">
                <span className="tabular text-[0.6rem] text-gold-dark">{pillar.number}</span>
                <span className="font-display text-xl text-ink/70">
                  {locale === "ar" ? pillar.ar : pillar.en}
                </span>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

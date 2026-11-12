"use client";

import Link from "next/link";
import { ArrowUpRight, Mail, Phone } from "lucide-react";
import { useI18n } from "@/components/providers/I18nProvider";
import { Reveal } from "@/components/ui/Reveal";
import { cn } from "@/lib/utils";

export function CTA() {
  const { t, isRTL } = useI18n();

  return (
    <section className="relative overflow-hidden border-t border-white/10 bg-obsidian">
      <div className="blueprint-grid pointer-events-none absolute inset-0 opacity-30" />
      <div className="pointer-events-none absolute start-1/2 top-1/2 h-[620px] w-[620px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-gold/[0.06] blur-[150px]" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 select-none text-center text-[18vw] font-semibold leading-[0.75] tracking-tighter text-white/[0.018]">
        BUILD
      </div>

      <div className="container-lux relative py-24 sm:py-32">
        <div className="mx-auto flex max-w-4xl flex-col items-center text-center">
          <Reveal>
            <span className="eyebrow">{t.cta.eyebrow}</span>
          </Reveal>
          <Reveal delay={90}>
            <h2 className="display-title mt-7 text-[clamp(2.5rem,5.6vw,5.6rem)] text-ivory">
              {t.cta.title}
            </h2>
          </Reveal>
          <Reveal delay={170}>
            <p className="mx-auto mt-6 max-w-xl text-[0.95rem] leading-[1.9] text-ivory/60">
              {t.cta.description}
            </p>
          </Reveal>

          <Reveal delay={250}>
            <div className="mt-10 flex flex-col items-center gap-3 sm:flex-row">
              <Link
                href="/contact"
                className="btn-shine group inline-flex h-13 items-center justify-center gap-3 bg-gold px-8 text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-obsidian transition-colors hover:bg-gold-light"
              >
                {t.cta.primary}
                <ArrowUpRight
                  className={cn(
                    "h-4 w-4 transition-transform duration-500 group-hover:-translate-y-0.5 group-hover:translate-x-0.5",
                    isRTL && "-scale-x-100",
                  )}
                />
              </Link>
              <Link
                href="/contact#procurement"
                className="inline-flex h-13 items-center justify-center gap-3 border border-white/20 px-8 text-[0.7rem] font-medium uppercase tracking-[0.16em] text-ivory/75 transition-colors hover:border-gold/60 hover:text-gold"
              >
                {t.cta.secondary}
              </Link>
            </div>
          </Reveal>

          <Reveal delay={320}>
            <div className="mt-12 flex flex-col items-center gap-5 text-[0.7rem] text-ivory/50 sm:flex-row sm:gap-8">
              <a
                href={`tel:${t.cta.phone.replace(/\s/g, "")}`}
                className="flex items-center gap-2 transition-colors hover:text-gold"
                dir="ltr"
              >
                <Phone className="h-3.5 w-3.5 text-gold/60" />
                {t.cta.phone}
              </a>
              <span className="hidden h-4 w-px bg-white/10 sm:block" />
              <a
                href={`mailto:${t.cta.email}`}
                className="flex items-center gap-2 transition-colors hover:text-gold"
              >
                <Mail className="h-3.5 w-3.5 text-gold/60" />
                {t.cta.email}
              </a>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

"use client";

import Link from "next/link";
import { ArrowUpRight, BadgeCheck, Quote, ShieldCheck } from "lucide-react";
import { useI18n } from "@/components/providers/I18nProvider";
import { CTA } from "@/components/sections/home/CTA";
import { Reveal } from "@/components/ui/Reveal";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { certifications, milestones } from "@/data/about";
import { cn } from "@/lib/utils";

export function AboutPage() {
  const { t, l, isRTL } = useI18n();

  return (
    <>
      <section className="relative overflow-hidden bg-bg pb-16 pt-36 sm:pb-20 sm:pt-44">
        <div className="blueprint-grid pointer-events-none absolute inset-0 opacity-40" />
        <div className="pointer-events-none absolute -end-16 top-10 select-none text-[18rem] font-semibold leading-none tracking-tighter text-fg/[0.022] sm:text-[26rem]">
          1987
        </div>
        <div className="pointer-events-none absolute start-1/4 top-1/3 h-[440px] w-[440px] rounded-full bg-accent/[0.05] blur-[140px]" />

        <div className="container-lux relative">
          <Reveal>
            <span className="eyebrow">{t.aboutPage.eyebrow}</span>
          </Reveal>
          <div className="mt-6 grid gap-10 lg:grid-cols-[1.2fr_0.8fr] lg:items-end">
            <Reveal delay={80}>
              <h1 className="display-title max-w-4xl text-[clamp(2.8rem,6.6vw,6.4rem)] text-fg">
                {t.aboutPage.title}
              </h1>
            </Reveal>
            <Reveal delay={160}>
              <p className="max-w-lg text-[0.95rem] leading-[1.95] text-fg lg:ms-auto">
                {t.aboutPage.description}
              </p>
            </Reveal>
          </div>

          <div className="mt-14 grid grid-cols-2 gap-px border border-line bg-line sm:grid-cols-4">
            {[
              { value: "1987", ar: "سنة التأسيس", en: "Founded" },
              { value: "240+", ar: "مشروعاً منجزاً", en: "Projects delivered" },
              { value: "1,200+", ar: "كادر داخلي", en: "In-house team" },
              { value: "04", ar: "دول", en: "Countries" },
            ].map((stat) => (
              <div key={stat.en} className="bg-bg px-5 py-6">
                <span className="tabular font-display text-2xl text-fg sm:text-3xl">
                  {stat.value}
                </span>
                <p className="mt-1.5 text-[0.55rem] uppercase tracking-[0.14em] text-fg">
                  {isRTL ? stat.ar : stat.en}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="grain relative overflow-hidden bg-fg text-fg">
        <div className="pointer-events-none absolute inset-0 opacity-[0.35] [background-image:linear-gradient(rgb(var(--fg-rgb)/0.05)_1px,transparent_1px),linear-gradient(90deg,rgb(var(--fg-rgb)/0.05)_1px,transparent_1px)] [background-size:90px_90px]" />

        <div className="container-lux section-pad relative">
          <div className="grid gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:gap-20">
            <Reveal variant="left">
              <div className="relative aspect-[4/5] overflow-hidden bg-surface">
                <div className="blueprint-grid absolute inset-0 opacity-30" />
                <div className="absolute inset-6 border border-accent/25" />
                <div className="absolute inset-x-0 top-1/2 flex -translate-y-1/2 flex-col items-center">
                  <span className="font-display text-[clamp(5rem,12vw,9rem)] leading-none text-accent">
                    ع
                  </span>
                  <span className="mt-4 text-[0.55rem] uppercase tracking-[0.3em] text-fg">
                    Ahmed Elattar · 1987
                  </span>
                </div>
                <div className="absolute inset-x-6 bottom-6 flex items-end justify-between gap-4">
                  <span className="text-[0.52rem] uppercase tracking-[0.16em] text-fg">
                    Riyadh · Saudi Arabia
                  </span>
                  <span className="h-10 w-px bg-accent/40" />
                </div>
                <div className="pointer-events-none absolute -end-16 -top-16 h-40 w-40 rounded-full bg-accent/10 blur-3xl" />
              </div>
            </Reveal>

            <div className="flex flex-col justify-center">
              <Reveal>
                <span className="eyebrow text-accent">{t.aboutPage.founderEyebrow}</span>
              </Reveal>
              <Reveal delay={80}>
                <h2 className="display-title mt-6 text-[clamp(2.2rem,4.4vw,4.2rem)] text-fg">
                  {t.aboutPage.founderTitle}
                </h2>
              </Reveal>
              <Reveal delay={140}>
                <div className="mt-7 space-y-5 text-[0.92rem] leading-[1.95] text-fg">
                  <p>{t.aboutPage.founderP1}</p>
                  <p>{t.aboutPage.founderP2}</p>
                  <p>{t.aboutPage.founderP3}</p>
                </div>
              </Reveal>

              <Reveal delay={220}>
                <figure className="mt-9 border-s-2 border-accent/70 ps-6">
                  <Quote className="h-5 w-5 text-accent" />
                  <blockquote className="mt-3 font-display text-[clamp(1.3rem,2.3vw,1.8rem)] italic leading-snug text-fg">
                    “{t.aboutPage.founderQuote}”
                  </blockquote>
                  <figcaption className="mt-5 flex flex-col">
                    <span className="text-sm font-semibold text-fg">
                      {t.aboutPage.founderSignature}
                    </span>
                    <span className="mt-1 text-[0.6rem] uppercase tracking-[0.16em] text-fg">
                      {t.aboutPage.founderRole}
                    </span>
                  </figcaption>
                </figure>
              </Reveal>
            </div>
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden bg-surface">
        <div className="blueprint-grid pointer-events-none absolute inset-0 opacity-30" />
        <div className="container-lux section-pad relative">
          <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16">
            <div>
              <Reveal>
                <span className="eyebrow">{t.aboutPage.valuesEyebrow}</span>
              </Reveal>
              <Reveal delay={80}>
                <h2 className="display-title mt-6 max-w-sm text-[clamp(2.2rem,4.4vw,4.2rem)] text-fg">
                  {t.aboutPage.valuesTitle}
                </h2>
              </Reveal>
            </div>

            <div className="grid gap-px bg-line sm:grid-cols-2">
              {t.aboutPage.values.map((value, index) => (
                <Reveal key={value.title} delay={index * 80}>
                  <div className="group flex h-full flex-col bg-surface p-6 transition-colors duration-500 hover:bg-surface-2 sm:p-7">
                    <div className="flex items-center justify-between gap-4">
                      <span className="tabular text-[0.55rem] text-accent">
                        0{index + 1}
                      </span>
                      <span className="h-px flex-1 bg-line transition-colors group-hover:bg-accent/30" />
                    </div>
                    <h3 className="mt-6 font-display text-2xl text-fg">{value.title}</h3>
                    <p className="mt-3 text-[0.78rem] leading-relaxed text-fg">
                      {value.text}
                    </p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="grain relative overflow-hidden bg-fg text-fg">
        <div className="pointer-events-none absolute inset-0 opacity-[0.35] [background-image:linear-gradient(rgb(var(--fg-rgb)/0.05)_1px,transparent_1px),linear-gradient(90deg,rgb(var(--fg-rgb)/0.05)_1px,transparent_1px)] [background-size:90px_90px]" />
        <div className="container-lux section-pad relative">
          <div className="grid gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:gap-20">
            <div>
              <Reveal>
                <span className="eyebrow text-accent">{t.aboutPage.safetyEyebrow}</span>
              </Reveal>
              <Reveal delay={80}>
                <h2 className="display-title mt-6 max-w-xl text-[clamp(2.2rem,4.4vw,4.2rem)] text-fg">
                  {t.aboutPage.safetyTitle}
                </h2>
              </Reveal>
              <Reveal delay={140}>
                <p className="mt-6 max-w-lg text-[0.92rem] leading-[1.95] text-fg">
                  {t.aboutPage.safetyText}
                </p>
              </Reveal>

              <Reveal delay={200}>
                <div className="mt-9 grid grid-cols-3 gap-px border border-line bg-line">
                  {t.aboutPage.safetyStats.map((stat) => (
                    <div key={stat.label} className="bg-fg p-4 sm:p-5">
                      <span className="tabular font-display text-2xl text-fg sm:text-3xl">
                        {stat.value}
                      </span>
                      <p className="mt-1.5 text-[0.55rem] uppercase leading-relaxed tracking-[0.1em] text-fg">
                        {stat.label}
                      </p>
                    </div>
                  ))}
                </div>
              </Reveal>
            </div>

            <div className="flex flex-col justify-center">
              <div className="border border-line bg-line0">
                <div className="flex items-center gap-3 border-b border-line px-6 py-4">
                  <ShieldCheck className="h-4 w-4 text-accent" />
                  <span className="text-[0.58rem] font-semibold uppercase tracking-[0.18em] text-fg">
                    {t.aboutPage.safetyEyebrow}
                  </span>
                </div>
                <ul className="divide-y divide-line">
                  {t.aboutPage.safetyProtocols.map((protocol) => (
                    <li key={protocol} className="flex items-start gap-3 px-6 py-4">
                      <BadgeCheck className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                      <span className="text-[0.8rem] leading-relaxed text-fg">{protocol}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden bg-surface">
        <div className="blueprint-grid pointer-events-none absolute inset-0 opacity-30" />
        <div className="container-lux section-pad relative">
          <SectionHeading
            eyebrow={t.aboutPage.timelineEyebrow}
            title={t.aboutPage.timelineTitle}
          />

          <div className="mt-14 grid gap-px border border-line bg-line sm:grid-cols-2 lg:grid-cols-4">
            {milestones.map((milestone, index) => (
              <Reveal key={milestone.year} delay={(index % 4) * 70}>
                <div className="group flex h-full flex-col bg-surface p-6 transition-colors duration-500 hover:bg-surface-2">
                  <span className="tabular font-display text-[clamp(2rem,3vw,2.8rem)] leading-none text-accent">
                    {milestone.year}
                  </span>
                  <h3 className="mt-5 text-sm font-semibold text-fg">{l(milestone.title)}</h3>
                  <p className="mt-2 text-[0.72rem] leading-relaxed text-fg">
                    {l(milestone.text)}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section
        id="certifications"
        className="grain relative scroll-mt-24 overflow-hidden bg-fg text-fg"
      >
        <div className="pointer-events-none absolute inset-0 opacity-[0.35] [background-image:linear-gradient(rgb(var(--fg-rgb)/0.05)_1px,transparent_1px),linear-gradient(90deg,rgb(var(--fg-rgb)/0.05)_1px,transparent_1px)] [background-size:90px_90px]" />
        <div className="container-lux section-pad relative">
          <div className="flex flex-col justify-between gap-8 lg:flex-row lg:items-end">
            <SectionHeading
              eyebrow={t.aboutPage.certEyebrow}
              title={t.aboutPage.certTitle}
              tone="light"
            />
            <Reveal delay={180}>
              <Link
                href="/contact"
                className="group inline-flex items-center gap-3 text-[0.65rem] font-semibold uppercase tracking-[0.16em] text-fg transition-colors hover:text-accent"
              >
                {t.aboutPage.ctaButton}
                <span className="flex h-8 w-8 items-center justify-center rounded-full border border-line transition-colors group-hover:border-accent">
                  <ArrowUpRight className={cn("h-3.5 w-3.5", isRTL && "-scale-x-100")} />
                </span>
              </Link>
            </Reveal>
          </div>

          <div className="mt-12 grid gap-px border border-line bg-line sm:grid-cols-2 lg:grid-cols-3">
            {certifications.map((cert, index) => (
              <Reveal key={cert.code} delay={(index % 3) * 70}>
                <div className="flex h-full flex-col justify-between gap-8 bg-fg p-6">
                  <span className="w-fit border border-line px-2.5 py-1 text-[0.55rem] font-semibold uppercase tracking-[0.16em] text-accent">
                    {cert.code}
                  </span>
                  <div>
                    <h3 className="text-[0.85rem] font-semibold leading-snug text-fg">
                      {l(cert.title)}
                    </h3>
                    <p className="mt-1.5 text-[0.65rem] leading-relaxed text-fg">
                      {l(cert.issuer)}
                    </p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <CTA />
    </>
  );
}

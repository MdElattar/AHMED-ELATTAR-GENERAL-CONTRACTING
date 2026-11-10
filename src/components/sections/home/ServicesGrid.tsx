"use client";

import Link from "next/link";
import { ArrowUpRight, Check } from "lucide-react";
import { useI18n } from "@/components/providers/I18nProvider";
import { useWorkspace } from "@/components/providers/WorkspaceProvider";
import { ProjectArt } from "@/components/ui/ProjectArt";
import { Reveal } from "@/components/ui/Reveal";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { services } from "@/data/services";
import { cn } from "@/lib/utils";

const copy = {
  ar: {
    eyebrow: "خدماتنا",
    title: "من الفكرة الأولى إلى آخر مفتاح.",
    description:
      "أربع قدرات متكاملة تحت سقف واحد: مقاولات عامة، أسطول مملوك، هندسة وتصميم، وإدارة مشاريع. لا وسطاء، ولا مسؤولية مبعثرة.",
    cta: "استكشف جميع الخدمات",
  },
  en: {
    eyebrow: "Our services",
    title: "From first idea to final key.",
    description:
      "Four integrated capabilities under one roof: general contracting, an owned fleet, engineering & design, and project management. No middlemen, no fragmented accountability.",
    cta: "Explore all services",
  },
};

export function ServicesGrid() {
  const { locale, l, isRTL } = useI18n();
  const { content } = useWorkspace();
  const c = copy[locale];

  return (
    <section className="grain relative overflow-hidden bg-ivory text-ink">
      <div className="pointer-events-none absolute inset-0 opacity-[0.35] [background-image:linear-gradient(rgba(10,11,14,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(10,11,14,0.035)_1px,transparent_1px)] [background-size:88px_88px]" />
      <div className="container-lux section-pad relative">
        <div className="flex flex-col justify-between gap-8 lg:flex-row lg:items-end">
          <SectionHeading
            eyebrow={c.eyebrow}
            title={c.title}
            description={c.description}
            tone="light"
            titleClassName="max-w-3xl"
          />
          <Reveal delay={200}>
            <Link
              href="/services"
              className="group inline-flex shrink-0 items-center gap-3 border border-ink/15 px-5 py-3 text-[0.65rem] font-semibold uppercase tracking-[0.16em] text-ink/65 transition-colors hover:border-gold-dark hover:text-gold-dark"
            >
              {c.cta}
              <ArrowUpRight
                className={cn(
                  "h-3.5 w-3.5 transition-transform duration-500 group-hover:-translate-y-0.5 group-hover:translate-x-0.5",
                  isRTL && "-scale-x-100",
                )}
              />
            </Link>
          </Reveal>
        </div>

        <div className="mt-14 grid gap-px overflow-hidden border border-ink/10 bg-ink/10 md:grid-cols-2">
          {services.map((service, index) => {
            const override = content.serviceOverrides[service.slug];
            const title = override?.title ?? service.title;
            const description = override?.description ?? service.description;
            const tagline = override?.tagline ?? service.tagline;
            return (
              <Reveal key={service.slug} delay={(index % 2) * 80}>
                <Link
                  href={`/services#${service.slug}`}
                  className="group relative flex h-full flex-col bg-ivory p-7 transition-colors duration-500 hover:bg-paper sm:p-9"
                >
                  <div className="flex items-start justify-between gap-5">
                    <span className="font-display text-4xl leading-none text-gold-dark/45">
                      {service.number}
                    </span>
                    <span className="flex h-10 w-10 items-center justify-center rounded-full border border-ink/12 text-ink/35 transition-colors group-hover:border-gold-dark/50 group-hover:text-gold-dark">
                      <ArrowUpRight
                        className={cn(
                          "h-4 w-4 transition-transform duration-500 group-hover:-translate-y-0.5 group-hover:translate-x-0.5",
                          isRTL && "-scale-x-100",
                        )}
                      />
                    </span>
                  </div>

                  <div className="relative mt-7 aspect-[16/8] overflow-hidden border border-ink/10">
                    <ProjectArt variant={service.art} className="h-full w-full" />
                    <div className="absolute inset-0 bg-gradient-to-t from-ink/55 via-transparent to-transparent" />
                    <span className="absolute inset-x-4 bottom-3 text-[0.55rem] uppercase tracking-[0.18em] text-ivory/70">
                      {l(tagline)}
                    </span>
                  </div>

                  <h3 className="mt-6 font-display text-[clamp(1.7rem,3vw,2.5rem)] leading-tight text-ink">
                    {l(title)}
                  </h3>
                  <p className="mt-3 max-w-xl text-[0.82rem] leading-[1.85] text-ink/55">
                    {l(description)}
                  </p>

                  <div className="mt-6 flex flex-wrap gap-x-5 gap-y-2 border-t border-ink/10 pt-5">
                    {service.capabilities.slice(0, 3).map((capability) => (
                      <span
                        key={capability.en}
                        className="inline-flex items-center gap-1.5 text-[0.62rem] text-ink/45"
                      >
                        <Check className="h-3 w-3 text-gold-dark" />
                        {l(capability)}
                      </span>
                    ))}
                  </div>
                </Link>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}

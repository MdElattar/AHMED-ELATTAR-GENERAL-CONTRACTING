"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowUpRight, Building2, Check, Compass, PenTool, Truck } from "lucide-react";
import { useI18n } from "@/components/providers/I18nProvider";
import { useSmoothScroll } from "@/components/providers/SmoothScroll";
import { useWorkspace } from "@/components/providers/WorkspaceProvider";
import { CTA } from "@/components/sections/home/CTA";
import { ProjectArt } from "@/components/ui/ProjectArt";
import { Reveal } from "@/components/ui/Reveal";
import type { ServiceIcon } from "@/data/services";
import { cn } from "@/lib/utils";

const iconMap: Record<ServiceIcon, typeof Building2> = {
  building: Building2,
  truck: Truck,
  compass: Compass,
  pen: PenTool,
};

export function ServicesPage() {
  const { t, l, locale, isRTL } = useI18n();
  const approach = t.sections.servicesApproach;
  const { content } = useWorkspace();
  const { scrollTo } = useSmoothScroll();
  const resolvedServices = content.services.map((service) => {
    const override = content.serviceOverrides[service.slug];
    return {
      ...service,
      title: override?.title ?? service.title,
      tagline: override?.tagline ?? service.tagline,
      description: override?.description ?? service.description,
    };
  });
  const [activeService, setActiveService] = useState<string>("all");
  const visibleServices =
    activeService === "all"
      ? resolvedServices
      : resolvedServices.filter((service) => service.slug === activeService);

  return (
    <>
      <section className="relative overflow-hidden bg-bg pb-16 pt-36 sm:pb-20 sm:pt-44">
        <div className="blueprint-grid pointer-events-none absolute inset-0 opacity-40" />
        <div className="pointer-events-none absolute -end-24 top-16 select-none text-[15rem] font-semibold leading-none tracking-tighter text-fg/[0.025] sm:text-[22rem]">
          CRAFT
        </div>
        <div className="pointer-events-none absolute start-1/4 top-1/3 h-[420px] w-[420px] rounded-full bg-accent/[0.05] blur-[130px]" />

        <div className="container-lux relative">
          <Reveal>
            <span className="eyebrow">{t.servicesPage.eyebrow}</span>
          </Reveal>
          <div className="mt-6 grid gap-10 lg:grid-cols-[1.15fr_0.85fr] lg:items-end">
            <Reveal delay={80}>
              <h1 className="display-title max-w-4xl text-[clamp(2.8rem,6.4vw,6.2rem)] text-fg">
                {t.servicesPage.title}
              </h1>
            </Reveal>
            <Reveal delay={160}>
              <p className="max-w-lg text-[0.95rem] leading-[1.95] text-fg lg:ms-auto">
                {t.servicesPage.description}
              </p>
            </Reveal>
          </div>

          <div className="mt-14 grid gap-px border border-line bg-line sm:grid-cols-2 lg:grid-cols-4">
            {resolvedServices.length === 0
              ? Array.from({ length: 4 }).map((_, index) => (
                  <div
                    key={`service-skeleton-${index}`}
                    className="h-40 animate-pulse bg-bg p-6"
                  />
                ))
              : resolvedServices.map((service, index) => {
                  const Icon = iconMap[service.icon];
                  return (
                    <Reveal key={service.slug} delay={index * 70}>
                      <a
                        href={`#${service.slug}`}
                        onClick={(event) => {
                          event.preventDefault();
                          setActiveService(service.slug);
                          // Route anchor scrolling through Lenis so it does not
                          // fight the smooth-scroll engine with a native scroll.
                          scrollTo(`#${service.slug}`, -96);
                        }}
                        className="group flex h-full flex-col justify-between gap-8 bg-bg p-6 transition-colors duration-500 hover:bg-surface"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <Icon className="h-5 w-5 text-accent" />
                          <span className="tabular text-[0.55rem] text-fg">
                            {service.number}
                          </span>
                        </div>
                        <div>
                          <h2 className="font-display text-[1.35rem] leading-tight text-fg transition-colors group-hover:text-accent">
                            {l(service.title)}
                          </h2>
                          <p className="mt-2 text-[0.68rem] leading-relaxed text-fg">
                            {l(service.tagline)}
                          </p>
                        </div>
                      </a>
                    </Reveal>
                  );
                })}
          </div>
        </div>
      </section>

      <section className="grain relative overflow-hidden bg-fg text-fg">
        <div className="pointer-events-none absolute inset-0 opacity-[0.35] [background-image:linear-gradient(rgb(var(--fg-rgb)/0.05)_1px,transparent_1px),linear-gradient(90deg,rgb(var(--fg-rgb)/0.05)_1px,transparent_1px)] [background-size:90px_90px]" />

        <div className="container-lux relative">
          <div className="flex flex-wrap items-center gap-2 border-b border-line py-7">
            <span className="me-2 text-[0.55rem] font-semibold uppercase tracking-[0.18em] text-accent">
              {t.servicesPage.index}
            </span>
            <button
              type="button"
              onClick={() => setActiveService("all")}
              className={cn(
                "border px-3 py-1.5 text-[0.56rem] font-semibold uppercase tracking-[0.12em] transition-colors",
                activeService === "all"
                  ? "border-line bg-surface text-fg"
                  : "border-line text-fg hover:border-line hover:text-fg",
              )}
            >
              {t.sections.inline.servicesAll}
            </button>
            {resolvedServices.map((service) => (
              <button
                key={service.slug}
                type="button"
                onClick={() => setActiveService(service.slug)}
                className={cn(
                  "border px-3 py-1.5 text-[0.56rem] font-semibold uppercase tracking-[0.12em] transition-colors",
                  activeService === service.slug
                    ? "border-line bg-surface text-fg"
                    : "border-line text-fg hover:border-line hover:text-fg",
                )}
              >
                {l(service.title)}
              </button>
            ))}
            {resolvedServices.length === 0 ? (
              <span className="px-2 text-[0.58rem] text-fg">
                {t.sections.inline.servicesLoading}
              </span>
            ) : null}
          </div>

          {visibleServices.map((service, index) => {
            const Icon = iconMap[service.icon];
            const reversed = index % 2 === 1;

            return (
              <article
                key={service.slug}
                id={service.slug}
                className="scroll-mt-32 border-b border-line py-16 first:pt-20 last:border-b-0 sm:py-20"
              >
                <div className="grid gap-10 lg:grid-cols-2 lg:gap-16">
                  <Reveal
                    variant={reversed ? "left" : "up"}
                    className={cn("relative", reversed && "lg:order-2")}
                  >
                    <div className="relative aspect-[4/3] overflow-hidden bg-bg">
                      <ProjectArt variant={service.art} className="h-full w-full" />
                      <div className="absolute inset-0 bg-gradient-to-t from-bg/90 via-bg/10 to-transparent" />
                      <span className="absolute start-5 top-4 tabular font-display text-[clamp(3rem,6vw,5.5rem)] leading-none text-fg">
                        {service.number}
                      </span>
                      <div className="absolute inset-x-5 bottom-5 flex items-end justify-between gap-4">
                        <div>
                          <span className="text-[0.52rem] uppercase tracking-[0.18em] text-accent">
                            {t.servicesPage.capabilities}
                          </span>
                          <p className="mt-1.5 font-display text-xl text-fg">
                            {l(service.title)}
                          </p>
                        </div>
                        <span className="flex h-10 w-10 items-center justify-center border border-line text-fg">
                          <Icon className="h-4 w-4" />
                        </span>
                      </div>
                    </div>

                    <div className="mt-4 grid grid-cols-3 gap-px bg-line">
                      {service.stats.map((stat) => (
                        <div key={stat.label.en} className="bg-fg p-4">
                          <span className="tabular text-lg font-light text-fg">{stat.value}</span>
                          <p className="mt-1 text-[0.55rem] uppercase leading-relaxed tracking-[0.1em] text-fg">
                            {l(stat.label)}
                          </p>
                        </div>
                      ))}
                    </div>
                  </Reveal>

                  <div className={cn("flex flex-col justify-center", reversed && "lg:order-1")}>
                    <Reveal>
                      <div className="flex items-center gap-3">
                        <span className="text-[0.58rem] uppercase tracking-[0.2em] text-accent">
                          {service.number}
                        </span>
                        <span className="h-px w-8 bg-accent/50" />
                        <span className="text-[0.58rem] uppercase tracking-[0.2em] text-fg">
                          {t.servicesPage.eyebrow}
                        </span>
                      </div>
                    </Reveal>
                    <Reveal delay={70}>
                      <h2 className="display-title mt-5 text-[clamp(2.2rem,4vw,3.8rem)] text-fg">
                        {l(service.title)}
                      </h2>
                    </Reveal>
                    <Reveal delay={120}>
                      <p className="mt-3 font-display text-[clamp(1.2rem,2vw,1.6rem)] italic text-accent">
                        {l(service.tagline)}
                      </p>
                    </Reveal>
                    <Reveal delay={170}>
                      <p className="mt-6 text-[0.95rem] leading-[1.95] text-fg">
                        {l(service.description)}
                      </p>
                    </Reveal>
                    <Reveal delay={220}>
                      <p className="mt-4 text-[0.85rem] leading-[1.9] text-fg">
                        {l(service.detail)}
                      </p>
                    </Reveal>

                    <Reveal delay={270}>
                      <ul className="mt-8 grid gap-x-6 gap-y-2.5 sm:grid-cols-2">
                        {service.capabilities.map((capability) => (
                          <li
                            key={capability.en}
                            className="flex items-start gap-2.5 text-[0.75rem] leading-relaxed text-fg"
                          >
                            <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-accent" />
                            {l(capability)}
                          </li>
                        ))}
                      </ul>
                    </Reveal>

                    <Reveal delay={320}>
                      <Link
                        href={`/contact?service=${service.slug}`}
                        className="group mt-9 inline-flex items-center gap-3 text-[0.65rem] font-semibold uppercase tracking-[0.16em] text-fg transition-colors hover:text-accent"
                      >
                        {t.servicesPage.cta}
                        <span className="flex h-8 w-8 items-center justify-center rounded-full border border-line transition-colors group-hover:border-accent">
                          <ArrowUpRight className={cn("h-3.5 w-3.5", isRTL && "-scale-x-100")} />
                        </span>
                      </Link>
                    </Reveal>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section className="relative overflow-hidden bg-surface">
        <div className="blueprint-grid pointer-events-none absolute inset-0 opacity-30" />
        <div className="container-lux section-pad relative">
          <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:gap-20">
            <div>
              <Reveal>
                <span className="eyebrow">{t.servicesPage.approach}</span>
              </Reveal>
              <Reveal delay={80}>
                <h2 className="display-title mt-6 max-w-md text-[clamp(2.2rem,4.4vw,4.2rem)] text-fg">
                  {t.sections.inline.servicesMethodTitle}
                </h2>
              </Reveal>
              <Reveal delay={160}>
                <p className="mt-5 max-w-md text-[0.9rem] leading-[1.9] text-fg">
                  {t.sections.inline.servicesMethodText}
                </p>
              </Reveal>
            </div>

            <div className="grid gap-px bg-line sm:grid-cols-2">
              {approach.map((step, index) => (
                <Reveal key={step.number} delay={index * 80}>
                  <div className="flex h-full flex-col bg-surface p-6">
                    <span className="tabular text-[0.55rem] text-accent">{step.number}</span>
                    <h3 className="mt-5 font-display text-xl text-fg">
                      {step.title[locale]}
                    </h3>
                    <p className="mt-2 text-[0.75rem] leading-relaxed text-fg">
                      {step.text[locale]}
                    </p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </div>
      </section>

      <CTA />
    </>
  );
}

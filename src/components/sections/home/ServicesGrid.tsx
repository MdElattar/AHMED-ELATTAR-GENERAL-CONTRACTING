"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, Check } from "lucide-react";
import { useI18n } from "@/components/providers/I18nProvider";
import { useWorkspace } from "@/components/providers/WorkspaceProvider";
import { Reveal } from "@/components/ui/Reveal";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { projectPhotos } from "@/data/media";
import { resolveMedia } from "@/lib/cms";
import { cn } from "@/lib/utils";

export function ServicesGrid() {
  const { t, locale, l, isRTL } = useI18n();
  const { content } = useWorkspace();
  const c = t.sections.servicesGrid;

  return (
    <section className="grain relative overflow-hidden bg-fg text-fg">
      <div className="pointer-events-none absolute inset-0 opacity-[0.35] [background-image:linear-gradient(rgb(var(--fg-rgb)/0.05)_1px,transparent_1px),linear-gradient(90deg,rgb(var(--fg-rgb)/0.05)_1px,transparent_1px)] [background-size:88px_88px]" />
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
              className="group inline-flex shrink-0 items-center gap-3 border border-line px-5 py-3 text-[0.65rem] font-semibold uppercase tracking-[0.16em] text-fg transition-colors hover:border-accent hover:text-accent"
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

        <div className="mt-14 grid gap-px overflow-hidden border border-line bg-line md:grid-cols-2">
          {content.services.length === 0
            ? Array.from({ length: 4 }).map((_, index) => (
                <div
                  key={`service-skeleton-${index}`}
                  className="h-80 animate-pulse bg-fg p-7 sm:p-9"
                />
              ))
            : content.services.map((service, index) => {
                const override = content.serviceOverrides[service.slug];
                const title = override?.title ?? service.title;
                const description = override?.description ?? service.description;
                const tagline = override?.tagline ?? service.tagline;
                const photo = resolveMedia(
                  content.mediaOverrides,
                  `project.${service.art}`,
                  projectPhotos[service.art],
                  locale,
                );
                return (
                  <Reveal key={service.slug} delay={(index % 2) * 80}>
                    <Link
                      href={`/services#${service.slug}`}
                      className="group relative flex h-full flex-col bg-fg p-7 transition-colors duration-500 hover:bg-surface-2 sm:p-9"
                    >
                      <div className="flex items-start justify-between gap-5">
                        <span className="font-display text-4xl leading-none text-accent">
                          {service.number}
                        </span>
                        <span className="flex h-10 w-10 items-center justify-center rounded-full border border-line text-fg transition-colors group-hover:border-accent/50 group-hover:text-accent">
                          <ArrowUpRight
                            className={cn(
                              "h-4 w-4 transition-transform duration-500 group-hover:-translate-y-0.5 group-hover:translate-x-0.5",
                              isRTL && "-scale-x-100",
                            )}
                          />
                        </span>
                      </div>

                      <div className="relative mt-7 aspect-[16/8] overflow-hidden border border-line bg-surface-2">
                        <Image
                          src={photo.src}
                          alt={photo.alt}
                          fill
                          sizes="(max-width: 768px) 100vw, 50vw"
                          className="object-cover photo-grade transition-transform duration-[1.4s] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.05]"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-surface/70 via-surface/10 to-transparent" />
                        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_74%_18%,rgb(var(--accent-rgb)/0.16),transparent_55%)]" />
                        <span className="absolute inset-x-4 bottom-3 text-[0.55rem] uppercase tracking-[0.18em] text-fg">
                          {l(tagline)}
                        </span>
                        <span className="absolute -top-px start-0 h-px w-14 bg-accent/70" />
                      </div>

                      <h3 className="mt-6 font-display text-[clamp(1.7rem,3vw,2.5rem)] leading-tight text-fg">
                        {l(title)}
                      </h3>
                      <p className="mt-3 max-w-xl text-[0.82rem] leading-[1.85] text-fg">
                        {l(description)}
                      </p>

                      <div className="mt-6 flex flex-wrap gap-x-5 gap-y-2 border-t border-line pt-5">
                        {service.capabilities.slice(0, 3).map((capability) => (
                          <span
                            key={capability.en}
                            className="inline-flex items-center gap-1.5 text-[0.62rem] text-fg"
                          >
                            <Check className="h-3 w-3 text-accent" />
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

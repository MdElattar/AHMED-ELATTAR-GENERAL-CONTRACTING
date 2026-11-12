"use client";

import Image from "next/image";
import { MoveDown } from "lucide-react";
import { useI18n } from "@/components/providers/I18nProvider";
import { useWorkspace } from "@/components/providers/WorkspaceProvider";
import { Reveal } from "@/components/ui/Reveal";
import { cranePhotos } from "@/data/media";
import { resolveMedia } from "@/lib/cms";
import { cn } from "@/lib/utils";

/**
 * The crane sequence — a natural-scrolling editorial feature.
 *
 * No pinning, no scroll hijacking. The section reads like a printed field
 * report: one full-bleed hero frame followed by five photographic milestones
 * that reveal as they enter the viewport. Every frame is lazy-loaded through
 * next/image, so the section costs nothing until it is approached.
 */
export function CraneExperience() {
  const { t, locale } = useI18n();
  const { content } = useWorkspace();
  const steps = t.crane.steps;
  const feature = resolveMedia(content.mediaOverrides, "crane.0", cranePhotos[0], locale);

  return (
    <section id="crane" className="relative overflow-hidden bg-obsidian py-20 sm:py-28">
      <div className="blueprint-grid pointer-events-none absolute inset-0 opacity-20" />
      <div className="atmo-glow pointer-events-none absolute inset-0 opacity-35" aria-hidden="true" />
      <div className="pointer-events-none absolute -start-16 top-24 select-none text-[11rem] font-semibold leading-none tracking-tighter text-white/[0.022] sm:text-[17rem]">
        {t.sections.inline.craneTag}
      </div>

      <div className="container-lux relative">
        <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-end">
          <Reveal className="max-w-2xl">
            <span className="eyebrow">{t.crane.eyebrow}</span>
            <h2 className="display-title mt-5 text-[clamp(2rem,4.6vw,4.2rem)] text-ivory">
              {t.crane.title}
            </h2>
            <p className="mt-4 max-w-xl text-sm leading-[1.9] text-ivory/55">
              {t.crane.description}
            </p>
          </Reveal>

          <Reveal delay={120} className="hidden items-center gap-3 text-ivory/35 lg:flex">
            <span className="text-[0.55rem] uppercase tracking-[0.2em]">{t.crane.hint}</span>
            <MoveDown className="h-4 w-4 text-gold/60" />
          </Reveal>
        </div>

        <Reveal variant="scale" delay={80} className="mt-12">
          <figure className="relative aspect-[16/10] overflow-hidden border border-white/10 bg-coal sm:aspect-[21/9]">
            <Image
              src={feature.src}
              alt={feature.alt}
              fill
              sizes="100vw"
              loading="lazy"
              className="object-cover photo-grade brightness-[0.82]"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-obsidian/85 via-obsidian/15 to-transparent" />
            <figcaption className="absolute inset-x-0 bottom-0 flex flex-wrap items-end justify-between gap-4 p-5 sm:p-7">
              <div>
                <span className="live-pill">{t.sections.inline.craneLive}</span>
                <p className="mt-3 max-w-md font-display text-[clamp(1.3rem,2.4vw,2rem)] leading-tight text-ivory">
                  {steps[0]?.heading}
                </p>
              </div>
              <div className="glass-panel-soft px-4 py-3 text-end">
                <span className="tabular block text-2xl font-light text-gold">
                  {steps[0]?.metric}
                </span>
                <span className="mt-1 block text-[0.52rem] uppercase tracking-[0.18em] text-ivory/45">
                  {steps[0]?.metricLabel}
                </span>
              </div>
            </figcaption>
            <span className="absolute -top-px start-0 h-px w-20 bg-gold" />
            <span className="absolute -start-px top-0 h-20 w-px bg-gold/50" />
          </figure>
        </Reveal>

        <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {steps.map((step, index) => {
            const photo = resolveMedia(
              content.mediaOverrides,
              `crane.${index % cranePhotos.length}`,
              cranePhotos[index % cranePhotos.length],
              locale,
            );
            return (
              <Reveal
                key={step.title}
                delay={index * 70}
                className={cn(
                  "group relative flex flex-col overflow-hidden border border-white/10 bg-coal/70",
                  index === 0 && "sm:col-span-2 lg:col-span-1",
                )}
              >
                <div className="relative aspect-[4/3] overflow-hidden">
                  <Image
                    src={photo.src}
                    alt={photo.alt}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    loading="lazy"
                    className="object-cover photo-grade brightness-[0.78] transition-transform duration-[1400ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.04]"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-obsidian/80 via-obsidian/10 to-transparent" />
                  <span className="tabular absolute start-4 top-4 font-display text-3xl italic text-gold/80">
                    {step.index}
                  </span>
                </div>

                <div className="flex flex-1 flex-col p-5 sm:p-6">
                  <span className="text-[0.55rem] font-semibold uppercase tracking-[0.2em] text-gold/80">
                    {step.title}
                  </span>
                  <h3 className="mt-2 font-display text-[1.45rem] leading-tight text-ivory">
                    {step.heading}
                  </h3>
                  <p className="mt-3 flex-1 text-[0.82rem] leading-[1.85] text-ivory/55">
                    {step.text}
                  </p>
                  <div className="mt-5 flex items-end justify-between gap-4 border-t border-white/10 pt-4">
                    <div>
                      <span className="tabular block text-xl font-light text-gold">
                        {step.metric}
                      </span>
                      <span className="mt-1 block text-[0.5rem] uppercase tracking-[0.18em] text-ivory/35">
                        {step.metricLabel}
                      </span>
                    </div>
                    <span className="flex h-8 w-8 items-center justify-center rounded-full border border-gold/25 text-[0.6rem] text-gold">
                      {step.index}
                    </span>
                  </div>
                </div>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}

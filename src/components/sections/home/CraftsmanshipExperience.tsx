"use client";

import Image from "next/image";
import { MoveDown } from "lucide-react";
import { useI18n } from "@/components/providers/I18nProvider";
import { useWorkspace } from "@/components/providers/WorkspaceProvider";
import { Reveal } from "@/components/ui/Reveal";
import { craftsmanshipPhotos } from "@/data/media";
import { resolveMedia } from "@/lib/cms";
import { cn } from "@/lib/utils";

/**
 * The craftsmanship sequence — an alternating editorial diary.
 *
 * Natural document flow only: each phase owns a photographic row that enters
 * with a reveal, and the whole section remains fully scrollable at 60 FPS on
 * low-end mobile because nothing is pinned or measured on scroll.
 */
export function CraftsmanshipExperience() {
  const { t, locale } = useI18n();
  const { content } = useWorkspace();
  const c = t.sections.craftsmanship;

  return (
    <section id="craftsmanship" className="relative overflow-hidden bg-ink py-20 sm:py-28">
      <div className="blueprint-grid pointer-events-none absolute inset-0 opacity-20" />
      <div className="pointer-events-none absolute -end-20 bottom-1/4 select-none text-[11rem] font-semibold leading-none tracking-tighter text-white/[0.02] sm:text-[18rem]">
        {t.sections.inline.craftsmanshipTag}
      </div>
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-gold/35 to-transparent" />

      <div className="container-lux relative">
        <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-end">
          <Reveal className="max-w-2xl">
            <span className="eyebrow">{c.eyebrow}</span>
            <h2 className="display-title mt-5 text-[clamp(2rem,4.4vw,4rem)] text-ivory">
              {c.title}
            </h2>
            <p className="mt-4 max-w-xl text-sm leading-[1.9] text-ivory/55">
              {c.description}
            </p>
          </Reveal>
          <Reveal delay={120} className="hidden items-center gap-3 text-ivory/35 lg:flex">
            <span className="text-[0.55rem] uppercase tracking-[0.2em]">{c.hint}</span>
            <MoveDown className="h-4 w-4 text-gold/60" />
          </Reveal>
        </div>

        <div className="mt-14 flex flex-col gap-6">
          {c.steps.map((step, index) => {
            const photo = resolveMedia(
              content.mediaOverrides,
              `craftsmanship.${index % craftsmanshipPhotos.length}`,
              craftsmanshipPhotos[index % craftsmanshipPhotos.length],
              locale,
            );
            const reversed = index % 2 === 1;

            return (
              <Reveal
                key={step.title}
                delay={40}
                className="group grid overflow-hidden border border-white/10 bg-coal/60 lg:grid-cols-2"
              >
                <div
                  className={cn(
                    "relative aspect-[16/11] overflow-hidden lg:aspect-auto lg:min-h-[360px]",
                    reversed && "lg:order-2",
                  )}
                >
                  <Image
                    src={photo.src}
                    alt={photo.alt}
                    fill
                    sizes="(max-width: 1024px) 100vw, 50vw"
                    loading="lazy"
                    className="object-cover photo-grade brightness-[0.82] transition-transform duration-[1500ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.035]"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-obsidian/65 via-transparent to-obsidian/15 lg:bg-gradient-to-r lg:from-obsidian/35 lg:to-transparent" />
                  <span className="tabular absolute bottom-5 start-5 font-display text-5xl italic leading-none text-gold/75 sm:text-6xl">
                    {step.index}
                  </span>
                </div>

                <div
                  className={cn(
                    "flex flex-col justify-center p-6 sm:p-9 lg:p-12",
                    reversed && "lg:order-1",
                  )}
                >
                  <span className="text-[0.56rem] font-semibold uppercase tracking-[0.22em] text-gold/85">
                    {c.stepLabel} · {step.title}
                  </span>
                  <h3 className="mt-3 font-display text-[clamp(1.6rem,3vw,2.5rem)] leading-tight text-ivory">
                    {step.heading}
                  </h3>
                  <p className="mt-4 max-w-md text-[0.86rem] leading-[1.9] text-ivory/55">
                    {step.text}
                  </p>
                  <div className="mt-7 flex items-end justify-between gap-6 border-t border-white/10 pt-5">
                    <div>
                      <span className="tabular block text-2xl font-light text-gold">
                        {step.metric}
                      </span>
                      <span className="mt-1 block text-[0.52rem] uppercase tracking-[0.18em] text-ivory/35">
                        {step.metricLabel}
                      </span>
                    </div>
                    <span className="hidden items-center gap-2 text-[0.52rem] uppercase tracking-[0.14em] text-ivory/30 sm:flex">
                      <span className="relative flex h-2 w-2">
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-gold/50" />
                        <span className="relative inline-flex h-2 w-2 rounded-full bg-gold" />
                      </span>
                      {c.liveNote}
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

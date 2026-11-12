"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, Gauge } from "lucide-react";
import { useI18n } from "@/components/providers/I18nProvider";
import { useWorkspace } from "@/components/providers/WorkspaceProvider";
import { Reveal } from "@/components/ui/Reveal";
import { fleet } from "@/data/fleet";
import { fleetPhotos } from "@/data/media";
import { resolveMedia } from "@/lib/cms";
import { cn } from "@/lib/utils";

/**
 * The fleet — a photographic equipment register.
 *
 * Every machine is a card in a natural grid, so the visitor can scan the whole
 * fleet without being pulled through a pinned tour. Images are lazy, the hover
 * motion is a single compositor transform, and the section never measures the
 * scroll position.
 */
export function FleetExperience() {
  const { t, l, locale, isRTL } = useI18n();
  const { content } = useWorkspace();
  const c = t.sections.fleet;

  return (
    <section id="fleet" className="relative overflow-hidden bg-obsidian py-20 sm:py-28">
      <div className="blueprint-grid pointer-events-none absolute inset-0 opacity-20" />
      <div className="atmo-glow pointer-events-none absolute inset-0 opacity-30" aria-hidden="true" />
      <div className="pointer-events-none absolute -start-10 top-16 select-none text-[11rem] font-semibold leading-none tracking-tighter text-white/[0.02] sm:text-[18rem]">
        FLEET
      </div>

      <div className="container-lux relative">
        <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-end">
          <Reveal className="max-w-2xl">
            <span className="eyebrow">{t.fleet.eyebrow}</span>
            <h2 className="display-title mt-5 text-[clamp(2rem,4.6vw,4.2rem)] text-ivory">
              {t.fleet.title}
            </h2>
            <p className="mt-4 max-w-xl text-sm leading-[1.9] text-ivory/65">
              {t.fleet.description}
            </p>
          </Reveal>

          <Reveal delay={120} className="flex flex-wrap gap-x-10 gap-y-5 border-s border-white/10 ps-6">
            {c.stats.map((stat) => (
              <div key={stat.label} className="flex flex-col gap-0.5">
                <span className="tabular text-2xl font-light text-gold">
                  {stat.value}
                  <span className="ms-1 text-[0.65rem] text-gold/60">{stat.suffix}</span>
                </span>
                <span className="text-[0.52rem] uppercase tracking-[0.16em] text-ivory/45">
                  {stat.label}
                </span>
              </div>
            ))}
          </Reveal>
        </div>

        <div className="mt-12 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {fleet.map((machine, index) => {
            const photo = resolveMedia(
              content.mediaOverrides,
              `fleet.${machine.art}`,
              fleetPhotos[machine.art],
              locale,
            );
            const specs = [
              { label: t.fleet.specs.capacity, value: machine.capacity },
              { label: t.fleet.specs.reach, value: machine.reach },
              { label: t.fleet.specs.units, value: machine.units },
              { label: t.fleet.specs.year, value: machine.year },
            ];

            return (
              <Reveal
                key={machine.id}
                delay={index * 60}
                className="group flex flex-col overflow-hidden border border-white/10 bg-coal/60"
              >
                <div className="relative aspect-[16/10] overflow-hidden">
                  <Image
                    src={photo.src}
                    alt={photo.alt}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 33vw"
                    loading="lazy"
                    className="object-cover photo-grade brightness-[0.8] transition-transform duration-[1400ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.04]"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-obsidian/80 via-obsidian/10 to-transparent" />
                  <span className="absolute start-4 top-4 border border-gold/30 bg-obsidian/55 px-2.5 py-1 text-[0.5rem] font-semibold uppercase tracking-[0.16em] text-gold backdrop-blur-sm">
                    {l(machine.category)}
                  </span>
                  <span className="live-pill absolute end-4 top-4">{c.ready}</span>
                  <div className="absolute inset-x-4 bottom-4 flex items-end justify-between gap-4">
                    <h3 className="font-display text-[clamp(1.5rem,2.4vw,2rem)] leading-none text-ivory">
                      {machine.name}
                    </h3>
                    <span className="tabular text-[0.55rem] text-ivory/55">0{index + 1}</span>
                  </div>
                </div>

                <div className="flex flex-1 flex-col p-5 sm:p-6">
                  <p className="flex-1 text-[0.82rem] leading-[1.85] text-ivory/65">
                    {l(machine.description)}
                  </p>

                  <div className="mt-5 grid grid-cols-2 border-t border-white/10 pt-4">
                    {specs.map((spec, specIndex) => (
                      <div
                        key={spec.label}
                        className={cn(
                          "flex flex-col gap-1 py-2",
                          specIndex % 2 === 0 && "border-e border-white/10 pe-4",
                          specIndex % 2 === 1 && "ps-4",
                          specIndex < 2 && "border-b border-white/10",
                        )}
                      >
                        <span className="tabular text-base font-light text-ivory">
                          {spec.value}
                        </span>
                        <span className="text-[0.48rem] uppercase tracking-[0.16em] text-ivory/40">
                          {spec.label}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </Reveal>
            );
          })}
        </div>

        <Reveal delay={80} className="mt-10 flex flex-wrap items-center justify-between gap-5 border-t border-white/10 pt-6">
          <span className="flex items-center gap-3 text-[0.55rem] uppercase tracking-[0.14em] text-ivory/45">
            <Gauge className="h-4 w-4 text-gold" />
            {c.liveNote}
          </span>
          <Link
            href="/contact"
            className="group inline-flex items-center gap-3 text-[0.62rem] font-semibold uppercase tracking-[0.16em] text-ivory/65 transition-colors hover:text-gold"
          >
            {t.fleet.cta}
            <span className="flex h-9 w-9 items-center justify-center rounded-full border border-white/15 transition-colors group-hover:border-gold">
              <ArrowUpRight className={cn("h-4 w-4", isRTL && "-scale-x-100")} />
            </span>
          </Link>
        </Reveal>
      </div>
    </section>
  );
}

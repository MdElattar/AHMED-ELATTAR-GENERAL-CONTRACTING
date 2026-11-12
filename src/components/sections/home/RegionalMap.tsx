"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowUpRight, Building2, MapPin } from "lucide-react";
import { useI18n } from "@/components/providers/I18nProvider";
import { Reveal } from "@/components/ui/Reveal";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { regionMarkers, regionStats } from "@/data/company";
import { cn } from "@/lib/utils";

const statusTone = {
  delivered: "bg-emerald-400/70",
  active: "bg-gold",
  upcoming: "bg-sky-400/70",
};

export function RegionalMap() {
  const { t, locale, l, isRTL } = useI18n();
  const c = t.sections.regionalMap;
  const [activeId, setActiveId] = useState(regionMarkers[0].id);
  const active = regionMarkers.find((marker) => marker.id === activeId) ?? regionMarkers[0];

  return (
    <section className="relative overflow-hidden bg-ink">
      <div className="blueprint-grid pointer-events-none absolute inset-0 opacity-30" />
      <div className="pointer-events-none absolute start-1/3 top-0 h-[420px] w-[420px] rounded-full bg-gold/[0.05] blur-[130px]" />
      <div className="container-lux section-pad relative">
        <SectionHeading
          eyebrow={c.eyebrow}
          title={c.title}
          description={c.description}
          titleClassName="max-w-3xl"
        />

        <div className="mt-12 grid gap-px overflow-hidden border border-white/10 bg-white/10 lg:grid-cols-[1.45fr_0.55fr]">
          <div className="relative min-h-[420px] overflow-hidden bg-coal p-4 sm:min-h-[520px] sm:p-6">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_55%_48%,rgba(201,164,92,0.10),transparent_55%)]" />
            <svg
              viewBox="0 0 1000 600"
              className="absolute inset-0 h-full w-full"
              aria-hidden="true"
            >
              <defs>
                <linearGradient id="map-land" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#1b1f25" />
                  <stop offset="100%" stopColor="#101317" />
                </linearGradient>
                <linearGradient id="map-glow" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#c9a45c" stopOpacity="0.5" />
                  <stop offset="100%" stopColor="#c9a45c" stopOpacity="0" />
                </linearGradient>
              </defs>
              <g opacity="0.5">
                {Array.from({ length: 17 }).map((_, index) => (
                  <line
                    key={`v-${index}`}
                    x1={index * 62.5}
                    y1="0"
                    x2={index * 62.5}
                    y2="600"
                    stroke="white"
                    strokeOpacity="0.045"
                    strokeWidth="1"
                  />
                ))}
                {Array.from({ length: 11 }).map((_, index) => (
                  <line
                    key={`h-${index}`}
                    x1="0"
                    y1={index * 60}
                    x2="1000"
                    y2={index * 60}
                    stroke="white"
                    strokeOpacity="0.045"
                    strokeWidth="1"
                  />
                ))}
              </g>

              <path
                d="M 292 86 L 402 62 L 500 88 L 588 68 L 672 102 L 756 138 L 826 208 L 888 294 L 900 384 L 860 462 L 792 526 L 690 556 L 590 532 L 500 482 L 430 436 L 356 396 L 296 336 L 260 248 L 268 158 Z"
                fill="url(#map-land)"
                stroke="#c9a45c"
                strokeOpacity="0.28"
                strokeWidth="1.4"
              />
              <path
                d="M 268 158 L 250 240 L 296 336 L 356 396 L 430 436 L 500 482 L 590 532"
                fill="none"
                stroke="url(#map-glow)"
                strokeWidth="2"
              />
              <path
                d="M 672 102 L 720 180 L 756 260 L 792 340 L 826 430 L 792 526"
                fill="none"
                stroke="#c9a45c"
                strokeOpacity="0.16"
                strokeWidth="1"
                strokeDasharray="5 7"
              />
              <path
                d="M 548 328 C 620 300, 700 312, 766 362"
                fill="none"
                stroke="#c9a45c"
                strokeOpacity="0.2"
                strokeWidth="1"
                strokeDasharray="4 8"
              />
            </svg>

            <div className="absolute inset-0">
              {regionMarkers.map((marker) => {
                const isActive = marker.id === active.id;
                return (
                  <button
                    key={marker.id}
                    type="button"
                    onClick={() => setActiveId(marker.id)}
                    aria-label={`${l(marker.city)} — ${marker.projects} ${c.projects}`}
                    className="group absolute -translate-x-1/2 -translate-y-1/2"
                    style={{ left: `${marker.x / 10}%`, top: `${marker.y / 6}%` }}
                  >
                    <span
                      className={cn(
                        "absolute inset-0 -m-3 rounded-full border transition-all duration-500",
                        isActive
                          ? "scale-100 border-gold/60 bg-gold/10"
                          : "scale-75 border-transparent group-hover:border-gold/30",
                      )}
                    />
                    <span
                      className={cn(
                        "relative flex h-3 w-3 items-center justify-center rounded-full transition-all duration-300",
                        isActive ? "bg-gold" : "bg-ivory/50 group-hover:bg-gold",
                      )}
                    >
                      {isActive ? (
                        <span className="absolute h-6 w-6 animate-ping rounded-full bg-gold/30" />
                      ) : null}
                    </span>
                    <span
                      className={cn(
                        "absolute start-1/2 top-5 -translate-x-1/2 whitespace-nowrap text-[0.55rem] font-medium uppercase tracking-[0.14em] transition-colors",
                        isActive ? "text-gold" : "text-ivory/35 group-hover:text-ivory/70",
                      )}
                    >
                      {l(marker.city)}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="absolute inset-x-4 bottom-4 flex flex-wrap gap-3 border border-white/10 bg-obsidian/60 px-4 py-3 backdrop-blur sm:inset-x-6 sm:bottom-6">
              {Object.entries(c.status).map(([status, label]) => (
                <span
                  key={status}
                  className="flex items-center gap-2 text-[0.52rem] uppercase tracking-[0.14em] text-ivory/40"
                >
                  <span className={cn("h-1.5 w-1.5 rounded-full", statusTone[status as keyof typeof statusTone])} />
                  {label}
                </span>
              ))}
              <span className="ms-auto hidden items-center gap-2 text-[0.52rem] uppercase tracking-[0.14em] text-ivory/30 sm:flex">
                <MapPin className="h-3 w-3 text-gold" />
                {c.select}
              </span>
            </div>
          </div>

          <div className="flex flex-col justify-between bg-coal p-7 sm:p-8">
            <div>
              <span className="eyebrow">{c.flagship}</span>
              <h3 className="mt-4 font-display text-[clamp(2rem,3.5vw,3rem)] leading-tight text-ivory">
                {l(active.city)}
              </h3>
              <p className="mt-1 text-[0.7rem] uppercase tracking-[0.16em] text-ivory/35">
                {l(active.country)}
              </p>

              <div className="mt-7 border border-white/10 bg-obsidian/40 p-5">
                <div className="flex items-center justify-between gap-4">
                  <span className="text-[0.52rem] uppercase tracking-[0.16em] text-ivory/35">
                    {c.status[active.status]}
                  </span>
                  <span className={cn("h-1.5 w-1.5 rounded-full", statusTone[active.status])} />
                </div>
                <p className="mt-3 text-sm leading-relaxed text-ivory/75">{l(active.flagship)}</p>
                <div className="mt-5 flex items-end justify-between border-t border-white/10 pt-4">
                  <div>
                    <p className="tabular text-2xl font-light text-gold">{active.projects}</p>
                    <p className="mt-1 text-[0.5rem] uppercase tracking-[0.14em] text-ivory/30">
                      {c.projects}
                    </p>
                  </div>
                  <p className="text-sm font-medium text-ivory/60">{active.value}</p>
                </div>
              </div>
            </div>

            <div className="mt-7">
              <div className="grid grid-cols-2 gap-px overflow-hidden border border-white/10 bg-white/10">
                {[
                  { value: `${regionStats.countries}`, label: c.countries },
                  { value: `${regionStats.projects}+`, label: c.projects },
                  { value: regionStats.value, label: c.value },
                  { value: `${regionStats.cities}`, label: c.cities },
                ].map((item) => (
                  <div key={item.label} className="bg-obsidian/60 p-4">
                    <p className="tabular text-lg font-light text-ivory">{item.value}</p>
                    <p className="mt-1 text-[0.48rem] uppercase tracking-[0.14em] text-ivory/30">
                      {item.label}
                    </p>
                  </div>
                ))}
              </div>
              <Link
                href="/projects"
                className="group mt-5 inline-flex items-center gap-3 text-[0.62rem] font-semibold uppercase tracking-[0.16em] text-ivory/55 transition-colors hover:text-gold"
              >
                {c.cta}
                <ArrowUpRight className={cn("h-3.5 w-3.5", isRTL && "-scale-x-100")} />
              </Link>
            </div>
          </div>
        </div>

        <Reveal delay={120}>
          <div className="mt-6 flex items-center gap-3 text-[0.58rem] uppercase tracking-[0.16em] text-ivory/25">
            <Building2 className="h-3.5 w-3.5 text-gold/70" />
            {locale === "ar"
              ? "محفظة موثقة عبر أربع دول · بيانات محدثة ٢٠٢٦"
              : "Documented portfolio across four countries · Updated 2026"}
          </div>
        </Reveal>
      </div>
    </section>
  );
}

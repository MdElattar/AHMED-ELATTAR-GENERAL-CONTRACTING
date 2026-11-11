"use client";

import Image from "next/image";
import Link from "next/link";
import { startTransition, useCallback, useRef, useState } from "react";
import { ArrowUpRight, Gauge, MoveDown } from "lucide-react";
import { useI18n } from "@/components/providers/I18nProvider";
import { useSmoothScroll } from "@/components/providers/SmoothScroll";
import { SpotlightCard } from "@/components/ui/SpotlightCard";
import { fleet } from "@/data/fleet";
import { fleetPhotos } from "@/data/media";
import { pinEndForSteps } from "@/lib/scroll/pin";
import { usePinnedScroll } from "@/lib/scroll/usePinnedScroll";
import { cn } from "@/lib/utils";

const copy = {
  ar: {
    ready: "جاهزة للتشغيل",
    liveNote: "مواقع الأسطول وساعات التشغيل تُتابع من غرفة العمليات",
    hint: "مرّر لاستعراض الأسطول",
    stats: [
      { value: "٧٥٠", suffix: "طن", label: "أقصى قدرة رفع" },
      { value: "٧٢", suffix: "+", label: "معدة ثقيلة" },
      { value: "٢٤/٧", suffix: "", label: "دعم ميداني" },
    ],
  },
  en: {
    ready: "Deployment ready",
    liveNote: "Fleet locations and operating hours are tracked from the operations room",
    hint: "Scroll to tour the fleet",
    stats: [
      { value: "750", suffix: "T", label: "Maximum lift" },
      { value: "72", suffix: "+", label: "Heavy machines" },
      { value: "24/7", suffix: "", label: "Field support" },
    ],
  },
};

/**
 * The fleet sequence — a pinned, scroll-scrubbed machinery theatre.
 *
 * Six machines resolve to `+=360%` (60vh of scroll per machine) with
 * `scrub: 0.5`. The full-bleed photography crossfades between machines while
 * the glass spec card mirrors the active unit; the selector rail jumps
 * straight to any machine through the shared Lenis smooth scroll, and the
 * bottom hairline tracks delivery through the entire tour.
 */
export function FleetExperience() {
  const sectionRef = useRef<HTMLElement | null>(null);
  const progressRef = useRef(0);
  const fillRef = useRef<HTMLDivElement | null>(null);
  const photoWrapRef = useRef<HTMLDivElement | null>(null);
  const [active, setActive] = useState(0);
  const { t, l, locale, isRTL } = useI18n();
  const { scrollTo } = useSmoothScroll();
  const c = copy[locale];

  const handleActive = useCallback((index: number) => {
    startTransition(() => setActive(index));
  }, []);

  const handleProgress = useCallback((value: number) => {
    if (photoWrapRef.current) {
      // Heavy-machinery documentary zoom, scrubbed to the scrollbar.
      const scale = 1.05 + value * 0.1;
      const drift = (0.5 - value) * 2.4;
      photoWrapRef.current.style.transform = `scale(${scale}) translate3d(${drift}%, 0, 0)`;
    }
  }, []);

  const triggerRef = usePinnedScroll({
    sectionRef,
    progressRef,
    fillRef,
    stepCount: fleet.length,
    // Six machines → `+=360%`, keeping the scroll budget proportional to the
    // tour length so every machine resolves naturally.
    end: pinEndForSteps(fleet.length),
    onActive: handleActive,
    onProgress: handleProgress,
  });

  const jumpTo = (index: number) => {
    const trigger = triggerRef.current;
    if (!trigger) return;
    const span = trigger.end - trigger.start;
    const ratio = 0.1 + (index / Math.max(1, fleet.length - 1)) * 0.8;
    scrollTo(trigger.start + span * ratio, 0);
  };

  const machine = fleet[active] ?? fleet[0];

  const specs = [
    { label: t.fleet.specs.capacity, value: machine.capacity },
    { label: t.fleet.specs.reach, value: machine.reach },
    { label: t.fleet.specs.units, value: machine.units },
    { label: t.fleet.specs.year, value: machine.year },
  ];

  return (
    <section
      ref={sectionRef}
      id="fleet"
      className="relative h-[100svh] overflow-hidden bg-ink"
    >
      <div ref={photoWrapRef} className="absolute inset-0 will-change-transform">
        {fleet.map((item, index) => {
          const asset = fleetPhotos[item.art];
          return (
            <div
              key={item.id}
              className={cn(
                "absolute inset-0 transition-opacity duration-[1400ms] ease-[cubic-bezier(0.16,1,0.3,1)]",
                index === active ? "opacity-100" : "opacity-0",
              )}
            >
              <Image
                src={asset.src}
                alt={asset.alt}
                fill
                sizes="100vw"
                className="object-cover photo-grade brightness-[0.68]"
              />
            </div>
          );
        })}
      </div>

      <div className="blueprint-grid pointer-events-none absolute inset-0 opacity-30" />
      <div className="atmo-glow pointer-events-none absolute inset-0 opacity-50" aria-hidden="true" />
      <div className="pointer-events-none absolute inset-0 z-[2] bg-gradient-to-b from-ink/90 via-ink/35 to-ink" />
      <div className="pointer-events-none absolute inset-0 z-[2] bg-[radial-gradient(ellipse_at_22%_55%,rgba(10,11,14,0.8),transparent_66%)]" />
      <div className="pointer-events-none absolute inset-0 z-[2] bg-[radial-gradient(ellipse_at_80%_18%,rgba(212,175,55,0.15),transparent_55%)]" />
      <div className="pointer-events-none absolute -start-10 top-14 z-[2] select-none text-[13rem] font-semibold leading-none tracking-tighter text-white/[0.022] sm:text-[20rem]">
        FLEET
      </div>

      <div className="relative z-10 flex h-full flex-col justify-between pb-6 pt-28 sm:pb-8 sm:pt-32">
        <div className="container-lux grid gap-6 lg:grid-cols-[1fr_auto] lg:items-start">
          <div className="max-w-xl">
            <span className="eyebrow">{t.fleet.eyebrow}</span>
            <h2 className="display-title text-shadow-lux mt-5 text-[clamp(1.9rem,4.6vw,4.4rem)] text-ivory">
              {t.fleet.title}
            </h2>
            <p className="text-shadow-lux mt-4 hidden max-w-md text-sm leading-relaxed text-ivory/55 sm:block">
              {t.fleet.description}
            </p>
          </div>

          <div className="hidden items-end gap-5 md:flex">
            <div className="glass-panel-soft flex flex-col items-end gap-2 px-4 py-3">
              <span className="text-[0.55rem] uppercase tracking-[0.2em] text-ivory/35">
                {c.hint}
              </span>
              <div className="h-12 w-px overflow-hidden bg-white/15">
                <div className="scroll-dot h-3 w-px bg-gold" />
              </div>
            </div>
            <MoveDown className="mb-1 h-4 w-4 text-gold/60" />
          </div>
        </div>

        <div className="container-lux grid items-end gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:gap-14">
          {/* Machine selector rail */}
          <div className="hidden flex-col gap-6 lg:flex">
            <div className="flex flex-col" role="tablist" aria-label={t.fleet.tabsLabel}>
              {fleet.map((item, index) => (
                <button
                  key={item.id}
                  type="button"
                  role="tab"
                  aria-selected={active === index}
                  onClick={() => jumpTo(index)}
                  className={cn(
                    "group flex w-full items-center justify-between gap-4 border-b border-white/10 py-3 text-start transition-colors duration-300",
                    active === index
                      ? "text-gold"
                      : "text-ivory/45 hover:text-ivory/75",
                  )}
                >
                  <span className="flex items-center gap-4">
                    <span
                      className={cn(
                        "tabular text-[0.55rem] transition-colors",
                        active === index ? "text-gold" : "text-ivory/20",
                      )}
                    >
                      0{index + 1}
                    </span>
                    <span className="flex flex-col gap-0.5">
                      <span className="text-sm font-medium tracking-wide">{item.name}</span>
                      <span className="text-[0.52rem] uppercase tracking-[0.16em] text-ivory/25">
                        {l(item.category)}
                      </span>
                    </span>
                  </span>
                  <span className="flex items-center gap-3">
                    {item.featured ? (
                      <span className="hidden border border-gold/25 px-2 py-0.5 text-[0.48rem] uppercase tracking-[0.14em] text-gold/70 xl:inline">
                        {t.fleet.featured}
                      </span>
                    ) : null}
                    <span
                      className={cn(
                        "h-6 w-px transition-all duration-500",
                        active === index ? "bg-gold" : "bg-transparent",
                      )}
                    />
                  </span>
                </button>
              ))}
            </div>

            <div className="flex flex-wrap gap-x-8 gap-y-4 border-t border-white/10 pt-5">
              {c.stats.map((stat) => (
                <div key={stat.label} className="flex flex-col gap-0.5">
                  <span className="tabular text-lg font-light text-gold">
                    {stat.value}
                    <span className="ms-0.5 text-[0.6rem] text-gold/60">{stat.suffix}</span>
                  </span>
                  <span className="text-[0.5rem] uppercase tracking-[0.14em] text-ivory/30">
                    {stat.label}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Machine spec card */}
          <div className="relative">
            <div className="mb-5 flex gap-1.5 overflow-x-auto pb-1 no-scrollbar lg:hidden">
              {fleet.map((item, index) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => jumpTo(index)}
                  aria-current={active === index ? "step" : undefined}
                  className={cn(
                    "shrink-0 border px-3 py-1.5 text-[0.55rem] font-semibold uppercase tracking-[0.12em] transition-colors",
                    active === index
                      ? "border-gold/70 text-gold"
                      : "border-white/12 text-ivory/40",
                  )}
                >
                  {item.name}
                </button>
              ))}
            </div>

            <SpotlightCard className="spotlight-card--media relative overflow-hidden border border-white/12 bg-coal/70 backdrop-blur-xl">
              <div className="flex items-start justify-between gap-6 border-b border-white/10 p-6 sm:p-7">
                <div>
                  <span className="text-[0.55rem] uppercase tracking-[0.2em] text-gold">
                    {l(machine.category)}
                  </span>
                  <h3 className="mt-2 font-display text-[clamp(1.9rem,3.6vw,3rem)] leading-none text-ivory">
                    {machine.name}
                  </h3>
                </div>
                <span className="live-pill">{c.ready}</span>
              </div>

              <div className="grid grid-cols-2 border-t border-white/10 sm:grid-cols-4">
                {specs.map((spec, index) => (
                  <div
                    key={spec.label}
                    className={cn(
                      "flex flex-col gap-1.5 p-4 sm:p-5",
                      index !== specs.length - 1 && "border-e border-white/10",
                      index < 2 && "border-b border-white/10 sm:border-b-0",
                    )}
                  >
                    <span className="tabular text-lg font-light text-ivory">{spec.value}</span>
                    <span className="text-[0.5rem] uppercase tracking-[0.16em] text-ivory/30">
                      {spec.label}
                    </span>
                  </div>
                ))}
              </div>

              <div className="border-t border-white/10 p-6 sm:p-7">
                <p className="hidden max-w-xl text-[0.82rem] leading-relaxed text-ivory/50 sm:block">
                  {l(machine.description)}
                </p>
                <div className="mt-5 flex flex-wrap items-center justify-between gap-4 border-t border-white/10 pt-5">
                  <span className="hidden items-center gap-3 text-[0.55rem] uppercase tracking-[0.14em] text-ivory/40 sm:flex">
                    <Gauge className="h-3.5 w-3.5 text-gold" />
                    {c.liveNote}
                  </span>
                  <Link
                    href="/contact"
                    className="group inline-flex items-center gap-3 text-[0.62rem] font-semibold uppercase tracking-[0.16em] text-ivory/60 transition-colors hover:text-gold"
                  >
                    {t.fleet.cta}
                    <span className="flex h-8 w-8 items-center justify-center rounded-full border border-white/15 transition-colors group-hover:border-gold">
                      <ArrowUpRight className={cn("h-3.5 w-3.5", isRTL && "-scale-x-100")} />
                    </span>
                  </Link>
                </div>
              </div>
            </SpotlightCard>
          </div>
        </div>
      </div>

      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-[2] h-16 bg-gradient-to-t from-ink to-transparent" />
      <div className="absolute inset-x-0 bottom-0 z-20 h-[2px] bg-white/10">
        <div
          ref={fillRef}
          className="h-full w-0 bg-gradient-to-r from-gold-dark via-gold to-gold-light shadow-[0_0_18px_rgb(var(--atmo-glow)/0.6)]"
        />
      </div>
      <span className="sr-only" aria-live="polite">
        {machine.name}
      </span>
    </section>
  );
}

"use client";

import Image from "next/image";
import { startTransition, useCallback, useRef, useState } from "react";
import { MoveDown } from "lucide-react";
import { useI18n } from "@/components/providers/I18nProvider";
import { useSmoothScroll } from "@/components/providers/SmoothScroll";
import { PhotoLayer } from "@/components/media/PhotoLayer";
import { SpotlightCard } from "@/components/ui/SpotlightCard";
import { TimelineTracker } from "@/components/ui/TimelineTracker";
import { cranePhotos } from "@/data/media";
import { pinEndForSteps } from "@/lib/scroll/pin";
import { usePinnedScroll } from "@/lib/scroll/usePinnedScroll";
import { cn } from "@/lib/utils";

/**
 * The crane sequence — a fully pinned, scroll-scrubbed mega-project reel.
 *
 * The stage is pinned for `+=300%` (five milestones × 60vh) with
 * `scrub: 0.5`, so the visitor advances naturally through Precision → Power
 * → Commitment → Assembly → Handover and can never be trapped inside a
 * single frame: the pin spacing reserves the scroll budget up front and the
 * smoothed tween guarantees every milestone resolves before the section
 * releases.
 *
 * All imagery is high-resolution site photography. The background slowly
 * zooms with the scrubbed progress (an imperative transform — React never
 * re-renders on scroll) while the step cards, the timeline rail, and the
 * bottom progress hairline all consume the same inertial value.
 */
export function CraneExperience() {
  const sectionRef = useRef<HTMLElement | null>(null);
  const progressRef = useRef(0);
  const fillRef = useRef<HTMLDivElement | null>(null);
  const photoWrapRef = useRef<HTMLDivElement | null>(null);
  const timelineFillRef = useRef<HTMLDivElement | null>(null);
  const mobileTimelineFillRef = useRef<HTMLDivElement | null>(null);
  const [active, setActive] = useState(0);
  const { t, locale } = useI18n();
  const { scrollTo } = useSmoothScroll();

  // Only the discrete step index crosses the React boundary (it changes four
  // times per section), wrapped in a transition so it can never interrupt the
  // paint loop mid-scrub.
  const handleActive = useCallback((index: number) => {
    startTransition(() => setActive(index));
  }, []);

  // The rails and the cinematic background drift are also imperative. They
  // are driven by the same scrubbed tween, so the fill, the zoom, and the
  // active card always show the same moment.
  const handleProgress = useCallback((value: number) => {
    if (timelineFillRef.current) {
      timelineFillRef.current.style.transform = `scaleY(${value})`;
    }
    if (mobileTimelineFillRef.current) {
      mobileTimelineFillRef.current.style.transform = `scaleX(${value})`;
    }
    if (photoWrapRef.current) {
      // Golden-hour documentary zoom: the frame breathes 1.045 → 1.14 while
      // the section is pinned, adding depth without a single re-render.
      const scale = 1.045 + value * 0.095;
      const drift = (value - 0.5) * 2.2;
      photoWrapRef.current.style.transform = `scale(${scale}) translate3d(${drift}%, ${-drift * 0.6}%, 0)`;
    }
  }, []);

  const steps = t.crane.steps;

  const triggerRef = usePinnedScroll({
    sectionRef,
    progressRef,
    fillRef,
    stepCount: steps.length,
    // Five steps → `+=300%`: 60vh of scroll per card, which is the cinematic
    // budget this sequence was designed around. The helper keeps shorter
    // sequences proportional instead of forcing an arbitrary 300%.
    end: pinEndForSteps(steps.length),
    onActive: handleActive,
    onProgress: handleProgress,
  });

  const jumpTo = (index: number) => {
    const trigger = triggerRef.current;
    if (!trigger) return;
    const span = trigger.end - trigger.start;
    const ratio = 0.12 + (index / Math.max(1, steps.length - 1)) * 0.76;
    scrollTo(trigger.start + span * ratio, 0);
  };

  const trackerSteps = steps.map((step) => ({
    title: step.title,
    subtitle: step.metricLabel,
  }));

  return (
    <section
      ref={sectionRef}
      id="crane"
      className="relative h-[100svh] overflow-hidden bg-obsidian"
    >
      <div ref={photoWrapRef} className="absolute inset-0 will-change-transform">
        <PhotoLayer
          images={cranePhotos}
          active={active}
          sizes="100vw"
          overlay="none"
          imageClassName="brightness-[0.74]"
        />
      </div>

      <div className="atmo-glow pointer-events-none absolute inset-0 z-[2] opacity-60" aria-hidden="true" />
      <div className="pointer-events-none absolute inset-0 z-[2] bg-gradient-to-b from-obsidian/88 via-obsidian/12 to-obsidian" />
      <div className="pointer-events-none absolute inset-0 z-[2] bg-[radial-gradient(ellipse_at_25%_50%,rgba(6,7,8,0.74),transparent_66%)]" />
      <div className="pointer-events-none absolute inset-0 z-[2] bg-[radial-gradient(ellipse_at_82%_12%,rgba(212,175,55,0.16),transparent_55%)]" />
      <div className="pointer-events-none absolute -start-16 top-1/3 z-[2] select-none text-[13rem] font-semibold leading-none tracking-tighter text-white/[0.022] sm:text-[19rem]">
        {locale === "ar" ? "رفع" : "LIFT"}
      </div>

      <div className="relative z-10 flex h-full flex-col justify-between pb-6 pt-28 sm:pb-8 sm:pt-32">
        <div className="container-lux grid gap-6 lg:grid-cols-[1fr_auto] lg:items-start">
          <div className="max-w-xl">
            <span className="eyebrow">{t.crane.eyebrow}</span>
            <h2 className="display-title text-shadow-lux mt-5 text-[clamp(1.9rem,4.6vw,4.4rem)] text-ivory">
              {t.crane.title}
            </h2>
            <p className="text-shadow-lux mt-4 hidden max-w-md text-sm leading-relaxed text-ivory/55 sm:block">
              {t.crane.description}
            </p>
          </div>

          <div className="hidden items-end gap-5 md:flex">
            <div className="glass-panel-soft flex flex-col items-end gap-2 px-4 py-3">
              <span className="text-[0.55rem] uppercase tracking-[0.2em] text-ivory/35">
                {t.crane.hint}
              </span>
              <div className="h-12 w-px overflow-hidden bg-white/15">
                <div className="scroll-dot h-3 w-px bg-gold" />
              </div>
            </div>
            <MoveDown className="mb-1 h-4 w-4 text-gold/60" />
          </div>
        </div>

        <div className="container-lux grid items-end gap-7 lg:grid-cols-[1fr_430px]">
          <div className="hidden flex-col gap-5 pb-2 lg:flex">
            <TimelineTracker
              steps={trackerSteps}
              active={active}
              onSelect={jumpTo}
              label={t.crane.stepLabel}
              fillRef={timelineFillRef}
            />

            <div className="glass-panel-soft flex items-center gap-3 px-4 py-3">
              <span className="relative flex h-2 w-2 shrink-0">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-gold/60" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-gold" />
              </span>
              <p className="text-[0.55rem] uppercase leading-relaxed tracking-[0.14em] text-ivory/40">
                {locale === "ar"
                  ? "بيانات الموقع تُحدَّث لحظياً مع حركة الرافعة"
                  : "Site telemetry tracks every crane movement in real time"}
              </p>
            </div>
          </div>

          <div className="relative">
            <div className="mb-4 lg:hidden">
              <TimelineTracker
                steps={trackerSteps}
                active={active}
                onSelect={jumpTo}
                label={t.crane.stepLabel}
                orientation="horizontal"
                fillRef={mobileTimelineFillRef}
              />
            </div>

            <div className="relative min-h-[280px] sm:min-h-[330px] lg:min-h-[340px]">
              <span
                aria-hidden="true"
                className="pointer-events-none absolute -top-10 end-2 z-0 select-none font-display text-[7rem] italic leading-none text-gold/10 sm:text-[9rem]"
              >
                {steps[active]?.index}
              </span>

              {steps.map((step, index) => (
                <SpotlightCard
                  as="article"
                  key={step.title}
                  aria-hidden={active !== index}
                  className={cn(
                    "spotlight-card--media absolute inset-0 overflow-hidden border border-white/12 bg-coal transition-all duration-700",
                    active === index
                      ? "pointer-events-auto translate-y-0 opacity-100"
                      : "pointer-events-none translate-y-5 opacity-0",
                  )}
                >
                  <Image
                    src={cranePhotos[index].src}
                    alt=""
                    fill
                    sizes="(max-width: 1024px) 100vw, 430px"
                    className="object-cover opacity-60 photo-grade"
                  />
                  <div className="absolute inset-0 z-[1] bg-gradient-to-b from-obsidian/25 via-obsidian/78 to-obsidian/96" />
                  <div className="absolute inset-0 z-[1] bg-[radial-gradient(ellipse_at_80%_10%,rgb(var(--atmo-glow)/0.16),transparent_55%)]" />

                  <div className="relative z-10 flex h-full flex-col justify-between p-6 sm:p-7">
                    <div>
                      <div className="flex items-center justify-between gap-4">
                        <span className="live-pill">
                          {locale === "ar" ? "مرحلة مباشرة" : "Live phase"}
                        </span>
                        <span className="font-display text-3xl italic text-gold/40">
                          {step.index}
                        </span>
                      </div>
                      <h3 className="mt-4 font-display text-[1.7rem] leading-tight text-ivory sm:text-[2rem]">
                        {step.heading}
                      </h3>
                      <p className="mt-3 text-[0.83rem] leading-[1.8] text-ivory/58">
                        {step.text}
                      </p>
                    </div>

                    <div className="mt-6 border-t border-white/10 pt-4">
                      <div className="flex items-end justify-between gap-4">
                        <div>
                          <div className="tabular text-2xl font-light text-gold">{step.metric}</div>
                          <div className="mt-1 text-[0.55rem] uppercase tracking-[0.18em] text-ivory/35">
                            {step.metricLabel}
                          </div>
                        </div>
                        <span className="flex h-8 w-8 items-center justify-center rounded-full border border-gold/30 text-[0.6rem] text-gold">
                          {step.index}
                        </span>
                      </div>
                      <div className="mt-4 h-px w-full overflow-hidden bg-white/10">
                        <div
                          className="h-full bg-gradient-to-r from-gold-dark via-gold to-gold-light transition-[width] duration-700"
                          style={{ width: `${((index + 1) / steps.length) * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  <span className="absolute -top-px start-0 z-10 h-px w-16 bg-gold" />
                  <span className="absolute -start-px top-0 z-10 h-16 w-px bg-gold/50" />
                </SpotlightCard>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-[2] h-16 bg-gradient-to-t from-obsidian to-transparent" />
      <div className="absolute inset-x-0 bottom-0 z-20 h-[2px] bg-white/10">
        <div
          ref={fillRef}
          className="h-full w-0 bg-gradient-to-r from-gold-dark via-gold to-gold-light shadow-[0_0_18px_rgb(var(--atmo-glow)/0.6)]"
        />
      </div>
      <span className="sr-only" aria-live="polite">
        {steps[active]?.title}
      </span>
      <div
        className="pointer-events-none absolute bottom-2 start-1/2 hidden h-8 w-px -translate-x-1/2 bg-gradient-to-b from-gold/50 to-transparent sm:block"
        aria-hidden="true"
      />
    </section>
  );
}

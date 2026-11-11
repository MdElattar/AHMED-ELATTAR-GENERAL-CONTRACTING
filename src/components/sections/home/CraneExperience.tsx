"use client";

import { useRef, useState } from "react";
import { MoveDown } from "lucide-react";
import { useI18n } from "@/components/providers/I18nProvider";
import { useSmoothScroll } from "@/components/providers/SmoothScroll";
import { ScrollCraneCanvas } from "@/components/three/CanvasLoader";
import { usePinnedScroll } from "@/lib/scroll/usePinnedScroll";
import { cn } from "@/lib/utils";

export function CraneExperience() {
  const sectionRef = useRef<HTMLElement | null>(null);
  const progressRef = useRef(0);
  const fillRef = useRef<HTMLDivElement | null>(null);
  const [active, setActive] = useState(0);
  const { t } = useI18n();
  const { scrollTo } = useSmoothScroll();

  const triggerRef = usePinnedScroll({
    sectionRef,
    progressRef,
    fillRef,
    stepCount: t.crane.steps.length,
    // ~40vh of scroll per step: enough room for each card/camera beat to land,
    // short enough that the pin never feels like it has trapped the page.
    end: "+=200%",
    onActive: setActive,
  });

  const jumpTo = (index: number) => {
    const trigger = triggerRef.current;
    if (!trigger) return;
    const span = trigger.end - trigger.start;
    const ratio = 0.12 + (index / Math.max(1, t.crane.steps.length - 1)) * 0.76;
    scrollTo(trigger.start + span * ratio, 0);
  };

  return (
    <section
      ref={sectionRef}
      id="crane"
      className="relative h-[100svh] overflow-hidden bg-obsidian"
    >
      <div className="absolute inset-0 z-0">
        <ScrollCraneCanvas progressRef={progressRef} />
      </div>

      <div className="pointer-events-none absolute inset-0 z-[1] bg-gradient-to-b from-obsidian/85 via-transparent to-obsidian" />
      <div className="pointer-events-none absolute inset-0 z-[1] bg-[radial-gradient(ellipse_at_25%_50%,rgba(6,7,8,0.72),transparent_65%)]" />

      <div className="relative z-10 flex h-full flex-col justify-between pb-6 pt-28 sm:pb-8 sm:pt-32">
        <div className="container-lux grid gap-6 lg:grid-cols-[1fr_auto] lg:items-start">
          <div className="max-w-xl">
            <span className="eyebrow">{t.crane.eyebrow}</span>
            <h2 className="display-title mt-5 text-[clamp(2.3rem,4.6vw,4.4rem)] text-ivory">
              {t.crane.title}
            </h2>
            <p className="mt-4 max-w-md text-sm leading-relaxed text-ivory/50">
              {t.crane.description}
            </p>
          </div>

          <div className="hidden items-end gap-5 md:flex">
            <div className="flex flex-col items-end gap-2">
              <span className="text-[0.58rem] uppercase tracking-[0.2em] text-ivory/30">
                {t.crane.hint}
              </span>
              <div className="h-14 w-px overflow-hidden bg-white/15">
                <div className="scroll-dot h-3 w-px bg-gold" />
              </div>
            </div>
            <MoveDown className="mb-1 h-4 w-4 text-gold/60" />
          </div>
        </div>

        <div className="container-lux grid items-end gap-7 lg:grid-cols-[1fr_430px]">
          <div className="hidden flex-col gap-4 pb-2 lg:flex">
            <div className="flex items-center gap-3">
              <span className="tabular text-[0.6rem] uppercase tracking-[0.2em] text-gold">
                {t.crane.stepLabel}
              </span>
              <span className="h-px w-8 bg-gold/40" />
              <span className="tabular text-[0.6rem] text-ivory/30">
                {String(active + 1).padStart(2, "0")} / 0{t.crane.steps.length}
              </span>
            </div>

            {t.crane.steps.map((step, index) => (
              <button
                key={step.title}
                type="button"
                onClick={() => jumpTo(index)}
                aria-current={active === index}
                className={cn(
                  "group flex items-center gap-4 py-1.5 text-start transition-colors duration-300",
                  active === index ? "text-ivory" : "text-ivory/35 hover:text-ivory/65",
                )}
              >
                <span
                  className={cn(
                    "tabular text-[0.58rem] transition-colors",
                    active === index ? "text-gold" : "text-ivory/25",
                  )}
                >
                  {step.index}
                </span>
                <span className="text-sm font-medium tracking-wide">{step.title}</span>
                <span
                  className={cn(
                    "h-px max-w-14 flex-1 bg-gold/50 transition-opacity duration-500",
                    active === index ? "opacity-100" : "opacity-0",
                  )}
                />
              </button>
            ))}

          </div>

          <div className="relative">
            <div className="mb-4 flex items-center justify-between lg:hidden">
              <div className="flex items-center gap-2">
                {t.crane.steps.map((step, index) => (
                  <button
                    key={step.title}
                    type="button"
                    onClick={() => jumpTo(index)}
                    aria-label={step.title}
                    aria-current={active === index}
                    className={cn(
                      "h-1.5 transition-all duration-500",
                      active === index ? "w-8 bg-gold" : "w-3 bg-white/20",
                    )}
                  />
                ))}
              </div>
              <span className="tabular text-[0.58rem] text-ivory/35">
                {String(active + 1).padStart(2, "0")} / 0{t.crane.steps.length}
              </span>
            </div>

            <div className="relative min-h-[335px] sm:min-h-[315px]">
              {t.crane.steps.map((step, index) => (
                <article
                  key={step.title}
                  aria-hidden={active !== index}
                  className={cn(
                    "absolute inset-0 flex flex-col justify-between border border-white/12 bg-obsidian/70 p-6 backdrop-blur-xl transition-all duration-700 sm:p-7",
                    active === index
                      ? "pointer-events-auto translate-y-0 opacity-100"
                      : "pointer-events-none translate-y-5 opacity-0",
                  )}
                  style={{ transitionTimingFunction: "cubic-bezier(0.16,1,0.3,1)" }}
                >
                  <span className="absolute -top-px start-0 h-px w-16 bg-gold" />
                  <span className="absolute -start-px top-0 h-16 w-px bg-gold/50" />

                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-[0.58rem] uppercase tracking-[0.2em] text-gold/80">
                        {step.title}
                      </span>
                      <span className="font-display text-3xl italic text-gold/30">
                        {step.index}
                      </span>
                    </div>
                    <h3 className="mt-4 font-display text-[1.7rem] leading-tight text-ivory sm:text-[2rem]">
                      {step.heading}
                    </h3>
                    <p className="mt-3 text-[0.83rem] leading-[1.8] text-ivory/50">
                      {step.text}
                    </p>
                  </div>

                  <div className="mt-6 flex items-end justify-between border-t border-white/10 pt-4">
                    <div>
                      <div className="tabular text-2xl font-light text-gold">{step.metric}</div>
                      <div className="mt-1 text-[0.55rem] uppercase tracking-[0.18em] text-ivory/30">
                        {step.metricLabel}
                      </div>
                    </div>
                    <span className="flex h-8 w-8 items-center justify-center rounded-full border border-gold/30 text-[0.6rem] text-gold">
                      {step.index}
                    </span>
                  </div>
                </article>
              ))}
            </div>

          </div>
        </div>
      </div>

      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-[2] h-16 bg-gradient-to-t from-obsidian to-transparent" />
      <div className="absolute inset-x-0 bottom-0 z-20 h-[2px] bg-white/10">
        <div ref={fillRef} className="h-full w-0 bg-gradient-to-r from-gold-dark via-gold to-gold-light" />
      </div>
      <span className="sr-only" aria-live="polite">
        {t.crane.steps[active]?.title}
      </span>
      <div
        className="pointer-events-none absolute bottom-2 start-1/2 hidden h-8 w-px -translate-x-1/2 bg-gradient-to-b from-gold/50 to-transparent sm:block"
        aria-hidden="true"
      />
    </section>
  );
}

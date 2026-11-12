"use client";

import type { RefObject } from "react";
import { cn } from "@/lib/utils";

export type TimelineStep = {
  title: string;
  subtitle?: string;
};

type TimelineTrackerProps = {
  steps: TimelineStep[];
  active: number;
  onSelect: (index: number) => void;
  label: string;
  orientation?: "vertical" | "horizontal";
  fillRef?: RefObject<HTMLDivElement | null>;
  className?: string;
};

/**
 * Precision step rail shared by the crane, craftsmanship, and fleet sequences.
 *
 * The active node is a discrete React value (it only changes four times per
 * section), while the connecting fill is an imperative DOM transform driven by
 * the scrubbed GSAP tween. That is why the rail can move at 60fps without
 * re-rendering the section.
 */
export function TimelineTracker({
  steps,
  active,
  onSelect,
  label,
  orientation = "vertical",
  fillRef,
  className,
}: TimelineTrackerProps) {
  const current = Math.max(0, Math.min(steps.length - 1, active));
  const counter = `${String(current + 1).padStart(2, "0")} / ${String(steps.length).padStart(2, "0")}`;

  if (orientation === "horizontal") {
    return (
      <div className={cn("flex flex-col gap-3", className)}>
        <div className="flex items-center justify-between">
          <span className="text-[0.55rem] font-semibold uppercase tracking-[0.2em] text-gold">
            {label}
          </span>
          <span className="tabular text-[0.55rem] tracking-[0.12em] text-ivory/45">{counter}</span>
        </div>

        <div className="relative flex items-start justify-between">
          <div className="timeline-rail absolute inset-x-0 top-[0.3rem] h-px" aria-hidden="true" />
          <div
            ref={fillRef}
            className="timeline-fill-x absolute inset-x-0 top-[0.3rem] h-px w-full"
            style={{ transform: "scaleX(0)" }}
            aria-hidden="true"
          />

          {steps.map((step, index) => {
            const isActive = index === current;
            return (
              <button
                key={`${step.title}-${index}`}
                type="button"
                onClick={() => onSelect(index)}
                aria-current={isActive ? "step" : undefined}
                aria-label={`${step.title}${step.subtitle ? ` — ${step.subtitle}` : ""}`}
                className="group relative z-10 flex min-w-0 flex-1 flex-col items-center gap-2"
              >
                <span
                  className={cn(
                    "h-2.5 w-2.5 rounded-full border transition-all duration-300",
                    isActive
                      ? "scale-125 border-gold bg-gold shadow-[0_0_18px_rgb(var(--atmo-glow)/0.6)]"
                      : "border-white/25 bg-obsidian group-hover:border-gold/60",
                  )}
                />
                <span
                  className={cn(
                    "max-w-16 truncate text-[0.44rem] font-medium uppercase tracking-[0.08em] transition-colors",
                    isActive ? "text-gold" : "text-ivory/40 group-hover:text-ivory/60",
                  )}
                >
                  {step.title}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col", className)}>
      <div className="flex items-center gap-3">
        <span className="text-[0.55rem] font-semibold uppercase tracking-[0.2em] text-gold">
          {label}
        </span>
        <span className="h-px w-8 bg-gold/40" />
        <span className="tabular text-[0.55rem] tracking-[0.12em] text-ivory/45">{counter}</span>
      </div>

      <div className="relative mt-5">
        <div className="timeline-rail absolute start-[0.44rem] top-2 bottom-2 w-px" aria-hidden="true" />
        <div
          ref={fillRef}
          className="timeline-fill absolute start-[0.44rem] top-2 h-[calc(100%-1rem)] w-px"
          style={{ transform: "scaleY(0)" }}
          aria-hidden="true"
        />

        <div className="flex flex-col gap-0.5">
          {steps.map((step, index) => {
            const isActive = index === current;
            return (
              <button
                key={`${step.title}-${index}`}
                type="button"
                onClick={() => onSelect(index)}
                aria-current={isActive ? "step" : undefined}
                aria-label={`${step.title}${step.subtitle ? ` — ${step.subtitle}` : ""}`}
                className="group relative flex w-full items-start gap-3 py-1.5 text-start"
              >
                <span
                  className={cn(
                    "relative z-10 mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border transition-all duration-300",
                    isActive
                      ? "border-gold bg-gold text-obsidian shadow-[0_0_18px_rgb(var(--atmo-glow)/0.55)]"
                      : "border-white/20 bg-obsidian text-transparent group-hover:border-gold/50",
                  )}
                >
                  <span className="h-1 w-1 rounded-full bg-current" />
                </span>

                <span className="min-w-0 flex-1">
                  <span
                    className={cn(
                      "block truncate text-[0.72rem] font-medium tracking-wide transition-colors",
                      isActive ? "text-ivory" : "text-ivory/50 group-hover:text-ivory/70",
                    )}
                  >
                    {step.title}
                  </span>
                  {step.subtitle ? (
                    <span className="mt-0.5 block truncate text-[0.48rem] uppercase tracking-[0.14em] text-ivory/35">
                      {step.subtitle}
                    </span>
                  ) : null}
                </span>

                <span
                  className={cn(
                    "mt-1 h-px w-6 shrink-0 bg-gold/60 transition-opacity duration-300",
                    isActive ? "opacity-100" : "opacity-0",
                  )}
                  aria-hidden="true"
                />
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

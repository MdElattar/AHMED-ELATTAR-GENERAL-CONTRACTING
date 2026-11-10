"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowUpRight, Clock3 } from "lucide-react";
import { useI18n } from "@/components/providers/I18nProvider";
import { useSmoothScroll } from "@/components/providers/SmoothScroll";
import { Reveal } from "@/components/ui/Reveal";
import { cn } from "@/lib/utils";

export function Process() {
  const { t, isRTL } = useI18n();
  const { scrollTo } = useSmoothScroll();
  const [active, setActive] = useState(0);
  const stepRefs = useRef<(HTMLDivElement | null)[]>([]);
  const activeRef = useRef(0);

  useEffect(() => {
    const nodes = stepRefs.current.filter(Boolean) as HTMLDivElement[];
    if (!nodes.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const index = Number((entry.target as HTMLElement).dataset.index ?? 0);
          if (index !== activeRef.current) {
            activeRef.current = index;
            setActive(index);
          }
        });
      },
      { threshold: 0.45, rootMargin: "-18% 0px -30% 0px" },
    );

    nodes.forEach((node) => observer.observe(node));
    return () => observer.disconnect();
  }, []);

  const jump = (index: number) => {
    const node = stepRefs.current[index];
    if (node) scrollTo(node, -110);
  };

  const current = t.process.steps[active] ?? t.process.steps[0];

  return (
    <section id="process" className="grain relative overflow-hidden bg-ivory text-ink">
      <div className="pointer-events-none absolute inset-0 opacity-[0.4] [background-image:linear-gradient(rgba(10,11,14,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(10,11,14,0.035)_1px,transparent_1px)] [background-size:84px_84px]" />
      <div className="pointer-events-none absolute -end-10 top-20 select-none text-[18rem] font-semibold leading-none text-ink/[0.03] sm:text-[26rem]">
        05
      </div>

      <div className="container-lux section-pad relative">
        <div className="grid gap-14 lg:grid-cols-[0.78fr_1.22fr] lg:gap-20">
          <div className="lg:sticky lg:top-28 lg:self-start">
            <Reveal>
              <span className="eyebrow text-gold-dark">{t.process.eyebrow}</span>
            </Reveal>
            <Reveal delay={80}>
              <h2 className="display-title mt-6 max-w-md text-[clamp(2.3rem,4.4vw,4.2rem)] text-ink">
                {t.process.title}
              </h2>
            </Reveal>
            <Reveal delay={160}>
              <p className="mt-5 max-w-sm text-[0.9rem] leading-[1.9] text-ink/55">
                {t.process.description}
              </p>
            </Reveal>

            <Reveal delay={240}>
              <div className="mt-10 border border-ink/10 bg-ivory/60 p-6 backdrop-blur">
                <div className="flex items-center justify-between">
                  <span className="text-[0.55rem] uppercase tracking-[0.2em] text-ink/35">
                    {t.process.stepLabel}
                  </span>
                  <span className="tabular text-[0.6rem] text-gold-dark">
                    {String(active + 1).padStart(2, "0")} / 0{t.process.steps.length}
                  </span>
                </div>
                <div className="mt-4 flex items-end gap-4">
                  <span className="font-display text-5xl italic leading-none text-gold-dark/50">
                    0{active + 1}
                  </span>
                  <span className="mb-1 font-display text-xl leading-tight text-ink/80">
                    {current.title}
                  </span>
                </div>
                <div className="mt-5 h-px w-full overflow-hidden bg-ink/10">
                  <div
                    className="h-full bg-gold-dark transition-all duration-700"
                    style={{ width: `${((active + 1) / t.process.steps.length) * 100}%` }}
                  />
                </div>

                <div className="mt-5 flex flex-col gap-1.5">
                  {t.process.steps.map((step, index) => (
                    <button
                      key={step.title}
                      type="button"
                      onClick={() => jump(index)}
                      className={cn(
                        "flex items-center justify-between gap-3 py-1 text-start text-[0.72rem] transition-colors",
                        active === index
                          ? "text-ink"
                          : "text-ink/35 hover:text-ink/65",
                      )}
                    >
                      <span className="flex items-center gap-2.5">
                        <span
                          className={cn(
                            "h-1 w-1 rotate-45 transition-colors",
                            active === index ? "bg-gold-dark" : "bg-ink/20",
                          )}
                        />
                        {step.title}
                      </span>
                      {active === index ? (
                        <ArrowUpRight className={cn("h-3 w-3", isRTL && "-scale-x-100")} />
                      ) : null}
                    </button>
                  ))}
                </div>
              </div>
            </Reveal>
          </div>

          <div className="flex flex-col">
            {t.process.steps.map((step, index) => (
              <div
                key={step.title}
                ref={(node) => {
                  stepRefs.current[index] = node;
                }}
                data-index={index}
                className={cn(
                  "group border-t border-ink/10 py-9 transition-all duration-500 lg:py-11",
                  active === index ? "border-t-gold-dark/60" : "",
                )}
              >
                <Reveal delay={40}>
                  <div className="grid gap-5 sm:grid-cols-[56px_1fr] lg:grid-cols-[70px_1fr_200px]">
                    <div className="flex items-start gap-3 sm:flex-col">
                      <span
                        className={cn(
                          "font-display text-3xl leading-none transition-colors duration-500",
                          active === index ? "text-gold-dark" : "text-ink/20",
                        )}
                      >
                        0{index + 1}
                      </span>
                      <span className="mt-1 h-px w-6 bg-ink/15 sm:mt-3" />
                    </div>

                    <div>
                      <h3
                        className={cn(
                          "font-display text-[1.6rem] leading-tight transition-colors duration-500 sm:text-[1.9rem]",
                          active === index ? "text-ink" : "text-ink/55",
                        )}
                      >
                        {step.title}
                      </h3>
                      <p className="mt-3 max-w-xl text-[0.84rem] leading-[1.85] text-ink/50">
                        {step.text}
                      </p>
                      <div className="mt-4 flex items-center gap-2 text-[0.58rem] uppercase tracking-[0.16em] text-ink/35 sm:hidden">
                        <Clock3 className="h-3 w-3 text-gold-dark" />
                        {step.duration}
                      </div>
                    </div>

                    <div className="flex flex-col gap-3 sm:col-start-2 lg:col-start-auto">
                      <div className="hidden items-center gap-2 text-[0.58rem] uppercase tracking-[0.16em] text-ink/35 sm:flex">
                        <Clock3 className="h-3 w-3 text-gold-dark" />
                        {step.duration}
                      </div>
                      <div>
                        <span className="text-[0.52rem] uppercase tracking-[0.18em] text-ink/30">
                          {t.process.deliverables}
                        </span>
                        <ul className="mt-2 flex flex-wrap gap-1.5">
                          {step.deliverables.map((item) => (
                            <li
                              key={item}
                              className="border border-ink/10 px-2 py-1 text-[0.55rem] text-ink/55"
                            >
                              {item}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                </Reveal>
              </div>
            ))}
            <div className="border-t border-ink/10" />
          </div>
        </div>
      </div>
    </section>
  );
}

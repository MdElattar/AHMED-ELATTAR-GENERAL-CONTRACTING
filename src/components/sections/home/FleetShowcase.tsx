"use client";

import { useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowUpRight, Gauge } from "lucide-react";
import { useI18n } from "@/components/providers/I18nProvider";
import { FleetArt } from "@/components/ui/FleetArt";
import { Reveal } from "@/components/ui/Reveal";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { fleet } from "@/data/fleet";
import { cn } from "@/lib/utils";

export function FleetShowcase() {
  const { t, l, isRTL } = useI18n();
  const [active, setActive] = useState(0);
  const machine = fleet[active];

  const specs = [
    { label: t.fleet.specs.capacity, value: machine.capacity },
    { label: t.fleet.specs.reach, value: machine.reach },
    { label: t.fleet.specs.units, value: machine.units },
    { label: t.fleet.specs.year, value: machine.year },
  ];

  return (
    <section className="relative overflow-hidden bg-ink">
      <div className="blueprint-grid pointer-events-none absolute inset-0 opacity-35" />
      <div className="pointer-events-none absolute end-0 top-1/4 h-[500px] w-[500px] rounded-full bg-gold/[0.045] blur-[130px]" />
      <div className="pointer-events-none absolute -start-10 top-16 select-none text-[13rem] font-semibold leading-none tracking-tighter text-white/[0.02] sm:text-[20rem]">
        FLEET
      </div>

      <div className="container-lux section-pad relative">
        <div className="grid gap-14 lg:grid-cols-[0.85fr_1.15fr] lg:gap-16">
          <div className="flex flex-col">
            <SectionHeading
              eyebrow={t.fleet.eyebrow}
              title={t.fleet.title}
              description={t.fleet.description}
            />

            <div className="mt-10 flex flex-col" role="tablist" aria-label={t.fleet.tabsLabel}>
              {fleet.map((item, index) => (
                <Reveal key={item.id} delay={index * 50}>
                  <button
                    type="button"
                    role="tab"
                    aria-selected={active === index}
                    onClick={() => setActive(index)}
                    className={cn(
                      "group flex w-full items-center justify-between gap-4 border-b border-white/10 py-3.5 text-start transition-colors duration-300",
                      active === index ? "text-gold" : "text-ivory/45 hover:text-ivory/75",
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
                        <span className="hidden border border-gold/25 px-2 py-0.5 text-[0.48rem] uppercase tracking-[0.14em] text-gold/70 sm:inline">
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
                </Reveal>
              ))}
            </div>

            <Reveal delay={250}>
              <Link
                href="/contact"
                className="group mt-8 inline-flex items-center gap-3 text-[0.65rem] font-semibold uppercase tracking-[0.16em] text-ivory/60 transition-colors hover:text-gold"
              >
                {t.fleet.cta}
                <span className="flex h-8 w-8 items-center justify-center rounded-full border border-white/15 transition-colors group-hover:border-gold">
                  <ArrowUpRight className={cn("h-3.5 w-3.5", isRTL && "-scale-x-100")} />
                </span>
              </Link>
            </Reveal>
          </div>

          <Reveal variant="scale" delay={120}>
            <div className="relative overflow-hidden border border-white/10 bg-coal/60">
              <div className="flex items-start justify-between gap-6 border-b border-white/10 p-6 sm:p-8">
                <div>
                  <span className="text-[0.55rem] uppercase tracking-[0.2em] text-gold">
                    {l(machine.category)}
                  </span>
                  <h3 className="mt-3 font-display text-[clamp(2rem,4vw,3.4rem)] leading-none text-ivory">
                    {machine.name}
                  </h3>
                </div>
                <span className="flex items-center gap-2 border border-white/10 px-3 py-1.5 text-[0.52rem] uppercase tracking-[0.16em] text-ivory/35">
                  <Gauge className="h-3 w-3 text-gold" />
                  {t.fleet.eyebrow}
                </span>
              </div>

              <div className="relative">
                <div className="blueprint-grid-fine pointer-events-none absolute inset-0 opacity-60" />
                <AnimatePresence mode="wait">
                  <motion.div
                    key={machine.id}
                    initial={{ opacity: 0, x: 24 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -24 }}
                    transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
                    className="relative aspect-[4/3] w-full p-4 sm:p-6"
                  >
                    <FleetArt variant={machine.art} />
                  </motion.div>
                </AnimatePresence>
                <div className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-coal to-transparent" />
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
                <p className="max-w-xl text-[0.82rem] leading-relaxed text-ivory/45">
                  {l(machine.description)}
                </p>
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

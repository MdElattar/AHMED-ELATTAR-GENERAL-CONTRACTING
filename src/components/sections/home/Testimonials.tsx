"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowUpRight, ChevronLeft, ChevronRight, Quote } from "lucide-react";
import { useI18n } from "@/components/providers/I18nProvider";
import { Marquee } from "@/components/ui/Marquee";
import { Reveal } from "@/components/ui/Reveal";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { clients, testimonials } from "@/data/testimonials";
import { cn } from "@/lib/utils";

export function Testimonials() {
  const { t, l, isRTL } = useI18n();
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const current = testimonials[index];

  useEffect(() => {
    if (paused) return;
    const timer = window.setInterval(() => {
      setIndex((value) => (value + 1) % testimonials.length);
    }, 7000);
    return () => window.clearInterval(timer);
  }, [paused]);

  const go = (direction: number) => {
    setIndex((value) => (value + direction + testimonials.length) % testimonials.length);
  };

  return (
    <section className="relative overflow-hidden bg-coal">
      <div className="blueprint-grid pointer-events-none absolute inset-0 opacity-30" />
      <div className="pointer-events-none absolute -start-32 top-0 h-[460px] w-[460px] rounded-full bg-gold/5 blur-[130px]" />

      <div className="container-lux section-pad relative">
        <div className="flex flex-col justify-between gap-8 lg:flex-row lg:items-end">
          <SectionHeading
            eyebrow={t.testimonials.eyebrow}
            title={t.testimonials.title}
            description={t.testimonials.description}
            titleClassName="max-w-3xl"
          />

          <Reveal delay={200}>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => go(-1)}
                aria-label={t.common.previous}
                className="flex h-11 w-11 items-center justify-center border border-white/15 text-ivory/60 transition-colors hover:border-gold hover:text-gold"
              >
                {isRTL ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
              </button>
              <button
                type="button"
                onClick={() => go(1)}
                aria-label={t.common.next}
                className="flex h-11 w-11 items-center justify-center border border-white/15 text-ivory/60 transition-colors hover:border-gold hover:text-gold"
              >
                {isRTL ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              </button>
            </div>
          </Reveal>
        </div>

        <div
          className="relative mt-14 border border-white/10 bg-obsidian/55 backdrop-blur-sm"
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
        >
          <Quote className="absolute end-6 top-6 h-16 w-16 text-gold/[0.07] sm:end-10 sm:top-10 sm:h-24 sm:w-24" />
          <div className="grid gap-8 p-6 sm:p-10 lg:grid-cols-[1fr_260px] lg:p-14">
            <div className="relative min-h-[260px] sm:min-h-[230px]">
              <AnimatePresence mode="wait">
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 18 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -14 }}
                  transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                >
                  <blockquote className="max-w-4xl font-display text-[clamp(1.45rem,3vw,2.55rem)] leading-[1.5] text-ivory/85">
                    “{l(current.quote)}”
                  </blockquote>

                  <div className="mt-8 flex items-center gap-4">
                    <span className="flex h-12 w-12 items-center justify-center rounded-full border border-gold/40 bg-gold/5 text-[0.65rem] font-semibold tracking-wider text-gold">
                      {current.initials}
                    </span>
                    <div className="flex flex-col">
                      <span className="text-sm font-semibold text-ivory">{l(current.name)}</span>
                      <span className="mt-0.5 text-[0.58rem] uppercase tracking-[0.16em] text-ivory/45">
                        {l(current.role)} — {l(current.company)}
                      </span>
                    </div>
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>

            <div className="flex flex-col justify-between gap-6 border-t border-white/10 pt-6 lg:border-s lg:border-t-0 lg:ps-8 lg:pt-0">
              <div>
                <span className="text-[0.55rem] uppercase tracking-[0.2em] text-ivory/40">
                  {t.common.project}
                </span>
                <Link
                  href={`/projects/${current.projectSlug}`}
                  className="group mt-3 flex items-start justify-between gap-3"
                >
                  <span className="font-display text-xl leading-tight text-ivory/80 transition-colors group-hover:text-gold">
                    {l(current.project)}
                  </span>
                  <ArrowUpRight
                    className={cn(
                      "mt-1 h-4 w-4 shrink-0 text-gold/60 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5",
                      isRTL && "-scale-x-100",
                    )}
                  />
                </Link>
              </div>

              <div>
                <div className="flex items-center gap-2">
                  {testimonials.map((item, dotIndex) => (
                    <button
                      key={item.name.en}
                      type="button"
                      onClick={() => setIndex(dotIndex)}
                      aria-label={`${t.common.step} ${dotIndex + 1}`}
                      aria-current={index === dotIndex}
                      className={cn(
                        "h-1 transition-all duration-500",
                        index === dotIndex ? "w-8 bg-gold" : "w-3 bg-white/20 hover:bg-white/40",
                      )}
                    />
                  ))}
                </div>
                <div className="mt-4 flex items-center gap-2 text-[0.6rem] uppercase tracking-[0.16em] text-ivory/35">
                  <span className="tabular text-gold">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <span>{t.testimonials.of}</span>
                  <span className="tabular">0{testimonials.length}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="relative border-t border-white/10 py-7">
        <div className="container-lux mb-5 flex items-center gap-4">
          <span className="text-[0.55rem] uppercase tracking-[0.22em] text-ivory/35">
            {t.clients.label}
          </span>
          <span className="h-px flex-1 bg-white/8" />
        </div>
        <Marquee
          items={clients.map((client) => l(client))}
          speed={46}
          itemClassName="text-ivory/45 text-[0.8rem]"
        />
      </div>
    </section>
  );
}

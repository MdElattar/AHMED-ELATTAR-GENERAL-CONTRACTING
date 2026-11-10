"use client";

import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Gauge, MoveDown } from "lucide-react";
import { useI18n } from "@/components/providers/I18nProvider";
import { useSmoothScroll } from "@/components/providers/SmoothScroll";
import { FleetCanvas } from "@/components/three/CanvasLoader";
import { fleet } from "@/data/fleet";
import { cn } from "@/lib/utils";

const copy = {
  ar: {
    eyebrow: "الأسطول الثقيل",
    title: "قوة مملوكة. جاهزية دائمة.",
    description:
      "لا نستأجر المعدات. نملكها، ونشغّلها بفرقنا، ونصونها بمعايير المصنّع — لضمان السيطرة الكاملة على الجدول والجودة.",
    hint: "مرّر لاستكشاف الأسطول",
    machine: "المعدة",
    capacity: "قدرة الرفع",
    reach: "الوصول",
    units: "عدد الوحدات",
    year: "سنة الصنع",
    cta: "اطلب معدات لمشروعك",
    stats: [
      { value: "٧٥٠", suffix: "طن", label: "أقصى قدرة رفع" },
      { value: "٧٢", suffix: "+", label: "معدة ثقيلة" },
      { value: "٢٤/٧", suffix: "", label: "دعم ميداني" },
    ],
  },
  en: {
    eyebrow: "Heavy fleet",
    title: "Owned power. Always ready.",
    description:
      "We do not rent equipment. We own it, operate it with our own crews, and maintain it to manufacturer standards — keeping complete control of schedule and quality.",
    hint: "Scroll to explore the fleet",
    machine: "Machine",
    capacity: "Lifting capacity",
    reach: "Reach",
    units: "Units",
    year: "Year",
    cta: "Request equipment for your project",
    stats: [
      { value: "750", suffix: "T", label: "Maximum lift" },
      { value: "72", suffix: "+", label: "Heavy machines" },
      { value: "24/7", suffix: "", label: "Field support" },
    ],
  },
};

const featured = fleet.filter((machine) => machine.featured).slice(0, 4);

export function FleetExperience() {
  const sectionRef = useRef<HTMLElement | null>(null);
  const progressRef = useRef(0);
  const fillRef = useRef<HTMLDivElement | null>(null);
  const triggerRef = useRef<ScrollTrigger | null>(null);
  const activeRef = useRef(0);
  const [active, setActive] = useState(0);
  const { locale, l } = useI18n();
  const { scrollTo } = useSmoothScroll();
  const c = copy[locale];
  const machine = featured[active] ?? featured[0];

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    const section = sectionRef.current;
    if (!section) return;

    const context = gsap.context(() => {
      const trigger = ScrollTrigger.create({
        trigger: section,
        start: "top top",
        end: "+=300%",
        pin: true,
        pinSpacing: true,
        anticipatePin: 1,
        invalidateOnRefresh: true,
        onUpdate: (self) => {
          progressRef.current = self.progress;
          if (fillRef.current) fillRef.current.style.width = `${self.progress * 100}%`;
          const next = Math.min(
            featured.length - 1,
            Math.floor(self.progress * featured.length),
          );
          if (next !== activeRef.current) {
            activeRef.current = next;
            setActive(next);
          }
        },
      });
      triggerRef.current = trigger;
    }, section);

    const timer = window.setTimeout(() => ScrollTrigger.refresh(), 400);
    return () => {
      window.clearTimeout(timer);
      triggerRef.current = null;
      context.revert();
    };
  }, []);

  const jumpTo = (index: number) => {
    const trigger = triggerRef.current;
    if (!trigger) return;
    const span = trigger.end - trigger.start;
    const ratio = 0.1 + (index / Math.max(1, featured.length - 1)) * 0.8;
    scrollTo(trigger.start + span * ratio, 0);
  };

  return (
    <section
      ref={sectionRef}
      id="fleet-experience"
      className="relative h-[100svh] overflow-hidden bg-obsidian"
    >
      <div className="absolute inset-0 z-0">
        <FleetCanvas progressRef={progressRef} />
      </div>

      <div className="pointer-events-none absolute inset-0 z-[1] bg-gradient-to-b from-obsidian/85 via-transparent to-obsidian" />
      <div className="pointer-events-none absolute inset-0 z-[1] bg-[radial-gradient(ellipse_at_28%_50%,rgba(6,7,8,0.76),transparent_66%)]" />

      <div className="relative z-10 flex h-full flex-col justify-between pb-6 pt-28 sm:pb-8 sm:pt-32">
        <div className="container-lux grid gap-6 lg:grid-cols-[1fr_auto] lg:items-start">
          <div className="max-w-xl">
            <span className="eyebrow">{c.eyebrow}</span>
            <h2 className="display-title mt-5 text-[clamp(2.3rem,4.6vw,4.4rem)] text-ivory">
              {c.title}
            </h2>
            <p className="mt-4 max-w-md text-sm leading-relaxed text-ivory/50">
              {c.description}
            </p>
          </div>
          <div className="hidden items-end gap-5 md:flex">
            <div className="flex flex-col items-end gap-2">
              <span className="text-[0.58rem] uppercase tracking-[0.2em] text-ivory/30">
                {c.hint}
              </span>
              <div className="h-14 w-px overflow-hidden bg-white/15">
                <div className="scroll-dot h-3 w-px bg-gold" />
              </div>
            </div>
            <MoveDown className="mb-1 h-4 w-4 text-gold/60" />
          </div>
        </div>

        <div className="container-lux grid items-end gap-7 lg:grid-cols-[1fr_470px]">
          <div className="hidden flex-col gap-4 pb-2 lg:flex">
            <div className="flex items-center gap-3">
              <span className="tabular text-[0.6rem] uppercase tracking-[0.2em] text-gold">
                {c.machine}
              </span>
              <span className="h-px w-8 bg-gold/40" />
              <span className="tabular text-[0.6rem] text-ivory/30">
                {String(active + 1).padStart(2, "0")} / 0{featured.length}
              </span>
            </div>
            {featured.map((item, index) => (
              <button
                key={item.id}
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
                  0{index + 1}
                </span>
                <span className="flex flex-col gap-0.5">
                  <span className="text-sm font-medium tracking-wide">{item.name}</span>
                  <span className="text-[0.5rem] uppercase tracking-[0.14em] text-ivory/25">
                    {l(item.category)}
                  </span>
                </span>
                <span
                  className={cn(
                    "h-px max-w-14 flex-1 bg-gold/50 transition-opacity duration-500",
                    active === index ? "opacity-100" : "opacity-0",
                  )}
                />
              </button>
            ))}

            <div className="mt-3 flex flex-wrap gap-6 border-t border-white/10 pt-5">
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

          <div className="relative">
            <div className="mb-4 flex items-center justify-between lg:hidden">
              <div className="flex items-center gap-2">
                {featured.map((item, index) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => jumpTo(index)}
                    aria-label={item.name}
                    aria-current={active === index}
                    className={cn(
                      "h-1.5 transition-all duration-500",
                      active === index ? "w-8 bg-gold" : "w-3 bg-white/20",
                    )}
                  />
                ))}
              </div>
              <span className="tabular text-[0.58rem] text-ivory/35">
                {String(active + 1).padStart(2, "0")} / 0{featured.length}
              </span>
            </div>

            <article className="relative border border-white/12 bg-obsidian/72 p-6 backdrop-blur-xl sm:p-7">
              <span className="absolute -top-px start-0 h-px w-16 bg-gold" />
              <span className="absolute -start-px top-0 h-16 w-px bg-gold/50" />
              <div className="flex items-start justify-between gap-4">
                <div>
                  <span className="text-[0.55rem] uppercase tracking-[0.2em] text-gold/80">
                    {l(machine.category)}
                  </span>
                  <h3 className="mt-3 font-display text-[2rem] leading-none text-ivory">
                    {machine.name}
                  </h3>
                </div>
                <span className="flex h-9 w-9 items-center justify-center rounded-full border border-gold/30 text-gold">
                  <Gauge className="h-4 w-4" />
                </span>
              </div>
              <p className="mt-4 text-[0.82rem] leading-[1.8] text-ivory/50">
                {l(machine.description)}
              </p>
              <div className="mt-6 grid grid-cols-2 gap-px overflow-hidden border border-white/10 bg-white/10">
                {[
                  { label: c.capacity, value: machine.capacity },
                  { label: c.reach, value: machine.reach },
                  { label: c.units, value: machine.units },
                  { label: c.year, value: machine.year },
                ].map((spec) => (
                  <div key={spec.label} className="bg-coal p-3.5">
                    <span className="tabular text-base font-light text-ivory">{spec.value}</span>
                    <p className="mt-1 text-[0.48rem] uppercase tracking-[0.14em] text-ivory/30">
                      {spec.label}
                    </p>
                  </div>
                ))}
              </div>
              <a
                href="/contact"
                className="mt-5 inline-flex text-[0.6rem] font-semibold uppercase tracking-[0.14em] text-gold transition-colors hover:text-gold-light"
              >
                {c.cta}
              </a>
            </article>
          </div>
        </div>
      </div>

      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-[2] h-16 bg-gradient-to-t from-obsidian to-transparent" />
      <div className="absolute inset-x-0 bottom-0 z-20 h-[2px] bg-white/10">
        <div ref={fillRef} className="h-full w-0 bg-gradient-to-r from-gold-dark via-gold to-gold-light" />
      </div>
      <span className="sr-only" aria-live="polite">
        {machine.name}
      </span>
    </section>
  );
}

"use client";

import Image from "next/image";
import Link from "next/link";
import { startTransition, useCallback, useRef, useState } from "react";
import { Gauge, MoveDown } from "lucide-react";
import { useI18n } from "@/components/providers/I18nProvider";
import { useSmoothScroll } from "@/components/providers/SmoothScroll";
import { PhotoLayer } from "@/components/media/PhotoLayer";
import { FleetCanvas } from "@/components/three/CanvasLoader";
import { SpotlightCard } from "@/components/ui/SpotlightCard";
import { TimelineTracker } from "@/components/ui/TimelineTracker";
import { fleetPhotos } from "@/data/media";
import { fleet } from "@/data/fleet";
import { pinEndForSteps } from "@/lib/scroll/pin";
import { usePinnedScroll } from "@/lib/scroll/usePinnedScroll";
import { cn } from "@/lib/utils";

const copy = {
  ar: {
    eyebrow: "الأسطول الثقيل",
    title: "قوة مملوكة. جاهزية دائمة.",
    description:
      "لا نستأجر المعدات. نملكها، ونشغّلها بفرقنا، ونصونها بمعايير المصنّع — لضمان السيطرة الكاملة على الجدول والجودة.",
    hint: "مرّر لاستكشاف الأسطول",
    stepLabel: "المعدة",
    ready: "جاهزة للتشغيل",
    liveNote: "مواقع الأسطول وساعات التشغيل تُتابع من غرفة العمليات",
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
    stepLabel: "Machine",
    ready: "Deployment ready",
    liveNote: "Fleet locations and operating hours are tracked from the operations room",
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

const featured = fleet.filter((machine) => machine.featured).slice(0, 3);
const featuredPhotos = featured.map((machine) => fleetPhotos[machine.art]);

export function FleetExperience() {
  const sectionRef = useRef<HTMLElement | null>(null);
  const progressRef = useRef(0);
  const fillRef = useRef<HTMLDivElement | null>(null);
  const timelineFillRef = useRef<HTMLDivElement | null>(null);
  const mobileTimelineFillRef = useRef<HTMLDivElement | null>(null);
  const [active, setActive] = useState(0);
  const { locale, l } = useI18n();
  const { scrollTo } = useSmoothScroll();
  const c = copy[locale];
  const machine = featured[active] ?? featured[0];

  // FleetScene reads `progressRef` imperatively every frame; only the active
  // machine index re-renders, and it does so as a non-urgent transition.
  const handleActive = useCallback((index: number) => {
    startTransition(() => setActive(index));
  }, []);

  // The rails and the bottom bar are written imperatively by the same scrubbed
  // tween that drives the 3D scene, so all four stay in perfect sync.
  const handleProgress = useCallback((value: number) => {
    if (timelineFillRef.current) {
      timelineFillRef.current.style.transform = `scaleY(${value})`;
    }
    if (mobileTimelineFillRef.current) {
      mobileTimelineFillRef.current.style.transform = `scaleX(${value})`;
    }
  }, []);

  const triggerRef = usePinnedScroll({
    sectionRef,
    progressRef,
    fillRef,
    stepCount: featured.length,
    // Three featured machines → `+=180%`. The helper keeps the scroll budget
    // proportional to the number of cards instead of a fixed distance.
    end: pinEndForSteps(featured.length),
    onActive: handleActive,
    onProgress: handleProgress,
  });

  const jumpTo = (index: number) => {
    const trigger = triggerRef.current;
    if (!trigger) return;
    const span = trigger.end - trigger.start;
    const ratio = 0.12 + (index / Math.max(1, featured.length - 1)) * 0.76;
    scrollTo(trigger.start + span * ratio, 0);
  };

  const trackerSteps = featured.map((item) => ({
    title: item.name,
    subtitle: l(item.category),
  }));

  return (
    <section
      ref={sectionRef}
      id="fleet-experience"
      className="relative h-[100svh] overflow-hidden bg-obsidian"
    >
      <PhotoLayer
        images={featuredPhotos}
        active={active}
        sizes="100vw"
        className="z-0"
        imageClassName="brightness-[0.72]"
      />

      <div className="pointer-events-none absolute inset-0 z-[1] opacity-90">
        <FleetCanvas progressRef={progressRef} />
      </div>

      <div className="atmo-glow pointer-events-none absolute inset-0 z-[2] opacity-60" aria-hidden="true" />
      <div className="pointer-events-none absolute inset-0 z-[2] bg-gradient-to-b from-obsidian/85 via-transparent to-obsidian" />
      <div className="pointer-events-none absolute inset-0 z-[2] bg-[radial-gradient(ellipse_at_28%_50%,rgba(6,7,8,0.74),transparent_66%)]" />

      <div className="relative z-10 flex h-full flex-col justify-between pb-6 pt-28 sm:pb-8 sm:pt-32">
        <div className="container-lux grid gap-6 lg:grid-cols-[1fr_auto] lg:items-start">
          <div className="max-w-xl">
            <span className="eyebrow">{c.eyebrow}</span>
            <h2 className="display-title text-shadow-lux mt-5 text-[clamp(2.3rem,4.6vw,4.4rem)] text-ivory">
              {c.title}
            </h2>
            <p className="text-shadow-lux mt-4 hidden max-w-md text-sm leading-relaxed text-ivory/55 sm:block">
              {c.description}
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

        <div className="container-lux grid items-end gap-7 lg:grid-cols-[1fr_470px]">
          <div className="hidden flex-col gap-5 pb-2 lg:flex">
            <TimelineTracker
              steps={trackerSteps}
              active={active}
              onSelect={jumpTo}
              label={c.stepLabel}
              fillRef={timelineFillRef}
            />

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

            <div className="glass-panel-soft flex items-center gap-3 px-4 py-3">
              <span className="relative flex h-2 w-2 shrink-0">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-gold/60" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-gold" />
              </span>
              <p className="text-[0.55rem] uppercase leading-relaxed tracking-[0.14em] text-ivory/40">
                {c.liveNote}
              </p>
            </div>
          </div>

          <div className="relative">
            <div className="mb-4 lg:hidden">
              <TimelineTracker
                steps={trackerSteps}
                active={active}
                onSelect={jumpTo}
                label={c.stepLabel}
                orientation="horizontal"
                fillRef={mobileTimelineFillRef}
              />
            </div>

            <div className="relative min-h-[320px] sm:min-h-[340px]">
              {featured.map((item, index) => (
                <SpotlightCard
                  as="article"
                  key={item.id}
                  aria-hidden={active !== index}
                  className={cn(
                    "spotlight-card--media absolute inset-0 overflow-hidden border border-white/12 bg-coal transition-all duration-700",
                    active === index
                      ? "pointer-events-auto translate-y-0 opacity-100"
                      : "pointer-events-none translate-y-5 opacity-0",
                  )}
                >
                  <Image
                    src={featuredPhotos[index].src}
                    alt=""
                    fill
                    sizes="(max-width: 1024px) 100vw, 470px"
                    className="object-cover opacity-55 photo-grade"
                  />
                  <div className="absolute inset-0 z-[1] bg-gradient-to-b from-obsidian/25 via-obsidian/78 to-obsidian/96" />
                  <div className="absolute inset-0 z-[1] bg-[radial-gradient(ellipse_at_80%_10%,rgb(var(--atmo-glow)/0.14),transparent_55%)]" />

                  <div className="relative z-10 flex h-full flex-col justify-between p-6 sm:p-7">
                    <div>
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <span className="live-pill">{c.ready}</span>
                          <span className="mt-4 block text-[0.55rem] uppercase tracking-[0.2em] text-gold/80">
                            {l(item.category)}
                          </span>
                          <h3 className="mt-2 font-display text-[1.9rem] leading-none text-ivory sm:text-[2.1rem]">
                            {item.name}
                          </h3>
                        </div>
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-gold/30 text-gold">
                          <Gauge className="h-4 w-4" />
                        </span>
                      </div>
                      <p className="mt-4 text-[0.82rem] leading-[1.8] text-ivory/58">
                        {l(item.description)}
                      </p>
                    </div>

                    <div className="mt-6">
                      <div className="grid grid-cols-2 gap-px overflow-hidden border border-white/10 bg-white/10">
                        {[
                          { label: c.capacity, value: item.capacity },
                          { label: c.reach, value: item.reach },
                          { label: c.units, value: item.units },
                          { label: c.year, value: item.year },
                        ].map((spec) => (
                          <div key={spec.label} className="bg-coal p-3.5">
                            <span className="tabular text-base font-light text-ivory">
                              {spec.value}
                            </span>
                            <p className="mt-1 text-[0.48rem] uppercase tracking-[0.14em] text-ivory/30">
                              {spec.label}
                            </p>
                          </div>
                        ))}
                      </div>
                      <div className="mt-4 h-px w-full overflow-hidden bg-white/10">
                        <div
                          className="h-full bg-gradient-to-r from-gold-dark via-gold to-gold-light transition-[width] duration-700"
                          style={{ width: `${((index + 1) / featured.length) * 100}%` }}
                        />
                      </div>
                      <Link
                        href="/contact"
                        className="mt-4 inline-flex text-[0.6rem] font-semibold uppercase tracking-[0.14em] text-gold transition-colors hover:text-gold-light"
                      >
                        {c.cta}
                      </Link>
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
        {machine.name}
      </span>
    </section>
  );
}

"use client";

import Image from "next/image";
import { startTransition, useCallback, useRef, useState } from "react";
import { MoveDown } from "lucide-react";
import { useI18n } from "@/components/providers/I18nProvider";
import { useSmoothScroll } from "@/components/providers/SmoothScroll";
import { TimelineTracker } from "@/components/ui/TimelineTracker";
import { craftsmanshipPhotos } from "@/data/media";
import { pinEndForSteps } from "@/lib/scroll/pin";
import { usePinnedScroll } from "@/lib/scroll/usePinnedScroll";
import { cn } from "@/lib/utils";

const copy = {
  ar: {
    eyebrow: "حرفية التنفيذ",
    title: "كل مفصل. كل ملليمتر. كل مرة.",
    description:
      "البناء ليس تجميع مواد. إنه تسلسل دقيق: مسح، تسليح، صب، تركيب، ثم تحقق. مرّر بحرية عبر المراحل الخمس — كل مرحلة تُمنح مساحتها الكاملة من التمرير.",
    hint: "مرّر عبر مراحل البناء",
    liveNote: "توثيق ميداني — مواقع فعلية للشركة",
    stepLabel: "المرحلة",
    steps: [
      {
        index: "٠١",
        title: "المسح والأساس",
        heading: "الدقة تبدأ قبل أول صبّة.",
        text: "مسح شبكي مستقل، نقاط تحكم جيوديسية، وفحص تربة معتمد قبل توقيع أي أساس.",
        metric: "±2 مم",
        metricLabel: "دقة المسح",
      },
      {
        index: "٠٢",
        title: "التسليح والقوالب",
        heading: "الحديد يُروى كما تُروى القصة.",
        text: "قص وثني رقمي، تباعد مدروس، وتغطية خرسانية لا تقل عن ٤٠ مم — موثقة بالصور قبل الصب.",
        metric: "١٢٧",
        metricLabel: "نقطة فحص",
      },
      {
        index: "٠٣",
        title: "الهيكل الإنشائي",
        heading: "العظم الذي يحمل الحلم.",
        text: "أعمدة وكمرات تُركّب بترتيب محسوب، مع قياس إجهادات حي ومراجعة استشاري مستقلة.",
        metric: "٤٨٠",
        metricLabel: "ميغاباسكال",
      },
      {
        index: "٠٤",
        title: "الغلاف والأنظمة",
        heading: "العزل الذي لا يُرى.",
        text: "غلاف حراري، شبكات كهروميكانيكية، واختبارات ضغط وتوازن قبل إغلاق الأسقف.",
        metric: "٣٥٪",
        metricLabel: "كفاءة طاقة",
      },
      {
        index: "٠٥",
        title: "التسليم والتحقق",
        heading: "لا مفتاح قبل آخر فحص.",
        text: "قائمة تسليم من ١٢٧ بنداً، تدقيق مستقل، وتوثيق رقمي لكل نظام قبل التسليم.",
        metric: "٩٨٪",
        metricLabel: "تسليم أول مرة",
      },
    ],
  },
  en: {
    eyebrow: "Construction craftsmanship",
    title: "Every joint. Every millimetre. Every time.",
    description:
      "Construction is not assembling materials. It is a precise sequence: survey, reinforcement, pour, install, verify. Scroll freely through the five phases — each milestone gets its full scroll budget.",
    hint: "Scroll through the build phases",
    liveNote: "Field documentation — live company sites",
    stepLabel: "Phase",
    steps: [
      {
        index: "01",
        title: "Survey & foundation",
        heading: "Precision starts before the first pour.",
        text: "Independent grid survey, geodetic control points, and certified soil testing before any foundation is signed off.",
        metric: "±2 mm",
        metricLabel: "Survey tolerance",
      },
      {
        index: "02",
        title: "Rebar & formwork",
        heading: "Steel is detailed like a story.",
        text: "Digital cutting and bending, engineered spacing, and a concrete cover of no less than 40 mm — photographed before the pour.",
        metric: "127",
        metricLabel: "Inspection points",
      },
      {
        index: "03",
        title: "Structural frame",
        heading: "The skeleton that carries the dream.",
        text: "Columns and beams installed in a calculated sequence, with live stress monitoring and independent consultant review.",
        metric: "480",
        metricLabel: "MPa concrete",
      },
      {
        index: "04",
        title: "Envelope & systems",
        heading: "The insulation no one sees.",
        text: "Thermal envelope, MEP networks, and pressure and balance testing before ceilings are closed.",
        metric: "35%",
        metricLabel: "Energy efficiency",
      },
      {
        index: "05",
        title: "Handover & verification",
        heading: "No key before the final check.",
        text: "A 127-item handover checklist, independent audit, and digital documentation for every system before delivery.",
        metric: "98%",
        metricLabel: "First-time handover",
      },
    ],
  },
};

/**
 * The craftsmanship sequence — a pinned, scroll-scrubbed build diary.
 *
 * The stage is pinned for `+=300%` with `scrub: 0.5`. Below lg the
 * photographic crossfade runs as a full-bleed stage backdrop behind the
 * editorial copy, with the phase rail docked to the bottom of the stage; at
 * lg it resolves into a framed panel beside the copy with the rail beneath
 * it. A scrub-linked drift keeps the imagery alive without a re-render.
 */
export function CraftsmanshipExperience() {
  const sectionRef = useRef<HTMLElement | null>(null);
  const progressRef = useRef(0);
  const fillRef = useRef<HTMLDivElement | null>(null);
  const photoWrapRef = useRef<HTMLDivElement | null>(null);
  const timelineFillRef = useRef<HTMLDivElement | null>(null);
  const [active, setActive] = useState(0);
  const { locale } = useI18n();
  const { scrollTo } = useSmoothScroll();

  const c = copy[locale];
  const steps = c.steps;

  const handleActive = useCallback((index: number) => {
    startTransition(() => setActive(index));
  }, []);

  const handleProgress = useCallback((value: number) => {
    if (timelineFillRef.current) {
      timelineFillRef.current.style.transform = `scaleX(${value})`;
    }
    if (photoWrapRef.current) {
      // The photographic panel drifts vertically inside its clipped frame as
      // the scrub advances — parallax depth without a re-render.
      const drift = (value - 0.5) * -6;
      const scale = 1.06 + value * 0.06;
      photoWrapRef.current.style.transform = `scale(${scale}) translate3d(0, ${drift}%, 0)`;
    }
  }, []);

  const triggerRef = usePinnedScroll({
    sectionRef,
    progressRef,
    fillRef,
    stepCount: steps.length,
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
      id="craftsmanship"
      className="relative h-[100svh] overflow-hidden bg-obsidian"
    >
      <div className="blueprint-grid pointer-events-none absolute inset-0 opacity-25" />
      <div className="atmo-glow pointer-events-none absolute inset-0 opacity-40" aria-hidden="true" />
      <div className="pointer-events-none absolute -end-20 bottom-1/4 select-none text-[13rem] font-semibold leading-none tracking-tighter text-white/[0.022] sm:text-[20rem]">
        {locale === "ar" ? "حرفية" : "CRAFT"}
      </div>
      <div className="pointer-events-none absolute inset-x-0 top-0 z-[2] h-px bg-gradient-to-r from-transparent via-gold/40 to-transparent" />

      <div className="relative z-10 flex h-full flex-col pb-6 pt-28 sm:pb-8 sm:pt-32 lg:pb-6 lg:pt-28">
        <div className="container-lux grid flex-1 items-center gap-10 pb-20 lg:grid-cols-12 lg:gap-14 lg:pb-0">
          {/* Editorial copy column */}
          <div className="relative z-10 lg:col-span-6 xl:col-span-5">
            <span className="eyebrow">{c.eyebrow}</span>
            <h2 className="display-title text-shadow-lux mt-5 text-[clamp(1.9rem,4.2vw,4rem)] text-ivory">
              {c.title}
            </h2>
            <p className="phase-description mt-4 max-w-md text-sm leading-relaxed text-ivory/55">
              {c.description}
            </p>

            <div className="relative mt-6 min-h-[176px] sm:mt-8 sm:min-h-[250px] lg:min-h-[320px]">
              {steps.map((step, index) => (
                <article
                  key={step.title}
                  aria-hidden={active !== index}
                  className={cn(
                    "absolute inset-0 transition-all duration-700",
                    active === index
                      ? "pointer-events-auto translate-y-0 opacity-100"
                      : "pointer-events-none translate-y-4 opacity-0",
                  )}
                >
                  <div className="hidden items-baseline gap-4 sm:flex">
                    <span className="font-display text-5xl italic leading-none text-gold/45 sm:text-6xl">
                      {step.index}
                    </span>
                    <span className="h-px flex-1 bg-gradient-to-r from-gold/50 to-transparent" />
                  </div>
                  <h3 className="mt-2 font-display text-[clamp(1.35rem,3vw,2.35rem)] leading-tight text-ivory sm:mt-4">
                    {step.heading}
                  </h3>
                  <span className="mt-2 block text-[0.58rem] font-semibold uppercase tracking-[0.2em] text-gold/85">
                    {step.title}
                  </span>
                  <p className="mt-3 hidden max-w-md text-[0.84rem] leading-[1.9] text-ivory/58 sm:block">
                    {step.text}
                  </p>
                  <div className="mt-5 flex items-end gap-6 border-t border-white/10 pt-4 sm:mt-6">
                    <div>
                      <span className="tabular block text-2xl font-light text-gold">
                        {step.metric}
                      </span>
                      <span className="mt-1 block text-[0.55rem] uppercase tracking-[0.18em] text-ivory/35">
                        {step.metricLabel}
                      </span>
                    </div>
                    <div className="mb-1.5 hidden h-px flex-1 overflow-hidden bg-white/10 sm:block">
                      <div
                        className="h-full bg-gradient-to-r from-gold-dark via-gold to-gold-light transition-[width] duration-700"
                        style={{ width: `${((index + 1) / steps.length) * 100}%` }}
                      />
                    </div>
                  </div>
                </article>
              ))}
            </div>

            <div className="mt-6 hidden items-center gap-3 lg:mt-4 lg:flex">
              <span className="glass-panel-soft flex items-center gap-3 px-4 py-2.5">
                <span className="relative flex h-2 w-2 shrink-0">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-gold/60" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-gold" />
                </span>
                <span className="text-[0.55rem] uppercase tracking-[0.14em] text-ivory/40">
                  {c.liveNote}
                </span>
              </span>
              <MoveDown className="h-4 w-4 text-gold/60" />
            </div>
          </div>

          {/* Photographic column — full-bleed stage backdrop below lg, framed panel beside the copy at lg */}
          <div className="absolute inset-0 z-0 lg:relative lg:z-auto lg:col-span-6 xl:col-span-7">
            <div className="absolute inset-0 overflow-hidden lg:relative lg:aspect-[16/12] lg:max-h-[48svh] lg:w-full lg:border lg:border-white/10 lg:bg-coal lg:shadow-[0_40px_120px_-40px_rgba(0,0,0,0.9)]">
              <div ref={photoWrapRef} className="absolute inset-0 will-change-transform">
                {craftsmanshipPhotos.map((photo, index) => (
                  <div
                    key={photo.src}
                    className={cn(
                      "absolute inset-0 transition-opacity duration-[1200ms] ease-[cubic-bezier(0.16,1,0.3,1)]",
                      index === active ? "opacity-100" : "opacity-0",
                    )}
                  >
                    <Image
                      src={photo.src}
                      alt={photo.alt}
                      fill
                      sizes="(max-width: 1024px) 100vw, 900px"
                      className="object-cover photo-grade brightness-[0.85]"
                    />
                  </div>
                ))}
              </div>

              <div className="pointer-events-none absolute inset-0 z-[2] bg-gradient-to-t from-obsidian/80 via-obsidian/45 to-obsidian/90 lg:from-obsidian/60 lg:via-transparent lg:to-obsidian/30" />
              <div className="pointer-events-none absolute inset-0 z-[2] bg-[radial-gradient(ellipse_at_72%_20%,rgb(var(--atmo-glow)/0.16),transparent_55%)]" />

              <span className="tabular glass-panel-soft absolute bottom-4 end-4 z-10 hidden px-3.5 py-2 font-display text-2xl italic text-gold/85 lg:block">
                {steps[active]?.index}
              </span>
              <span className="absolute -top-px start-0 z-10 hidden h-px w-16 bg-gold lg:block" />
              <span className="absolute -start-px top-0 z-10 hidden h-16 w-px bg-gold/50 lg:block" />
              <span className="absolute inset-x-0 top-0 z-10 hidden h-px bg-gradient-to-r from-transparent via-gold/50 to-transparent lg:block" />
            </div>

            <div className="absolute inset-x-[clamp(1.25rem,4vw,4.5rem)] bottom-7 z-20 lg:static lg:mt-5">
              <TimelineTracker
                steps={trackerSteps}
                active={active}
                onSelect={jumpTo}
                label={c.stepLabel}
                orientation="horizontal"
                fillRef={timelineFillRef}
              />
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
    </section>
  );
}

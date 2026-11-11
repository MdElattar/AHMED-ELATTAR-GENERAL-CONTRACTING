"use client";

import dynamic from "next/dynamic";
import Image from "next/image";
import { startTransition, useCallback, useEffect, useRef, useState } from "react";
import { MoveDown } from "lucide-react";
import { useI18n } from "@/components/providers/I18nProvider";
import { useSmoothScroll } from "@/components/providers/SmoothScroll";
import { PhotoLayer } from "@/components/media/PhotoLayer";
import { SpotlightCard } from "@/components/ui/SpotlightCard";
import { TimelineTracker } from "@/components/ui/TimelineTracker";
import { craftsmanshipPhotos } from "@/data/media";
import { pinEndForSteps } from "@/lib/scroll/pin";
import { usePinnedScroll } from "@/lib/scroll/usePinnedScroll";
import { cn } from "@/lib/utils";

// The 2D drawing code is client-only. Keeping it out of the server render lets
// the section copy ship as static HTML while the canvas chunk loads lazily.
const CraftsmanshipCanvas = dynamic(
  () =>
    import("@/components/sections/home/CraftsmanshipCanvas").then(
      (module) => module.CraftsmanshipCanvas,
    ),
  {
    ssr: false,
    // Transparent placeholder: the photographic layer behind stays visible.
    loading: () => <div className="absolute inset-0" />,
  },
);

const copy = {
  ar: {
    eyebrow: "حرفية التنفيذ",
    title: "كل مفصل. كل ملليمتر. كل مرة.",
    description:
      "البناء ليس تجميع مواد. إنه تسلسل دقيق: مسح، تسليح، صب، تركيب، ثم تحقق. مرّر لتشاهد الهيكل يُبنى أمامك.",
    hint: "مرّر لتجميع الهيكل",
    stepLabel: "مرحلة",
    liveNote: "قائمة فحص رقمية تُحدَّث مع كل تثبيت إنشائي",
    livePhase: "مرحلة مباشرة",
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
      "Construction is not assembling materials. It is a precise sequence: survey, reinforcement, pour, install, verify. Scroll to watch the frame build itself.",
    hint: "Scroll to assemble the frame",
    stepLabel: "Phase",
    liveNote: "A digital inspection checklist updates with every fixing",
    livePhase: "Live phase",
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

export function CraftsmanshipExperience() {
  const sectionRef = useRef<HTMLElement | null>(null);
  const progressRef = useRef(0);
  const fillRef = useRef<HTMLDivElement | null>(null);
  const timelineFillRef = useRef<HTMLDivElement | null>(null);
  const mobileTimelineFillRef = useRef<HTMLDivElement | null>(null);
  const activeRef = useRef(0);
  const stepCountRef = useRef(0);
  const [active, setActive] = useState(0);
  const { locale } = useI18n();
  const { scrollTo } = useSmoothScroll();
  const c = copy[locale];

  // The 2D canvas reads `progressRef`/`activeRef` directly on its own rAF, so
  // the step change is written to the ref immediately and only the DOM state
  // update is deferred as a transition.
  const handleActive = useCallback((index: number) => {
    activeRef.current = index;
    startTransition(() => setActive(index));
  }, []);

  // Both timeline rails are driven imperatively by the scrubbed tween.
  const handleProgress = useCallback((value: number) => {
    if (timelineFillRef.current) {
      timelineFillRef.current.style.transform = `scaleY(${value})`;
    }
    if (mobileTimelineFillRef.current) {
      mobileTimelineFillRef.current.style.transform = `scaleX(${value})`;
    }
  }, []);

  useEffect(() => {
    stepCountRef.current = c.steps.length;
  }, [c.steps.length]);

  const triggerRef = usePinnedScroll({
    sectionRef,
    progressRef,
    fillRef,
    stepCount: c.steps.length,
    // Five steps → `+=300%`: a full cinematic beat per card.
    end: pinEndForSteps(c.steps.length),
    onActive: handleActive,
    onProgress: handleProgress,
  });

  const jumpTo = (index: number) => {
    const trigger = triggerRef.current;
    if (!trigger) return;
    const span = trigger.end - trigger.start;
    const ratio = 0.1 + (index / Math.max(1, c.steps.length - 1)) * 0.8;
    scrollTo(trigger.start + span * ratio, 0);
  };

  const trackerSteps = c.steps.map((step) => ({
    title: step.title,
    subtitle: step.metricLabel,
  }));

  return (
    <section
      ref={sectionRef}
      id="craftsmanship"
      className="relative h-[100svh] overflow-hidden bg-obsidian"
    >
      <PhotoLayer
        images={craftsmanshipPhotos}
        active={active}
        sizes="100vw"
        className="z-0"
        imageClassName="brightness-[0.78]"
      />

      {/* The drawing canvas is screened over the photography, so its ink-black
          pass disappears and the structural linework glows like a hologram. */}
      <div className="pointer-events-none absolute inset-0 z-[1] opacity-80 mix-blend-screen">
        <CraftsmanshipCanvas
          progressRef={progressRef}
          activeRef={activeRef}
          stepCountRef={stepCountRef}
        />
      </div>

      <div className="atmo-glow pointer-events-none absolute inset-0 z-[2] opacity-55" aria-hidden="true" />
      <div className="pointer-events-none absolute inset-0 z-[2] bg-gradient-to-b from-obsidian/85 via-transparent to-obsidian" />
      <div className="pointer-events-none absolute inset-0 z-[2] bg-[radial-gradient(ellipse_at_30%_50%,rgba(6,7,8,0.72),transparent_68%)]" />

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

        <div className="container-lux grid items-end gap-7 lg:grid-cols-[1fr_460px]">
          <div className="hidden flex-col gap-5 pb-2 lg:flex">
            <TimelineTracker
              steps={trackerSteps}
              active={active}
              onSelect={jumpTo}
              label={c.stepLabel}
              fillRef={timelineFillRef}
            />

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
              {c.steps.map((step, index) => (
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
                    src={craftsmanshipPhotos[index].src}
                    alt=""
                    fill
                    sizes="(max-width: 1024px) 100vw, 460px"
                    className="object-cover opacity-55 photo-grade"
                  />
                  <div className="absolute inset-0 z-[1] bg-gradient-to-b from-obsidian/25 via-obsidian/78 to-obsidian/96" />
                  <div className="absolute inset-0 z-[1] bg-[radial-gradient(ellipse_at_20%_10%,rgb(var(--atmo-glow)/0.14),transparent_55%)]" />

                  <div className="relative z-10 flex h-full flex-col justify-between p-6 sm:p-7">
                    <div>
                      <div className="flex items-center justify-between gap-4">
                        <span className="live-pill">{c.livePhase}</span>
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
                          style={{ width: `${((index + 1) / c.steps.length) * 100}%` }}
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
        {c.steps[active]?.title}
      </span>
    </section>
  );
}

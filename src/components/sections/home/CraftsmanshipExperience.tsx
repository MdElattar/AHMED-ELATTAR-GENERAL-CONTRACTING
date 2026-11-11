"use client";

import Image from "next/image";
import { MoveDown } from "lucide-react";
import { useI18n } from "@/components/providers/I18nProvider";
import { Reveal } from "@/components/ui/Reveal";
import { craftsmanshipPhotos } from "@/data/media";
import { cn } from "@/lib/utils";

const copy = {
  ar: {
    eyebrow: "حرفية التنفيذ",
    title: "كل مفصل. كل ملليمتر. كل مرة.",
    description:
      "البناء ليس تجميع مواد. إنه تسلسل دقيق: مسح، تسليح، صب، تركيب، ثم تحقق. خمس مراحل موثقة ميدانياً — كل مرحلة لها صورتها ورقمها.",
    hint: "خمس مراحل من التنفيذ",
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
      "Construction is not assembling materials. It is a precise sequence: survey, reinforcement, pour, install, verify. Five field-documented phases, each with its own frame and number.",
    hint: "Five build phases",
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
 * The craftsmanship sequence — an alternating editorial diary.
 *
 * Natural document flow only: each phase owns a photographic row that enters
 * with a reveal, and the whole section remains fully scrollable at 60 FPS on
 * low-end mobile because nothing is pinned or measured on scroll.
 */
export function CraftsmanshipExperience() {
  const { locale } = useI18n();
  const c = copy[locale];

  return (
    <section id="craftsmanship" className="relative overflow-hidden bg-ink py-20 sm:py-28">
      <div className="blueprint-grid pointer-events-none absolute inset-0 opacity-20" />
      <div className="pointer-events-none absolute -end-20 bottom-1/4 select-none text-[11rem] font-semibold leading-none tracking-tighter text-white/[0.02] sm:text-[18rem]">
        {locale === "ar" ? "حرفية" : "CRAFT"}
      </div>
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-gold/35 to-transparent" />

      <div className="container-lux relative">
        <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-end">
          <Reveal className="max-w-2xl">
            <span className="eyebrow">{c.eyebrow}</span>
            <h2 className="display-title mt-5 text-[clamp(2rem,4.4vw,4rem)] text-ivory">
              {c.title}
            </h2>
            <p className="mt-4 max-w-xl text-sm leading-[1.9] text-ivory/55">
              {c.description}
            </p>
          </Reveal>
          <Reveal delay={120} className="hidden items-center gap-3 text-ivory/35 lg:flex">
            <span className="text-[0.55rem] uppercase tracking-[0.2em]">{c.hint}</span>
            <MoveDown className="h-4 w-4 text-gold/60" />
          </Reveal>
        </div>

        <div className="mt-14 flex flex-col gap-6">
          {c.steps.map((step, index) => {
            const photo = craftsmanshipPhotos[index % craftsmanshipPhotos.length];
            const reversed = index % 2 === 1;

            return (
              <Reveal
                key={step.title}
                delay={40}
                className="group grid overflow-hidden border border-white/10 bg-coal/60 lg:grid-cols-2"
              >
                <div
                  className={cn(
                    "relative aspect-[16/11] overflow-hidden lg:aspect-auto lg:min-h-[360px]",
                    reversed && "lg:order-2",
                  )}
                >
                  <Image
                    src={photo.src}
                    alt={photo.alt}
                    fill
                    sizes="(max-width: 1024px) 100vw, 50vw"
                    loading="lazy"
                    className="object-cover photo-grade brightness-[0.82] transition-transform duration-[1500ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.035]"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-obsidian/65 via-transparent to-obsidian/15 lg:bg-gradient-to-r lg:from-obsidian/35 lg:to-transparent" />
                  <span className="tabular absolute bottom-5 start-5 font-display text-5xl italic leading-none text-gold/75 sm:text-6xl">
                    {step.index}
                  </span>
                </div>

                <div
                  className={cn(
                    "flex flex-col justify-center p-6 sm:p-9 lg:p-12",
                    reversed && "lg:order-1",
                  )}
                >
                  <span className="text-[0.56rem] font-semibold uppercase tracking-[0.22em] text-gold/85">
                    {c.stepLabel} · {step.title}
                  </span>
                  <h3 className="mt-3 font-display text-[clamp(1.6rem,3vw,2.5rem)] leading-tight text-ivory">
                    {step.heading}
                  </h3>
                  <p className="mt-4 max-w-md text-[0.86rem] leading-[1.9] text-ivory/55">
                    {step.text}
                  </p>
                  <div className="mt-7 flex items-end justify-between gap-6 border-t border-white/10 pt-5">
                    <div>
                      <span className="tabular block text-2xl font-light text-gold">
                        {step.metric}
                      </span>
                      <span className="mt-1 block text-[0.52rem] uppercase tracking-[0.18em] text-ivory/35">
                        {step.metricLabel}
                      </span>
                    </div>
                    <span className="hidden items-center gap-2 text-[0.52rem] uppercase tracking-[0.14em] text-ivory/30 sm:flex">
                      <span className="relative flex h-2 w-2">
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-gold/50" />
                        <span className="relative inline-flex h-2 w-2 rounded-full bg-gold" />
                      </span>
                      {c.liveNote}
                    </span>
                  </div>
                </div>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}

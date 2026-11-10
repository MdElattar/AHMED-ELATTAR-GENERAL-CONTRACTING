"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowUpRight, Calculator, Clock3, Ruler, Wallet } from "lucide-react";
import { useI18n } from "@/components/providers/I18nProvider";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { cn } from "@/lib/utils";

type ProjectType = "residential" | "commercial" | "infrastructure" | "industrial";
type Quality = "essential" | "premium" | "signature";
type City = "riyadh" | "jeddah" | "neom" | "other";
type Pace = "standard" | "fast" | "accelerated";

const copy = {
  ar: {
    eyebrow: "حاسبة التكلفة والوقت",
    title: "قدّر مشروعك في ٣٠ ثانية.",
    description:
      "أداة تقدير أولية مبنية على بيانات مشاريعنا الفعلية. اختر النطاق، وحرّك المتغيرات، واحصل على نطاق تكلفة ومدة واقعي — قبل أن تبدأ الحوار.",
    projectType: "نوع المشروع",
    area: "المساحة (م²)",
    quality: "مستوى التشطيب",
    city: "موقع المشروع",
    pace: "وتيرة التنفيذ",
    estimate: "التقدير الأولي",
    range: "نطاق التكلفة",
    duration: "المدة المتوقعة",
    months: "شهراً",
    perM2: "ريال / م²",
    breakdown: "توزيع التكلفة",
    disclaimer:
      "تقدير استرشادي لا يُعد عرضاً تعاقدياً. نُصدر عرضاً مفصلاً بعد مراجعة المخططات والموقع.",
    cta: "اطلب عرضاً مفصلاً",
    types: {
      residential: "سكني فاخر",
      commercial: "تجاري / مكاتب",
      infrastructure: "بنية تحتية",
      industrial: "صناعي",
    },
    qualities: {
      essential: "أساسي",
      premium: "متقدم",
      signature: "توقيع العطار",
    },
    cities: {
      riyadh: "الرياض",
      jeddah: "جدة",
      neom: "نيوم",
      other: "مدينة أخرى",
    },
    paces: {
      standard: "قياسي",
      fast: "سريع",
      accelerated: "مُعجّل",
    },
    parts: {
      structure: "الهيكل والأعمال المدنية",
      finishes: "التشطيبات",
      mep: "الكهروميكانيك",
      management: "الإدارة والجودة",
    },
  },
  en: {
    eyebrow: "Cost & time estimator",
    title: "Estimate your project in 30 seconds.",
    description:
      "A preliminary tool built on our actual project data. Choose the scope, adjust the variables, and get a realistic cost and duration range — before the conversation starts.",
    projectType: "Project type",
    area: "Area (m²)",
    quality: "Finish level",
    city: "Project location",
    pace: "Delivery pace",
    estimate: "Preliminary estimate",
    range: "Cost range",
    duration: "Expected duration",
    months: "months",
    perM2: "SAR / m²",
    breakdown: "Cost breakdown",
    disclaimer:
      "Indicative only; not a contractual offer. We issue a detailed proposal after reviewing drawings and site conditions.",
    cta: "Request a detailed quote",
    types: {
      residential: "Luxury residential",
      commercial: "Commercial / offices",
      infrastructure: "Infrastructure",
      industrial: "Industrial",
    },
    qualities: {
      essential: "Essential",
      premium: "Premium",
      signature: "Elattar signature",
    },
    cities: {
      riyadh: "Riyadh",
      jeddah: "Jeddah",
      neom: "NEOM",
      other: "Another city",
    },
    paces: {
      standard: "Standard",
      fast: "Fast",
      accelerated: "Accelerated",
    },
    parts: {
      structure: "Structure & civil works",
      finishes: "Finishes",
      mep: "MEP",
      management: "Management & QA",
    },
  },
};

const typeRate: Record<ProjectType, number> = {
  residential: 3200,
  commercial: 4200,
  infrastructure: 1800,
  industrial: 2800,
};

const typeProductivity: Record<ProjectType, number> = {
  residential: 1800,
  commercial: 1400,
  infrastructure: 2200,
  industrial: 2500,
};

const qualityFactor: Record<Quality, number> = {
  essential: 0.85,
  premium: 1,
  signature: 1.35,
};

const cityFactor: Record<City, number> = {
  riyadh: 1,
  jeddah: 1.08,
  neom: 1.22,
  other: 1.05,
};

const paceFactor: Record<Pace, number> = {
  standard: 1,
  fast: 1.12,
  accelerated: 1.25,
};

const paceDuration: Record<Pace, number> = {
  standard: 1,
  fast: 0.82,
  accelerated: 0.66,
};

export function Estimator() {
  const { locale, isRTL } = useI18n();
  const c = copy[locale];
  const [type, setType] = useState<ProjectType>("commercial");
  const [area, setArea] = useState(18000);
  const [quality, setQuality] = useState<Quality>("premium");
  const [city, setCity] = useState<City>("riyadh");
  const [pace, setPace] = useState<Pace>("standard");

  const result = useMemo(() => {
    const safeArea = Math.max(200, Math.min(500000, Number.isFinite(area) ? area : 200));
    const total =
      safeArea *
      typeRate[type] *
      qualityFactor[quality] *
      cityFactor[city] *
      paceFactor[pace];
    const months = Math.max(
      4,
      Math.ceil((safeArea / typeProductivity[type]) * paceDuration[pace]),
    );
    return {
      low: total * 0.92,
      high: total * 1.08,
      total,
      months,
      perM2: total / safeArea,
    };
  }, [area, city, pace, quality, type]);

  const nf = new Intl.NumberFormat(locale === "ar" ? "ar-SA" : "en-US", {
    maximumFractionDigits: 0,
  });
  const df = new Intl.NumberFormat(locale === "ar" ? "ar-SA" : "en-US", {
    maximumFractionDigits: 1,
  });

  const breakdown = [
    { key: "structure" as const, pct: 38 },
    { key: "finishes" as const, pct: 27 },
    { key: "mep" as const, pct: 22 },
    { key: "management" as const, pct: 13 },
  ];

  const optionClass = (active: boolean) =>
    cn(
      "px-3 py-2 text-[0.62rem] font-medium transition-colors",
      active
        ? "bg-gold text-obsidian"
        : "border border-white/10 text-ivory/45 hover:border-gold/40 hover:text-ivory",
    );

  return (
    <section id="estimator" className="relative overflow-hidden bg-ivory text-ink">
      <div className="pointer-events-none absolute inset-0 opacity-[0.35] [background-image:linear-gradient(rgba(10,11,14,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(10,11,14,0.035)_1px,transparent_1px)] [background-size:90px_90px]" />
      <div className="container-lux section-pad relative">
        <SectionHeading
          eyebrow={c.eyebrow}
          title={c.title}
          description={c.description}
          tone="light"
          titleClassName="max-w-3xl"
        />

        <div className="mt-12 grid gap-px overflow-hidden border border-ink/10 bg-ink/10 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="bg-ivory p-6 sm:p-9">
            <div className="flex items-center gap-3 border-b border-ink/10 pb-5">
              <Calculator className="h-4 w-4 text-gold-dark" />
              <span className="text-[0.58rem] font-semibold uppercase tracking-[0.18em] text-ink/45">
                {c.estimate}
              </span>
            </div>

            <div className="mt-6 space-y-6">
              <div>
                <p className="mb-3 text-[0.58rem] font-semibold uppercase tracking-[0.16em] text-ink/45">
                  {c.projectType}
                </p>
                <div className="flex flex-wrap gap-2">
                  {(Object.keys(c.types) as ProjectType[]).map((item) => (
                    <button
                      key={item}
                      type="button"
                      onClick={() => setType(item)}
                      className={optionClass(type === item)}
                    >
                      {c.types[item]}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between gap-4">
                  <label
                    htmlFor="estimator-area"
                    className="text-[0.58rem] font-semibold uppercase tracking-[0.16em] text-ink/45"
                  >
                    {c.area}
                  </label>
                  <span className="tabular text-sm font-medium text-ink">{nf.format(area)}</span>
                </div>
                <input
                  id="estimator-area"
                  type="range"
                  min={200}
                  max={120000}
                  step={200}
                  value={area}
                  onChange={(event) => setArea(Number(event.target.value))}
                  className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-ink/10 accent-gold-dark"
                />
                <div className="mt-2 flex justify-between text-[0.5rem] text-ink/30">
                  <span>200</span>
                  <span>120,000</span>
                </div>
              </div>

              <div>
                <p className="mb-3 text-[0.58rem] font-semibold uppercase tracking-[0.16em] text-ink/45">
                  {c.quality}
                </p>
                <div className="flex flex-wrap gap-2">
                  {(Object.keys(c.qualities) as Quality[]).map((item) => (
                    <button
                      key={item}
                      type="button"
                      onClick={() => setQuality(item)}
                      className={optionClass(quality === item)}
                    >
                      {c.qualities[item]}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid gap-6 sm:grid-cols-2">
                <div>
                  <p className="mb-3 text-[0.58rem] font-semibold uppercase tracking-[0.16em] text-ink/45">
                    {c.city}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {(Object.keys(c.cities) as City[]).map((item) => (
                      <button
                        key={item}
                        type="button"
                        onClick={() => setCity(item)}
                        className={optionClass(city === item)}
                      >
                        {c.cities[item]}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="mb-3 text-[0.58rem] font-semibold uppercase tracking-[0.16em] text-ink/45">
                    {c.pace}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {(Object.keys(c.paces) as Pace[]).map((item) => (
                      <button
                        key={item}
                        type="button"
                        onClick={() => setPace(item)}
                        className={optionClass(pace === item)}
                      >
                        {c.paces[item]}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col justify-between bg-obsidian p-6 text-ivory sm:p-9">
            <div>
              <span className="eyebrow">{c.estimate}</span>
              <p className="mt-4 text-[0.58rem] uppercase tracking-[0.16em] text-ivory/35">
                {c.range}
              </p>
              <p className="mt-2 font-display text-[clamp(2.1rem,5vw,4.1rem)] leading-none text-ivory">
                <span className="tabular text-gold">{df.format(result.low / 1_000_000)}</span>
                <span className="mx-2 text-ivory/25">–</span>
                <span className="tabular text-gold">{df.format(result.high / 1_000_000)}</span>
                <span className="ms-2 text-[0.35em] font-sans uppercase tracking-[0.14em] text-ivory/35">
                  {locale === "ar" ? "مليون ر.س" : "M SAR"}
                </span>
              </p>

              <div className="mt-7 grid grid-cols-2 gap-px overflow-hidden border border-white/10 bg-white/10">
                <div className="bg-coal p-4">
                  <Clock3 className="h-3.5 w-3.5 text-gold" />
                  <p className="mt-3 tabular text-xl font-light text-ivory">
                    {nf.format(result.months)}
                  </p>
                  <p className="mt-1 text-[0.48rem] uppercase tracking-[0.14em] text-ivory/30">
                    {c.months}
                  </p>
                </div>
                <div className="bg-coal p-4">
                  <Ruler className="h-3.5 w-3.5 text-gold" />
                  <p className="mt-3 tabular text-xl font-light text-ivory">
                    {nf.format(Math.round(result.perM2))}
                  </p>
                  <p className="mt-1 text-[0.48rem] uppercase tracking-[0.14em] text-ivory/30">
                    {c.perM2}
                  </p>
                </div>
              </div>

              <div className="mt-7">
                <p className="text-[0.55rem] uppercase tracking-[0.16em] text-ivory/35">
                  {c.breakdown}
                </p>
                <div className="mt-4 space-y-3">
                  {breakdown.map((part) => (
                    <div key={part.key}>
                      <div className="flex items-center justify-between gap-3 text-[0.58rem]">
                        <span className="text-ivory/55">{c.parts[part.key]}</span>
                        <span className="tabular text-ivory/35">{part.pct}%</span>
                      </div>
                      <div className="mt-1.5 h-1 overflow-hidden bg-white/10">
                        <div
                          className="h-full bg-gradient-to-r from-gold-dark to-gold"
                          style={{ width: `${part.pct}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-8">
              <p className="text-[0.6rem] leading-relaxed text-ivory/30">{c.disclaimer}</p>
              <Link
                href="/contact"
                className="btn-shine group mt-4 inline-flex h-11 items-center justify-center gap-2 bg-gold px-5 text-[0.62rem] font-semibold uppercase tracking-[0.14em] text-obsidian transition-colors hover:bg-gold-light"
              >
                <Wallet className="h-3.5 w-3.5" />
                {c.cta}
                <ArrowUpRight
                  className={cn(
                    "h-3.5 w-3.5 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5",
                    isRTL && "-scale-x-100",
                  )}
                />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowUpRight, RefreshCcw, Sparkles, X } from "lucide-react";
import { useI18n } from "@/components/providers/I18nProvider";
import {
  ESTIMATE_BREAKDOWN,
  computeEstimate,
  type EstimateType,
} from "@/lib/estimate";
import { cn } from "@/lib/utils";

type BudgetBand = "under-50" | "50-200" | "200-1000" | "1000-plus";
type Verdict = "aligned" | "headroom" | "gap";

type Message = {
  id: number;
  role: "assistant" | "user";
  text: string;
};

const BUDGET_RANGE: Record<BudgetBand, { min: number; max: number }> = {
  "under-50": { min: 0, max: 50_000_000 },
  "50-200": { min: 50_000_000, max: 200_000_000 },
  "200-1000": { min: 200_000_000, max: 1_000_000_000 },
  "1000-plus": { min: 1_000_000_000, max: Number.POSITIVE_INFINITY },
};

const copy = {
  ar: {
    name: "العطار الذكي",
    role: "مستشار المشاريع الذكي",
    online: "متصل الآن",
    open: "افتح العطار الذكي",
    close: "إغلاق المستشار",
    intro:
      "أهلاً بك. أنا العطار الذكي — مستشارك الأول لتقدير المشاريع. ثلاث خطوات سريعة وسأصدر لك جدوى أولية مبنية على بيانات محفظتنا الفعلية منذ ١٩٨٧.",
    askType: "ما نوع المشروع الذي تدرسه؟",
    askArea: "ممتاز. ما المساحة التقريبية (م²)؟",
    areaHint: "حرّك المؤشر أو اكتب القيمة مباشرة",
    areaUnit: "م²",
    confirmArea: "تأكيد المساحة",
    askBudget: "وما النطاق التقريبي للميزانية؟",
    thinking: "أحلّل المعطيات…",
    userArea: (area: string) => `مساحة تقريبية: ${area} م²`,
    resultTitle: "الجدوى الأولية",
    range: "نطاق التكلفة",
    months: "المدة المتوقعة",
    monthsUnit: "شهراً",
    perM2: "ريال / م²",
    verdict: {
      label: "موقف الميزانية",
      aligned: "ضمن الميزانية",
      headroom: "مساحة لرفع المواصفات",
      gap: "يتطلب جدولة مراحل",
    },
    verdictNote: {
      aligned: "تقديرك يقع داخل النطاق المالي الذي حددته.",
      headroom: "ميزانيتك تتيح مساحة أكبر أو مستوى تشطيب أعلى.",
      gap: "التقدير يتجاوز النطاق — نقترح تنفيذاً على مراحل أو مراجعة النطاق.",
    },
    breakdown: "توزيع التكلفة",
    parts: {
      structure: "الهيكل والأعمال المدنية",
      finishes: "التشطيبات",
      mep: "الكهروميكانيك",
      management: "الإدارة والجودة",
    },
    nextSteps: "الخطوات التالية",
    steps: [
      "مراجعة أولية للمخططات خلال ٤٨ ساعة",
      "زيارة موقع واجتماع مع فريق الهندسة",
      "عرض تفصيلي ومالي موقّع",
    ],
    disclaimer:
      "تقدير استرشادي لا يُعد عرضاً تعاقدياً. النتائج مبنية على متوسطات محفظتنا المنفذة.",
    cta: "اطلب استشارة رسمية",
    again: "قيّم مشروعاً آخر",
    types: {
      residential: "سكني فاخر",
      commercial: "تجاري / مكاتب",
      infrastructure: "بنية تحتية",
      industrial: "صناعي",
    } as Record<EstimateType, string>,
    budgets: {
      "under-50": "أقل من ٥٠ مليون",
      "50-200": "٥٠ – ٢٠٠ مليون",
      "200-1000": "٢٠٠ مليون – مليار",
      "1000-plus": "أكثر من مليار",
    } as Record<BudgetBand, string>,
    budgetUnit: "ر.س",
  },
  en: {
    name: "Elattar AI",
    role: "Smart project consultant",
    online: "Online",
    open: "Open Elattar AI",
    close: "Close consultant",
    intro:
      "Welcome. I am Elattar AI — your first-pass project consultant. Three quick questions and I will issue a preliminary feasibility read built on our portfolio data since 1987.",
    askType: "What type of project are you studying?",
    askArea: "Excellent. What is the approximate built area (m²)?",
    areaHint: "Drag the slider or type the value directly",
    areaUnit: "m²",
    confirmArea: "Confirm area",
    askBudget: "And the approximate budget range?",
    thinking: "Analysing inputs…",
    userArea: (area: string) => `Approximate area: ${area} m²`,
    resultTitle: "Preliminary feasibility",
    range: "Cost range",
    months: "Expected duration",
    monthsUnit: "months",
    perM2: "SAR / m²",
    verdict: {
      label: "Budget position",
      aligned: "Within budget",
      headroom: "Room to raise spec",
      gap: "Needs phasing",
    },
    verdictNote: {
      aligned: "The estimate sits inside the range you set.",
      headroom: "Your budget allows more area or a higher finish level.",
      gap: "The estimate exceeds the range — we suggest phased delivery or a scope review.",
    },
    breakdown: "Cost breakdown",
    parts: {
      structure: "Structure & civil works",
      finishes: "Finishes",
      mep: "MEP",
      management: "Management & QA",
    },
    nextSteps: "Next steps",
    steps: [
      "Initial drawing review within 48 hours",
      "Site visit and engineering team meeting",
      "Signed detailed technical & financial proposal",
    ],
    disclaimer:
      "Indicative only; not a contractual offer. Figures are based on our delivered portfolio averages.",
    cta: "Request formal consultation",
    again: "Estimate another project",
    types: {
      residential: "Luxury residential",
      commercial: "Commercial / offices",
      infrastructure: "Infrastructure",
      industrial: "Industrial",
    } as Record<EstimateType, string>,
    budgets: {
      "under-50": "Under SAR 50M",
      "50-200": "SAR 50–200M",
      "200-1000": "SAR 200M–1B",
      "1000-plus": "Above SAR 1B",
    } as Record<BudgetBand, string>,
    budgetUnit: "SAR",
  },
};

const THINKING_MS = 850;

/**
 * "Elattar AI" — structured-logic consultant widget.
 *
 * A guided chat surface for prospective clients: project type, built area and
 * budget band feed the shared estimation engine (the same model behind the
 * public estimator) and return a feasibility read with a budget verdict, cost
 * breakdown and consultation path. Deterministic logic only — no network
 * calls, no personal data leaves the browser.
 */
export function SmartConsultant() {
  const { locale, isRTL } = useI18n();
  const c = copy[locale];

  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [thinking, setThinking] = useState(false);
  const [type, setType] = useState<EstimateType | null>(null);
  const [area, setArea] = useState(18000);
  const [budget, setBudget] = useState<BudgetBand | null>(null);
  const [showResult, setShowResult] = useState(false);

  const closeRef = useRef<HTMLButtonElement | null>(null);
  const logRef = useRef<HTMLDivElement | null>(null);
  const messageIdRef = useRef(0);
  const timersRef = useRef<number[]>([]);

  useEffect(() => {
    return () => {
      timersRef.current.forEach((timer) => window.clearTimeout(timer));
      timersRef.current = [];
    };
  }, []);

  // Escape closes the panel; focus lands on the close button when it opens.
  useEffect(() => {
    if (!open) return;
    const focusTimer = window.setTimeout(() => closeRef.current?.focus(), 60);
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKeyDown);
    return () => {
      window.clearTimeout(focusTimer);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  // Keep the freshest message in view without locking page scroll.
  useEffect(() => {
    const log = logRef.current;
    if (log) log.scrollTop = log.scrollHeight;
  }, [messages, thinking, showResult]);

  const say = useCallback(
    (text: string, after?: () => void) => {
      setThinking(true);
      const timer = window.setTimeout(() => {
        setMessages((current) => [
          ...current,
          { id: (messageIdRef.current += 1), role: "assistant", text },
        ]);
        setThinking(false);
        after?.();
      }, THINKING_MS);
      timersRef.current.push(timer);
    },
    [],
  );

  const openPanel = () => {
    setOpen(true);
    if (messages.length === 0) {
      say(c.intro);
    }
  };

  const chooseType = (value: EstimateType) => {
    setType(value);
    setMessages((current) => [
      ...current,
      { id: (messageIdRef.current += 1), role: "user", text: c.types[value] },
    ]);
    say(c.askArea);
  };

  const confirmArea = () => {
    const formatted = new Intl.NumberFormat(locale === "ar" ? "ar-SA" : "en-US", {
      maximumFractionDigits: 0,
    }).format(area);
    setMessages((current) => [
      ...current,
      { id: (messageIdRef.current += 1), role: "user", text: c.userArea(formatted) },
    ]);
    say(c.askBudget);
  };

  const chooseBudget = (value: BudgetBand) => {
    setBudget(value);
    setMessages((current) => [
      ...current,
      {
        id: (messageIdRef.current += 1),
        role: "user",
        text: `${c.budgets[value]} ${c.budgetUnit}`,
      },
    ]);
    say(c.thinking, () => setShowResult(true));
  };

  const reset = () => {
    timersRef.current.forEach((timer) => window.clearTimeout(timer));
    timersRef.current = [];
    setMessages([]);
    setThinking(false);
    setType(null);
    setArea(18000);
    setBudget(null);
    setShowResult(false);
    say(c.intro);
  };

  const result =
    type && budget
      ? computeEstimate({
          type,
          area,
          quality: "premium",
          city: "riyadh",
          pace: "standard",
        })
      : null;

  const verdict: Verdict | null = (() => {
    if (!result || !budget) return null;
    const band = BUDGET_RANGE[budget];
    if (result.high < band.min) return "headroom";
    if (result.low > band.max) return "gap";
    return "aligned";
  })();

  const nf = new Intl.NumberFormat(locale === "ar" ? "ar-SA" : "en-US", {
    maximumFractionDigits: 0,
  });
  const df = new Intl.NumberFormat(locale === "ar" ? "ar-SA" : "en-US", {
    maximumFractionDigits: 1,
  });

  return (
    <>
      <button
        type="button"
        onClick={openPanel}
        aria-label={c.open}
        className="group fixed bottom-5 end-5 z-[90] flex h-14 w-14 items-center justify-center rounded-full bg-gold text-obsidian shadow-[0_18px_50px_-12px_rgba(212,175,55,0.65)] transition-transform duration-300 hover:scale-105 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold sm:bottom-7 sm:end-7"
      >
        <Sparkles className="h-5 w-5" />
        <span className="absolute -top-1 -end-1 flex h-3 w-3">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-gold-light opacity-60" />
          <span className="relative inline-flex h-3 w-3 rounded-full border-2 border-obsidian bg-gold-light" />
        </span>
      </button>

      <AnimatePresence>
        {open ? (
          <motion.div
            role="dialog"
            aria-label={c.name}
            initial={{ opacity: 0, y: 24, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.98 }}
            transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
            className="fixed bottom-20 end-5 z-[95] flex max-h-[min(78svh,640px)] w-[min(25rem,calc(100vw-2.5rem))] flex-col overflow-hidden border border-white/12 bg-coal/95 text-ivory shadow-[0_40px_120px_-24px_rgba(0,0,0,0.85)] backdrop-blur-xl sm:bottom-24 sm:end-7"
          >
            {/* Header */}
            <div className="flex items-center gap-3 border-b border-white/10 bg-obsidian/70 px-4 py-3.5">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gold/15 text-gold">
                <Sparkles className="h-4 w-4" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[0.8rem] font-semibold leading-tight">{c.name}</p>
                <p className="flex items-center gap-1.5 text-[0.52rem] uppercase tracking-[0.14em] text-ivory/40">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  {c.role} · {c.online}
                </p>
              </div>
              <button
                ref={closeRef}
                type="button"
                onClick={() => setOpen(false)}
                aria-label={c.close}
                className="flex h-8 w-8 items-center justify-center border border-white/12 text-ivory/50 transition-colors hover:border-gold/50 hover:text-gold"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* Conversation */}
            <div
              ref={logRef}
              aria-live="polite"
              className="flex flex-1 flex-col gap-3 overflow-y-auto overscroll-contain px-4 py-4"
            >
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={cn(
                    "max-w-[85%] px-3.5 py-2.5 text-[0.76rem] leading-relaxed",
                    message.role === "assistant"
                      ? "self-start border border-white/10 bg-obsidian/70 text-ivory/75"
                      : "self-end border border-gold/40 bg-gold/15 text-ivory",
                  )}
                >
                  {message.text}
                </div>
              ))}

              {thinking ? (
                <div className="flex items-center gap-1.5 self-start border border-white/10 bg-obsidian/70 px-3.5 py-3">
                  {[0, 1, 2].map((dot) => (
                    <span
                      key={dot}
                      className="h-1.5 w-1.5 animate-bounce rounded-full bg-gold/70"
                      style={{ animationDelay: `${dot * 140}ms` }}
                    />
                  ))}
                </div>
              ) : null}

              {!showResult && !thinking && type === null ? (
                <div className="mt-1 flex flex-wrap gap-2">
                  {(Object.keys(c.types) as EstimateType[]).map((value) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => chooseType(value)}
                      className="border border-gold/35 px-3 py-2 text-[0.66rem] font-medium text-gold transition-colors hover:bg-gold hover:text-obsidian"
                    >
                      {c.types[value]}
                    </button>
                  ))}
                </div>
              ) : null}

              {!showResult && !thinking && type !== null && budget === null ? (
                <div className="mt-1 flex flex-wrap gap-2">
                  {(Object.keys(c.budgets) as BudgetBand[]).map((value) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => chooseBudget(value)}
                      className="border border-gold/35 px-3 py-2 text-[0.66rem] font-medium text-gold transition-colors hover:bg-gold hover:text-obsidian"
                    >
                      {c.budgets[value]}
                    </button>
                  ))}
                </div>
              ) : null}
            </div>

            {/* Controls / result */}
            {showResult && result && verdict ? (
              <div className="border-t border-white/10 bg-obsidian/60 p-4">
                <span className="text-[0.52rem] font-semibold uppercase tracking-[0.2em] text-gold">
                  {c.resultTitle}
                </span>
                <p className="mt-2 font-display text-[clamp(1.35rem,4vw,1.9rem)] leading-none text-ivory">
                  <span className="tabular text-gold">{df.format(result.low / 1_000_000)}</span>
                  <span className="mx-1.5 text-ivory/25">–</span>
                  <span className="tabular text-gold">{df.format(result.high / 1_000_000)}</span>
                  <span className="ms-1.5 text-[0.42em] font-sans uppercase tracking-[0.14em] text-ivory/40">
                    {locale === "ar" ? "مليون ر.س" : "M SAR"}
                  </span>
                </p>

                <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-[0.6rem] text-ivory/55">
                  <span>
                    {c.months}: <span className="tabular text-ivory">{nf.format(result.months)}</span>{" "}
                    {c.monthsUnit}
                  </span>
                  <span>
                    {c.perM2}:{" "}
                    <span className="tabular text-ivory">{nf.format(Math.round(result.perM2))}</span>
                  </span>
                </div>

                <div className="mt-3 border border-gold/25 bg-gold/[0.06] px-3 py-2.5">
                  <span className="text-[0.5rem] uppercase tracking-[0.16em] text-ivory/40">
                    {c.verdict.label}
                  </span>
                  <p className="mt-0.5 text-[0.72rem] font-semibold text-gold">
                    {c.verdict[verdict]}
                  </p>
                  <p className="mt-1 text-[0.6rem] leading-relaxed text-ivory/50">
                    {c.verdictNote[verdict]}
                  </p>
                </div>

                <div className="mt-4 space-y-2">
                  {ESTIMATE_BREAKDOWN.map((part) => (
                    <div key={part.key}>
                      <div className="flex items-center justify-between text-[0.56rem]">
                        <span className="text-ivory/55">{c.parts[part.key]}</span>
                        <span className="tabular text-ivory/35">{part.pct}%</span>
                      </div>
                      <div className="mt-1 h-[3px] overflow-hidden bg-white/10">
                        <div
                          className="h-full bg-gradient-to-r from-gold-dark to-gold"
                          style={{ width: `${part.pct}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-4">
                  <span className="text-[0.5rem] uppercase tracking-[0.18em] text-ivory/40">
                    {c.nextSteps}
                  </span>
                  <ol className="mt-2 space-y-1.5">
                    {c.steps.map((step, index) => (
                      <li key={step} className="flex items-baseline gap-2 text-[0.62rem] text-ivory/60">
                        <span className="tabular text-[0.5rem] text-gold/70">0{index + 1}</span>
                        {step}
                      </li>
                    ))}
                  </ol>
                </div>

                <Link
                  href="/contact"
                  className="btn-shine mt-4 flex h-10 items-center justify-center gap-2 bg-gold px-4 text-[0.62rem] font-semibold uppercase tracking-[0.14em] text-obsidian transition-colors hover:bg-gold-light"
                >
                  {c.cta}
                  <ArrowUpRight className={cn("h-3.5 w-3.5", isRTL && "-scale-x-100")} />
                </Link>

                <p className="mt-3 text-[0.52rem] leading-relaxed text-ivory/30">{c.disclaimer}</p>

                <button
                  type="button"
                  onClick={reset}
                  className="mt-2 flex items-center gap-1.5 text-[0.56rem] font-semibold uppercase tracking-[0.14em] text-ivory/40 transition-colors hover:text-gold"
                >
                  <RefreshCcw className="h-3 w-3" />
                  {c.again}
                </button>
              </div>
            ) : (
              <div className="border-t border-white/10 bg-obsidian/60 p-4">
                {type === null ? null : budget === null ? (
                  <div>
                    <div className="flex items-center justify-between gap-3">
                      <label
                        htmlFor="smart-area"
                        className="text-[0.58rem] font-semibold uppercase tracking-[0.16em] text-ivory/45"
                      >
                        {c.areaHint}
                      </label>
                      <span className="tabular text-[0.8rem] font-medium text-gold">
                        {nf.format(area)} {c.areaUnit}
                      </span>
                    </div>
                    <input
                      id="smart-area"
                      type="range"
                      min={500}
                      max={120000}
                      step={500}
                      value={area}
                      onChange={(event) => setArea(Number(event.target.value))}
                      className="mt-3 h-1.5 w-full cursor-pointer appearance-none rounded-full bg-white/10 accent-gold"
                    />
                    <button
                      type="button"
                      onClick={confirmArea}
                      className="mt-3 w-full border border-gold/40 py-2.5 text-[0.62rem] font-semibold uppercase tracking-[0.14em] text-gold transition-colors hover:bg-gold hover:text-obsidian"
                    >
                      {c.confirmArea}
                    </button>
                  </div>
                ) : null}
              </div>
            )}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  );
}

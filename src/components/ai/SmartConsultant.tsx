"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowUpRight, RefreshCcw, Sparkles, X } from "lucide-react";
import { useI18n } from "@/components/providers/I18nProvider";
import {
  ESTIMATE_BREAKDOWN,
  computeEstimate,
  type EstimateCity,
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
  const { t, locale, isRTL } = useI18n();
  const c = t.sections.smartConsultant;

  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [thinking, setThinking] = useState(false);
  const [type, setType] = useState<EstimateType | null>(null);
  const [area, setArea] = useState(18000);
  const [areaConfirmed, setAreaConfirmed] = useState(false);
  const [budget, setBudget] = useState<BudgetBand | null>(null);
  const [city, setCity] = useState<EstimateCity | null>(null);
  const [showResult, setShowResult] = useState(false);

  const closeRef = useRef<HTMLButtonElement | null>(null);
  const logRef = useRef<HTMLDivElement | null>(null);
  const messageIdRef = useRef(0);
  const timersRef = useRef<number[]>([]);
  const introRef = useRef(false);

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
    if (!introRef.current) {
      introRef.current = true;
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
    if (areaConfirmed) return;
    setAreaConfirmed(true);
    const formatted = new Intl.NumberFormat(locale === "ar" ? "ar-SA" : "en-US", {
      maximumFractionDigits: 0,
    }).format(area);
    setMessages((current) => [
      ...current,
      { id: (messageIdRef.current += 1), role: "user", text: c.userArea.replace("{area}", formatted) },
    ]);
    say(c.askBudget);
  };

  const chooseBudget = (value: BudgetBand) => {
    if (!areaConfirmed) return;
    setBudget(value);
    setMessages((current) => [
      ...current,
      {
        id: (messageIdRef.current += 1),
        role: "user",
        text: `${c.budgets[value]} ${c.budgetUnit}`,
      },
    ]);
    say(c.askLocation);
  };

  const chooseCity = (value: EstimateCity) => {
    setCity(value);
    setMessages((current) => [
      ...current,
      { id: (messageIdRef.current += 1), role: "user", text: c.cities[value] },
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
    setAreaConfirmed(false);
    setBudget(null);
    setCity(null);
    setShowResult(false);
    say(c.intro);
  };

  const result =
    type && budget
      ? computeEstimate({
          type,
          area,
          quality: "premium",
          city: city ?? "riyadh",
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
        className="group fixed bottom-5 end-5 z-[90] flex h-14 w-14 items-center justify-center rounded-full bg-gold text-obsidian shadow-[0_18px_50px_-12px_rgba(184,134,11,0.65)] transition-transform duration-300 hover:scale-105 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold sm:bottom-7 sm:end-7"
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
                <p className="flex items-center gap-1.5 text-[0.52rem] uppercase tracking-[0.14em] text-ivory/50">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  {c.role} · {c.online}
                </p>
              </div>
              <button
                ref={closeRef}
                type="button"
                onClick={() => setOpen(false)}
                aria-label={c.close}
                className="flex h-8 w-8 items-center justify-center border border-white/12 text-ivory/60 transition-colors hover:border-gold/50 hover:text-gold"
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

              {!showResult && !thinking && type !== null && areaConfirmed && budget === null ? (
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

              {!showResult && !thinking && type !== null && budget !== null && city === null ? (
                <div className="mt-1 flex flex-wrap gap-2">
                  {(Object.keys(c.cities) as EstimateCity[]).map((value) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => chooseCity(value)}
                      className="border border-gold/35 px-3 py-2 text-[0.66rem] font-medium text-gold transition-colors hover:bg-gold hover:text-obsidian"
                    >
                      {c.cities[value]}
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
                  <span className="mx-1.5 text-ivory/35">–</span>
                  <span className="tabular text-gold">{df.format(result.high / 1_000_000)}</span>
                  <span className="ms-1.5 text-[0.42em] font-sans uppercase tracking-[0.14em] text-ivory/50">
                    {t.sections.inline.smartMillionSuffix}
                  </span>
                </p>

                <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-[0.6rem] text-ivory/65">
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
                  <span className="text-[0.5rem] uppercase tracking-[0.16em] text-ivory/50">
                    {c.verdict.label}
                  </span>
                  <p className="mt-0.5 text-[0.72rem] font-semibold text-gold">
                    {c.verdict[verdict]}
                  </p>
                  <p className="mt-1 text-[0.6rem] leading-relaxed text-ivory/60">
                    {c.verdictNote[verdict]}
                  </p>
                </div>

                <div className="mt-4 space-y-2">
                  {ESTIMATE_BREAKDOWN.map((part) => (
                    <div key={part.key}>
                      <div className="flex items-center justify-between text-[0.56rem]">
                        <span className="text-ivory/65">{c.parts[part.key]}</span>
                        <span className="tabular text-ivory/45">{part.pct}%</span>
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
                  <span className="text-[0.5rem] uppercase tracking-[0.18em] text-ivory/50">
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

                <p className="mt-3 text-[0.52rem] leading-relaxed text-ivory/40">{c.disclaimer}</p>

                <button
                  type="button"
                  onClick={reset}
                  className="mt-2 flex items-center gap-1.5 text-[0.56rem] font-semibold uppercase tracking-[0.14em] text-ivory/50 transition-colors hover:text-gold"
                >
                  <RefreshCcw className="h-3 w-3" />
                  {c.again}
                </button>
              </div>
            ) : type !== null && budget === null ? (
              <div className="border-t border-white/10 bg-obsidian/60 p-4">
                {areaConfirmed ? (
                  <p className="text-[0.58rem] uppercase tracking-[0.16em] text-ivory/50">
                    {c.userArea.replace("{area}", nf.format(area))}
                  </p>
                ) : (
                  <div>
                    <div className="flex items-center justify-between gap-3">
                      <label
                        htmlFor="smart-area"
                        className="text-[0.58rem] font-semibold uppercase tracking-[0.16em] text-ivory/55"
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
                )}
              </div>
            ) : null}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  );
}

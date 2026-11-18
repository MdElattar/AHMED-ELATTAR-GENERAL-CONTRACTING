"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowUpRight, Calculator, Clock3, FileDown, Ruler, Wallet } from "lucide-react";
import { useI18n } from "@/components/providers/I18nProvider";
import { ProposalDialog } from "@/components/sections/proposal/ProposalDialog";
import { SectionHeading } from "@/components/ui/SectionHeading";
import {
  CURRENCIES,
  CURRENCY_META,
  FALLBACK_RATES,
  convertFromSar,
  formatCurrencyValue,
  formatRateLine,
  type CurrencyCode,
  type ExchangeRates,
} from "@/lib/currency";
import {
  computeEstimate,
  costBreakdownForType,
  type EstimateCity,
  type EstimatePace,
  type EstimateQuality,
  type EstimateType,
} from "@/lib/estimate";
import { cn } from "@/lib/utils";

type ProjectType = EstimateType;
type Quality = EstimateQuality;
type City = EstimateCity;
type Pace = EstimatePace;

export function Estimator() {
  const { t, locale, isRTL } = useI18n();
  const c = t.sections.estimator;
  const [type, setType] = useState<EstimateType>("commercial");
  const [area, setArea] = useState(18000);
  const [quality, setQuality] = useState<EstimateQuality>("premium");
  const [city, setCity] = useState<EstimateCity>("riyadh");
  const [pace, setPace] = useState<EstimatePace>("standard");
  const [currency, setCurrency] = useState<CurrencyCode>("SAR");
  const [rates, setRates] = useState<ExchangeRates | null>(null);
  const [proposalOpen, setProposalOpen] = useState(false);

  const result = useMemo(
    () => computeEstimate({ type, area, quality, city, pace }),
    [area, city, pace, quality, type],
  );

  useEffect(() => {
    let cancelled = false;
    fetch("/api/rates")
      .then((response) => (response.ok ? response.json() : null))
      .then((payload: ExchangeRates | null) => {
        if (!cancelled && payload?.rates) setRates(payload);
      })
      .catch(() => {
        // The estimator keeps the reference rates when the feed is unavailable.
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const activeRates = rates ?? {
    base: "SAR" as const,
    rates: FALLBACK_RATES,
    updatedAt: "",
    source: "fallback" as const,
  };

  // Formatters are expensive to construct and this panel re-renders on every
  // slider tick, so build them once per locale.
  const nf = useMemo(
    () => new Intl.NumberFormat(locale === "ar" ? "ar-SA" : "en-US", { maximumFractionDigits: 0 }),
    [locale],
  );

  const breakdown = costBreakdownForType(type);
  const money = (amountSar: number, compact = false) =>
    formatCurrencyValue(
      convertFromSar(amountSar, currency, activeRates.rates),
      currency,
      locale,
      { compact },
    );

  const optionClass = (active: boolean) =>
    cn(
      "px-3 py-2 text-[0.62rem] font-medium transition-colors",
      active
        ? "bg-accent-fill text-accent-fg"
        : "border border-line text-fg hover:border-accent/40 hover:text-fg",
    );

  return (
    <section id="estimator" className="relative overflow-hidden bg-fg text-fg">
      <div className="pointer-events-none absolute inset-0 opacity-[0.35] [background-image:linear-gradient(rgb(var(--fg-rgb)/0.05)_1px,transparent_1px),linear-gradient(90deg,rgb(var(--fg-rgb)/0.05)_1px,transparent_1px)] [background-size:90px_90px]" />
      <div className="container-lux section-pad relative">
        <SectionHeading
          eyebrow={c.eyebrow}
          title={c.title}
          description={c.description}
          tone="light"
          titleClassName="max-w-3xl"
        />

        <div className="mt-12 grid gap-px overflow-hidden border border-line bg-line lg:grid-cols-[1.05fr_0.95fr]">
          <div className="bg-fg p-6 sm:p-9">
            <div className="flex items-center gap-3 border-b border-line pb-5">
              <Calculator className="h-4 w-4 text-accent" />
              <span className="text-[0.58rem] font-semibold uppercase tracking-[0.18em] text-fg">
                {c.estimate}
              </span>
            </div>

            <div className="mt-6 space-y-6">
              <div>
                <p className="mb-3 text-[0.58rem] font-semibold uppercase tracking-[0.16em] text-fg">
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
                    className="text-[0.58rem] font-semibold uppercase tracking-[0.16em] text-fg"
                  >
                    {c.area}
                  </label>
                  <span className="tabular text-sm font-medium text-fg">{nf.format(area)}</span>
                </div>
                <input
                  id="estimator-area"
                  type="range"
                  min={200}
                  max={120000}
                  step={200}
                  value={area}
                  onChange={(event) => setArea(Number(event.target.value))}
                  className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-line accent-accent"
                />
                <div className="mt-2 flex justify-between text-[0.5rem] text-fg">
                  <span>200</span>
                  <span>120,000</span>
                </div>
              </div>

              <div>
                <p className="mb-3 text-[0.58rem] font-semibold uppercase tracking-[0.16em] text-fg">
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
                  <p className="mb-3 text-[0.58rem] font-semibold uppercase tracking-[0.16em] text-fg">
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
                  <p className="mb-3 text-[0.58rem] font-semibold uppercase tracking-[0.16em] text-fg">
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

          <div className="flex flex-col justify-between bg-bg p-6 text-fg sm:p-9">
            <div>
              <span className="eyebrow">{c.estimate}</span>
              <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                <p className="text-[0.58rem] uppercase tracking-[0.16em] text-fg">
                  {c.range}
                </p>
                <div className="flex items-center gap-1" aria-label={c.currency}>
                  {CURRENCIES.map((code) => (
                    <button
                      key={code}
                      type="button"
                      onClick={() => setCurrency(code)}
                      aria-pressed={currency === code}
                      className={cn(
                        "h-7 px-2.5 text-[0.5rem] font-semibold uppercase tracking-[0.12em] transition-colors",
                        currency === code
                          ? "bg-accent-fill text-accent-fg"
                          : "border border-line text-fg hover:border-accent/40 hover:text-accent",
                      )}
                    >
                      {CURRENCY_META[code][locale]}
                    </button>
                  ))}
                </div>
              </div>
              <p className="mt-2 font-display text-[clamp(1.9rem,4.4vw,3.6rem)] leading-none text-fg">
                <span className="tabular text-accent">{money(result.low, true)}</span>
                <span className="mx-2 text-fg">–</span>
                <span className="tabular text-accent">{money(result.high, true)}</span>
              </p>
              <p className="mt-2 text-[0.5rem] uppercase tracking-[0.14em] text-fg">
                {activeRates.source === "live" ? c.liveRates : c.fallbackRates} ·{" "}
                {formatRateLine(activeRates, locale)}
              </p>

              <div className="mt-7 grid grid-cols-2 gap-px overflow-hidden border border-line bg-line">
                <div className="bg-surface p-4">
                  <Clock3 className="h-3.5 w-3.5 text-accent" />
                  <p className="mt-3 tabular text-xl font-light text-fg">
                    {nf.format(result.months)}
                  </p>
                  <p className="mt-1 text-[0.48rem] uppercase tracking-[0.14em] text-fg">
                    {c.months}
                  </p>
                </div>
                <div className="bg-surface p-4">
                  <Ruler className="h-3.5 w-3.5 text-accent" />
                  <p className="mt-3 tabular text-xl font-light text-fg">
                    {money(result.perM2)}
                  </p>
                  <p className="mt-1 text-[0.48rem] uppercase tracking-[0.14em] text-fg">
                    {c.perM2}
                  </p>
                </div>
              </div>

              <div className="mt-7">
                <p className="text-[0.55rem] uppercase tracking-[0.16em] text-fg">
                  {c.breakdown}
                </p>
                <div className="mt-4 space-y-3">
                  {breakdown.map((part) => (
                    <div key={part.key}>
                      <div className="flex items-center justify-between gap-3 text-[0.58rem]">
                        <span className="text-fg">{c.parts[part.key]}</span>
                        <span className="ms-auto tabular text-fg">
                          {money((result.total * part.pct) / 100, true)}
                        </span>
                        <span className="tabular text-fg">{part.pct}%</span>
                      </div>
                      <div className="mt-1.5 h-1 overflow-hidden bg-line">
                        <div
                          className="h-full bg-gradient-to-r from-accent to-accent"
                          style={{ width: `${part.pct}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-8">
              <p className="text-[0.6rem] leading-relaxed text-fg">{c.disclaimer}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setProposalOpen(true)}
                  className="group inline-flex h-11 items-center justify-center gap-2 border border-accent/35 px-5 text-[0.62rem] font-semibold uppercase tracking-[0.14em] text-accent transition-colors hover:border-accent hover:bg-accent/10"
                >
                  <FileDown className="h-3.5 w-3.5" />
                  {c.proposal}
                </button>
                <Link
                  href="/contact"
                  className="btn-shine group inline-flex h-11 items-center justify-center gap-2 bg-accent-fill px-5 text-[0.62rem] font-semibold uppercase tracking-[0.14em] text-accent-fg transition-colors hover:bg-accent-fill"
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
      </div>
      {proposalOpen ? (
        <ProposalDialog
          open
          onClose={() => setProposalOpen(false)}
          defaults={{ type, area, quality, city, pace }}
        />
      ) : null}
    </section>
  );
}

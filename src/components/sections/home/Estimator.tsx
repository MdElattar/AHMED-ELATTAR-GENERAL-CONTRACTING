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
        ? "bg-gold text-obsidian"
        : "border border-white/10 text-ivory/55 hover:border-gold/40 hover:text-ivory",
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
              <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                <p className="text-[0.58rem] uppercase tracking-[0.16em] text-ivory/45">
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
                          ? "bg-gold text-obsidian"
                          : "border border-white/10 text-ivory/50 hover:border-gold/40 hover:text-gold",
                      )}
                    >
                      {CURRENCY_META[code][locale]}
                    </button>
                  ))}
                </div>
              </div>
              <p className="mt-2 font-display text-[clamp(1.9rem,4.4vw,3.6rem)] leading-none text-ivory">
                <span className="tabular text-gold">{money(result.low, true)}</span>
                <span className="mx-2 text-ivory/35">–</span>
                <span className="tabular text-gold">{money(result.high, true)}</span>
              </p>
              <p className="mt-2 text-[0.5rem] uppercase tracking-[0.14em] text-ivory/35">
                {activeRates.source === "live" ? c.liveRates : c.fallbackRates} ·{" "}
                {formatRateLine(activeRates, locale)}
              </p>

              <div className="mt-7 grid grid-cols-2 gap-px overflow-hidden border border-white/10 bg-white/10">
                <div className="bg-coal p-4">
                  <Clock3 className="h-3.5 w-3.5 text-gold" />
                  <p className="mt-3 tabular text-xl font-light text-ivory">
                    {nf.format(result.months)}
                  </p>
                  <p className="mt-1 text-[0.48rem] uppercase tracking-[0.14em] text-ivory/40">
                    {c.months}
                  </p>
                </div>
                <div className="bg-coal p-4">
                  <Ruler className="h-3.5 w-3.5 text-gold" />
                  <p className="mt-3 tabular text-xl font-light text-ivory">
                    {money(result.perM2)}
                  </p>
                  <p className="mt-1 text-[0.48rem] uppercase tracking-[0.14em] text-ivory/40">
                    {c.perM2}
                  </p>
                </div>
              </div>

              <div className="mt-7">
                <p className="text-[0.55rem] uppercase tracking-[0.16em] text-ivory/45">
                  {c.breakdown}
                </p>
                <div className="mt-4 space-y-3">
                  {breakdown.map((part) => (
                    <div key={part.key}>
                      <div className="flex items-center justify-between gap-3 text-[0.58rem]">
                        <span className="text-ivory/65">{c.parts[part.key]}</span>
                        <span className="ms-auto tabular text-ivory/40">
                          {money((result.total * part.pct) / 100, true)}
                        </span>
                        <span className="tabular text-ivory/55">{part.pct}%</span>
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
              <p className="text-[0.6rem] leading-relaxed text-ivory/40">{c.disclaimer}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setProposalOpen(true)}
                  className="group inline-flex h-11 items-center justify-center gap-2 border border-gold/35 px-5 text-[0.62rem] font-semibold uppercase tracking-[0.14em] text-gold transition-colors hover:border-gold hover:bg-gold/10"
                >
                  <FileDown className="h-3.5 w-3.5" />
                  {c.proposal}
                </button>
                <Link
                  href="/contact"
                  className="btn-shine group inline-flex h-11 items-center justify-center gap-2 bg-gold px-5 text-[0.62rem] font-semibold uppercase tracking-[0.14em] text-obsidian transition-colors hover:bg-gold-light"
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

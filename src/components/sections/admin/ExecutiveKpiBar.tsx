"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Building2,
  CircleDollarSign,
  FileSignature,
  FolderKanban,
  Inbox,
  Loader2,
  RefreshCcw,
  TrendingUp,
} from "lucide-react";
import { useI18n } from "@/components/providers/I18nProvider";

type Kpis = {
  totalProjects: number;
  activeProjects: number;
  portfolioValue: number;
  netProfit: number;
  newInquiries: number;
  totalInquiries: number;
  signedContracts: number;
  updatedAt: string;
};

const copy = {
  ar: {
    live: "مباشر",
    refresh: "تحديث المؤشرات",
    totalProjects: "إجمالي المشاريع",
    activeProjects: "قيد التنفيذ",
    portfolioValue: "قيمة المحفظة",
    netProfit: "صافي الربح",
    newInquiries: "استفسارات جديدة",
    signedContracts: "عقود موقعة",
    updated: "آخر تحديث",
    unavailable: "تعذّر تحديث المؤشرات.",
  },
  en: {
    live: "Live",
    refresh: "Refresh KPIs",
    totalProjects: "Total projects",
    activeProjects: "Active projects",
    portfolioValue: "Portfolio value",
    netProfit: "Net profit",
    newInquiries: "New inquiries",
    signedContracts: "Signed contracts",
    updated: "Updated",
    unavailable: "Could not refresh the KPI feed.",
  },
};

const formatM = (value: number, locale: "ar" | "en") =>
  `${new Intl.NumberFormat(locale === "ar" ? "ar-SA" : "en-US", {
    maximumFractionDigits: 1,
  }).format(value)}M`;

export function ExecutiveKpiBar() {
  const { locale } = useI18n();
  const c = copy[locale];
  const [kpis, setKpis] = useState<Kpis | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(false);

  const load = useCallback(async (initial = false, signal?: AbortSignal) => {
    if (initial) setLoading(true);
    else setRefreshing(true);

    try {
      const response = await fetch("/api/admin/kpis", {
        cache: "no-store",
        credentials: "same-origin",
        signal,
      });
      if (!response.ok) throw new Error("request_failed");
      const data = (await response.json()) as { kpis?: Kpis };
      if (!data.kpis) throw new Error("invalid_payload");
      setKpis(data.kpis);
      setError(false);
    } catch (loadError) {
      if ((loadError as Error).name !== "AbortError") setError(true);
    } finally {
      if (initial) setLoading(false);
      else setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load(true, controller.signal);

    const interval = window.setInterval(() => {
      void load(false);
    }, 30_000);
    const onFocus = () => void load(false);

    window.addEventListener("focus", onFocus);
    return () => {
      controller.abort();
      window.clearInterval(interval);
      window.removeEventListener("focus", onFocus);
    };
  }, [load]);

  const stats = kpis
    ? [
        { label: c.totalProjects, value: String(kpis.totalProjects), icon: Building2 },
        { label: c.activeProjects, value: String(kpis.activeProjects), icon: FolderKanban },
        {
          label: c.portfolioValue,
          value: formatM(kpis.portfolioValue, locale),
          icon: CircleDollarSign,
        },
        { label: c.netProfit, value: formatM(kpis.netProfit, locale), icon: TrendingUp },
        { label: c.newInquiries, value: String(kpis.newInquiries), icon: Inbox },
        {
          label: c.signedContracts,
          value: String(kpis.signedContracts),
          icon: FileSignature,
        },
      ]
    : [];

  return (
    <div className="border border-white/10 bg-coal/60">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 px-5 py-4">
        <div className="flex flex-wrap items-center gap-3">
          <span className="inline-flex items-center gap-1.5 border border-gold/30 bg-gold/[0.06] px-2.5 py-1.5 text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-gold">
            <span
              aria-hidden="true"
              className="h-1.5 w-1.5 rounded-full bg-gold [animation:live-pulse_3.8s_ease-out_infinite]"
            />
            {c.live}
          </span>
          <span className="text-[0.74rem] text-ivory/40">
            {c.updated}{" "}
            {kpis
              ? new Intl.DateTimeFormat(locale === "ar" ? "ar-SA" : "en-GB", {
                  hour: "2-digit",
                  minute: "2-digit",
                }).format(new Date(kpis.updatedAt))
              : "—"}
          </span>
        </div>
        <button
          type="button"
          onClick={() => void load(false)}
          disabled={refreshing}
          className="inline-flex h-10 items-center gap-1.5 border border-white/10 px-3 text-[0.68rem] font-semibold uppercase tracking-[0.12em] text-ivory/50 transition-colors hover:border-gold/40 hover:text-gold disabled:opacity-50"
          aria-label={c.refresh}
        >
          {refreshing ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <RefreshCcw className="h-3.5 w-3.5" />
          )}
          {c.refresh}
        </button>
      </div>

      {error ? (
        <p className="border-b border-red-400/15 bg-red-400/[0.05] px-5 py-3 text-[0.76rem] text-red-300/80">
          {c.unavailable}
        </p>
      ) : null}

      <div className="grid grid-cols-2 gap-px bg-white/10 lg:grid-cols-3 2xl:grid-cols-6">
        {loading && !kpis
          ? Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="bg-coal p-5" aria-hidden="true">
                <span className="block h-4 w-4 animate-pulse rounded-sm bg-white/10" />
                <span className="mt-3 block h-6 w-16 animate-pulse bg-white/10" />
                <span className="mt-2 block h-2 w-20 animate-pulse bg-white/[0.07]" />
              </div>
            ))
          : stats.map(({ label, value, icon: Icon }) => (
              <div key={label} className="min-w-0 bg-coal p-5">
                <Icon className="h-4 w-4 text-gold" />
                <p className="mt-3 tabular font-display text-[1.9rem] leading-none text-ivory">
                  {value}
                </p>
                <p className="mt-2.5 text-[0.72rem] leading-snug uppercase tracking-[0.12em] text-ivory/40">
                  {label}
                </p>
              </div>
            ))}
      </div>
    </div>
  );
}

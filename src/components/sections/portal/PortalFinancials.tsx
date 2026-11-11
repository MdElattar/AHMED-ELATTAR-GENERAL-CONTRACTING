"use client";

import { useMemo, useState } from "react";
import {
  ArrowDownToLine,
  ArrowUpRight,
  Banknote,
  CircleDollarSign,
  Receipt,
  TrendingUp,
  Wallet,
} from "lucide-react";
import { useI18n } from "@/components/providers/I18nProvider";
import { useWorkspace } from "@/components/providers/WorkspaceProvider";
import { PortalShell } from "@/components/sections/portal/PortalShell";
import { Reveal } from "@/components/ui/Reveal";
import type { PortalInvoice } from "@/data/portal";
import { cn } from "@/lib/utils";

const copy = {
  ar: {
    title: "المالية والفواتير",
    description:
      "قيمة العقد، المدفوعات، التدفق النقدي، وصافي الربح — شفافية كاملة على مستوى كل مشروع.",
    select: "اختر المشروع",
    contract: "قيمة العقد",
    spent: "المنفق حتى الآن",
    remaining: "المتبقي",
    profit: "صافي الربح",
    margin: "هامش الربح",
    budget: "الميزانية مقابل المنفق",
    invoices: "الفواتير",
    download: "تنزيل",
    paid: "مدفوع",
    due: "مستحق",
    pending: "معلق",
    stages: "جدول الدفعات",
    noInvoices: "لا توجد فواتير لهذا المشروع.",
    empty: "لم يُسند إليك مشروع بعد. ستظهر البيانات المالية هنا عند بدء التنفيذ.",
  },
  en: {
    title: "Financials & invoices",
    description:
      "Contract value, payments, cash flow, and net profit — full transparency at project level.",
    select: "Select project",
    contract: "Contract value",
    spent: "Spent to date",
    remaining: "Remaining",
    profit: "Net profit",
    margin: "Profit margin",
    budget: "Budget vs spent",
    invoices: "Invoices",
    download: "Download",
    paid: "Paid",
    due: "Due",
    pending: "Pending",
    stages: "Payment schedule",
    noInvoices: "No invoices for this project.",
    empty: "No project is assigned to you yet. Financial data will appear here when work begins.",
  },
};

function downloadInvoice(invoice: PortalInvoice, projectName: string) {
  const content = [
    "AHMED ELATTAR GENERAL CONTRACTING CO.",
    "PAYMENT RECORD",
    "",
    `Project: ${projectName}`,
    `Invoice: ${invoice.number}`,
    `Title: ${invoice.title.en}`,
    `Amount: ${invoice.amount}`,
    `Date: ${invoice.date}`,
    `Status: ${invoice.status}`,
    "",
    "This export summarises the payment record held in the client portal.",
    "For the controlled tax invoice, contact the finance department.",
  ].join("\n");
  const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `${invoice.number.toLowerCase()}.txt`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

export function PortalFinancials() {
  const { t, l, locale } = useI18n();
  const { projects } = useWorkspace();
  const c = copy[locale];
  const [selectedSlug, setSelectedSlug] = useState("");

  const activeSlug = projects.some((item) => item.slug === selectedSlug)
    ? selectedSlug
    : (projects[0]?.slug ?? "");
  const project = projects.find((item) => item.slug === activeSlug) ?? projects[0] ?? null;
  const contract = project?.contractValue ?? project?.budget ?? 0;
  const spent = project?.spent ?? 0;
  const profit = project?.profit ?? 0;
  const remaining = Math.max(0, contract - spent);
  const margin = contract ? (profit / contract) * 100 : 0;

  const nf = useMemo(
    () =>
      new Intl.NumberFormat(locale === "ar" ? "ar-SA" : "en-US", {
        maximumFractionDigits: 1,
      }),
    [locale],
  );

  const formatM = (value: number) =>
    locale === "ar" ? `${nf.format(value)} مليون` : `${nf.format(value)}M`;
  const invoices = project?.invoices ?? [];
  const paidTotal = invoices.filter((invoice) => invoice.status === "paid").length;

  if (!project) {
    return (
      <PortalShell title={c.title} description={c.description}>
        <div className="border border-white/10 bg-coal px-6 py-16 text-center">
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-gold/30 text-gold">
            <Wallet className="h-5 w-5" />
          </span>
          <p className="mx-auto mt-5 max-w-md text-[0.8rem] leading-relaxed text-ivory/45">
            {c.empty}
          </p>
        </div>
      </PortalShell>
    );
  }

  return (
    <PortalShell title={c.title} description={c.description}>
      <div className="flex flex-col gap-2 sm:flex-row">
        {projects.map((item) => (
          <button
            key={item.slug}
            type="button"
            onClick={() => setSelectedSlug(item.slug)}
            className={cn(
              "flex flex-1 flex-col gap-1 border p-4 text-start transition-colors",
              item.slug === activeSlug
                ? "border-gold/40 bg-gold/[0.08] text-ivory"
                : "border-white/10 bg-coal text-ivory/70 hover:border-white/25",
            )}
          >
            <span className="truncate text-[0.76rem] font-medium">{l(item.title)}</span>
            <span
              className={cn(
                "text-[0.54rem] uppercase tracking-[0.12em]",
                item.slug === activeSlug ? "text-ivory/40" : "text-ivory/30",
              )}
            >
              {l(item.location)}
            </span>
          </button>
        ))}
      </div>

      <div className="mt-6 grid grid-cols-2 gap-px border border-white/10 bg-white/10 lg:grid-cols-4">
        {[
          { label: c.contract, value: formatM(contract), icon: CircleDollarSign },
          { label: c.spent, value: formatM(spent), icon: Wallet },
          { label: c.remaining, value: formatM(remaining), icon: Banknote },
          { label: c.profit, value: formatM(profit), icon: TrendingUp },
        ].map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="bg-coal p-5">
              <Icon className="h-4 w-4 text-gold" />
              <p className="mt-3 tabular font-display text-2xl leading-none text-ivory">
                {stat.value}
              </p>
              <p className="mt-2 text-[0.5rem] uppercase tracking-[0.14em] text-ivory/35">
                {stat.label}
              </p>
            </div>
          );
        })}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="flex flex-col gap-6">
          <Reveal>
            <div className="border border-white/10 bg-coal p-6">
              <div className="flex items-center justify-between gap-4">
                <span className="text-[0.55rem] font-semibold uppercase tracking-[0.16em] text-gold">
                  {c.budget}
                </span>
                <span className="tabular text-[0.68rem] text-ivory/45">{formatM(contract)}</span>
              </div>
              <div className="mt-5 space-y-5">
                <div>
                  <div className="flex items-center justify-between text-[0.62rem] text-ivory/50">
                    <span>{c.spent}</span>
                    <span className="tabular">{formatM(spent)}</span>
                  </div>
                  <div className="mt-2 h-2 overflow-hidden bg-white/10">
                    <div
                      className="h-full bg-gold"
                      style={{ width: `${Math.min(100, (spent / Math.max(1, contract)) * 100)}%` }}
                    />
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between text-[0.62rem] text-ivory/50">
                    <span>{c.profit}</span>
                    <span className="tabular">{formatM(profit)}</span>
                  </div>
                  <div className="mt-2 h-2 overflow-hidden bg-white/10">
                    <div
                      className="h-full bg-emerald-300/70"
                      style={{ width: `${Math.min(100, margin * 2)}%` }}
                    />
                  </div>
                </div>
              </div>
              <div className="mt-6 grid grid-cols-2 gap-4 border-t border-white/10 pt-5">
                <div>
                  <p className="text-[0.5rem] uppercase tracking-[0.14em] text-ivory/35">
                    {c.margin}
                  </p>
                  <p className="mt-1 tabular text-xl font-light text-ivory">
                    {nf.format(margin)}%
                  </p>
                </div>
                <div>
                  <p className="text-[0.5rem] uppercase tracking-[0.14em] text-ivory/35">
                    {c.paid}
                  </p>
                  <p className="mt-1 tabular text-xl font-light text-ivory">
                    {paidTotal} / {invoices.length}
                  </p>
                </div>
              </div>
            </div>
          </Reveal>

          <Reveal delay={80}>
            <div className="border border-white/10 bg-coal">
              <div className="flex items-center justify-between gap-3 border-b border-white/10 px-6 py-4">
                <span className="text-[0.55rem] font-semibold uppercase tracking-[0.16em] text-gold">
                  {c.stages}
                </span>
                <ArrowDownToLine className="h-4 w-4 text-gold/60" />
              </div>
              {invoices.length ? (
                <div className="space-y-4 p-6">
                  {invoices.map((invoice, index) => {
                    const complete = invoice.status === "paid";
                    const current = invoice.status === "due";
                    return (
                      <div key={invoice.number}>
                        <div className="flex items-center justify-between gap-3 text-[0.65rem]">
                          <span className={complete || current ? "text-ivory/75" : "text-ivory/40"}>
                            {String(index + 1).padStart(2, "0")} · {l(invoice.title)}
                          </span>
                          <span className="tabular text-ivory/35">{invoice.amount}</span>
                        </div>
                        <div className="mt-1.5 h-1.5 overflow-hidden bg-white/10">
                          <div
                            className={cn(
                              "h-full",
                              complete
                                ? "bg-gold"
                                : current
                                  ? "bg-gold/40"
                                  : "bg-white/20",
                            )}
                            style={{ width: complete ? "100%" : current ? "55%" : "15%" }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="p-6 text-center text-[0.68rem] text-ivory/35">{c.noInvoices}</p>
              )}
            </div>
          </Reveal>
        </div>

        <Reveal delay={120}>
          <div className="border border-white/10 bg-coal">
            <div className="flex items-center justify-between gap-3 border-b border-white/10 px-6 py-4">
              <span className="text-[0.55rem] font-semibold uppercase tracking-[0.16em] text-gold">
                {c.invoices}
              </span>
              <Receipt className="h-4 w-4 text-gold/60" />
            </div>
            {invoices.length ? (
              <ul className="divide-y divide-white/8">
                {invoices.map((invoice) => (
                  <li key={invoice.number} className="flex items-center gap-3 px-6 py-4">
                    <Receipt className="h-4 w-4 shrink-0 text-gold" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[0.74rem] text-ivory/75">{l(invoice.title)}</p>
                      <span className="tabular text-[0.55rem] text-ivory/35">
                        {invoice.number} · {invoice.date}
                      </span>
                    </div>
                    <div className="shrink-0 text-end">
                      <p className="tabular text-[0.68rem] text-ivory/70">{invoice.amount}</p>
                      <span
                        className={cn(
                          "text-[0.5rem] uppercase tracking-[0.1em]",
                          invoice.status === "paid"
                            ? "text-emerald-300/80"
                            : invoice.status === "due"
                              ? "text-gold"
                              : "text-ivory/35",
                        )}
                      >
                        {c[invoice.status]}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => downloadInvoice(invoice, l(project.title))}
                      className="flex h-8 w-8 shrink-0 items-center justify-center border border-white/12 text-ivory/45 transition-colors hover:border-gold hover:text-gold"
                      aria-label={`${c.download} ${invoice.number}`}
                    >
                      <ArrowDownToLine className="h-3.5 w-3.5" />
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="p-6 text-center text-[0.68rem] text-ivory/35">{c.noInvoices}</p>
            )}
            <div className="border-t border-white/10 p-4">
              <p className="text-[0.58rem] leading-relaxed text-ivory/35">{t.auth.secureNote}</p>
            </div>
          </div>
        </Reveal>
      </div>

      <div className="mt-8 flex flex-col items-start justify-between gap-3 border-t border-white/10 pt-5 text-[0.6rem] text-ivory/35 sm:flex-row sm:items-center">
        <span>{l(project.title)}</span>
        <a
          href="/contact"
          className="inline-flex items-center gap-1.5 font-semibold uppercase tracking-[0.12em] transition-colors hover:text-gold"
        >
          {locale === "ar" ? "تحدث مع الإدارة المالية" : "Talk to finance"}
          <ArrowUpRight className="h-3 w-3" />
        </a>
      </div>
    </PortalShell>
  );
}

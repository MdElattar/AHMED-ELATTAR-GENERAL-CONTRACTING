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
import { portalProjects, type PortalInvoice } from "@/data/portal";
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
    cashflow: "التدفق النقدي",
    invoices: "الفواتير",
    download: "تنزيل",
    paid: "مدفوع",
    due: "مستحق",
    pending: "معلق",
    stages: "مراحل الدفع",
    stageLabels: ["دفعة مقدمة", "التصميم والهندسة", "الهيكل الإنشائي", "التشطيبات", "التسليم"],
    amounts: "القيمة",
    status: "الحالة",
    noInvoices: "لا توجد فواتير لهذا المشروع.",
    demoNotice: "بيانات مالية توضيحية محدثة من لوحة الإدارة.",
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
    cashflow: "Cash flow",
    invoices: "Invoices",
    download: "Download",
    paid: "Paid",
    due: "Due",
    pending: "Pending",
    stages: "Payment stages",
    stageLabels: ["Advance", "Design & engineering", "Structure", "Finishes", "Handover"],
    amounts: "Amount",
    status: "Status",
    noInvoices: "No invoices for this project.",
    demoNotice: "Indicative financial data synced from the admin panel.",
  },
};

function downloadInvoice(invoice: PortalInvoice, projectName: string) {
  const content = [
    "AHMED ELATTAR GENERAL CONTRACTING CO.",
    "INVOICE — DEMO EXPORT",
    "",
    `Project: ${projectName}`,
    `Invoice: ${invoice.number}`,
    `Title: ${invoice.title.en}`,
    `Amount: ${invoice.amount}`,
    `Date: ${invoice.date}`,
    `Status: ${invoice.status}`,
    "",
    "This is a demo export from the client portal.",
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
  const { l, locale } = useI18n();
  const { projects } = useWorkspace();
  const c = copy[locale];
  const [activeSlug, setActiveSlug] = useState(portalProjects[0].slug);

  const portalProject =
    portalProjects.find((item) => item.slug === activeSlug) ?? portalProjects[0];
  const project = projects.find((item) => item.slug === activeSlug);
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

  const formatM = (value: number) => `${nf.format(value)}M`;
  const paidTotal = portalProject.invoices
    .filter((invoice) => invoice.status === "paid")
    .length;

  return (
    <PortalShell title={c.title} description={c.description}>
      <div className="flex flex-col gap-2 sm:flex-row">
        {portalProjects.map((item) => (
          <button
            key={item.slug}
            type="button"
            onClick={() => setActiveSlug(item.slug)}
            className={cn(
              "flex flex-1 flex-col gap-1 border p-4 text-start transition-colors",
              item.slug === activeSlug
                ? "border-ink bg-ink text-ivory"
                : "border-ink/12 bg-ivory text-ink hover:border-ink/30",
            )}
          >
            <span className="truncate text-[0.76rem] font-medium">{l(item.name)}</span>
            <span
              className={cn(
                "text-[0.54rem] uppercase tracking-[0.12em]",
                item.slug === activeSlug ? "text-ivory/40" : "text-ink/35",
              )}
            >
              {l(item.location)}
            </span>
          </button>
        ))}
      </div>

      <div className="mt-6 grid grid-cols-2 gap-px border border-ink/10 bg-ink/10 lg:grid-cols-4">
        {[
          { label: c.contract, value: formatM(contract), icon: CircleDollarSign },
          { label: c.spent, value: formatM(spent), icon: Wallet },
          { label: c.remaining, value: formatM(remaining), icon: Banknote },
          { label: c.profit, value: formatM(profit), icon: TrendingUp },
        ].map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="bg-ivory p-5">
              <Icon className="h-4 w-4 text-gold-dark" />
              <p className="mt-3 tabular font-display text-2xl leading-none text-ink">{stat.value}</p>
              <p className="mt-2 text-[0.5rem] uppercase tracking-[0.14em] text-ink/35">
                {stat.label}
              </p>
            </div>
          );
        })}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="flex flex-col gap-6">
          <Reveal>
            <div className="border border-ink/10 bg-ivory p-6">
              <div className="flex items-center justify-between gap-4">
                <span className="text-[0.55rem] font-semibold uppercase tracking-[0.16em] text-gold-dark">
                  {c.budget}
                </span>
                <span className="tabular text-[0.68rem] text-ink/45">{formatM(contract)}</span>
              </div>
              <div className="mt-5 space-y-5">
                <div>
                  <div className="flex items-center justify-between text-[0.62rem] text-ink/50">
                    <span>{c.spent}</span>
                    <span className="tabular">{formatM(spent)}</span>
                  </div>
                  <div className="mt-2 h-2 overflow-hidden bg-ink/10">
                    <div
                      className="h-full bg-gold-dark"
                      style={{ width: `${Math.min(100, (spent / Math.max(1, contract)) * 100)}%` }}
                    />
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between text-[0.62rem] text-ink/50">
                    <span>{c.profit}</span>
                    <span className="tabular">{formatM(profit)}</span>
                  </div>
                  <div className="mt-2 h-2 overflow-hidden bg-ink/10">
                    <div
                      className="h-full bg-[#4f7a5b]"
                      style={{ width: `${Math.min(100, margin * 2)}%` }}
                    />
                  </div>
                </div>
              </div>
              <div className="mt-6 grid grid-cols-2 gap-4 border-t border-ink/10 pt-5">
                <div>
                  <p className="text-[0.5rem] uppercase tracking-[0.14em] text-ink/35">{c.margin}</p>
                  <p className="mt-1 tabular text-xl font-light text-ink">{nf.format(margin)}%</p>
                </div>
                <div>
                  <p className="text-[0.5rem] uppercase tracking-[0.14em] text-ink/35">{c.paid}</p>
                  <p className="mt-1 tabular text-xl font-light text-ink">
                    {paidTotal} / {portalProject.invoices.length}
                  </p>
                </div>
              </div>
            </div>
          </Reveal>

          <Reveal delay={80}>
            <div className="border border-ink/10 bg-ivory">
              <div className="flex items-center justify-between gap-3 border-b border-ink/10 px-6 py-4">
                <span className="text-[0.55rem] font-semibold uppercase tracking-[0.16em] text-gold-dark">
                  {c.stages}
                </span>
                <ArrowDownToLine className="h-4 w-4 text-gold-dark/60" />
              </div>
              <div className="space-y-4 p-6">
                {c.stageLabels.map((label, index) => {
                  const pct = [20, 15, 30, 25, 10][index];
                  const complete = index < Math.round(paidTotal * 1.7);
                  return (
                    <div key={label}>
                      <div className="flex items-center justify-between gap-3 text-[0.65rem]">
                        <span className={complete ? "text-ink/75" : "text-ink/40"}>
                          {String(index + 1).padStart(2, "0")} · {label}
                        </span>
                        <span className="tabular text-ink/35">{pct}%</span>
                      </div>
                      <div className="mt-1.5 h-1.5 overflow-hidden bg-ink/10">
                        <div
                          className={cn("h-full", complete ? "bg-gold-dark" : "bg-ink/20")}
                          style={{ width: `${complete ? 100 : pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </Reveal>
        </div>

        <Reveal delay={120}>
          <div className="border border-ink/10 bg-ivory">
            <div className="flex items-center justify-between gap-3 border-b border-ink/10 px-6 py-4">
              <span className="text-[0.55rem] font-semibold uppercase tracking-[0.16em] text-gold-dark">
                {c.invoices}
              </span>
              <Receipt className="h-4 w-4 text-gold-dark/60" />
            </div>
            {portalProject.invoices.length ? (
              <ul className="divide-y divide-ink/8">
                {portalProject.invoices.map((invoice) => (
                  <li key={invoice.number} className="flex items-center gap-3 px-6 py-4">
                    <Receipt className="h-4 w-4 shrink-0 text-gold-dark" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[0.74rem] text-ink/75">{l(invoice.title)}</p>
                      <span className="tabular text-[0.55rem] text-ink/35">
                        {invoice.number} · {invoice.date}
                      </span>
                    </div>
                    <div className="shrink-0 text-end">
                      <p className="tabular text-[0.68rem] text-ink/70">{invoice.amount}</p>
                      <span
                        className={cn(
                          "text-[0.5rem] uppercase tracking-[0.1em]",
                          invoice.status === "paid"
                            ? "text-[#4f7a5b]"
                            : invoice.status === "due"
                              ? "text-gold-dark"
                              : "text-ink/35",
                        )}
                      >
                        {c[invoice.status]}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => downloadInvoice(invoice, l(project?.title ?? portalProject.name))}
                      className="flex h-8 w-8 shrink-0 items-center justify-center border border-ink/12 text-ink/45 transition-colors hover:border-gold-dark hover:text-gold-dark"
                      aria-label={`${c.download} ${invoice.number}`}
                    >
                      <ArrowDownToLine className="h-3.5 w-3.5" />
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="p-6 text-center text-[0.68rem] text-ink/35">{c.noInvoices}</p>
            )}
            <div className="border-t border-ink/10 p-4">
              <p className="text-[0.58rem] leading-relaxed text-ink/35">{c.demoNotice}</p>
            </div>
          </div>
        </Reveal>
      </div>

      <div className="mt-8 flex flex-col items-start justify-between gap-3 border-t border-ink/10 pt-5 text-[0.6rem] text-ink/35 sm:flex-row sm:items-center">
        <span>{l(project?.title ?? portalProject.name)}</span>
        <a
          href="/contact"
          className="inline-flex items-center gap-1.5 font-semibold uppercase tracking-[0.12em] transition-colors hover:text-gold-dark"
        >
          {locale === "ar" ? "تحدث مع الإدارة المالية" : "Talk to finance"}
          <ArrowUpRight className="h-3 w-3" />
        </a>
      </div>
    </PortalShell>
  );
}

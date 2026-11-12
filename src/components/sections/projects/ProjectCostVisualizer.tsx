"use client";

import { useMemo, useState } from "react";
import {
  Building2,
  Download,
  Layers3,
  Paintbrush,
  ShieldCheck,
  Zap,
} from "lucide-react";
import { useI18n } from "@/components/providers/I18nProvider";
import { ProposalDialog } from "@/components/sections/proposal/ProposalDialog";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { formatCurrencyValue } from "@/lib/currency";
import { costBreakdownForType, type EstimateInput, type EstimatePart } from "@/lib/estimate";
import { parseAreaSqm, parseSarValue } from "@/lib/project-metrics";
import type { Project } from "@/data/projects";
import { cn } from "@/lib/utils";

const copy = {
  ar: {
    eyebrow: "هندسة التكلفة",
    title: "أين يذهب الاستثمار؟",
    description:
      "تفكيك تفاعلي لقيمة العقد حسب مراكز التكلفة الفعلية. مرّر أو اختر أي شريحة لعرض قيمتها.",
    total: "قيمة العقد",
    perM2: "التكلفة / م²",
    area: "المساحة",
    selected: "المركز المحدد",
    onRequest: "حسب الطلب",
    proposal: "عرض المشروع PDF",
    note: "النسب معايرة حسب فئة الأصل وطبيعة التنفيذ، وتُثبَّت نهائياً بعد اعتماد المخططات.",
    parts: {
      structure: "الهيكل والغلاف",
      finishes: "التشطيبات والنجارة",
      mep: "الكهروميكانيك والأنظمة",
      management: "الإدارة والجودة",
    },
  },
  en: {
    eyebrow: "Cost architecture",
    title: "Where the investment goes.",
    description:
      "An interactive decomposition of the contract value by real cost centre. Hover or select any segment to inspect it.",
    total: "Contract value",
    perM2: "Cost / m²",
    area: "Built area",
    selected: "Selected centre",
    onRequest: "On request",
    proposal: "Project proposal PDF",
    note: "Weights are calibrated to the asset class and delivery profile, then fixed after drawing approval.",
    parts: {
      structure: "Structure & envelope",
      finishes: "Finishes & joinery",
      mep: "MEP & systems",
      management: "Management & QA",
    },
  },
};

const colors: Record<EstimatePart["key"], string> = {
  structure: "#d4af37",
  finishes: "#f2dfa0",
  mep: "#c5a059",
  management: "#8b7440",
};

const icons: Record<EstimatePart["key"], typeof Building2> = {
  structure: Building2,
  finishes: Paintbrush,
  mep: Zap,
  management: ShieldCheck,
};

function cityFor(location: string): EstimateInput["city"] {
  const value = location.toLowerCase();
  if (value.includes("jeddah") || value.includes("جدة")) return "jeddah";
  if (value.includes("neom") || value.includes("نيوم")) return "neom";
  if (value.includes("cairo") || value.includes("القاهرة")) return "cairo";
  return "riyadh";
}

export function ProjectCostVisualizer({
  project,
  contractValue,
}: {
  project: Project;
  contractValue?: number;
}) {
  const { locale, l } = useI18n();
  const c = copy[locale];
  const [activeKey, setActiveKey] = useState<EstimatePart["key"]>("structure");
  const [proposalOpen, setProposalOpen] = useState(false);

  const totalSar = useMemo(() => {
    if (contractValue && contractValue > 0) return contractValue * 1_000_000;
    return parseSarValue(project.value.en);
  }, [contractValue, project.value.en]);

  const areaSqm = useMemo(() => parseAreaSqm(project.area.en), [project.area.en]);
  const breakdown = costBreakdownForType(project.category);
  const active = breakdown.find((part) => part.key === activeKey) ?? breakdown[0];
  const activeAmount = totalSar * (active.pct / 100);
  const radius = 78;
  const circumference = 2 * Math.PI * radius;
  const segments = breakdown.map((part, index) => {
    const startPct = breakdown
      .slice(0, index)
      .reduce((sum, previous) => sum + previous.pct, 0);
    return {
      ...part,
      dash: (part.pct / 100) * circumference,
      offset: (startPct / 100) * circumference,
    };
  });
  const money = (amount: number) =>
    totalSar > 0
      ? formatCurrencyValue(amount, "SAR", locale, { compact: true })
      : c.onRequest;

  const defaults: EstimateInput = {
    type: project.category,
    area: areaSqm || 5000,
    quality: "premium",
    city: cityFor(project.location.en),
    pace: "standard",
  };

  return (
    <section className="relative overflow-hidden bg-obsidian text-ivory">
      <div className="blueprint-grid pointer-events-none absolute inset-0 opacity-30" />
      <div className="container-lux section-pad relative">
        <SectionHeading
          eyebrow={c.eyebrow}
          title={c.title}
          description={c.description}
          titleClassName="max-w-2xl"
        />

        <div className="mt-12 grid gap-px overflow-hidden border border-white/10 bg-white/10 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="flex flex-col items-center justify-center bg-coal p-8 sm:p-12">
            <div className="relative h-64 w-64">
              <svg viewBox="0 0 220 220" className="h-full w-full -rotate-90">
                <circle
                  cx="110"
                  cy="110"
                  r={radius}
                  fill="none"
                  stroke="rgba(255,255,255,0.06)"
                  strokeWidth="22"
                />
                {segments.map((part) => (
                  <circle
                    key={part.key}
                    cx="110"
                    cy="110"
                    r={radius}
                    fill="none"
                    stroke={colors[part.key]}
                    strokeWidth={activeKey === part.key ? 27 : 21}
                    strokeDasharray={`${part.dash} ${circumference - part.dash}`}
                    strokeDashoffset={-part.offset}
                    className="cursor-pointer transition-[stroke-width,opacity] duration-300"
                    opacity={activeKey === part.key ? 1 : 0.62}
                    onMouseEnter={() => setActiveKey(part.key)}
                    onClick={() => setActiveKey(part.key)}
                  />
                ))}
              </svg>
              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="max-w-[8rem] text-[0.5rem] uppercase tracking-[0.16em] text-ivory/35">
                  {c.parts[active.key]}
                </span>
                <span className="mt-1 font-display text-4xl text-gold">{active.pct}%</span>
                <span className="mt-1 text-[0.62rem] text-ivory/55">{money(activeAmount)}</span>
              </div>
            </div>

            <div className="mt-8 grid w-full grid-cols-3 gap-px overflow-hidden border border-white/10 bg-white/10 text-center">
              {[
                { label: c.total, value: money(totalSar) },
                { label: c.area, value: areaSqm ? `${new Intl.NumberFormat(locale === "ar" ? "ar-SA" : "en-US").format(areaSqm)} m²` : "—" },
                { label: c.perM2, value: areaSqm ? money(totalSar / areaSqm) : "—" },
              ].map((fact) => (
                <div key={fact.label} className="bg-obsidian p-3">
                  <p className="text-[0.44rem] uppercase tracking-[0.12em] text-ivory/30">
                    {fact.label}
                  </p>
                  <p className="mt-1 text-[0.64rem] text-ivory/70">{fact.value}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-obsidian p-6 sm:p-10">
            <div className="flex items-center gap-2 text-[0.55rem] uppercase tracking-[0.16em] text-ivory/35">
              <Layers3 className="h-3.5 w-3.5 text-gold" />
              {c.selected}
            </div>

            <div className="mt-5 space-y-2">
              {breakdown.map((part) => {
                const Icon = icons[part.key];
                const selected = activeKey === part.key;
                return (
                  <button
                    key={part.key}
                    type="button"
                    onMouseEnter={() => setActiveKey(part.key)}
                    onFocus={() => setActiveKey(part.key)}
                    onClick={() => setActiveKey(part.key)}
                    aria-pressed={selected}
                    className={cn(
                      "flex w-full items-center gap-4 border p-4 text-start transition-colors",
                      selected
                        ? "border-gold/40 bg-gold/[0.06]"
                        : "border-white/8 bg-white/[0.015] hover:border-white/20",
                    )}
                  >
                    <span
                      className="flex h-9 w-9 shrink-0 items-center justify-center border"
                      style={{ borderColor: `${colors[part.key]}55`, color: colors[part.key] }}
                    >
                      <Icon className="h-4 w-4" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-[0.72rem] text-ivory/75">{c.parts[part.key]}</span>
                      <span className="mt-1 block h-1 overflow-hidden bg-white/10">
                        <span
                          className="block h-full"
                          style={{ width: `${part.pct}%`, background: colors[part.key] }}
                        />
                      </span>
                    </span>
                    <span className="shrink-0 text-end">
                      <span className="block text-[0.66rem] text-ivory/45">{money((totalSar * part.pct) / 100)}</span>
                      <span className="block font-display text-xl text-gold">{part.pct}%</span>
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="mt-6 flex flex-col gap-4 border-t border-white/10 pt-5 sm:flex-row sm:items-center sm:justify-between">
              <p className="max-w-sm text-[0.58rem] leading-relaxed text-ivory/30">{c.note}</p>
              <button
                type="button"
                onClick={() => setProposalOpen(true)}
                className="inline-flex h-10 shrink-0 items-center justify-center gap-2 border border-gold/35 px-4 text-[0.56rem] font-semibold uppercase tracking-[0.14em] text-gold transition-colors hover:border-gold hover:bg-gold/10"
              >
                <Download className="h-3.5 w-3.5" />
                {c.proposal}
              </button>
            </div>
          </div>
        </div>
      </div>

      {proposalOpen ? (
        <ProposalDialog
          open
          onClose={() => setProposalOpen(false)}
          defaults={defaults}
          projectSlug={project.slug}
          projectTitle={l(project.title)}
        />
      ) : null}
    </section>
  );
}

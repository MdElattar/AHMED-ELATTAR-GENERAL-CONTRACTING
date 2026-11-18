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

const colors: Record<EstimatePart["key"], string> = {
  structure: "var(--accent)",
  finishes: "var(--accent-fill)",
  mep: "var(--info)",
  management: "var(--success)",
};

const softColors: Record<EstimatePart["key"], string> = {
  structure: "rgb(var(--accent-rgb)/0.33)",
  finishes: "rgb(var(--accent-rgb)/0.33)",
  mep: "rgb(var(--info-rgb)/0.33)",
  management: "rgb(var(--success-rgb)/0.33)",
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
  const { t, locale, l } = useI18n();
  const c = t.sections.projectCost;
  const [activeKey, setActiveKey] = useState<EstimatePart["key"]>("structure");
  const [proposalOpen, setProposalOpen] = useState(false);

  const totalSar = useMemo(() => {
    if (contractValue && contractValue > 0) return contractValue * 1_000_000;
    return parseSarValue(project.value.en) ?? 0;
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
    <section className="relative overflow-hidden bg-bg text-fg">
      <div className="blueprint-grid pointer-events-none absolute inset-0 opacity-30" />
      <div className="container-lux section-pad relative">
        <SectionHeading
          eyebrow={c.eyebrow}
          title={c.title}
          description={c.description}
          titleClassName="max-w-2xl"
        />

        <div className="mt-12 grid gap-px overflow-hidden border border-line bg-line lg:grid-cols-[0.9fr_1.1fr]">
          <div className="flex flex-col items-center justify-center bg-surface p-8 sm:p-12">
            <div className="relative h-64 w-64">
              <svg viewBox="0 0 220 220" className="h-full w-full -rotate-90">
                <circle
                  cx="110"
                  cy="110"
                  r={radius}
                  fill="none"
                  stroke="rgb(var(--fg-rgb)/0.06)"
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
                <span className="max-w-[8rem] text-[0.5rem] uppercase tracking-[0.16em] text-fg">
                  {c.parts[active.key]}
                </span>
                <span className="mt-1 font-display text-4xl text-accent">{active.pct}%</span>
                <span className="mt-1 text-[0.62rem] text-fg">{money(activeAmount)}</span>
              </div>
            </div>

            <div className="mt-8 grid w-full grid-cols-3 gap-px overflow-hidden border border-line bg-line text-center">
              {[
                { label: c.total, value: money(totalSar) },
                { label: c.area, value: areaSqm ? `${new Intl.NumberFormat(locale === "ar" ? "ar-SA" : "en-US").format(areaSqm)} m²` : "—" },
                { label: c.perM2, value: areaSqm ? money(totalSar / areaSqm) : "—" },
              ].map((fact) => (
                <div key={fact.label} className="bg-bg p-3">
                  <p className="text-[0.44rem] uppercase tracking-[0.12em] text-fg">
                    {fact.label}
                  </p>
                  <p className="mt-1 text-[0.64rem] text-fg">{fact.value}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-bg p-6 sm:p-10">
            <div className="flex items-center gap-2 text-[0.55rem] uppercase tracking-[0.16em] text-fg">
              <Layers3 className="h-3.5 w-3.5 text-accent" />
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
                        ? "border-accent/40 bg-accent/[0.06]"
                        : "border-line bg-surface-2 hover:border-line",
                    )}
                  >
                    <span
                      className="flex h-9 w-9 shrink-0 items-center justify-center border"
                      style={{ borderColor: softColors[part.key], color: colors[part.key] }}
                    >
                      <Icon className="h-4 w-4" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-[0.72rem] text-fg">{c.parts[part.key]}</span>
                      <span className="mt-1 block h-1 overflow-hidden bg-line">
                        <span
                          className="block h-full"
                          style={{ width: `${part.pct}%`, background: colors[part.key] }}
                        />
                      </span>
                    </span>
                    <span className="shrink-0 text-end">
                      <span className="block text-[0.66rem] text-fg">{money((totalSar * part.pct) / 100)}</span>
                      <span className="block font-display text-xl text-accent">{part.pct}%</span>
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="mt-6 flex flex-col gap-4 border-t border-line pt-5 sm:flex-row sm:items-center sm:justify-between">
              <p className="max-w-sm text-[0.58rem] leading-relaxed text-fg">{c.note}</p>
              <button
                type="button"
                onClick={() => setProposalOpen(true)}
                className="inline-flex h-10 shrink-0 items-center justify-center gap-2 border border-accent/35 px-4 text-[0.56rem] font-semibold uppercase tracking-[0.14em] text-accent transition-colors hover:border-accent hover:bg-accent/10"
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

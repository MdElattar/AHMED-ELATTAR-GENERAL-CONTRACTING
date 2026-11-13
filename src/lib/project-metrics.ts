import type { WorkspaceProject } from "@/components/providers/WorkspaceProvider";

export type Project = {
  id: string;
  nameEn: string;
  nameAr?: string;
  city: string;
  cityAr?: string;
  category: string;
  status: "upcoming" | "ongoing" | "completed";
  progress: number; // 0-100
  value: number; // contract value, SAR
  budget: number; // planned cost, SAR
  spent: number; // actual cost to date, SAR
  profit: number; // net profit, SAR
};

export type Health =
  | { key: "no_data" }
  | { key: "on_track" }
  | { key: "watch"; gap: number }
  | { key: "over"; gap: number }
  | { key: "saved"; amount: number }
  | { key: "overrun"; amount: number };

export function getBudgetHealth(p: Project): Health {
  if (!p.budget || p.spent == null) return { key: "no_data" };
  if (p.status === "completed") {
    const delta = p.budget - p.spent;
    return delta >= 0 ? { key: "saved", amount: delta } : { key: "overrun", amount: -delta };
  }
  const gap = (p.spent / p.budget) * 100 - p.progress;
  if (gap > 10) return { key: "over", gap };
  if (gap > 5) return { key: "watch", gap };
  return { key: "on_track" };
}

export const needsAttention = (p: Project) =>
  ["over", "watch", "overrun"].includes(getBudgetHealth(p).key);

export const byCity = (ps: Project[]) =>
  Object.entries(
    ps.reduce<Record<string, { value: number; nameEn: string; nameAr?: string }>>((a, p) => {
      const key = p.city || p.id;
      const prev = a[key] || { value: 0, nameEn: p.city, nameAr: p.cityAr };
      prev.value += Number.isFinite(p.value) ? p.value : 0;
      if (!prev.nameAr && p.cityAr) prev.nameAr = p.cityAr;
      a[key] = prev;
      return a;
    }, {}),
  )
    .map(([id, v]) => ({ id, ...v }))
    .sort((x, y) => y.value - x.value);

/**
 * Format a monetary amount for display.
 * In this workspace, project financial values are stored in million-SAR units
 * (e.g. 2300 = 2.3 billion SAR). Adapts to raw-SAR values if very large.
 */
export function formatSAR(n: number, locale: "ar" | "en" = "en") {
  if (!Number.isFinite(n)) return "—";
  const L = locale === "ar" ? "ar-SA" : "en-US";
  const f = (v: number, d = 2) =>
    new Intl.NumberFormat(L, { maximumFractionDigits: d }).format(v);
  const abs = Math.abs(n);
  // Raw SAR (>= 1,000,000 treated as raw riyals)
  if (abs >= 1_000_000) {
    if (abs >= 1e9) return locale === "ar" ? `${f(n / 1e9)} مليار ر.س` : `SAR ${f(n / 1e9)}B`;
    return locale === "ar" ? `${f(n / 1e6, 1)} مليون ر.س` : `SAR ${f(n / 1e6, 1)}M`;
  }
  // Million-SAR units (workspace convention)
  if (abs >= 1000) {
    return locale === "ar" ? `${f(n / 1000)} مليار ر.س` : `SAR ${f(n / 1000)}B`;
  }
  if (abs >= 1) {
    // show decimals only when needed
    const d = abs >= 100 ? 0 : abs >= 10 ? 1 : 2;
    return locale === "ar" ? `${f(n, d)} مليون ر.س` : `SAR ${f(n, d)}M`;
  }
  if (abs === 0) return locale === "ar" ? "0 ر.س" : "SAR 0";
  return locale === "ar" ? `${f(n * 1_000_000, 0)} ر.س` : `SAR ${f(n * 1_000_000, 0)}`;
}

export type Alert = {
  id: string;
  severity: "critical" | "warning";
  type: "budget_ahead" | "budget_watch" | "overrun";
  projectId: string;
  params: Record<string, number>;
};

export function buildAlerts(ps: Project[]): Alert[] {
  return ps.flatMap((p): Alert[] => {
    const h = getBudgetHealth(p);
    if (h.key === "over")
      return [
        {
          id: `${p.id}-ahead`,
          severity: "critical",
          type: "budget_ahead",
          projectId: p.id,
          params: { gap: Math.round(h.gap) },
        },
      ];
    if (h.key === "watch")
      return [
        {
          id: `${p.id}-watch`,
          severity: "warning",
          type: "budget_watch",
          projectId: p.id,
          params: { gap: Math.round(h.gap) },
        },
      ];
    if (h.key === "overrun")
      return [
        {
          id: `${p.id}-overrun`,
          severity: "critical",
          type: "overrun",
          projectId: p.id,
          params: { amount: h.amount },
        },
      ];
    return [];
  });
}

export function toMetricsProject(p: WorkspaceProject): Project {
  return {
    id: p.slug,
    nameEn: p.title?.en || p.slug,
    nameAr: p.title?.ar || undefined,
    city: p.location?.en || "",
    cityAr: p.location?.ar || undefined,
    category: p.category,
    status: p.status,
    progress: Number.isFinite(p.progress) ? p.progress : 0,
    value: Number.isFinite(p.contractValue) && p.contractValue > 0 ? p.contractValue : (p.budget || 0),
    budget: Number.isFinite(p.budget) ? p.budget : 0,
    spent: Number.isFinite(p.spent) ? p.spent : 0,
    profit: Number.isFinite(p.profit) ? p.profit : 0,
  };
}

export function projectName(p: Project, locale: "ar" | "en") {
  return locale === "ar" ? (p.nameAr || p.nameEn) : p.nameEn;
}

export function projectCity(p: Project, locale: "ar" | "en") {
  return locale === "ar" ? (p.cityAr || p.city) : p.city;
}


// Legacy helpers used by public project visualizer (values stored as display strings)
export function parseSarValue(value: string): number | null {
  if (!value) return null;
  const cleaned = value.replace(/[,\s]/g, "");
  const m = cleaned.match(/([\d.]+)\s*(B|M|K)?/i);
  if (!m) return null;
  const n = parseFloat(m[1]);
  if (!Number.isFinite(n)) return null;
  const unit = (m[2] || "").toUpperCase();
  if (unit === "B") return n * 1_000_000_000;
  if (unit === "M") return n * 1_000_000;
  if (unit === "K") return n * 1_000;
  // if string contains Arabic مليار/مليون
  if (/مليار/.test(value)) return n * 1_000_000_000;
  if (/مليون/.test(value)) return n * 1_000_000;
  return n;
}

export function parseAreaSqm(value: string): number | null {
  if (!value) return null;
  const cleaned = value.replace(/[,\s]/g, "");
  const m = cleaned.match(/([\d.]+)/);
  if (!m) return null;
  const n = parseFloat(m[1]);
  return Number.isFinite(n) ? n : null;
}

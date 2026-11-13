import { L } from "@/lib/dictionary";
import { projects } from "@/data/projects";
import { portalProjects } from "@/data/portal";
import { services } from "@/data/services";

/**
 * Canonical seed records for the database.
 *
 * These are imported only by the repository/seed script — never by client
 * components — so the running site always reads live records from MongoDB (or
 * the development repository) instead of shipping mock arrays in the bundle.
 */

const progressBySlug: Record<string, number> = {
  "advanced-industries": 68,
  "al-hijr-hotel": 42,
  "marina-quarter": 12,
};

const financialsBySlug: Record<string, { budget: number; spent: number; profit: number }> = {
  "aurora-tower": { budget: 1400, spent: 1260, profit: 238 },
  "palm-oasis": { budget: 780, spent: 760, profit: 132 },
  "wadi-crossing": { budget: 920, spent: 905, profit: 148 },
  "advanced-industries": { budget: 1100, spent: 748, profit: 176 },
  "al-hijr-hotel": { budget: 650, spent: 273, profit: 104 },
  "riyadh-central-interchange": { budget: 540, spent: 531, profit: 82 },
  "marina-quarter": { budget: 1800, spent: 216, profit: 324 },
  "solar-energy-park": { budget: 2300, spent: 1564, profit: 391 },
};

export const CONTENT_SLUG = "__site-content__";

export function buildSeedProjects(): Record<string, unknown>[] {
  return projects.map((project, index) => {
    const portal = portalProjects.find((item) => item.slug === project.slug);
    const progress =
      portal?.progress ??
      progressBySlug[project.slug] ??
      (project.status === "completed" ? 100 : project.status === "upcoming" ? 12 : 54);
    const financials =
      financialsBySlug[project.slug] ?? {
        budget: 500 + index * 120,
        spent: (500 + index * 120) * (progress / 100),
        profit: (500 + index * 120) * 0.18,
      };

    return {
      ...project,
      progress,
      budget: financials.budget,
      spent: Math.round(financials.spent),
      profit: Math.round(financials.profit),
      contractValue: financials.budget,
      updatedAt: "2026-10-12",
      gallery: [project.art],
      milestones: portal?.milestones ?? [],
      documents: portal?.documents ?? [],
      invoices: portal?.invoices ?? [],
      phase: portal?.phase ?? L("قيد التخطيط", "In planning"),
      manager: portal?.manager ?? L("فريق العطار", "Elattar team"),
      lastUpdate: portal?.lastUpdate ?? L("", ""),
      nextMilestone: portal?.nextMilestone ?? L("", ""),
    };
  });
}

export function buildSeedContent(): Record<string, unknown> {
  return {
    heroEyebrow: L(
      "منذ ١٩٨٧ · الرياض · المملكة العربية السعودية",
      "Since 1987 · Riyadh · Saudi Arabia",
    ),
    heroTitleTop: L("نبني", "We build"),
    heroTitleAccent: L("ما يبقى.", "what endures."),
    heroDescription: L(
      "أربعة عقود من الهندسة الدقيقة، والإنشاءات الضخمة، والتميّز الذي لا يقبل المساومة. من الرؤية الأولى إلى آخر مسمار.",
      "Four decades of precise engineering, monumental construction, and uncompromising excellence — from first vision to final bolt.",
    ),
    promoVisible: true,
    promoTitle: L("نبني لك ما يبقى.", "We build what endures for you."),
    promoText: L(
      "فريق تطوير الأعمال جاهز لمراجعة نطاق مشروعك وتقديم تصور مبدئي خلال ٢٤ ساعة.",
      "Our development team is ready to review your scope and share an initial approach within 24 hours.",
    ),
    promoHref: "/contact",
    services,
    serviceOverrides: {},
  };
}

export function seedAdminIdentity() {
  const email = (process.env.ADMIN_EMAIL || "alattar@mohamedaelattar.com").trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD || "Alattar!Admin2026";
  
  return {
    email,
    password,
    name: process.env.ADMIN_NAME?.trim() || "Platform Administrator",
    company: process.env.ADMIN_COMPANY?.trim() || "Ahmed Elattar General Contracting",
  };
}

import { createHash } from "node:crypto";
import type { StoredProject } from "@/lib/db";

export type LocalizedFact = { ar: string; en: string };

export type ContractMilestone = {
  titleEn: string;
  title: LocalizedFact;
  date: LocalizedFact;
  status: string;
};

function localized(value: unknown, fallback = ""): LocalizedFact {
  if (typeof value === "string") return { ar: value, en: value };
  if (typeof value === "object" && value !== null) {
    const record = value as Record<string, unknown>;
    return {
      ar: typeof record.ar === "string" ? record.ar : fallback,
      en: typeof record.en === "string" ? record.en : fallback,
    };
  }
  return { ar: fallback, en: fallback };
}

export function projectTitle(project: StoredProject): LocalizedFact {
  return localized(project.payload.title, project.slug);
}

export function projectLocation(project: StoredProject): LocalizedFact {
  return localized(project.payload.location);
}

export function projectValue(project: StoredProject): LocalizedFact {
  return localized(project.payload.value);
}

export function projectScope(project: StoredProject): LocalizedFact[] {
  const raw = project.payload.scope;
  if (!Array.isArray(raw)) return [];
  return raw.map((item) => localized(item)).filter((item) => item.ar || item.en);
}

export function projectMilestones(project: StoredProject): ContractMilestone[] {
  const raw = project.payload.milestones;
  if (!Array.isArray(raw)) return [];

  return raw
    .map((entry) => {
      const record = typeof entry === "object" && entry !== null ? (entry as Record<string, unknown>) : {};
      const title = localized(record.title);
      return {
        titleEn: title.en,
        title,
        date: localized(record.date),
        status: typeof record.status === "string" ? record.status : "upcoming",
      };
    })
    .filter((milestone) => milestone.titleEn);
}

/**
 * Deterministic digest of the commercial terms a client signs. Re-signing after
 * a scope change produces a different hash, so the portal can always show
 * exactly which version was accepted.
 */
export function contractDigest(project: StoredProject): string {
  const body = {
    slug: project.slug,
    title: projectTitle(project),
    value: projectValue(project),
    scope: project.payload.scope ?? [],
    milestones: projectMilestones(project).map((milestone) => ({
      title: milestone.titleEn,
      date: milestone.date.en,
      status: milestone.status,
    })),
  };
  return createHash("sha256").update(JSON.stringify(body)).digest("hex");
}

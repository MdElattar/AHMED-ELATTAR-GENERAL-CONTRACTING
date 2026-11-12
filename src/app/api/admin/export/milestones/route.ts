import { connection } from "next/server";
import { requireAdmin } from "@/lib/auth/guard";
import { csvResponse, type CsvCell } from "@/lib/csv";
import { listProjects } from "@/lib/db";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function localized(value: unknown, locale: "ar" | "en") {
  return isRecord(value) && typeof value[locale] === "string"
    ? String(value[locale])
    : "";
}

function numberValue(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

export async function GET() {
  await connection();
  const session = await requireAdmin();
  if (!session) {
    return new Response("Unauthorized", { status: 401 });
  }

  const projects = (await listProjects()).filter(
    (project) => !project.slug.startsWith("__"),
  );
  const rows: CsvCell[][] = [];

  for (const project of projects) {
    const payload = project.payload;
    const titleEn = localized(payload.title, "en");
    const contractValue = numberValue(payload.contractValue);
    const budget = numberValue(payload.budget);
    const spent = numberValue(payload.spent);
    const profit = numberValue(payload.profit);

    const milestones = Array.isArray(payload.milestones) ? payload.milestones : [];
    for (const item of milestones) {
      if (!isRecord(item)) continue;
      rows.push([
        titleEn,
        project.slug,
        "Milestone",
        localized(item.title, "en"),
        localized(item.title, "ar"),
        localized(item.date, "en"),
        localized(item.date, "ar"),
        typeof item.status === "string" ? item.status : "",
        "",
        contractValue,
        budget,
        spent,
        profit,
      ]);
    }

    const invoices = Array.isArray(payload.invoices) ? payload.invoices : [];
    for (const item of invoices) {
      if (!isRecord(item)) continue;
      rows.push([
        titleEn,
        project.slug,
        "Invoice",
        localized(item.title, "en"),
        localized(item.title, "ar"),
        typeof item.date === "string" ? item.date : "",
        "",
        typeof item.status === "string" ? item.status : "",
        typeof item.amount === "string" ? item.amount : "",
        contractValue,
        budget,
        spent,
        profit,
      ]);
    }
  }

  return csvResponse(
    "ahmed-elattar-financial-milestones.csv",
    [
      "Project",
      "Project slug",
      "Record type",
      "Title (English)",
      "Title (Arabic)",
      "Date (English)",
      "Date (Arabic)",
      "Status",
      "Amount",
      "Contract value",
      "Budget",
      "Spent",
      "Profit",
    ],
    rows,
  );
}

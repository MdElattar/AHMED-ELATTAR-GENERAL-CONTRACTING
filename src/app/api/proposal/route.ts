import { NextResponse, connection, type NextRequest } from "next/server";
import { randomReference } from "@/lib/auth/token";
import {
  projectLocation,
  projectMilestones,
  projectScope,
  projectTitle,
  type LocalizedFact,
} from "@/lib/contract";
import { getExchangeRates } from "@/lib/currency";
import { getProjectBySlug, recordAudit } from "@/lib/db";
import { dispatchAdminAlert } from "@/lib/notifications";
import { buildProposalPdf, type ProposalProject } from "@/lib/proposal";
import {
  NO_STORE_HEADERS,
  clientIp,
  isSameOrigin,
  readJsonBody,
} from "@/lib/security/http";
import { rateLimit } from "@/lib/security/rate-limit";
import { proposalSchema } from "@/lib/security/schemas";
import { isPlainObject } from "@/lib/security/validation";

const typeLabels: Record<string, LocalizedFact> = {
  residential: { ar: "تطوير سكني", en: "Residential development" },
  commercial: { ar: "تطوير تجاري", en: "Commercial development" },
  infrastructure: { ar: "مشروع بنية تحتية", en: "Infrastructure programme" },
  industrial: { ar: "منشأة صناعية", en: "Industrial facility" },
};

const cityLabels: Record<string, LocalizedFact> = {
  riyadh: { ar: "الرياض", en: "Riyadh" },
  jeddah: { ar: "جدة", en: "Jeddah" },
  neom: { ar: "نيوم", en: "NEOM" },
  other: { ar: "المملكة العربية السعودية", en: "Kingdom of Saudi Arabia" },
  cairo: { ar: "القاهرة", en: "Cairo" },
};

export async function POST(request: NextRequest) {
  await connection();

  if (!isSameOrigin(request)) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const limited = rateLimit(`proposal:${clientIp(request)}`, 6, 15 * 60 * 1000);
  if (!limited.ok) {
    return NextResponse.json(
      { error: "rate_limited", retryAfter: limited.retryAfter },
      { status: 429, headers: NO_STORE_HEADERS },
    );
  }

  const body = await readJsonBody(request, 16_000);
  if (!isPlainObject(body)) {
    return NextResponse.json(
      { error: "invalid_body" },
      { status: 400, headers: NO_STORE_HEADERS },
    );
  }

  const parsed = proposalSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "invalid_input", issues: parsed.error.issues.map((issue) => issue.message) },
      { status: 422, headers: NO_STORE_HEADERS },
    );
  }

  const data = parsed.data;
  const projectRecord = data.slug ? await getProjectBySlug(data.slug) : null;
  if (data.slug && !projectRecord) {
    return NextResponse.json(
      { error: "project_not_found" },
      { status: 404, headers: NO_STORE_HEADERS },
    );
  }

  const fallbackType = typeLabels[data.type] ?? typeLabels.commercial;
  const fallbackCity = cityLabels[data.city] ?? cityLabels.other;
  const project: ProposalProject = {
    slug: projectRecord?.slug || data.slug || "bespoke-engagement",
    title: projectRecord ? projectTitle(projectRecord) : fallbackType,
    location: projectRecord ? projectLocation(projectRecord) : fallbackCity,
    category: projectRecord ? String(projectRecord.payload.category ?? data.type) : data.type,
    scope: projectRecord ? projectScope(projectRecord) : [],
    milestones: projectRecord
      ? projectMilestones(projectRecord).map((milestone) => ({
          title: milestone.title,
          date: milestone.date,
          status: milestone.status,
        }))
      : [],
  };

  const reference = randomReference("PROP");
  const issuedAt = new Date();
  const rates = await getExchangeRates();

  try {
    const pdf = await buildProposalPdf({
      reference,
      issuedAt,
      client: {
        name: data.name,
        email: data.email,
        ...(data.company ? { company: data.company } : {}),
        ...(data.phone ? { phone: data.phone } : {}),
      },
      project,
      estimateInput: {
        type: data.type,
        area: data.area,
        quality: data.quality,
        city: data.city,
        pace: data.pace,
      },
      currency: data.currency,
      rates,
    });

    await recordAudit({
      actor: data.email,
      action: "proposal.generated",
      entity: "proposal",
      entityId: reference,
      meta: {
        project: project.slug,
        type: data.type,
        area: data.area,
        currency: data.currency,
      },
      ip: clientIp(request),
    });

    await dispatchAdminAlert({
      title: "Proposal PDF downloaded",
      message: `${data.name} generated a proposal for ${project.title.en}.`,
      meta: {
        Reference: reference,
        Email: data.email,
        Phone: data.phone || "—",
        Area: `${Math.round(data.area)} m²`,
        Currency: data.currency,
      },
      url: `${(process.env.NEXT_PUBLIC_SITE_URL?.trim() || request.nextUrl.origin).replace(/\/$/, "")}/admin`,
    });

    const bytes = new Uint8Array(pdf);
    return new NextResponse(bytes, {
      status: 200,
      headers: {
        ...NO_STORE_HEADERS,
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="Ahmed-Elattar-Proposal-${reference}.pdf"`,
        "Content-Length": String(bytes.byteLength),
        "X-Content-Type-Options": "nosniff",
        "X-Proposal-Reference": reference,
      },
    });
  } catch (error) {
    console.error("[proposal] generation failed", error);
    return NextResponse.json(
      { error: "proposal_failed" },
      { status: 500, headers: NO_STORE_HEADERS },
    );
  }
}

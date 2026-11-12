import { NextResponse, connection, type NextRequest } from "next/server";
import { currentSession } from "@/lib/auth/guard";
import { contractDigest, projectMilestones, projectTitle } from "@/lib/contract";
import {
  getProjectBySlug,
  getSignoff,
  recordAudit,
  saveMilestoneVerification,
} from "@/lib/db";
import { dispatchAdminAlert } from "@/lib/notifications";
import {
  NO_STORE_HEADERS,
  clientIp,
  isSameOrigin,
  readJsonBody,
} from "@/lib/security/http";
import { rateLimit } from "@/lib/security/rate-limit";
import { milestoneVerifySchema } from "@/lib/security/schemas";
import { isPlainObject } from "@/lib/security/validation";

export async function POST(request: NextRequest) {
  await connection();

  if (!isSameOrigin(request)) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const session = await currentSession();
  if (!session) {
    return NextResponse.json(
      { error: "unauthorized" },
      { status: 401, headers: NO_STORE_HEADERS },
    );
  }

  const limited = rateLimit(`milestone-verify:${session.email}`, 30, 15 * 60 * 1000);
  if (!limited.ok) {
    return NextResponse.json(
      { error: "rate_limited", retryAfter: limited.retryAfter },
      { status: 429, headers: NO_STORE_HEADERS },
    );
  }

  const body = await readJsonBody(request, 8_000);
  if (!isPlainObject(body)) {
    return NextResponse.json(
      { error: "invalid_body" },
      { status: 400, headers: NO_STORE_HEADERS },
    );
  }

  const parsed = milestoneVerifySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "invalid_input", issues: parsed.error.issues.map((issue) => issue.message) },
      { status: 422, headers: NO_STORE_HEADERS },
    );
  }

  const data = parsed.data;
  const project = await getProjectBySlug(data.projectSlug);
  if (!project) {
    return NextResponse.json(
      { error: "project_not_found" },
      { status: 404, headers: NO_STORE_HEADERS },
    );
  }

  const milestone = projectMilestones(project).find(
    (entry) => entry.titleEn.toLowerCase() === data.titleEn.toLowerCase(),
  );
  if (!milestone) {
    return NextResponse.json(
      { error: "milestone_not_found" },
      { status: 404, headers: NO_STORE_HEADERS },
    );
  }
  if (milestone.status !== "complete") {
    return NextResponse.json(
      { error: "milestone_not_complete" },
      { status: 409, headers: NO_STORE_HEADERS },
    );
  }

  const signoff = await getSignoff(project.slug, session.email);
  if (!signoff) {
    return NextResponse.json(
      { error: "contract_required" },
      { status: 409, headers: NO_STORE_HEADERS },
    );
  }
  if (signoff.contractHash !== contractDigest(project)) {
    return NextResponse.json(
      { error: "contract_outdated" },
      { status: 409, headers: NO_STORE_HEADERS },
    );
  }

  const updated = await saveMilestoneVerification({
    projectSlug: project.slug,
    email: session.email,
    titleEn: milestone.titleEn,
    verifiedBy: session.email,
  });

  await recordAudit({
    actor: session.email,
    action: "milestone.verified",
    entity: "project",
    entityId: project.slug,
    meta: { milestone: milestone.titleEn },
    ip: clientIp(request),
  });

  await dispatchAdminAlert({
    title: "Milestone verified by client",
    message: `${session.email} verified "${milestone.titleEn}" on ${projectTitle(project).en}.`,
    meta: { Project: projectTitle(project).en, Milestone: milestone.titleEn },
  });

  return NextResponse.json({ signoff: updated }, { headers: NO_STORE_HEADERS });
}

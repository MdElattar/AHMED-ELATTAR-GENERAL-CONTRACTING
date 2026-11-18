import { NextResponse, type NextRequest } from "next/server";
import { requireAdmin } from "@/lib/auth/guard";
import { hasRecentStepUp, stepUpRequiredResponse } from "@/lib/auth/step-up";
import { listProjects, recordAudit, upsertProject } from "@/lib/db";
import {NO_STORE_HEADERS,
  clientIp,
  isSameOrigin,
  readJsonBody, safeLogError } from "@/lib/security/http";
import { revalidatePublicContent } from "@/lib/revalidate";
import { rateLimit } from "@/lib/security/rate-limit";
import { adminProjectMutationSchema } from "@/lib/security/schemas";
import { isPlainObject } from "@/lib/security/validation";

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const MAX_PAYLOAD_BYTES = 120_000;

function unauthorized() {
  return NextResponse.json(
    { error: "unauthorized" },
    { status: 401, headers: NO_STORE_HEADERS },
  );
}

export async function GET() {
  const session = await requireAdmin();
  if (!session) return unauthorized();

  const projects = (await listProjects())
    .filter((project) => !project.slug.startsWith("__"))
    .map((project) => ({
      ...project.payload,
      slug: project.slug,
      featured: project.featured,
      updatedAt: project.updatedAt,
    }));
  return NextResponse.json({ projects }, { headers: NO_STORE_HEADERS });
}

export async function POST(request: NextRequest) {
  if (!isSameOrigin(request)) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const session = await requireAdmin();
  if (!session) return unauthorized();

  const limited = rateLimit(`admin-projects:${clientIp(request)}`, 60, 60 * 1000);
  if (!limited.ok) {
    return NextResponse.json(
      { error: "rate_limited" },
      {
        status: 429,
        headers: { ...NO_STORE_HEADERS, "Retry-After": String(limited.retryAfter) },
      },
    );
  }

  const body = await readJsonBody(request, MAX_PAYLOAD_BYTES);
  const parsed = adminProjectMutationSchema.safeParse(
    isPlainObject(body) && isPlainObject(body.project) ? body : { project: body },
  );
  if (!parsed.success) {
    return NextResponse.json(
      { error: "invalid_input" },
      { status: 400, headers: NO_STORE_HEADERS },
    );
  }

  const candidate = parsed.data;
  // Archiving is a soft delete. Require a fresh step-up before persisting the
  // archived marker so it cannot be triggered by a stale admin session.
  const isArchive =
    candidate.archivedAt != null ||
    candidate.deletedAt != null ||
    candidate.archived === true ||
    candidate.status === "archived";
  if (isArchive && !hasRecentStepUp(session)) return stepUpRequiredResponse();

  const slug =
    typeof candidate.slug === "string" ? candidate.slug.trim().toLowerCase() : "";

  if (!SLUG_PATTERN.test(slug) || slug.length > 80) {
    return NextResponse.json(
      { error: "invalid_slug" },
      { status: 400, headers: NO_STORE_HEADERS },
    );
  }

  try {
    const project = await upsertProject(slug, candidate);
    await recordAudit({
      actor: session.email,
      action: "project.created",
      entity: "project",
      entityId: slug,
      ip: clientIp(request),
    });
    revalidatePublicContent(slug);
    return NextResponse.json({ project }, { status: 201, headers: NO_STORE_HEADERS });
  } catch (error) {
    safeLogError("[admin] failed to create project", error);
    return NextResponse.json(
      { error: "server_error" },
      { status: 500, headers: NO_STORE_HEADERS },
    );
  }
}

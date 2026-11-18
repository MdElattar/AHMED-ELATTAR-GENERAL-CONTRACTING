import { NextResponse, type NextRequest } from "next/server";
import { requireAdmin } from "@/lib/auth/guard";
import { hasRecentStepUp, stepUpRequiredResponse } from "@/lib/auth/step-up";
import {
  deleteProject,
  listProjects,
  recordAudit,
  upsertProject,
} from "@/lib/db";
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

type RouteContext = { params: Promise<{ slug: string }> };

function unauthorized() {
  return NextResponse.json(
    { error: "unauthorized" },
    { status: 401, headers: NO_STORE_HEADERS },
  );
}

async function guard(request: NextRequest, limitKey: string, requireStepUp = false) {
  if (!isSameOrigin(request)) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  const session = await requireAdmin();
  if (!session) return unauthorized();
  // Irreversible hard deletes require a fresh passkey step-up. Soft archiving
  // through PATCH stays recoverable and is intentionally exempt.
  if (requireStepUp && !hasRecentStepUp(session)) return stepUpRequiredResponse();

  const limited = rateLimit(`${limitKey}:${clientIp(request)}`, 60, 60 * 1000);
  if (!limited.ok) {
    return NextResponse.json(
      { error: "rate_limited" },
      {
        status: 429,
        headers: { ...NO_STORE_HEADERS, "Retry-After": String(limited.retryAfter) },
      },
    );
  }
  return session;
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  const guarded = await guard(request, "admin-projects-patch");
  if (guarded instanceof NextResponse) return guarded;

  const { slug: rawSlug } = await context.params;
  const slug = rawSlug.trim().toLowerCase();
  if (!SLUG_PATTERN.test(slug) || slug.length > 80) {
    return NextResponse.json(
      { error: "invalid_slug" },
      { status: 400, headers: NO_STORE_HEADERS },
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

  const patch = parsed.data;

  try {
    const existing = (await listProjects()).find((project) => project.slug === slug);
    const project = await upsertProject(slug, {
      ...(existing?.payload ?? {}),
      ...patch,
      slug,
    });

    await recordAudit({
      actor: guarded.email,
      action: "project.updated",
      entity: "project",
      entityId: slug,
      ip: clientIp(request),
    });

    revalidatePublicContent(slug);
    return NextResponse.json({ project }, { headers: NO_STORE_HEADERS });
  } catch (error) {
    safeLogError("[admin] failed to update project", error);
    return NextResponse.json(
      { error: "server_error" },
      { status: 500, headers: NO_STORE_HEADERS },
    );
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  const guarded = await guard(request, "admin-projects-delete", true);
  if (guarded instanceof NextResponse) return guarded;

  const { slug: rawSlug } = await context.params;
  const slug = rawSlug.trim().toLowerCase();
  if (!SLUG_PATTERN.test(slug) || slug.length > 80) {
    return NextResponse.json(
      { error: "invalid_slug" },
      { status: 400, headers: NO_STORE_HEADERS },
    );
  }

  try {
    const deleted = await deleteProject(slug);
    if (!deleted) {
      return NextResponse.json(
        { error: "not_found" },
        { status: 404, headers: NO_STORE_HEADERS },
      );
    }

    await recordAudit({
      actor: guarded.email,
      action: "project.archived",
      entity: "project",
      entityId: slug,
      ip: clientIp(request),
    });

    revalidatePublicContent(slug);
    return NextResponse.json({ ok: true, archived: true }, { headers: NO_STORE_HEADERS });
  } catch (error) {
    safeLogError("[admin] failed to delete project", error);
    return NextResponse.json(
      { error: "server_error" },
      { status: 500, headers: NO_STORE_HEADERS },
    );
  }
}

import { NextResponse, type NextRequest } from "next/server";
import { requireAdmin } from "@/lib/auth/guard";
import { listProjects, recordAudit, upsertProject } from "@/lib/db";
import {
  NO_STORE_HEADERS,
  clientIp,
  isSameOrigin,
  readJsonBody,
} from "@/lib/security/http";
import { rateLimit } from "@/lib/security/rate-limit";
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

  const projects = (await listProjects()).filter(
    (project) => !project.slug.startsWith("__"),
  );
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
  if (!isPlainObject(body)) {
    return NextResponse.json(
      { error: "invalid_input" },
      { status: 400, headers: NO_STORE_HEADERS },
    );
  }

  const candidate = isPlainObject(body.project) ? body.project : body;
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
    return NextResponse.json({ project }, { status: 201, headers: NO_STORE_HEADERS });
  } catch (error) {
    console.error("[admin] failed to create project", error);
    return NextResponse.json(
      { error: "server_error" },
      { status: 500, headers: NO_STORE_HEADERS },
    );
  }
}

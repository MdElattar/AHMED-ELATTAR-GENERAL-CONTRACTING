import { NextResponse, type NextRequest } from "next/server";
import { requireAdmin } from "@/lib/auth/guard";
import { isAllowedMediaSource, isCmsPath } from "@/lib/cms";
import { recordAudit, upsertProject } from "@/lib/db";
import { revalidatePublicContent } from "@/lib/revalidate";
import {NO_STORE_HEADERS,
  clientIp,
  isSameOrigin,
  readJsonBody, safeLogError } from "@/lib/security/http";
import { rateLimit } from "@/lib/security/rate-limit";
import { adminContentMutationSchema } from "@/lib/security/schemas";
import { isPlainObject } from "@/lib/security/validation";

const CONTENT_SLUG = "__site-content__";

export async function PATCH(request: NextRequest) {
  if (!isSameOrigin(request)) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json(
      { error: "unauthorized" },
      { status: 401, headers: NO_STORE_HEADERS },
    );
  }

  const limited = rateLimit(`admin-content:${clientIp(request)}`, 60, 60 * 1000);
  if (!limited.ok) {
    return NextResponse.json(
      { error: "rate_limited" },
      {
        status: 429,
        headers: { ...NO_STORE_HEADERS, "Retry-After": String(limited.retryAfter) },
      },
    );
  }

  // Copy overrides are intentionally granular (every dictionary leaf can be
  // edited), so allow a larger admin-only payload while still bounding it.
  const body = await readJsonBody(request, 1_000_000);
  const parsed = adminContentMutationSchema.safeParse(
    isPlainObject(body) && isPlainObject(body.content) ? body : { content: body },
  );
  if (!parsed.success) {
    return NextResponse.json(
      { error: "invalid_input" },
      { status: 400, headers: NO_STORE_HEADERS },
    );
  }

  const content = parsed.data;

  // Media links are admin-authored, but they still flow into next/image. Keep
  // the same validation on both sides of the wire so a malformed script URL or
  // unsupported protocol can never be persisted through the API.
  if (content.mediaOverrides !== undefined) {
    if (!isPlainObject(content.mediaOverrides)) {
      return NextResponse.json(
        { error: "invalid_media" },
        { status: 422, headers: NO_STORE_HEADERS },
      );
    }

    for (const [key, entry] of Object.entries(content.mediaOverrides)) {
      if (!isCmsPath(key) || !isPlainObject(entry)) {
        return NextResponse.json(
          { error: "invalid_media" },
          { status: 422, headers: NO_STORE_HEADERS },
        );
      }
      const src = typeof entry.src === "string" ? entry.src.trim() : "";
      if (!isAllowedMediaSource(src)) {
        return NextResponse.json(
          { error: "invalid_media" },
          { status: 422, headers: NO_STORE_HEADERS },
        );
      }
    }
  }

  try {
    const record = await upsertProject(CONTENT_SLUG, { ...content, slug: CONTENT_SLUG });

    await recordAudit({
      actor: session.email,
      action: "content.updated",
      entity: "content",
      entityId: CONTENT_SLUG,
      ip: clientIp(request),
    });

    revalidatePublicContent();
    return NextResponse.json({ content: record.payload }, { headers: NO_STORE_HEADERS });
  } catch (error) {
    safeLogError("[admin] failed to update content", error);
    return NextResponse.json(
      { error: "server_error" },
      { status: 500, headers: NO_STORE_HEADERS },
    );
  }
}

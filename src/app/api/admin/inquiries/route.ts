import { NextResponse, type NextRequest } from "next/server";
import { requireAdmin } from "@/lib/auth/guard";
import { listInquiries, recordAudit, updateInquiry } from "@/lib/db";
import {
  NO_STORE_HEADERS,
  clientIp,
  isSameOrigin,
  readJsonBody,
} from "@/lib/security/http";
import { rateLimit } from "@/lib/security/rate-limit";
import { isPlainObject } from "@/lib/security/validation";

const STATUSES = new Set(["new", "read", "won", "lost"]);

function unauthorized() {
  return NextResponse.json(
    { error: "unauthorized" },
    { status: 401, headers: NO_STORE_HEADERS },
  );
}

export async function GET() {
  const session = await requireAdmin();
  if (!session) return unauthorized();

  const inquiries = await listInquiries(200);
  return NextResponse.json({ inquiries }, { headers: NO_STORE_HEADERS });
}

export async function PATCH(request: NextRequest) {
  if (!isSameOrigin(request)) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const session = await requireAdmin();
  if (!session) return unauthorized();

  const limited = rateLimit(`admin-inquiries:${clientIp(request)}`, 60, 60 * 1000);
  if (!limited.ok) {
    return NextResponse.json(
      { error: "rate_limited" },
      {
        status: 429,
        headers: { ...NO_STORE_HEADERS, "Retry-After": String(limited.retryAfter) },
      },
    );
  }

  const body = await readJsonBody(request, 8_000);
  if (!isPlainObject(body)) {
    return NextResponse.json(
      { error: "invalid_input" },
      { status: 400, headers: NO_STORE_HEADERS },
    );
  }

  const status = typeof body.status === "string" ? body.status : "";
  const ids = Array.isArray(body.ids)
    ? Array.from(
        new Set(
          body.ids
            .filter((id): id is string => typeof id === "string")
            .map((id) => id.trim())
            .filter(Boolean),
        ),
      ).slice(0, 100)
    : [];

  if (ids.length > 0) {
    if (!STATUSES.has(status)) {
      return NextResponse.json(
        { error: "invalid_input" },
        { status: 400, headers: NO_STORE_HEADERS },
      );
    }

    const updated = (
      await Promise.all(
        ids.map((id) =>
          updateInquiry(id, {
            status: status as "new" | "read" | "won" | "lost",
          }),
        ),
      )
    ).filter((inquiry) => inquiry !== null);

    if (!updated.length) {
      return NextResponse.json(
        { error: "not_found" },
        { status: 404, headers: NO_STORE_HEADERS },
      );
    }

    await recordAudit({
      actor: session.email,
      action: `inquiry.bulk_${status}`,
      entity: "inquiry",
      meta: { ids: updated.map((inquiry) => inquiry.id), count: updated.length },
      ip: clientIp(request),
    });

    return NextResponse.json({ inquiries: updated }, { headers: NO_STORE_HEADERS });
  }

  const inquiryId = typeof body.id === "string" ? body.id.trim() : "";
  if (!inquiryId || !STATUSES.has(status)) {
    return NextResponse.json(
      { error: "invalid_input" },
      { status: 400, headers: NO_STORE_HEADERS },
    );
  }

  const inquiry = await updateInquiry(inquiryId, {
    status: status as "new" | "read" | "won" | "lost",
  });

  if (!inquiry) {
    return NextResponse.json(
      { error: "not_found" },
      { status: 404, headers: NO_STORE_HEADERS },
    );
  }

  await recordAudit({
    actor: session.email,
    action: `inquiry.${status}`,
    entity: "inquiry",
    entityId: inquiryId,
    ip: clientIp(request),
  });

  return NextResponse.json({ inquiry }, { headers: NO_STORE_HEADERS });
}

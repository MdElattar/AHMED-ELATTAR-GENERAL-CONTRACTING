import { NextResponse, type NextRequest } from "next/server";
import { requireAdmin } from "@/lib/auth/guard";
import { isPrimaryAdminEmail } from "@/lib/auth/token";
import { adminDirectoryUser } from "@/lib/admin-access";
import {
  getUserByEmail,
  recordAudit,
  revokeAdminRole,
} from "@/lib/db";
import {
  NO_STORE_HEADERS,
  clientIp,
  isSameOrigin,
  readJsonBody,
} from "@/lib/security/http";
import { rateLimit } from "@/lib/security/rate-limit";
import { adminRevokeSchema } from "@/lib/security/schemas";

export async function POST(request: NextRequest) {
  if (!isSameOrigin(request)) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const ip = clientIp(request);
  const limited = rateLimit(`admin-revoke:${ip}`, 10, 15 * 60 * 1000);
  if (!limited.ok) {
    return NextResponse.json(
      { error: "rate_limited" },
      {
        status: 429,
        headers: { ...NO_STORE_HEADERS, "Retry-After": String(limited.retryAfter) },
      },
    );
  }

  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json(
      { error: "unauthorized" },
      { status: 401, headers: NO_STORE_HEADERS },
    );
  }
  if (!isPrimaryAdminEmail(session.email)) {
    return NextResponse.json(
      { error: "primary_admin_required" },
      { status: 403, headers: NO_STORE_HEADERS },
    );
  }

  const parsed = adminRevokeSchema.safeParse(await readJsonBody(request, 4_000));
  if (!parsed.success) {
    return NextResponse.json(
      { error: "invalid_request" },
      { status: 400, headers: NO_STORE_HEADERS },
    );
  }

  const { email } = parsed.data;
  if (isPrimaryAdminEmail(email) || email === session.email) {
    return NextResponse.json(
      { error: "primary_protected" },
      { status: 409, headers: NO_STORE_HEADERS },
    );
  }

  const target = await getUserByEmail(email);
  if (!target || target.role !== "admin") {
    return NextResponse.json(
      { error: "not_admin" },
      { status: 404, headers: NO_STORE_HEADERS },
    );
  }

  const updated = await revokeAdminRole(target.email);
  if (!updated) {
    return NextResponse.json(
      { error: "not_admin" },
      { status: 404, headers: NO_STORE_HEADERS },
    );
  }

  await recordAudit({
    actor: session.email,
    action: "admin.delegation.revoked",
    entity: "user",
    entityId: updated.id,
    meta: { targetEmail: updated.email },
    ip,
  });

  return NextResponse.json(
    { user: adminDirectoryUser(updated) },
    { headers: NO_STORE_HEADERS },
  );
}

import { NextResponse, type NextRequest } from "next/server";
import { requireAdmin } from "@/lib/auth/guard";
import { verifyPassword } from "@/lib/auth/password";
import { isPrimaryAdminEmail } from "@/lib/auth/token";
import { deleteUserAccount, getUserByEmail, recordAudit } from "@/lib/db";
import {
  NO_STORE_HEADERS,
  clientIp,
  isSameOrigin,
  readJsonBody,
} from "@/lib/security/http";
import { rateLimit } from "@/lib/security/rate-limit";
import { adminAccountRemoveSchema } from "@/lib/security/schemas";

export async function POST(request: NextRequest) {
  if (!isSameOrigin(request)) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const ip = clientIp(request);
  const limited = rateLimit(`admin-account-remove:${ip}`, 5, 15 * 60 * 1000);
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
  // Role changes and account removal are the two super-admin-only operations.
  if (!isPrimaryAdminEmail(session.email)) {
    return NextResponse.json(
      { error: "primary_admin_required" },
      { status: 403, headers: NO_STORE_HEADERS },
    );
  }
  // Password re-entry in this request is the fresh verification for removal;
  // it also works for sessions signed in before a passkey was enrolled.
  const parsed = adminAccountRemoveSchema.safeParse(
    await readJsonBody(request, 4_000),
  );
  if (!parsed.success) {
    return NextResponse.json(
      { error: "invalid_request" },
      { status: 400, headers: NO_STORE_HEADERS },
    );
  }

  const { email, primaryPassword } = parsed.data;
  if (isPrimaryAdminEmail(email) || email === session.email) {
    return NextResponse.json(
      { error: "primary_protected" },
      { status: 409, headers: NO_STORE_HEADERS },
    );
  }

  const primary = await getUserByEmail(session.email);
  if (!primary || !(await verifyPassword(primaryPassword, primary.passwordHash))) {
    await recordAudit({
      actor: session.email,
      action: "admin.account.remove_password_failed",
      entity: "user",
      entityId: session.sub,
      meta: { targetEmail: email },
      ip,
    });
    return NextResponse.json(
      { error: "invalid_password" },
      { status: 401, headers: NO_STORE_HEADERS },
    );
  }

  const target = await getUserByEmail(email);
  if (!target) {
    return NextResponse.json(
      { error: "user_not_found" },
      { status: 404, headers: NO_STORE_HEADERS },
    );
  }

  const removed = await deleteUserAccount(email);
  if (!removed) {
    return NextResponse.json(
      { error: "user_not_found" },
      { status: 404, headers: NO_STORE_HEADERS },
    );
  }

  await recordAudit({
    actor: session.email,
    action: "admin.account.removed",
    entity: "user",
    entityId: removed.id,
    meta: {
      targetEmail: removed.email,
      role: removed.role,
      accountId: removed.accountId,
      previousRole: target.role,
    },
    ip,
  });

  return NextResponse.json(
    { email: removed.email, removed: true },
    { headers: NO_STORE_HEADERS },
  );
}

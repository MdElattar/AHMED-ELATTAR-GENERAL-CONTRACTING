import { NextResponse, type NextRequest } from "next/server";
import { requireAdmin } from "@/lib/auth/guard";
import { OTP_MAX_ATTEMPTS, verifyOtpHash } from "@/lib/auth/otp";
import { isPrimaryAdminEmail, randomAccountId } from "@/lib/auth/token";
import { adminDirectoryUser } from "@/lib/admin-access";
import {
  consumeAdminGrant,
  createUser,
  deleteAdminGrant,
  getAdminGrant,
  getUserByEmail,
  incrementAdminGrantAttempts,
  promoteToAdmin,
  recordAudit,
} from "@/lib/db";
import {
  NO_STORE_HEADERS,
  clientIp,
  isSameOrigin,
  readJsonBody,
} from "@/lib/security/http";
import { rateLimit } from "@/lib/security/rate-limit";
import { adminGrantConfirmSchema } from "@/lib/security/schemas";

function unauthorized() {
  return NextResponse.json(
    { error: "unauthorized" },
    { status: 401, headers: NO_STORE_HEADERS },
  );
}

function forbidden() {
  return NextResponse.json(
    { error: "primary_admin_required" },
    { status: 403, headers: NO_STORE_HEADERS },
  );
}

export async function POST(request: NextRequest) {
  if (!isSameOrigin(request)) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const ip = clientIp(request);
  const limited = rateLimit(`admin-grant-confirm:${ip}`, 10, 15 * 60 * 1000);
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
  if (!session) return unauthorized();
  if (!isPrimaryAdminEmail(session.email)) return forbidden();

  const parsed = adminGrantConfirmSchema.safeParse(
    await readJsonBody(request, 4_000),
  );
  if (!parsed.success) {
    return NextResponse.json(
      { error: "invalid_code" },
      { status: 400, headers: NO_STORE_HEADERS },
    );
  }

  const { grantId, code } = parsed.data;
  const grant = await getAdminGrant(grantId);
  if (
    !grant ||
    grant.requestedBy !== session.email ||
    grant.consumedAt ||
    Date.parse(grant.expiresAt) <= Date.now() ||
    grant.attempts >= OTP_MAX_ATTEMPTS
  ) {
    return NextResponse.json(
      { error: "expired_grant" },
      { status: 400, headers: NO_STORE_HEADERS },
    );
  }

  if (!verifyOtpHash(`admin-grant:${grant.id}`, code, grant.codeHash)) {
    await incrementAdminGrantAttempts(grant.id);
    await recordAudit({
      actor: session.email,
      action: "admin.delegation.otp_failed",
      entity: "user",
      entityId: session.sub,
      meta: {
        targetEmail: grant.targetEmail,
        mode: grant.mode,
        grantId: grant.id,
      },
      ip,
    });
    return NextResponse.json(
      { error: "invalid_code" },
      { status: 401, headers: NO_STORE_HEADERS },
    );
  }

  const consumed = await consumeAdminGrant(grant.id);
  if (!consumed) {
    return NextResponse.json(
      { error: "expired_grant" },
      { status: 400, headers: NO_STORE_HEADERS },
    );
  }

  try {
    let target = await getUserByEmail(grant.targetEmail);
    if (grant.mode === "promote") {
      if (!target) {
        return NextResponse.json(
          { error: "user_not_found" },
          { status: 404, headers: NO_STORE_HEADERS },
        );
      }
      target = (await promoteToAdmin(target.email)) ?? target;
    } else {
      if (target) {
        return NextResponse.json(
          { error: "email_taken" },
          { status: 409, headers: NO_STORE_HEADERS },
        );
      }
      if (!grant.name || !grant.passwordHash) {
        return NextResponse.json(
          { error: "invalid_grant" },
          { status: 400, headers: NO_STORE_HEADERS },
        );
      }

      try {
        target = await createUser({
          email: grant.targetEmail,
          name: grant.name,
          company: grant.company || "Ahmed Elattar General Contracting",
          ...(grant.phone ? { phone: grant.phone } : {}),
          passwordHash: grant.passwordHash,
          role: "admin",
          accountId: randomAccountId(),
        });
      } catch (error) {
        if (error instanceof Error && error.message === "email_taken") {
          return NextResponse.json(
            { error: "email_taken" },
            { status: 409, headers: NO_STORE_HEADERS },
          );
        }
        throw error;
      }
    }

    await recordAudit({
      actor: session.email,
      action: "admin.delegation.granted",
      entity: "user",
      entityId: target.id,
      meta: {
        targetEmail: target.email,
        mode: grant.mode,
        grantId: grant.id,
      },
      ip,
    });

    return NextResponse.json(
      { user: adminDirectoryUser(target), mode: grant.mode },
      { headers: NO_STORE_HEADERS },
    );
  } finally {
    // The grant holds a code hash and, for new accounts, a password hash. It is
    // one-time material, so remove it after every terminal outcome.
    await deleteAdminGrant(grant.id);
  }
}

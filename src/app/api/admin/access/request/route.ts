import { NextResponse, type NextRequest } from "next/server";
import { requireAdmin } from "@/lib/auth/guard";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { generateOtp, hashOtp, OTP_TTL_SECONDS } from "@/lib/auth/otp";
import { isPrimaryAdminEmail } from "@/lib/auth/token";
import { sendOtpEmail } from "@/lib/email";
import {
  deleteAdminGrant,
  getUserByEmail,
  recordAudit,
  saveAdminGrant,
} from "@/lib/db";
import {
  NO_STORE_HEADERS,
  clientIp,
  isSameOrigin,
  readJsonBody,
} from "@/lib/security/http";
import { rateLimit } from "@/lib/security/rate-limit";
import { adminGrantRequestSchema } from "@/lib/security/schemas";

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
  const limited = rateLimit(`admin-grant-request:${ip}`, 5, 15 * 60 * 1000);
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

  const parsed = adminGrantRequestSchema.safeParse(
    await readJsonBody(request, 12_000),
  );
  if (!parsed.success) {
    return NextResponse.json(
      { error: "invalid_request" },
      { status: 400, headers: NO_STORE_HEADERS },
    );
  }

  const { primaryPassword, mode, email, name, company, phone, password } =
    parsed.data;

  const primary = await getUserByEmail(session.email);
  if (!primary || !(await verifyPassword(primaryPassword, primary.passwordHash))) {
    await recordAudit({
      actor: session.email,
      action: "admin.delegation.password_failed",
      entity: "user",
      entityId: session.sub,
      meta: { targetEmail: email, mode },
      ip,
    });
    return NextResponse.json(
      { error: "invalid_password" },
      { status: 401, headers: NO_STORE_HEADERS },
    );
  }

  if (isPrimaryAdminEmail(email)) {
    return NextResponse.json(
      { error: "already_admin" },
      { status: 409, headers: NO_STORE_HEADERS },
    );
  }

  const existing = await getUserByEmail(email);
  if (mode === "promote") {
    if (!existing) {
      return NextResponse.json(
        { error: "user_not_found" },
        { status: 404, headers: NO_STORE_HEADERS },
      );
    }
    if (existing.role === "admin") {
      return NextResponse.json(
        { error: "already_admin" },
        { status: 409, headers: NO_STORE_HEADERS },
      );
    }
  } else if (existing) {
    return NextResponse.json(
      { error: "email_taken" },
      { status: 409, headers: NO_STORE_HEADERS },
    );
  }

  const passwordHash =
    mode === "create" && password ? await hashPassword(password) : undefined;
  const code = generateOtp();
  const grantId = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + OTP_TTL_SECONDS * 1000).toISOString();

  const grant = await saveAdminGrant({
    requestedBy: session.email,
    targetEmail: email,
    mode,
    ...(mode === "create" && name ? { name } : {}),
    ...(mode === "create" && company ? { company } : {}),
    ...(mode === "create" && phone ? { phone } : {}),
    ...(passwordHash ? { passwordHash } : {}),
    codeHash: hashOtp(`admin-grant:${grantId}`, code),
    expiresAt,
  });

  const delivery = await sendOtpEmail({
    to: session.email,
    code,
    expiresMinutes: Math.round(OTP_TTL_SECONDS / 60),
    locale: "ar",
    purpose: "admin-delegation",
    targetEmail: email,
  });

  if (!delivery.delivered) {
    await deleteAdminGrant(grant.id);
    await recordAudit({
      actor: session.email,
      action: "admin.delegation.delivery_failed",
      entity: "user",
      entityId: session.sub,
      meta: { targetEmail: email, mode, provider: delivery.provider },
      ip,
    });
    return NextResponse.json(
      { error: "email_unavailable" },
      { status: 503, headers: NO_STORE_HEADERS },
    );
  }

  await recordAudit({
    actor: session.email,
    action: "admin.delegation.otp_sent",
    entity: "user",
    entityId: session.sub,
    meta: {
      targetEmail: email,
      mode,
      grantId: grant.id,
      provider: delivery.provider,
    },
    ip,
  });

  return NextResponse.json(
    {
      grantId: grant.id,
      targetEmail: email,
      mode,
      expiresAt: grant.expiresAt,
    },
    { headers: NO_STORE_HEADERS },
  );
}

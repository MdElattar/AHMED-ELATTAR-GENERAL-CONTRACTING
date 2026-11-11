import { NextResponse, type NextRequest } from "next/server";
import {
  consumeOtp,
  getOtp,
  incrementOtpAttempts,
  recordAudit,
} from "@/lib/db";
import { OTP_MAX_ATTEMPTS, verifyOtpHash } from "@/lib/auth/otp";
import { createResetToken } from "@/lib/auth/token";
import { setResetCookie } from "@/lib/auth/cookie";
import { authUnavailable, isAuthConfigError } from "@/lib/auth/response";
import {
  NO_STORE_HEADERS,
  clientIp,
  isSameOrigin,
  readJsonBody,
} from "@/lib/security/http";
import { rateLimit } from "@/lib/security/rate-limit";
import { verifyOtpSchema } from "@/lib/security/schemas";

export async function POST(request: NextRequest) {
  if (!isSameOrigin(request)) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const ip = clientIp(request);
  const limited = rateLimit(`verify-otp:${ip}`, 12, 15 * 60 * 1000);
  if (!limited.ok) {
    return NextResponse.json(
      { error: "rate_limited" },
      {
        status: 429,
        headers: { ...NO_STORE_HEADERS, "Retry-After": String(limited.retryAfter) },
      },
    );
  }

  const parsed = verifyOtpSchema.safeParse(await readJsonBody(request, 4_000));
  if (!parsed.success) {
    return NextResponse.json(
      { error: "invalid_code" },
      { status: 400, headers: NO_STORE_HEADERS },
    );
  }

  const { email, code } = parsed.data;

  const otp = await getOtp(email);

  if (!otp || otp.consumedAt) {
    return NextResponse.json(
      { error: "invalid_code" },
      { status: 401, headers: NO_STORE_HEADERS },
    );
  }

  if (Date.parse(otp.expiresAt) <= Date.now()) {
    return NextResponse.json(
      { error: "code_expired" },
      { status: 410, headers: NO_STORE_HEADERS },
    );
  }

  if (otp.attempts >= OTP_MAX_ATTEMPTS) {
    return NextResponse.json(
      { error: "too_many_attempts" },
      { status: 429, headers: NO_STORE_HEADERS },
    );
  }

  if (!verifyOtpHash(email, code, otp.codeHash)) {
    await incrementOtpAttempts(email);
    await recordAudit({
      actor: email,
      action: "password.reset.otp_failed",
      entity: "user",
      ip,
    });
    return NextResponse.json(
      { error: "invalid_code" },
      { status: 401, headers: NO_STORE_HEADERS },
    );
  }

  await consumeOtp(email);

  try {
    const token = await createResetToken(email);
    const response = NextResponse.json({ ok: true }, { headers: NO_STORE_HEADERS });
    setResetCookie(response, token);

    await recordAudit({
      actor: email,
      action: "password.reset.verified",
      entity: "user",
      ip,
    });

    return response;
  } catch (error) {
    if (isAuthConfigError(error)) return authUnavailable();
    throw error;
  }
}

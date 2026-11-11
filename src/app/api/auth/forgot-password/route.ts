import { NextResponse, type NextRequest } from "next/server";
import {
  clearUserResetToken,
  getUserByEmail,
  recordAudit,
  saveOtp,
} from "@/lib/db";
import { OTP_TTL_SECONDS, generateOtp, hashOtp } from "@/lib/auth/otp";
import { sendOtpEmail } from "@/lib/email";
import { authUnavailable, isAuthConfigError } from "@/lib/auth/response";
import {
  NO_STORE_HEADERS,
  clientIp,
  isSameOrigin,
  readJsonBody,
} from "@/lib/security/http";
import { rateLimit } from "@/lib/security/rate-limit";
import { forgotPasswordSchema } from "@/lib/security/schemas";

export async function POST(request: NextRequest) {
  if (!isSameOrigin(request)) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const ip = clientIp(request);
  const limited = rateLimit(`forgot-password:${ip}`, 5, 15 * 60 * 1000);
  if (!limited.ok) {
    return NextResponse.json(
      { error: "rate_limited" },
      {
        status: 429,
        headers: { ...NO_STORE_HEADERS, "Retry-After": String(limited.retryAfter) },
      },
    );
  }

  const parsed = forgotPasswordSchema.safeParse(await readJsonBody(request, 4_000));
  if (!parsed.success) {
    return NextResponse.json(
      { error: "invalid_email" },
      { status: 400, headers: NO_STORE_HEADERS },
    );
  }

  const { email, locale } = parsed.data;
  const user = await getUserByEmail(email);

  // Always answer with the same shape so the endpoint cannot be used to
  // enumerate registered addresses.
  if (!user) {
    return NextResponse.json({ ok: true }, { headers: NO_STORE_HEADERS });
  }

  try {
    const code = generateOtp();
    const expiresAt = new Date(Date.now() + OTP_TTL_SECONDS * 1000).toISOString();

    await saveOtp({
      email,
      codeHash: hashOtp(email, code),
      expiresAt,
    });
    await clearUserResetToken(email);

    const delivery = await sendOtpEmail({
      to: email,
      code,
      expiresMinutes: Math.round(OTP_TTL_SECONDS / 60),
      locale,
    });

    if (!delivery.delivered && process.env.NODE_ENV === "production") {
      console.error(
        "[auth] OTP delivery is not configured. Set RESEND_API_KEY and OTP_FROM_EMAIL.",
      );
      return NextResponse.json(
        { error: "email_unavailable" },
        { status: 503, headers: NO_STORE_HEADERS },
      );
    }

    await recordAudit({
      actor: email,
      action: "password.reset.requested",
      entity: "user",
      entityId: user.id,
      ip,
      meta: { provider: delivery.provider },
    });

    return NextResponse.json(
      {
        ok: true,
        expiresIn: OTP_TTL_SECONDS,
        // Local development has no inbox wired up. Expose the code only in
        // non-production so a real deployment can never leak it.
        ...(delivery.provider === "development" && process.env.NODE_ENV !== "production"
          ? { devCode: code }
          : {}),
      },
      { headers: NO_STORE_HEADERS },
    );
  } catch (error) {
    if (isAuthConfigError(error)) return authUnavailable();
    console.error("[auth] forgot-password failed", error);
    return NextResponse.json(
      { error: "server_error" },
      { status: 500, headers: NO_STORE_HEADERS },
    );
  }
}

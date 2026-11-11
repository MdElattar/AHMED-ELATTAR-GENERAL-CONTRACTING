import { NextResponse, type NextRequest } from "next/server";
import { cookies } from "next/headers";
import { timingSafeEqual } from "node:crypto";
import { clearUserResetToken, getUserByEmail, recordAudit, updateUser } from "@/lib/db";
import { hashPassword, hashResetToken } from "@/lib/auth/password";
import { RESET_COOKIE, verifyResetToken } from "@/lib/auth/token";
import { clearResetCookie } from "@/lib/auth/cookie";
import { authUnavailable, isAuthConfigError } from "@/lib/auth/response";
import {
  NO_STORE_HEADERS,
  clientIp,
  isSameOrigin,
  readJsonBody,
} from "@/lib/security/http";
import { rateLimit } from "@/lib/security/rate-limit";
import { resetPasswordSchema } from "@/lib/security/schemas";

function sameHash(a: string, b: string) {
  const left = Buffer.from(a, "hex");
  const right = Buffer.from(b, "hex");
  if (left.length !== right.length || left.length === 0) return false;
  return timingSafeEqual(left, right);
}

export async function POST(request: NextRequest) {
  if (!isSameOrigin(request)) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const ip = clientIp(request);
  const limited = rateLimit(`reset-password:${ip}`, 8, 15 * 60 * 1000);
  if (!limited.ok) {
    return NextResponse.json(
      { error: "rate_limited" },
      {
        status: 429,
        headers: { ...NO_STORE_HEADERS, "Retry-After": String(limited.retryAfter) },
      },
    );
  }

  const cookie = (await cookies()).get(RESET_COOKIE)?.value;
  const reset = cookie ? await verifyResetToken(cookie) : null;

  if (!reset) {
    return NextResponse.json(
      { error: "invalid_token" },
      { status: 401, headers: NO_STORE_HEADERS },
    );
  }

  const parsed = resetPasswordSchema.safeParse(await readJsonBody(request, 4_000));
  if (!parsed.success) {
    return NextResponse.json(
      { error: "weak_password" },
      { status: 400, headers: NO_STORE_HEADERS },
    );
  }

  const { password } = parsed.data;

  const user = await getUserByEmail(reset.email);
  if (
    !user?.resetTokenHash ||
    !user.resetTokenExpiry ||
    Date.parse(user.resetTokenExpiry) <= Date.now() ||
    !sameHash(hashResetToken(reset.token), user.resetTokenHash)
  ) {
    return NextResponse.json(
      { error: "invalid_token" },
      { status: 401, headers: NO_STORE_HEADERS },
    );
  }

  try {
    const passwordHash = await hashPassword(password);
    await updateUser(reset.email, { passwordHash });
    await clearUserResetToken(reset.email);

    await recordAudit({
      actor: reset.email,
      action: "password.reset.completed",
      entity: "user",
      entityId: user.id,
      ip,
    });

    const response = NextResponse.json({ ok: true }, { headers: NO_STORE_HEADERS });
    clearResetCookie(response);
    return response;
  } catch (error) {
    if (isAuthConfigError(error)) return authUnavailable();
    console.error("[auth] reset-password failed", error);
    return NextResponse.json(
      { error: "server_error" },
      { status: 500, headers: NO_STORE_HEADERS },
    );
  }
}

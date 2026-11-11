import { NextResponse, type NextRequest } from "next/server";
import { cookies } from "next/headers";
import { getUserByEmail, recordAudit, updateUser } from "@/lib/db";
import { hashPassword } from "@/lib/auth/password";
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

  const token = (await cookies()).get(RESET_COOKIE)?.value;
  const email = token ? await verifyResetToken(token) : null;

  if (!email) {
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

  const user = await getUserByEmail(email);
  if (!user) {
    return NextResponse.json(
      { error: "invalid_token" },
      { status: 401, headers: NO_STORE_HEADERS },
    );
  }

  try {
    const passwordHash = await hashPassword(password);
    await updateUser(email, { passwordHash });

    await recordAudit({
      actor: email,
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

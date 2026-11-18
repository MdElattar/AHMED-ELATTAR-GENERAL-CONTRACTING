import { NextResponse, type NextRequest } from "next/server";
import { activeSession } from "@/lib/auth/guard";
import { clearSessionCookie } from "@/lib/auth/cookie";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { getUserByEmail, recordAudit, updateUser } from "@/lib/db";
import {
  NO_STORE_HEADERS,
  clientIp,
  isSameOrigin,
  readJsonBody,
} from "@/lib/security/http";
import { rateLimit } from "@/lib/security/rate-limit";
import { changePasswordSchema } from "@/lib/security/schemas";

export async function POST(request: NextRequest) {
  if (!isSameOrigin(request)) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const ip = clientIp(request);
  const limited = rateLimit(`password:${ip}`, 6, 15 * 60 * 1000);
  if (!limited.ok) {
    return NextResponse.json(
      { error: "rate_limited" },
      {
        status: 429,
        headers: { ...NO_STORE_HEADERS, "Retry-After": String(limited.retryAfter) },
      },
    );
  }

  const session = await activeSession();

  if (!session) {
    return NextResponse.json(
      { error: "unauthorized" },
      { status: 401, headers: NO_STORE_HEADERS },
    );
  }

  const parsed = changePasswordSchema.safeParse(await readJsonBody(request));
  if (!parsed.success) {
    return NextResponse.json(
      { error: "weak_password" },
      { status: 400, headers: NO_STORE_HEADERS },
    );
  }

  const { currentPassword, newPassword } = parsed.data;

  const user = await getUserByEmail(session.email);
  if (!user) {
    return NextResponse.json(
      { error: "unauthorized" },
      { status: 401, headers: NO_STORE_HEADERS },
    );
  }

  const currentValid = await verifyPassword(currentPassword, user.passwordHash);
  if (!currentValid) {
    await recordAudit({
      actor: session.email,
      action: "account.password_change_failed",
      entity: "user",
      entityId: user.id,
      ip,
    });
    return NextResponse.json(
      { error: "invalid_password" },
      { status: 400, headers: NO_STORE_HEADERS },
    );
  }

  if (await verifyPassword(newPassword, user.passwordHash)) {
    return NextResponse.json(
      { error: "same_password" },
      { status: 400, headers: NO_STORE_HEADERS },
    );
  }

  await updateUser(session.email, {
    passwordHash: await hashPassword(newPassword),
    sessionVersion: session.sessionVersion + 1,
  });

  await recordAudit({
    actor: session.email,
    action: "account.password_changed",
    entity: "user",
    entityId: user.id,
    ip,
  });

  const response = NextResponse.json({ ok: true }, { headers: NO_STORE_HEADERS });
  clearSessionCookie(response);
  return response;
}

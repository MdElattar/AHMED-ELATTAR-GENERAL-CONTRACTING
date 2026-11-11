import { NextResponse, type NextRequest } from "next/server";
import { cookies } from "next/headers";
import { SESSION_COOKIE, verifySession } from "@/lib/auth/token";
import {
  hashPassword,
  isStrongEnoughPassword,
  verifyPassword,
} from "@/lib/auth/password";
import { getUserByEmail, recordAudit, updateUser } from "@/lib/db";
import {
  NO_STORE_HEADERS,
  clientIp,
  isSameOrigin,
  readJsonBody,
} from "@/lib/security/http";
import { rateLimit } from "@/lib/security/rate-limit";
import { isPlainObject } from "@/lib/security/validation";

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

  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  const session = token ? await verifySession(token) : null;

  if (!session) {
    return NextResponse.json(
      { error: "unauthorized" },
      { status: 401, headers: NO_STORE_HEADERS },
    );
  }

  const body = await readJsonBody(request);
  if (!isPlainObject(body)) {
    return NextResponse.json({ error: "invalid_input" }, { status: 400 });
  }

  const currentPassword =
    typeof body.currentPassword === "string" ? body.currentPassword : "";
  const newPassword = typeof body.newPassword === "string" ? body.newPassword : "";

  if (!currentPassword || !newPassword || newPassword.length > 256) {
    return NextResponse.json(
      { error: "invalid_input" },
      { status: 400, headers: NO_STORE_HEADERS },
    );
  }

  if (!isStrongEnoughPassword(newPassword)) {
    return NextResponse.json(
      { error: "weak_password" },
      { status: 400, headers: NO_STORE_HEADERS },
    );
  }

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

  await updateUser(session.email, { passwordHash: await hashPassword(newPassword) });

  await recordAudit({
    actor: session.email,
    action: "account.password_changed",
    entity: "user",
    entityId: user.id,
    ip,
  });

  return NextResponse.json({ ok: true }, { headers: NO_STORE_HEADERS });
}

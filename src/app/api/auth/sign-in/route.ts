import { NextResponse, type NextRequest } from "next/server";
import {
  REMEMBERED_SESSION_TTL_SECONDS,
  SESSION_TTL_SECONDS,
  createSession,
  publicSessionUser,
} from "@/lib/auth/token";
import { setSessionCookie } from "@/lib/auth/cookie";
import { authUnavailable, isAuthConfigError } from "@/lib/auth/response";
import { getUserByEmail, recordAudit, updateUser } from "@/lib/db";
import { hashPassword, needsRehash, verifyPassword } from "@/lib/auth/password";
import {
  NO_STORE_HEADERS,
  clientIp,
  isSameOrigin,
  readJsonBody,
} from "@/lib/security/http";
import { rateLimit } from "@/lib/security/rate-limit";
import { signInSchema } from "@/lib/security/schemas";

export async function POST(request: NextRequest) {
  if (!isSameOrigin(request)) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const ip = clientIp(request);
  const limited = rateLimit(`sign-in:${ip}`, 8, 15 * 60 * 1000);
  if (!limited.ok) {
    return NextResponse.json(
      { error: "rate_limited" },
      {
        status: 429,
        headers: { ...NO_STORE_HEADERS, "Retry-After": String(limited.retryAfter) },
      },
    );
  }

  const parsed = signInSchema.safeParse(await readJsonBody(request));
  if (!parsed.success) {
    return NextResponse.json(
      { error: "invalid_credentials" },
      { status: 401, headers: NO_STORE_HEADERS },
    );
  }

  const { email, password, remember } = parsed.data;

  const user = await getUserByEmail(email);

  // Always run a verifier so a missing account and a wrong password take a
  // comparable amount of time. Never issue a session without a stored user.
  const passwordValid = user
    ? await verifyPassword(password, user.passwordHash)
    : await verifyPassword(password, "bcrypt$invalid");

  if (!user || !passwordValid) {
    if (user) {
      await recordAudit({
        actor: email,
        action: "auth.sign_in_failed",
        entity: "user",
        entityId: user.id,
        ip,
      });
    }
    return NextResponse.json(
      { error: "invalid_credentials" },
      { status: 401, headers: NO_STORE_HEADERS },
    );
  }

  // Rolling migration: transparently upgrade legacy scrypt hashes to bcrypt.
  if (needsRehash(user.passwordHash)) {
    try {
      await updateUser(email, { passwordHash: await hashPassword(password) });
    } catch (error) {
      console.error("[auth] password rehash failed", error);
    }
  }

  const ttl = remember ? REMEMBERED_SESSION_TTL_SECONDS : SESSION_TTL_SECONDS;

  let created: Awaited<ReturnType<typeof createSession>>;
  try {
    created = await createSession(
      {
        sub: user.id,
        email: user.email,
        name: user.name,
        company: user.company,
        accountId: user.accountId,
        ...(user.phone ? { phone: user.phone } : {}),
        role: user.role,
      },
      ttl,
    );
  } catch (error) {
    if (isAuthConfigError(error)) {
      console.error(
        "[auth] AUTH_SECRET/JWT_SECRET is missing or shorter than 32 characters; refusing to sign sessions.",
      );
      return authUnavailable();
    }
    throw error;
  }

  const { token, session } = created;

  await updateUser(email, { lastLoginAt: new Date().toISOString() });

  await recordAudit({
    actor: email,
    action: "auth.sign_in",
    entity: "user",
    entityId: user.id,
    ip,
  });

  const response = NextResponse.json(
    { user: publicSessionUser(session) },
    { headers: NO_STORE_HEADERS },
  );

  setSessionCookie(response, token, remember ? ttl : undefined);
  return response;
}

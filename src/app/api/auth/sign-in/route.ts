import { NextResponse, type NextRequest } from "next/server";
import {
  REMEMBERED_SESSION_TTL_SECONDS,
  SESSION_TTL_SECONDS,
  createSession,
  publicSessionUser,
  sessionInputFromUser,
} from "@/lib/auth/token";
import { setSessionCookie } from "@/lib/auth/cookie";
import { resolvePostLoginPath } from "@/lib/auth/redirect";
import { authUnavailable, isAuthConfigError } from "@/lib/auth/response";
import { getUserByEmail, listPasskeys, recordAudit, updateUser } from "@/lib/db";
import { hashPassword, needsRehash, verifyPassword } from "@/lib/auth/password";
import {
  NO_STORE_HEADERS,
  clientIp,
  isSameOrigin,
  readJsonBody,
  safeLogError,
} from "@/lib/security/http";
import { rateLimitIdentity } from "@/lib/security/rate-limit";
import { signInSchema } from "@/lib/security/schemas";

export async function POST(request: NextRequest) {
  if (!isSameOrigin(request)) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const ip = clientIp(request);
  const parsed = signInSchema.safeParse(await readJsonBody(request));
  if (!parsed.success) {
    return NextResponse.json(
      { error: "invalid_credentials" },
      { status: 401, headers: NO_STORE_HEADERS },
    );
  }

  const { email, password, remember, next } = parsed.data;

  const limited = rateLimitIdentity("sign-in", ip, email, 8, 15 * 60 * 1000);
  if (!limited.ok) {
    return NextResponse.json(
      { error: "rate_limited" },
      {
        status: 429,
        headers: { ...NO_STORE_HEADERS, "Retry-After": String(limited.retryAfter) },
      },
    );
  }

  const user = await getUserByEmail(email);

  // Always run a verifier so a missing account and a wrong password take a
  // comparable amount of time. Never issue a session without a stored user.
  const passwordValid = user
    ? await verifyPassword(password, user.passwordHash)
    : await verifyPassword(password, "bcrypt$invalid");

  if (!user || !passwordValid) {
    await recordAudit({
      actor: email,
      action: "login_failed",
      entity: "user",
      ...(user ? { entityId: user.id } : {}),
      ip,
      meta: { method: "password" },
    });
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
      safeLogError("[auth] password rehash failed", error);
    }
  }

  const ttl = remember ? REMEMBERED_SESSION_TTL_SECONDS : SESSION_TTL_SECONDS;
  // Never rotate sessionVersion here. The token must carry the version that is
  // already persisted, otherwise `activeSession()` rejects the fresh cookie
  // and the client bounces back to /sign-in in a loop.
  const passkeys = await listPasskeys(user.email);
  const passkeyEnrolled = passkeys.length > 0;

  let created: Awaited<ReturnType<typeof createSession>>;
  try {
    created = await createSession(
      sessionInputFromUser(user, { passkeyEnrolled, stepUpAt: 0 }),
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

  // Only write login metadata; the version in the token was already persisted.
  await updateUser(email, { lastLoginAt: new Date().toISOString() });

  await recordAudit({
    actor: email,
    action: "login_success",
    entity: "user",
    entityId: user.id,
    ip,
    meta: { method: "password" },
  });

  const response = NextResponse.json(
    {
      user: publicSessionUser(session),
      redirectTo: resolvePostLoginPath(user.role, next, passkeyEnrolled),
    },
    { headers: NO_STORE_HEADERS },
  );

  setSessionCookie(response, token, ttl);
  return response;
}

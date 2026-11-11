import { NextResponse, type NextRequest } from "next/server";
import {
  REMEMBERED_SESSION_TTL_SECONDS,
  SESSION_TTL_SECONDS,
  createSession,
  publicSessionUser,
} from "@/lib/auth/token";
import { setSessionCookie } from "@/lib/auth/cookie";
import { authUnavailable, isAuthConfigError } from "@/lib/auth/response";
import { demoAccountsAllowed, getUserByEmail, recordAudit, updateUser } from "@/lib/db";
import { verifyPassword } from "@/lib/auth/password";
import {
  NO_STORE_HEADERS,
  clientIp,
  isSameOrigin,
  readJsonBody,
} from "@/lib/security/http";
import { rateLimit } from "@/lib/security/rate-limit";
import { signInSchema } from "@/lib/security/schemas";

const DEMO_EMAILS = new Set(["demo@alattar.sa", "demo@ahmedelattar.sa"]);
const DEMO_PASSWORD = "demo1234";

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
  const demoAccess =
    demoAccountsAllowed() && DEMO_EMAILS.has(email) && password === DEMO_PASSWORD;

  if (user && !(await verifyPassword(password, user.passwordHash))) {
    await recordAudit({
      actor: email,
      action: "auth.sign_in_failed",
      entity: "user",
      entityId: user.id,
      ip,
    });
    return NextResponse.json(
      { error: "invalid_credentials" },
      { status: 401, headers: NO_STORE_HEADERS },
    );
  }

  if (!user && !demoAccess) {
    return NextResponse.json(
      { error: "invalid_credentials" },
      { status: 401, headers: NO_STORE_HEADERS },
    );
  }

  const accountId = user?.accountId ?? "ALT-2048";
  const ttl = remember ? REMEMBERED_SESSION_TTL_SECONDS : SESSION_TTL_SECONDS;

  let created: Awaited<ReturnType<typeof createSession>>;
  try {
    created = await createSession(
      {
        sub: user?.id ?? "demo-admin",
        email,
        name: user?.name ?? "Mohammed Alabdullah",
        company: user?.company ?? "Riyadh Development Holding",
        accountId,
        ...(user?.phone ? { phone: user.phone } : { phone: "+966 55 214 8890" }),
        role: user?.role ?? "admin",
      },
      ttl,
    );
  } catch (error) {
    if (isAuthConfigError(error)) {
      console.error(
        "[auth] AUTH_SECRET is missing or shorter than 32 characters; refusing to sign sessions.",
      );
      return authUnavailable();
    }
    throw error;
  }

  const { token, session } = created;

  if (user) {
    await updateUser(email, { lastLoginAt: new Date().toISOString() });
  }

  await recordAudit({
    actor: email,
    action: "auth.sign_in",
    entity: "user",
    entityId: user?.id,
    ip,
  });

  const response = NextResponse.json(
    { user: publicSessionUser(session) },
    { headers: NO_STORE_HEADERS },
  );

  setSessionCookie(response, token, remember ? ttl : undefined);
  return response;
}

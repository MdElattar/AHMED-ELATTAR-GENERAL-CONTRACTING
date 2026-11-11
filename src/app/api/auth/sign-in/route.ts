import { NextResponse, type NextRequest } from "next/server";
import {
  REMEMBERED_SESSION_TTL_SECONDS,
  SESSION_TTL_SECONDS,
  createSession,
  publicSessionUser,
  randomAccountId,
} from "@/lib/auth/token";
import { setSessionCookie } from "@/lib/auth/cookie";
import { authUnavailable, isAuthConfigError } from "@/lib/auth/response";
import {
  NO_STORE_HEADERS,
  clientIp,
  isSameOrigin,
  readJsonBody,
} from "@/lib/security/http";
import { rateLimit } from "@/lib/security/rate-limit";
import { isEmail, isPlainObject, normalizeEmail } from "@/lib/security/validation";

const DEMO_EMAILS = new Set(["demo@alattar.sa", "demo@ahmedelattar.sa"]);
const DEMO_PASSWORD = "demo1234";

function titleFromEmail(email: string) {
  const handle = email.split("@")[0] ?? "Client";
  return (
    handle
      .split(/[._-]/)
      .filter(Boolean)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(" ") || "Client"
  );
}

export async function POST(request: NextRequest) {
  if (!isSameOrigin(request)) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const limited = rateLimit(`sign-in:${clientIp(request)}`, 8, 15 * 60 * 1000);
  if (!limited.ok) {
    return NextResponse.json(
      { error: "rate_limited" },
      {
        status: 429,
        headers: { ...NO_STORE_HEADERS, "Retry-After": String(limited.retryAfter) },
      },
    );
  }

  const body = await readJsonBody(request);
  if (!isPlainObject(body)) {
    return NextResponse.json({ error: "invalid_input" }, { status: 400 });
  }

  const email = normalizeEmail(body.email);
  const password = typeof body.password === "string" ? body.password : "";
  const remember = body.remember === true;

  if (!isEmail(email) || password.length < 8 || password.length > 128) {
    return NextResponse.json(
      { error: "invalid_credentials" },
      { status: 401, headers: NO_STORE_HEADERS },
    );
  }

  const isDemo = DEMO_EMAILS.has(email);
  if (isDemo && password !== DEMO_PASSWORD) {
    return NextResponse.json(
      { error: "invalid_credentials" },
      { status: 401, headers: NO_STORE_HEADERS },
    );
  }

  const accountId = isDemo ? "ALT-2048" : randomAccountId();
  const ttl = remember ? REMEMBERED_SESSION_TTL_SECONDS : SESSION_TTL_SECONDS;

  let created: Awaited<ReturnType<typeof createSession>>;
  try {
    created = await createSession(
      {
        sub: accountId,
        email,
        name: isDemo ? "Mohammed Alabdullah" : titleFromEmail(email),
        company: isDemo ? "Riyadh Development Holding" : "Ahmed Elattar Client",
        accountId,
        ...(isDemo ? { phone: "+966 55 214 8890" } : {}),
        role: isDemo ? "admin" : "client",
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

  const response = NextResponse.json(
    { user: publicSessionUser(session) },
    { headers: NO_STORE_HEADERS },
  );

  setSessionCookie(response, token, remember ? ttl : undefined);
  return response;
}

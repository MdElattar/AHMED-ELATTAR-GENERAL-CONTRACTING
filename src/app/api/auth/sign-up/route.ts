import { NextResponse, type NextRequest } from "next/server";
import {
  REMEMBERED_SESSION_TTL_SECONDS,
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
import {
  cleanString,
  isDisplayName,
  isEmail,
  isPhone,
  isPlainObject,
  normalizeEmail,
} from "@/lib/security/validation";

const DEMO_EMAILS = new Set(["demo@alattar.sa", "demo@ahmedelattar.sa"]);

export async function POST(request: NextRequest) {
  if (!isSameOrigin(request)) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const limited = rateLimit(`sign-up:${clientIp(request)}`, 5, 30 * 60 * 1000);
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

  const name = cleanString(body.name, 120);
  const email = normalizeEmail(body.email);
  const company = cleanString(body.company, 160) || "Ahmed Elattar Client";
  const phone = cleanString(body.phone, 40);
  const password = typeof body.password === "string" ? body.password : "";

  if (
    !isDisplayName(name) ||
    !isEmail(email) ||
    (phone.length > 0 && !isPhone(phone)) ||
    password.length < 8 ||
    password.length > 128
  ) {
    return NextResponse.json(
      { error: "invalid_input" },
      { status: 400, headers: NO_STORE_HEADERS },
    );
  }

  if (DEMO_EMAILS.has(email)) {
    return NextResponse.json(
      { error: "email_unavailable" },
      { status: 409, headers: NO_STORE_HEADERS },
    );
  }

  const accountId = randomAccountId();

  let created: Awaited<ReturnType<typeof createSession>>;
  try {
    created = await createSession({
      sub: accountId,
      email,
      name,
      company,
      accountId,
      ...(phone ? { phone } : {}),
      role: "client",
    });
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
    { status: 201, headers: NO_STORE_HEADERS },
  );

  setSessionCookie(response, token, REMEMBERED_SESSION_TTL_SECONDS);
  return response;
}

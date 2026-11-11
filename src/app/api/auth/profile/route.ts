import { NextResponse, type NextRequest } from "next/server";
import { cookies } from "next/headers";
import {
  SESSION_COOKIE,
  createSession,
  publicSessionUser,
  verifySession,
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
  isPhone,
  isPlainObject,
} from "@/lib/security/validation";

export async function PATCH(request: NextRequest) {
  if (!isSameOrigin(request)) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const limited = rateLimit(`profile:${clientIp(request)}`, 20, 15 * 60 * 1000);
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

  const name = cleanString(body.name, 120);
  const company = cleanString(body.company, 160);
  const phone = cleanString(body.phone, 40);

  if (!isDisplayName(name) || (phone.length > 0 && !isPhone(phone))) {
    return NextResponse.json(
      { error: "invalid_input" },
      { status: 400, headers: NO_STORE_HEADERS },
    );
  }

  // Email, role, and accountId are intentionally immutable here. Letting a
  // client change them would allow privilege escalation or account takeover.
  let created: Awaited<ReturnType<typeof createSession>>;
  try {
    created = await createSession({
      sub: session.sub,
      email: session.email,
      name,
      company: company || session.company,
      accountId: session.accountId,
      ...(phone ? { phone } : {}),
      role: session.role,
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

  const { token: nextToken, session: nextSession } = created;

  const response = NextResponse.json(
    { user: publicSessionUser(nextSession) },
    { headers: NO_STORE_HEADERS },
  );

  const remaining = Math.max(60, session.exp - Math.floor(Date.now() / 1000));
  setSessionCookie(response, nextToken, remaining);
  return response;
}

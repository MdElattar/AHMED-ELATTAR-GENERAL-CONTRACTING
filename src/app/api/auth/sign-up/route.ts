import { NextResponse, type NextRequest } from "next/server";
import {
  REMEMBERED_SESSION_TTL_SECONDS,
  createSession,
  publicSessionUser,
  randomAccountId,
} from "@/lib/auth/token";
import { setSessionCookie } from "@/lib/auth/cookie";
import { authUnavailable, isAuthConfigError } from "@/lib/auth/response";
import { createUser, getUserByEmail, recordAudit } from "@/lib/db";
import { hashPassword } from "@/lib/auth/password";
import {
  NO_STORE_HEADERS,
  clientIp,
  isSameOrigin,
  readJsonBody,
} from "@/lib/security/http";
import { rateLimit } from "@/lib/security/rate-limit";
import { signUpSchema } from "@/lib/security/schemas";

export async function POST(request: NextRequest) {
  if (!isSameOrigin(request)) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const ip = clientIp(request);
  const limited = rateLimit(`sign-up:${ip}`, 5, 30 * 60 * 1000);
  if (!limited.ok) {
    return NextResponse.json(
      { error: "rate_limited" },
      {
        status: 429,
        headers: { ...NO_STORE_HEADERS, "Retry-After": String(limited.retryAfter) },
      },
    );
  }

  const parsed = signUpSchema.safeParse(await readJsonBody(request));
  if (!parsed.success) {
    return NextResponse.json(
      { error: "invalid_input" },
      { status: 400, headers: NO_STORE_HEADERS },
    );
  }

  const { name, email, phone, password } = parsed.data;
  const company = parsed.data.company || "Ahmed Elattar Client";

  const existing = await getUserByEmail(email);
  if (existing) {
    return NextResponse.json(
      { error: "email_unavailable" },
      { status: 409, headers: NO_STORE_HEADERS },
    );
  }

  const accountId = randomAccountId();

  try {
    const passwordHash = await hashPassword(password);
    const user = await createUser({
      email,
      name,
      company,
      ...(phone ? { phone } : {}),
      passwordHash,
      role: "client",
      accountId,
    });

    const { token, session } = await createSession({
      sub: user.id,
      email: user.email,
      name: user.name,
      company: user.company,
      accountId: user.accountId,
      ...(user.phone ? { phone: user.phone } : {}),
      role: user.role,
    });

    await recordAudit({
      actor: email,
      action: "auth.sign_up",
      entity: "user",
      entityId: user.id,
      ip,
    });

    const response = NextResponse.json(
      { user: publicSessionUser(session) },
      { status: 201, headers: NO_STORE_HEADERS },
    );

    setSessionCookie(response, token, REMEMBERED_SESSION_TTL_SECONDS);
    return response;
  } catch (error) {
    if (isAuthConfigError(error)) {
      console.error(
        "[auth] AUTH_SECRET is missing or shorter than 32 characters; refusing to sign sessions.",
      );
      return authUnavailable();
    }

    if (
      error instanceof Error &&
      (error.message === "email_taken" || error.message.includes("E11000"))
    ) {
      return NextResponse.json(
        { error: "email_unavailable" },
        { status: 409, headers: NO_STORE_HEADERS },
      );
    }

    console.error("[auth] sign-up failed", error);
    return NextResponse.json(
      { error: "server_error" },
      { status: 500, headers: NO_STORE_HEADERS },
    );
  }
}

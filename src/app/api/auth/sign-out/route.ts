import { NextResponse, type NextRequest } from "next/server";
import { activeSession } from "@/lib/auth/guard";
import { clearResetCookie, clearSessionCookie } from "@/lib/auth/cookie";
import { updateUser } from "@/lib/db";
import { NO_STORE_HEADERS, clientIp, isSameOrigin } from "@/lib/security/http";
import { rateLimit } from "@/lib/security/rate-limit";

export async function POST(request: NextRequest) {
  if (!isSameOrigin(request)) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const ip = clientIp(request);
  const limited = rateLimit(`sign-out:${ip}`, 30, 15 * 60 * 1000);
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
  if (session) {
    // Sign-out is an explicit revocation; unlike sign-in, incrementing here is
    // safe because no new token is issued from the new version.
    await updateUser(session.email, { sessionVersion: session.sessionVersion + 1 });
  }

  const response = NextResponse.json({ ok: true }, { headers: NO_STORE_HEADERS });
  clearSessionCookie(response);
  clearResetCookie(response);
  return response;
}

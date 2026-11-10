import { NextResponse, type NextRequest } from "next/server";
import {
  NO_STORE_HEADERS,
  clientIp,
  isSameOrigin,
  readJsonBody,
} from "@/lib/security/http";
import { rateLimit } from "@/lib/security/rate-limit";
import { isEmail, isPlainObject, normalizeEmail } from "@/lib/security/validation";

export async function POST(request: NextRequest) {
  if (!isSameOrigin(request)) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const limited = rateLimit(`newsletter:${clientIp(request)}`, 5, 10 * 60 * 1000);
  if (!limited.ok) {
    return NextResponse.json(
      { error: "rate_limited" },
      {
        status: 429,
        headers: { ...NO_STORE_HEADERS, "Retry-After": String(limited.retryAfter) },
      },
    );
  }

  const body = await readJsonBody(request, 4_000);
  if (!isPlainObject(body)) {
    return NextResponse.json({ error: "invalid_input" }, { status: 400 });
  }

  const email = normalizeEmail(body.email);
  if (!isEmail(email)) {
    return NextResponse.json(
      { error: "invalid_email" },
      { status: 400, headers: NO_STORE_HEADERS },
    );
  }

  // Always return the same acknowledgement to avoid email enumeration.
  return NextResponse.json({ ok: true }, { headers: NO_STORE_HEADERS });
}

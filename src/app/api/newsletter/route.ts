import { NextResponse, type NextRequest } from "next/server";
import { createInquiry, listInquiries } from "@/lib/db";
import {
  NO_STORE_HEADERS,
  clientIp,
  isSameOrigin,
  readJsonBody,
} from "@/lib/security/http";
import { rateLimit } from "@/lib/security/rate-limit";
import { newsletterSchema } from "@/lib/security/schemas";

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

  const parsed = newsletterSchema.safeParse(await readJsonBody(request, 4_000));
  if (!parsed.success) {
    return NextResponse.json(
      { error: "invalid_email" },
      { status: 400, headers: NO_STORE_HEADERS },
    );
  }

  const { email } = parsed.data;

  // Always return the same acknowledgement to avoid email enumeration.
  try {
    const recent = await listInquiries(200);
    const subscribed = recent.some(
      (entry) => entry.kind === "newsletter" && entry.email === email,
    );

    if (!subscribed) {
      await createInquiry({ kind: "newsletter", email });
    }
  } catch (error) {
    console.error("[newsletter] failed to persist subscription", error);
  }

  return NextResponse.json({ ok: true }, { headers: NO_STORE_HEADERS });
}

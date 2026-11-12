import { NextResponse, type NextRequest } from "next/server";
import { requireAdmin } from "@/lib/auth/guard";
import { inspectMediaSource } from "@/lib/media-inspect";
import {
  NO_STORE_HEADERS,
  clientIp,
  isSameOrigin,
  readJsonBody,
} from "@/lib/security/http";
import { rateLimit } from "@/lib/security/rate-limit";

type ValidateBody = {
  sources?: unknown;
};

export async function POST(request: NextRequest) {
  if (!isSameOrigin(request)) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json(
      { error: "unauthorized" },
      { status: 401, headers: NO_STORE_HEADERS },
    );
  }

  const limited = rateLimit(`admin-media-validate:${clientIp(request)}`, 30, 60 * 1000);
  if (!limited.ok) {
    return NextResponse.json(
      { error: "rate_limited" },
      {
        status: 429,
        headers: { ...NO_STORE_HEADERS, "Retry-After": String(limited.retryAfter) },
      },
    );
  }

  const body = await readJsonBody<ValidateBody>(request, 24_000);
  if (!body || !Array.isArray(body.sources)) {
    return NextResponse.json(
      { error: "invalid_payload" },
      { status: 400, headers: NO_STORE_HEADERS },
    );
  }

  const sources = Array.from(
    new Set(
      body.sources
        .filter((source): source is string => typeof source === "string")
        .map((source) => source.trim())
        .filter(Boolean),
    ),
  );

  if (sources.length > 12 || sources.some((source) => source.length > 2000)) {
    return NextResponse.json(
      { error: "invalid_payload" },
      { status: 400, headers: NO_STORE_HEADERS },
    );
  }

  const results = await Promise.all(sources.map((source) => inspectMediaSource(source)));

  return NextResponse.json(
    {
      valid: results.every((result) => result.ok),
      results,
    },
    { headers: NO_STORE_HEADERS },
  );
}

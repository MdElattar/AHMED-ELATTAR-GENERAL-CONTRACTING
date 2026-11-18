import type { NextRequest } from "next/server";
import type { ZodType } from "zod";

export const NO_STORE_HEADERS = {
  "Cache-Control": "no-store, max-age=0",
  Pragma: "no-cache",
};

/**
 * CSRF defence for every state-changing route: SameSite=Strict cookies plus a
 * strict Origin check. `Sec-Fetch-Site` is a forbidden header that browsers
 * set, so a cross-site page cannot forge it.
 */
export function isSameOrigin(request: NextRequest) {
  const fetchSite = request.headers.get("sec-fetch-site");
  if (fetchSite && fetchSite !== "same-origin") return false;

  const origin = request.headers.get("origin");
  if (!origin) return false;

  // Do not trust X-Forwarded-Host: it is client-controllable on many platforms.
  const host = request.headers.get("host") ?? request.nextUrl.host;

  try {
    const parsed = new URL(origin);
    if (parsed.protocol !== "https:" && parsed.protocol !== "http:") return false;
    const allowedHosts = new Set<string>([host, request.nextUrl.host]);
    return allowedHosts.has(parsed.host);
  } catch {
    return false;
  }
}

/**
 * Platform-provided IP headers only. A raw `X-Forwarded-For` sent directly by
 * a client must never be trusted for rate limiting unless the deployment
 * explicitly marks a trusted proxy.
 */
export function clientIp(request: NextRequest) {
  const direct =
    request.headers.get("x-real-ip") ??
    request.headers.get("cf-connecting-ip") ??
    request.headers.get("x-vercel-forwarded-for")?.split(",")[0];
  const cleaned = direct?.trim().replace(/^\[|\]$/g, "");
  if (cleaned) return cleaned;

  if (process.env.TRUST_PROXY_HEADERS === "true") {
    const forwarded = request.headers.get("x-forwarded-for");
    const candidate = forwarded?.split(",")[0]?.trim();
    if (candidate) return candidate;
  }

  return "unknown";
}

export async function readJsonBody<T = Record<string, unknown>>(
  request: NextRequest,
  maxBytes = 24_000,
): Promise<T | null> {
  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (Number.isFinite(contentLength) && contentLength > maxBytes) return null;

  const contentType = request.headers.get("content-type") ?? "";
  if (!contentType.toLowerCase().includes("application/json")) return null;

  try {
    return (await request.json()) as T;
  } catch {
    return null;
  }
}

export async function readValidatedJson<T>(
  request: NextRequest,
  schema: ZodType<T>,
  maxBytes = 24_000,
): Promise<{ data: T; error?: undefined } | { data?: undefined; error: string }> {
  const body = await readJsonBody(request, maxBytes);
  const parsed = schema.safeParse(body);
  return parsed.success
    ? { data: parsed.data }
    : { error: parsed.error.issues.map((issue) => issue.message).join(",") || "invalid_input" };
}

export function validateSearchParams<T>(
  request: NextRequest,
  schema: ZodType<T>,
): { data: T; error?: undefined } | { data?: undefined; error: string } {
  const input = Object.fromEntries(request.nextUrl.searchParams.entries());
  const parsed = schema.safeParse(input);
  return parsed.success
    ? { data: parsed.data }
    : { error: parsed.error.issues.map((issue) => issue.message).join(",") || "invalid_query" };
}

/**
 * Production logs record only the operation, never raw exception objects,
 * stacks, SQL/Mongo diagnostics or third-party response bodies. Development
 * keeps a short message for debugging.
 */
export function safeLogError(scope: string, error: unknown) {
  if (process.env.NODE_ENV === "production") {
    console.error(`${scope}: request failed`);
    return;
  }
  const message = error instanceof Error ? error.message : String(error);
  console.error(`${scope}: ${message.slice(0, 200)}`);
}

/** Never return raw database, stack, or dependency errors to clients. */
export function safeErrorMessage(error: unknown) {
  if (error instanceof Error && error.name === "AuthConfigError") {
    return "Authentication is temporarily unavailable.";
  }
  return "The request could not be completed. Please try again.";
}

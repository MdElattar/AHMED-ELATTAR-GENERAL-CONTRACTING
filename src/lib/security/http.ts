import type { NextRequest } from "next/server";

export const NO_STORE_HEADERS = {
  "Cache-Control": "no-store, max-age=0",
  Pragma: "no-cache",
};

export function isSameOrigin(request: NextRequest) {
  // Defence in depth: modern browsers send `Sec-Fetch-Site` as a forbidden
  // header, so a cross-site request can never forge it. Reject anything that
  // is not explicitly same-origin before even inspecting `Origin`.
  const fetchSite = request.headers.get("sec-fetch-site");
  if (fetchSite && fetchSite !== "same-origin") return false;

  const origin = request.headers.get("origin");
  if (!origin) return false;

  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");

  try {
    const parsed = new URL(origin);
    if (parsed.protocol !== "https:" && parsed.protocol !== "http:") return false;

    const allowedHosts = new Set<string>();
    if (host) allowedHosts.add(host);
    // Behind a proxy the forwarded host can differ from the internal origin,
    // so accept either — the browser-supplied `Origin` is still authoritative.
    try {
      allowedHosts.add(new URL(request.nextUrl.origin).host);
    } catch {
      // Ignore malformed request URLs.
    }

    return allowedHosts.has(parsed.host);
  } catch {
    return false;
  }
}

export function clientIp(request: NextRequest) {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]?.trim() || "unknown";
  return request.headers.get("x-real-ip")?.trim() || "unknown";
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

import { NextResponse, type NextRequest } from "next/server";
import { canAccessAdmin } from "@/lib/auth/permissions";
import { SESSION_COOKIE, verifySession } from "@/lib/auth/token";
import { NO_STORE_HEADERS } from "@/lib/security/http";
import { applySecurityHeaders } from "@/lib/security/headers";

type GuardedArea = "admin" | "portal" | null;

function areaFor(pathname: string): GuardedArea {
  if (pathname.startsWith("/admin") || pathname.startsWith("/api/admin")) return "admin";
  if (pathname.startsWith("/portal") || pathname.startsWith("/api/portal")) return "portal";
  return null;
}

function isLocalHost(host: string) {
  const hostname = host.split(":")[0]?.replace(/^\[|\]$/g, "").toLowerCase() ?? "";
  return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1";
}

function requestProtocol(request: NextRequest) {
  // Only honour proxy-provided protocol hints when the deployment explicitly
  // marks a trusted proxy. Otherwise a client could fake `https` and skip the
  // production redirect.
  if (process.env.TRUST_PROXY_HEADERS === "true") {
    const forwarded = request.headers
      .get("x-forwarded-proto")
      ?.split(",")[0]
      ?.trim()
      .toLowerCase();
    if (forwarded) return forwarded;
  }
  return request.nextUrl.protocol.replace(":", "");
}

/** Always a same-origin, relative path safe to put in a `next` parameter. */
function relativePath(request: NextRequest) {
  const pathname = request.nextUrl.pathname || "/";
  const suffix = request.nextUrl.search || "";
  return `${pathname}${suffix}`;
}

function clearSession(response: NextResponse) {
  response.cookies.set({
    name: SESSION_COOKIE,
    value: "",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: 0,
  });
  return response;
}

function denyApi(
  request: NextRequest,
  status: 401 | 403,
  reason: string,
  clearStaleSession = false,
) {
  const response = NextResponse.json(
    { error: reason },
    { status, headers: NO_STORE_HEADERS },
  );
  return applySecurityHeaders(clearStaleSession ? clearSession(response) : response);
}

function redirectTo(request: NextRequest, pathname: string, next?: string) {
  const url = request.nextUrl.clone();
  url.pathname = pathname;
  url.search = "";
  if (next) url.searchParams.set("next", next);
  const response = NextResponse.redirect(url, 307);
  applySecurityHeaders(response);
  return response;
}

/**
 * Unauthenticated / expired session: send pages to sign-in so the user can
 * recover, and clear the stale cookie to avoid an endless redirect loop.
 */
function deny(request: NextRequest, status: 401 | 403, reason: string) {
  if (request.nextUrl.pathname.startsWith("/api/")) {
    return denyApi(request, status, reason, true);
  }

  const response = redirectTo(request, "/sign-in", relativePath(request));
  return clearSession(response);
}

/**
 * Proxy performs only optimistic, token-based checks. It never queries MongoDB:
 * authoritative reconciliation (role/sessionVersion) happens in the route
 * handler via `activeSession()`. This keeps privileged redirects fast and,
 * crucially, prevents a login loop when the database and cookie disagree.
 */
export async function proxy(request: NextRequest) {
  // First request over plain HTTP is redirected before any session work. HSTS
  // only protects repeat visits, so this guard is required in production.
  const host = request.headers.get("host") ?? request.nextUrl.host;
  if (
    process.env.NODE_ENV === "production" &&
    !isLocalHost(host) &&
    requestProtocol(request) !== "https"
  ) {
    const httpsUrl = request.nextUrl.clone();
    httpsUrl.protocol = "https:";
    return applySecurityHeaders(NextResponse.redirect(httpsUrl, 308));
  }

  // A ?lang= link must be reflected by the server render, not patched in after
  // paint. Mirror it into the request headers before the layout reads cookies.
  let requestHeaders: Headers | null = null;
  const lang = request.nextUrl.searchParams.get("lang");
  if (lang === "ar" || lang === "en") {
    requestHeaders = new Headers(request.headers);
    const remaining = (requestHeaders.get("cookie") ?? "")
      .split("; ")
      .filter((part) => part && !part.startsWith("alattar-locale="));
    remaining.push(`alattar-locale=${lang}`);
    requestHeaders.set("cookie", remaining.join("; "));
  }
  const continueWithLocale = () => {
    const response = NextResponse.next(
      requestHeaders ? { request: { headers: requestHeaders } } : undefined,
    );
    // Keep the browser cookie in sync with the query so the inline bootstrap in
    // layout.tsx sees the same locale the server just rendered (no post-paint flip).
    if (lang === "ar" || lang === "en") {
      response.cookies.set("alattar-locale", lang, {
        path: "/",
        maxAge: 31536000,
        sameSite: "lax",
      });
    }
    return applySecurityHeaders(response);
  };

  const area = areaFor(request.nextUrl.pathname);
  if (!area) return continueWithLocale();

  const isApi = request.nextUrl.pathname.startsWith("/api/");
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const session = token ? await verifySession(token) : null;
  if (!session) return deny(request, 401, "session_expired");

  if (area === "admin" && !canAccessAdmin(session.role)) {
    if (isApi) return denyApi(request, 403, "forbidden");
    return redirectTo(request, "/portal");
  }

  return continueWithLocale();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|_next/font|favicon.ico|robots.txt|sitemap.xml|brand/).*)",
  ],
};

import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, verifySession } from "@/lib/auth/token";
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

function deny(request: NextRequest, status: 401 | 403, reason: string) {
  if (request.nextUrl.pathname.startsWith("/api/")) {
    return applySecurityHeaders(NextResponse.json({ error: reason }, { status }));
  }

  const signInUrl = request.nextUrl.clone();
  signInUrl.pathname = "/sign-in";
  signInUrl.search = "";
  signInUrl.searchParams.set("next", request.nextUrl.pathname);
  return applySecurityHeaders(NextResponse.redirect(signInUrl, 307));
}

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

  const area = areaFor(request.nextUrl.pathname);
  if (!area) return applySecurityHeaders(NextResponse.next());

  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const session = token ? await verifySession(token) : null;
  if (!session) return deny(request, 401, "authentication_required");

  // Reconcile with the live account on every privileged request. This makes
  // role changes, revocations and deletions effective without waiting for JWT
  // expiry, and keeps the admin API protected even if a route forgets its
  // own guard.
  let liveUser: Awaited<ReturnType<(typeof import("@/lib/db"))["getUserByEmail"]>> = null;
  try {
    const { getUserByEmail } = await import("@/lib/db");
    liveUser = await getUserByEmail(session.email);
  } catch {
    liveUser = null;
  }

  if (!liveUser || (liveUser.sessionVersion ?? 0) !== session.sessionVersion) {
    return deny(request, 401, "session_expired");
  }

  if (area === "admin" && liveUser.role !== "admin") {
    if (request.nextUrl.pathname.startsWith("/api/")) {
      return applySecurityHeaders(NextResponse.json({ error: "forbidden" }, { status: 403 }));
    }
    const portalUrl = request.nextUrl.clone();
    portalUrl.pathname = "/portal";
    portalUrl.search = "";
    return applySecurityHeaders(NextResponse.redirect(portalUrl, 307));
  }

  return applySecurityHeaders(NextResponse.next());
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|_next/font|favicon.ico|robots.txt|sitemap.xml|brand/).*)",
  ],
};

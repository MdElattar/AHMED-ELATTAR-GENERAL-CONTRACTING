import { NextResponse, type NextRequest } from "next/server";
import { getUserByEmail } from "@/lib/db";
import { SESSION_COOKIE, verifySession } from "@/lib/auth/token";

export async function proxy(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const session = token ? await verifySession(token) : null;
  const { pathname } = request.nextUrl;

  if (!session) {
    const signInUrl = request.nextUrl.clone();
    signInUrl.pathname = "/sign-in";
    signInUrl.search = "";
    signInUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(signInUrl);
  }

  // Administrative access is checked against the live account, not only the
  // signed token, so revoking a co-admin takes effect on their next request.
  if (pathname.startsWith("/admin")) {
    let liveRole: string | null = null;
    let liveVersion = -1;
    try {
      const user = await getUserByEmail(session.email);
      liveRole = user?.role ?? null;
      liveVersion = user?.sessionVersion ?? -1;
    } catch {
      // Fail closed for the admin surface if the database cannot be reached.
      liveRole = null;
    }

    if (
      liveRole !== "admin" ||
      liveVersion !== session.sessionVersion
    ) {
      const portalUrl = request.nextUrl.clone();
      portalUrl.pathname = "/portal";
      portalUrl.search = "";
      return NextResponse.redirect(portalUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/portal/:path*"],
};

import { NextResponse, type NextRequest } from "next/server";
import { clearSessionCookie } from "@/lib/auth/cookie";
import { NO_STORE_HEADERS, isSameOrigin } from "@/lib/security/http";

export async function POST(request: NextRequest) {
  if (!isSameOrigin(request)) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const response = NextResponse.json({ ok: true }, { headers: NO_STORE_HEADERS });
  clearSessionCookie(response);
  return response;
}

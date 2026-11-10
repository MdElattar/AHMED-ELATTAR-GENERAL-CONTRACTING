import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  SESSION_COOKIE,
  publicSessionUser,
  verifySession,
} from "@/lib/auth/token";
import { NO_STORE_HEADERS } from "@/lib/security/http";

export async function GET() {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  const session = token ? await verifySession(token) : null;

  return NextResponse.json(
    { user: session ? publicSessionUser(session) : null },
    { headers: NO_STORE_HEADERS },
  );
}

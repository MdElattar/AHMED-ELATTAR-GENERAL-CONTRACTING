import { NextResponse } from "next/server";
import { activeSession } from "@/lib/auth/guard";
import { publicSessionUser } from "@/lib/auth/token";
import { NO_STORE_HEADERS } from "@/lib/security/http";

export async function GET() {
  const session = await activeSession();

  return NextResponse.json(
    { user: session ? publicSessionUser(session) : null },
    { headers: NO_STORE_HEADERS },
  );
}

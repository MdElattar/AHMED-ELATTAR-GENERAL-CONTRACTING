import { NextResponse, connection } from "next/server";
import { requireAdmin } from "@/lib/auth/guard";
import { listSignoffs } from "@/lib/db";
import { NO_STORE_HEADERS } from "@/lib/security/http";

export async function GET() {
  await connection();
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json(
      { error: "unauthorized" },
      { status: 401, headers: NO_STORE_HEADERS },
    );
  }

  const signoffs = await listSignoffs(300);
  return NextResponse.json({ signoffs }, { headers: NO_STORE_HEADERS });
}

import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/guard";
import { listAudit } from "@/lib/db";
import { NO_STORE_HEADERS } from "@/lib/security/http";

export async function GET() {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json(
      { error: "unauthorized" },
      { status: 401, headers: NO_STORE_HEADERS },
    );
  }

  const entries = await listAudit(100);
  return NextResponse.json({ entries }, { headers: NO_STORE_HEADERS });
}

import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/guard";
import { isPrimaryAdminEmail } from "@/lib/auth/token";
import { adminDirectoryUser } from "@/lib/admin-access";
import { listUsers } from "@/lib/db";
import { NO_STORE_HEADERS } from "@/lib/security/http";

export async function GET() {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json(
      { error: "unauthorized" },
      { status: 401, headers: NO_STORE_HEADERS },
    );
  }
  if (!isPrimaryAdminEmail(session.email)) {
    return NextResponse.json(
      { error: "primary_admin_required" },
      { status: 403, headers: NO_STORE_HEADERS },
    );
  }

  const users = (await listUsers()).map(adminDirectoryUser);
  return NextResponse.json(
    {
      users,
      primaryAdmin: session.email,
      admins: users.filter((user) => user.role === "admin").length,
    },
    { headers: NO_STORE_HEADERS },
  );
}

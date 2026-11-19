import { NextResponse, type NextRequest } from "next/server";
import { requireAdmin } from "@/lib/auth/guard";
import { isPrimaryAdminEmail } from "@/lib/auth/token";
import { adminDirectoryUser } from "@/lib/admin-access";
import { queryUsers } from "@/lib/db";
import {
  NO_STORE_HEADERS,
  validateSearchParams,
} from "@/lib/security/http";
import { adminAccessQuerySchema } from "@/lib/security/schemas";

export async function GET(request: NextRequest) {
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

  const parsed = validateSearchParams(request, adminAccessQuerySchema);
  if (!parsed.data) {
    return NextResponse.json(
      { error: "invalid_query" },
      { status: 400, headers: NO_STORE_HEADERS },
    );
  }

  const result = await queryUsers({
    page: parsed.data.page,
    limit: parsed.data.limit,
    role: parsed.data.role,
    search: parsed.data.query,
    excludeTest: parsed.data.excludeTest,
  });

  return NextResponse.json(
    {
      users: result.users.map(adminDirectoryUser),
      total: result.total,
      page: result.page,
      limit: result.limit,
      pages: result.pages,
      admins: result.admins,
      managers: result.managers,
      clients: result.clients,
      primaryAdmin: session.email,
    },
    { headers: NO_STORE_HEADERS },
  );
}

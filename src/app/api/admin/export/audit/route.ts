import { connection } from "next/server";
import { requireAdmin } from "@/lib/auth/guard";
import { csvResponse } from "@/lib/csv";
import { listAudit } from "@/lib/db";

export async function GET() {
  await connection();
  const session = await requireAdmin();
  if (!session) {
    return new Response("Unauthorized", { status: 401 });
  }

  const entries = await listAudit(5000);
  const rows = entries.map((entry) => [
    entry.createdAt,
    entry.actor,
    entry.action,
    entry.entity,
    entry.entityId ?? "",
    entry.ip ?? "",
    entry.meta ? JSON.stringify(entry.meta) : "",
  ]);

  return csvResponse(
    "ahmed-elattar-audit-log.csv",
    ["Created at", "Actor", "Action", "Entity", "Entity ID", "IP", "Metadata"],
    rows,
  );
}

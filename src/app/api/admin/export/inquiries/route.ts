import { connection } from "next/server";
import { requireAdmin } from "@/lib/auth/guard";
import { csvResponse } from "@/lib/csv";
import { listInquiries } from "@/lib/db";

export async function GET() {
  await connection();
  const session = await requireAdmin();
  if (!session) {
    return new Response("Unauthorized", { status: 401 });
  }

  const inquiries = await listInquiries(5000);
  const rows = inquiries.map((inquiry) => [
    inquiry.reference ?? "",
    inquiry.kind,
    inquiry.name ?? "",
    inquiry.email,
    inquiry.phone ?? "",
    inquiry.company ?? "",
    inquiry.service ?? "",
    inquiry.projectType ?? "",
    inquiry.location ?? "",
    inquiry.status,
    inquiry.message ?? "",
    inquiry.createdAt,
    inquiry.updatedAt,
  ]);

  return csvResponse(
    "ahmed-elattar-inquiries.csv",
    [
      "Reference",
      "Kind",
      "Name",
      "Email",
      "Phone",
      "Company",
      "Service",
      "Project type",
      "Location",
      "Status",
      "Message",
      "Created at",
      "Updated at",
    ],
    rows,
  );
}

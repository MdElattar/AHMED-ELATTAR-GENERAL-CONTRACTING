import { NextResponse, connection } from "next/server";
import { requireAdmin } from "@/lib/auth/guard";
import { listInquiries, listProjects, listSignoffs } from "@/lib/db";
import { NO_STORE_HEADERS } from "@/lib/security/http";

function finiteNumber(value: unknown, fallback = 0) {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

export async function GET() {
  await connection();
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json(
      { error: "unauthorized" },
      { status: 401, headers: NO_STORE_HEADERS },
    );
  }

  const [projects, inquiries, signoffs] = await Promise.all([
    listProjects(),
    listInquiries(1000),
    listSignoffs(1000),
  ]);

  const portfolio = projects.filter((project) => !project.slug.startsWith("__"));
  let activeProjects = 0;
  let portfolioValue = 0;
  let netProfit = 0;

  for (const project of portfolio) {
    const status = project.payload.status;
    if (status === "ongoing") activeProjects += 1;
    portfolioValue += finiteNumber(project.payload.contractValue, finiteNumber(project.payload.budget));
    netProfit += finiteNumber(project.payload.profit);
  }

  return NextResponse.json(
    {
      kpis: {
        totalProjects: portfolio.length,
        activeProjects,
        portfolioValue,
        netProfit,
        newInquiries: inquiries.filter((inquiry) => inquiry.status === "new").length,
        totalInquiries: inquiries.length,
        signedContracts: signoffs.length,
        updatedAt: new Date().toISOString(),
      },
    },
    { headers: NO_STORE_HEADERS },
  );
}

import { NextResponse, connection } from "next/server";
import { activeSession } from "@/lib/auth/guard";
import { listOwnedProjects } from "@/lib/db";
import { NO_STORE_HEADERS } from "@/lib/security/http";

/** Owned portal feed. Never expose another client's project records. */
export async function GET() {
  await connection();

  const session = await activeSession();
  if (!session) {
    return NextResponse.json(
      { error: "unauthorized" },
      { status: 401, headers: NO_STORE_HEADERS },
    );
  }

  const projects = await listOwnedProjects(session.email);
  return NextResponse.json(
    {
      projects: projects.map((project) => {
        const { clientEmails: _owners, ...payload } = project.payload;
        void _owners;
        return {
          slug: project.slug,
          featured: project.featured,
          ...payload,
          updatedAt: project.updatedAt,
        };
      }),
    },
    { headers: NO_STORE_HEADERS },
  );
}

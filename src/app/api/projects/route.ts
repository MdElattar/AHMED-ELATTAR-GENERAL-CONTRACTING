import { NextResponse, connection } from "next/server";
import { listProjects } from "@/lib/db";
import { NO_STORE_HEADERS } from "@/lib/security/http";

/** Public, read-only portfolio feed. Internal records (site content) are hidden. */
export async function GET() {
  await connection();
  try {
    const projects = (await listProjects()).filter((project) => {
      if (project.slug.startsWith("__")) return false;
      if (project.payload.archivedAt) return false;
      if (project.payload.published === false) return false;
      return true;
    });

    return NextResponse.json(
      {
        projects: projects.map((project) => ({
          slug: project.slug,
          featured: project.featured,
          ...project.payload,
          updatedAt: project.updatedAt,
        })),
      },
      { headers: NO_STORE_HEADERS },
    );
  } catch (error) {
    console.error("[projects] failed to list", error);
    return NextResponse.json(
      { projects: [] },
      { status: 503, headers: NO_STORE_HEADERS },
    );
  }
}

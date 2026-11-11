import { NextResponse, connection } from "next/server";
import { listProjects } from "@/lib/db";
import { NO_STORE_HEADERS } from "@/lib/security/http";

const CONTENT_SLUG = "__site-content__";

export async function GET() {
  await connection();
  try {
    const record = (await listProjects()).find(
      (project) => project.slug === CONTENT_SLUG,
    );

    return NextResponse.json(
      { content: record?.payload ?? null },
      { headers: NO_STORE_HEADERS },
    );
  } catch (error) {
    console.error("[content] failed to load", error);
    return NextResponse.json({ content: null }, { headers: NO_STORE_HEADERS });
  }
}

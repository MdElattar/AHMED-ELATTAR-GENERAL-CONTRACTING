import { NextResponse, connection } from "next/server";
import { loadPublicProjects } from "@/lib/cache/public-data";
import { PUBLIC_CACHE_HEADERS, safeLogError } from "@/lib/security/http";

/** Public, read-only portfolio feed. Internal records and owner emails are hidden. */
export async function GET() {
  await connection();
  try {
    const feed = await loadPublicProjects();
    return NextResponse.json(feed, { headers: PUBLIC_CACHE_HEADERS });
  } catch (error) {
    safeLogError("[projects] failed to list", error);
    return NextResponse.json(
      { projects: [] },
      { status: 503, headers: PUBLIC_CACHE_HEADERS },
    );
  }
}

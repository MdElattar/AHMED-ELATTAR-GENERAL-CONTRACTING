import { NextResponse, connection } from "next/server";
import { loadPublicContent } from "@/lib/cache/public-data";
import { PUBLIC_CACHE_HEADERS, safeLogError } from "@/lib/security/http";

export async function GET() {
  await connection();
  try {
    const feed = await loadPublicContent();
    return NextResponse.json(feed, { headers: PUBLIC_CACHE_HEADERS });
  } catch (error) {
    safeLogError("[content] failed to load", error);
    return NextResponse.json(
      { content: null },
      { headers: PUBLIC_CACHE_HEADERS },
    );
  }
}

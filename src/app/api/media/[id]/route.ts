import { NextResponse } from "next/server";
import { getAsset } from "@/lib/db";

type RouteContext = { params: Promise<{ id: string }> };

/**
 * Public, immutable project imagery.
 *
 * Uploads are written only through the authenticated admin endpoint; this
 * route is intentionally read-only and safe to cache at the edge forever.
 */
export async function GET(_request: Request, context: RouteContext) {
  const { id } = await context.params;

  try {
    const asset = await getAsset(id);
    if (!asset) {
      return new Response("Not found", { status: 404 });
    }

    const bytes = Buffer.from(asset.data, "base64");
    return new Response(new Uint8Array(bytes), {
      headers: {
        "Content-Type": asset.mime,
        "Content-Length": String(bytes.byteLength),
        "Cache-Control": "public, max-age=31536000, immutable",
        "X-Content-Type-Options": "nosniff",
        "Content-Disposition": "inline",
      },
    });
  } catch (error) {
    console.error("[media] failed to read asset", error);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}

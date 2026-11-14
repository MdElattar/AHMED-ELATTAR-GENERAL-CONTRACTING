import { NextResponse, type NextRequest } from "next/server";
import { requireAdmin } from "@/lib/auth/guard";
import { createAsset } from "@/lib/db";
import { NO_STORE_HEADERS, clientIp, isSameOrigin } from "@/lib/security/http";
import { rateLimit } from "@/lib/security/rate-limit";

const MAX_UPLOAD_BYTES = 4 * 1024 * 1024;

const allowedMime = new Set(["image/webp", "image/jpeg", "image/png", "image/avif"]);

function sniffMime(buffer: Buffer): string | null {
  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return "image/jpeg";
  }
  if (
    buffer.length >= 8 &&
    buffer[0] === 0x89 &&
    buffer.subarray(1, 4).toString("ascii") === "PNG"
  ) {
    return "image/png";
  }
  if (
    buffer.length >= 12 &&
    buffer.subarray(0, 4).toString("ascii") === "RIFF" &&
    buffer.subarray(8, 12).toString("ascii") === "WEBP"
  ) {
    return "image/webp";
  }
  if (
    buffer.length >= 12 &&
    buffer.subarray(4, 8).toString("ascii") === "ftyp" &&
    buffer.subarray(8, 12).toString("ascii").startsWith("avif")
  ) {
    return "image/avif";
  }
  return null;
}

export async function POST(request: NextRequest) {
  if (!isSameOrigin(request)) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json(
      { error: "unauthorized" },
      { status: 401, headers: NO_STORE_HEADERS },
    );
  }

  const limited = rateLimit(`admin-media:${clientIp(request)}`, 60, 60 * 1000);
  if (!limited.ok) {
    return NextResponse.json(
      { error: "rate_limited" },
      {
        status: 429,
        headers: { ...NO_STORE_HEADERS, "Retry-After": String(limited.retryAfter) },
      },
    );
  }

  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (Number.isFinite(contentLength) && contentLength > MAX_UPLOAD_BYTES + 64 * 1024) {
    return NextResponse.json(
      { error: "file_too_large" },
      { status: 413, headers: NO_STORE_HEADERS },
    );
  }

  const contentType = request.headers.get("content-type") ?? "";
  if (!contentType.toLowerCase().includes("multipart/form-data")) {
    return NextResponse.json(
      { error: "invalid_content_type" },
      { status: 415, headers: NO_STORE_HEADERS },
    );
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json(
      { error: "invalid_form" },
      { status: 400, headers: NO_STORE_HEADERS },
    );
  }

  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json(
      { error: "missing_file" },
      { status: 400, headers: NO_STORE_HEADERS },
    );
  }
  if (file.size === 0 || file.size > MAX_UPLOAD_BYTES) {
    return NextResponse.json(
      { error: "file_too_large" },
      { status: 413, headers: NO_STORE_HEADERS },
    );
  }
  if (file.type && !allowedMime.has(file.type.toLowerCase())) {
    return NextResponse.json(
      { error: "unsupported_type" },
      { status: 415, headers: NO_STORE_HEADERS },
    );
  }

  const data = Buffer.from(await file.arrayBuffer());
  const mime = sniffMime(data);
  if (!mime || !allowedMime.has(mime)) {
    return NextResponse.json(
      { error: "unsupported_type" },
      { status: 415, headers: NO_STORE_HEADERS },
    );
  }

  const width = Number(form.get("width"));
  const height = Number(form.get("height"));

  try {
    const asset = await createAsset({
      mime,
      data,
      ...(Number.isFinite(width) && width > 0 ? { width: Math.round(width) } : {}),
      ...(Number.isFinite(height) && height > 0 ? { height: Math.round(height) } : {}),
    });

    return NextResponse.json(
      { url: `/api/media/${asset.id}`, width: asset.width, height: asset.height, size: asset.size },
      { status: 201, headers: NO_STORE_HEADERS },
    );
  } catch (error) {
    console.error("[admin] failed to store project image", error);
    return NextResponse.json(
      { error: "server_error" },
      { status: 500, headers: NO_STORE_HEADERS },
    );
  }
}

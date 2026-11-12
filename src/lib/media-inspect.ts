import { stat, readFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { isAllowedMediaSource } from "@/lib/cms";

const MAX_BYTES = 8 * 1024 * 1024;
const MIN_EDGE = 300;
const MAX_EDGE = 8_000;
// libvips reports AVIF through the HEIF container reader.
const ALLOWED_FORMATS = new Set(["avif", "gif", "heif", "jpeg", "png", "webp"]);

export type MediaInspection = {
  ok: boolean;
  source: string;
  width?: number;
  height?: number;
  format?: string;
  bytes?: number;
  reason?: "invalid_source" | "too_large" | "unreachable" | "not_image" | "format" | "dimensions";
};

async function inspectBuffer(source: string, buffer: Buffer): Promise<MediaInspection> {
  if (!buffer.byteLength || buffer.byteLength > MAX_BYTES) {
    return { ok: false, source, reason: "too_large" };
  }

  try {
    const metadata = await sharp(buffer, {
      failOn: "none",
      limitInputPixels: MAX_EDGE * MAX_EDGE,
    }).metadata();
    const width = metadata.width ?? 0;
    const height = metadata.height ?? 0;
    const format = metadata.format ?? "";

    if (!ALLOWED_FORMATS.has(format)) {
      return { ok: false, source, width, height, format, bytes: buffer.byteLength, reason: "format" };
    }
    if (
      Math.min(width, height) < MIN_EDGE ||
      Math.max(width, height) > MAX_EDGE
    ) {
      return {
        ok: false,
        source,
        width,
        height,
        format,
        bytes: buffer.byteLength,
        reason: "dimensions",
      };
    }

    return {
      ok: true,
      source,
      width,
      height,
      format,
      bytes: buffer.byteLength,
    };
  } catch {
    return { ok: false, source, bytes: buffer.byteLength, reason: "not_image" };
  }
}

async function readLimited(response: Response) {
  const declared = Number(response.headers.get("content-length") ?? 0);
  if (declared > MAX_BYTES) {
    await response.body?.cancel();
    throw new Error("too_large");
  }
  if (!response.body) {
    const buffer = Buffer.from(await response.arrayBuffer());
    if (buffer.byteLength > MAX_BYTES) throw new Error("too_large");
    return buffer;
  }

  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    if (!value) continue;
    total += value.byteLength;
    if (total > MAX_BYTES) {
      await reader.cancel();
      throw new Error("too_large");
    }
    chunks.push(value);
  }

  return Buffer.concat(chunks);
}

async function inspectLocal(source: string): Promise<MediaInspection> {
  const pathname = decodeURIComponent(new URL(source, "https://local.invalid").pathname);
  const publicDir = path.join(process.cwd(), "public");
  const filePath = path.resolve(publicDir, `.${pathname}`);
  if (!filePath.startsWith(`${publicDir}${path.sep}`)) {
    return { ok: false, source, reason: "invalid_source" };
  }

  try {
    const info = await stat(filePath);
    if (!info.isFile() || info.size > MAX_BYTES) {
      return { ok: false, source, reason: "too_large" };
    }
    const buffer = await readFile(filePath);
    return inspectBuffer(source, buffer);
  } catch {
    return { ok: false, source, reason: "unreachable" };
  }
}

/**
 * Validate a linked image before it is persisted into the CMS. Remote files are
 * bounded while streaming so a hostile or misconfigured URL can never consume
 * unbounded memory, and sharp verifies the real format and pixel dimensions.
 */
export async function inspectMediaSource(source: string): Promise<MediaInspection> {
  if (!isAllowedMediaSource(source)) {
    return { ok: false, source, reason: "invalid_source" };
  }

  if (source.startsWith("/") && !source.startsWith("//")) {
    return inspectLocal(source);
  }

  let response: Response;
  try {
    response = await fetch(source, {
      redirect: "follow",
      cache: "no-store",
      signal: AbortSignal.timeout(7_000),
      headers: { Accept: "image/avif,image/webp,image/png,image/jpeg,image/gif" },
    });
  } catch {
    return { ok: false, source, reason: "unreachable" };
  }

  if (!response.ok || !isAllowedMediaSource(response.url)) {
    await response.body?.cancel();
    return { ok: false, source, reason: "unreachable" };
  }

  const contentType = response.headers.get("content-type")?.toLowerCase() ?? "";
  if (contentType && !contentType.startsWith("image/")) {
    await response.body?.cancel();
    return { ok: false, source, reason: "not_image" };
  }

  try {
    return inspectBuffer(source, await readLimited(response));
  } catch (error) {
    return {
      ok: false,
      source,
      reason: error instanceof Error && error.message === "too_large" ? "too_large" : "unreachable",
    };
  }
}

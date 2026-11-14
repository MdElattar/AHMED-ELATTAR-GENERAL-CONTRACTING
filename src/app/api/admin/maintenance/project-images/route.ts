import { NextResponse, type NextRequest } from "next/server";
import sharp from "sharp";
import { requireAdmin } from "@/lib/auth/guard";
import {
  createAsset,
  getAsset,
  listProjects,
  recordAudit,
  upsertProject,
} from "@/lib/db";
import { projectImageDefaults } from "@/data/project-images";
import type { ArtVariant } from "@/data/projects";
import { isAllowedMediaSource } from "@/lib/cms";
import { revalidatePublicContent } from "@/lib/revalidate";
import {
  NO_STORE_HEADERS,
  clientIp,
  isSameOrigin,
  readJsonBody,
} from "@/lib/security/http";
import { rateLimit } from "@/lib/security/rate-limit";
import { isPlainObject } from "@/lib/security/validation";

async function loadSource(url: string): Promise<Buffer | null> {
  const local = url.match(/^\/api\/media\/([a-f0-9-]{20,64})$/i);
  if (local) {
    const asset = await getAsset(local[1]);
    return asset ? Buffer.from(asset.data, "base64") : null;
  }
  if (!isAllowedMediaSource(url)) return null;

  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) return null;
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.startsWith("image/")) return null;
  const buffer = Buffer.from(await response.arrayBuffer());
  return buffer.byteLength > 12 * 1024 * 1024 ? null : buffer;
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

  const limited = rateLimit(
    `admin-maintenance-images:${clientIp(request)}`,
    6,
    5 * 60 * 1000,
  );
  if (!limited.ok) {
    return NextResponse.json(
      { error: "rate_limited" },
      {
        status: 429,
        headers: { ...NO_STORE_HEADERS, "Retry-After": String(limited.retryAfter) },
      },
    );
  }

  const body = await readJsonBody(request, 8_000);
  if (!isPlainObject(body)) {
    return NextResponse.json(
      { error: "invalid_input" },
      { status: 400, headers: NO_STORE_HEADERS },
    );
  }
  const dryRun = body.dryRun === true;

  const projects = (await listProjects()).filter(
    (project) => !project.slug.startsWith("__"),
  );

  const candidates = projects.flatMap((project) => {
    const payload = project.payload;
    const art = payload.art as ArtVariant;
    const defaults = projectImageDefaults[art];
    const coverUrl =
      typeof payload.coverUrl === "string" && isAllowedMediaSource(payload.coverUrl)
        ? payload.coverUrl
        : defaults?.coverUrl;
    if (!coverUrl) return [];
    const needsThumb = typeof payload.thumbUrl !== "string" || !payload.thumbUrl;
    const needsBlur = typeof payload.blurDataURL !== "string" || !payload.blurDataURL;
    return needsThumb || needsBlur
      ? [{ project, payload, coverUrl, needsThumb, needsBlur }]
      : [];
  });

  if (dryRun) {
    return NextResponse.json(
      {
        dryRun: true,
        candidates: candidates.map(({ project, needsThumb, needsBlur }) => ({
          slug: project.slug,
          needsThumb,
          needsBlur,
        })),
        count: candidates.length,
      },
      { headers: NO_STORE_HEADERS },
    );
  }

  const generated: string[] = [];
  const failed: { slug: string; reason: string }[] = [];
  let touched = false;

  for (const candidate of candidates) {
    try {
      const source = await loadSource(candidate.coverUrl);
      if (!source) throw new Error("source_unavailable");

      const image = sharp(source, { failOn: "none" }).rotate();
      const metadata = await image.metadata();
      const [thumb, blur] = await Promise.all([
        image
          .clone()
          .resize({ width: 400, withoutEnlargement: true })
          .webp({ quality: 82 })
          .toBuffer(),
        image
          .clone()
          .resize({ width: 20, withoutEnlargement: true })
          .webp({ quality: 40 })
          .toBuffer(),
      ]);

      const width = Math.min(400, metadata.width ?? 400);
      const height =
        metadata.width && metadata.height
          ? Math.max(1, Math.round((metadata.height * width) / metadata.width))
          : (metadata.height ?? 1);
      const asset = await createAsset({
        mime: "image/webp",
        data: thumb,
        width,
        height,
      });
      const blurDataURL = `data:image/webp;base64,${blur.toString("base64")}`;

      await upsertProject(candidate.project.slug, {
        ...candidate.payload,
        coverUrl: candidate.coverUrl,
        thumbUrl: `/api/media/${asset.id}`,
        blurDataURL,
      });
      generated.push(candidate.project.slug);
      touched = true;
    } catch (error) {
      failed.push({
        slug: candidate.project.slug,
        reason: error instanceof Error ? error.message : "unknown",
      });
    }
  }

  if (touched) revalidatePublicContent();

  await recordAudit({
    actor: session.email,
    action: "project.images.maintenance",
    entity: "project",
    meta: { generated: generated.length, failed: failed.length },
    ip: clientIp(request),
  });

  return NextResponse.json(
    { dryRun: false, generated, failed, count: generated.length },
    { headers: NO_STORE_HEADERS },
  );
}

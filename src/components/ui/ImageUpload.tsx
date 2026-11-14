"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import imageCompression from "browser-image-compression";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  GripVertical,
  ImagePlus,
  Loader2,
  RefreshCw,
  Trash2,
  UploadCloud,
} from "lucide-react";
import { useI18n } from "@/components/providers/I18nProvider";
import { ProjectImage } from "@/components/ui/ProjectImage";
import type { ArtVariant, ProjectCategory } from "@/data/projects";
import { cn } from "@/lib/utils";

export type ImageUploadValue = {
  gallery: string[];
  coverUrl?: string;
  thumbUrl?: string;
  blurDataURL?: string;
};

type ImageUploadProps = {
  value: ImageUploadValue;
  onChange: (value: ImageUploadValue) => void;
  titleAr?: string;
  titleEn?: string;
  category?: ProjectCategory;
  art?: ArtVariant;
  maxFiles?: number;
};

const MAX_SOURCE_BYTES = 10 * 1024 * 1024;
const MAX_FINAL_BYTES = 300 * 1024;
const ACCEPTED = ["image/jpeg", "image/png", "image/webp", "image/avif"];

type AssetMeta = { thumbUrl?: string; blurDataURL?: string };

function metaFromValue(value: ImageUploadValue): Record<string, AssetMeta> {
  if (!value.coverUrl) return {};
  const entry: AssetMeta = {
    ...(value.thumbUrl ? { thumbUrl: value.thumbUrl } : {}),
    ...(value.blurDataURL ? { blurDataURL: value.blurDataURL } : {}),
  };
  return entry.thumbUrl || entry.blurDataURL ? { [value.coverUrl]: entry } : {};
}

function canvasToBlob(
  source: ImageBitmap,
  maxWidth: number,
  quality: number,
): Promise<Blob> {
  const scale = Math.min(1, maxWidth / source.width);
  const width = Math.max(1, Math.round(source.width * scale));
  const height = Math.max(1, Math.round(source.height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) return Promise.reject(new Error("canvas_unavailable"));
  context.imageSmoothingQuality = "high";
  context.drawImage(source, 0, 0, width, height);
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("encode_failed"))),
      "image/webp",
      quality,
    );
  });
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = () => reject(new Error("blur_failed"));
    reader.readAsDataURL(blob);
  });
}

async function prepareImage(file: File) {
  const compressed = await imageCompression(file, {
    maxWidthOrHeight: 1600,
    fileType: "image/webp",
    initialQuality: 0.82,
    maxSizeMB: 0.28,
    useWebWorker: true,
  });

  const secondPass =
    compressed.size > MAX_FINAL_BYTES
      ? await imageCompression(compressed, {
          maxWidthOrHeight: 1600,
          fileType: "image/webp",
          initialQuality: 0.7,
          maxSizeMB: 0.26,
          useWebWorker: true,
        })
      : compressed;

  const bitmap = await createImageBitmap(secondPass);
  const width = bitmap.width;
  const height = bitmap.height;

  // `browser-image-compression` targets a byte budget, but quality floors can
  // still leave very noisy photos above the 300 KB requirement. Walk quality
  // down deterministically until the encoded cover fits.
  let cover: Blob = secondPass;
  if (cover.size > MAX_FINAL_BYTES) {
    for (const quality of [0.72, 0.62, 0.5, 0.38, 0.28]) {
      cover = await canvasToBlob(bitmap, 1600, quality);
      if (cover.size <= MAX_FINAL_BYTES) break;
    }
  }

  const thumb = await canvasToBlob(bitmap, 400, 0.78);
  const blur = await canvasToBlob(bitmap, 20, 0.4);
  const blurDataURL = await blobToDataUrl(blur);
  bitmap.close();

  return {
    cover,
    thumb,
    blurDataURL,
    width: Math.round(width || 0),
    height: Math.round(height || 0),
  };
}

function uploadAsset(
  file: Blob,
  filename: string,
  onProgress: (percent: number) => void,
): Promise<string> {
  return new Promise((resolve, reject) => {
    const form = new FormData();
    form.append("file", file, filename);
    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/api/admin/media");
    xhr.withCredentials = true;
    xhr.responseType = "json";

    xhr.upload.onprogress = (event) => {
      if (!event.lengthComputable) return;
      onProgress(Math.round((event.loaded / event.total) * 100));
    };
    xhr.onerror = () => reject(new Error("network"));
    xhr.onabort = () => reject(new Error("network"));
    xhr.onload = () => {
      const body = (xhr.response ?? {}) as { url?: string; error?: string };
      if (xhr.status >= 200 && xhr.status < 300 && body.url) {
        resolve(body.url);
        return;
      }
      reject(new Error(body.error || `http_${xhr.status}`));
    };
    xhr.send(form);
  });
}

function moveItem(items: string[], from: number, to: number) {
  if (to < 0 || to >= items.length || from === to) return items;
  const next = [...items];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}

export function ImageUpload({
  value,
  onChange,
  titleAr = "",
  titleEn = "",
  category,
  art,
  maxFiles = 8,
}: ImageUploadProps) {
  const { locale } = useI18n();
  const isAr = locale === "ar";
  const inputRef = useRef<HTMLInputElement | null>(null);
  const dragIndex = useRef<number | null>(null);
  const replaceIndex = useRef<number | null>(null);
  const [uploadedMeta, setUploadedMeta] = useState<Record<string, AssetMeta>>({});
  const [dragActive, setDragActive] = useState(false);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [errors, setErrors] = useState<string[]>([]);

  const meta = useMemo(
    () => ({ ...metaFromValue(value), ...uploadedMeta }),
    [value, uploadedMeta],
  );

  const commitGallery = useCallback(
    (gallery: string[], metaOverride?: Record<string, AssetMeta>) => {
      const first = gallery[0];
      const merged = { ...metaFromValue(value), ...uploadedMeta };
      const entry = first ? (metaOverride ?? merged)[first] : undefined;
      onChange({
        gallery,
        ...(first ? { coverUrl: first } : {}),
        ...(entry?.thumbUrl ? { thumbUrl: entry.thumbUrl } : {}),
        ...(entry?.blurDataURL ? { blurDataURL: entry.blurDataURL } : {}),
      });
    },
    [onChange, uploadedMeta, value],
  );

  const acceptFiles = useCallback(
    async (files: File[]) => {
      const remaining = Math.max(0, maxFiles - value.gallery.length);
      if (!remaining) {
        setErrors([
          isAr
            ? `الحد الأقصى ${maxFiles} صور لكل مشروع.`
            : `Up to ${maxFiles} images per project.`,
        ]);
        return;
      }

      const valid: File[] = [];
      const nextErrors: string[] = [];
      for (const file of files.slice(0, remaining)) {
        if (!ACCEPTED.includes(file.type.toLowerCase())) {
          nextErrors.push(
            isAr
              ? `${file.name}: نوع الملف غير مدعوم. استخدم JPG أو PNG أو WebP أو AVIF.`
              : `${file.name}: unsupported type. Use JPG, PNG, WebP, or AVIF.`,
          );
          continue;
        }
        if (file.size > MAX_SOURCE_BYTES) {
          nextErrors.push(
            isAr
              ? `${file.name}: الحجم أكبر من 10 ميجابايت.`
              : `${file.name}: larger than 10 MB.`,
          );
          continue;
        }
        valid.push(file);
      }

      if (!valid.length) {
        setErrors(nextErrors);
        return;
      }

      setBusy(true);
      setErrors(nextErrors);
      setProgress(0);

      try {
        const uploaded: string[] = [];
        const uploadedMeta: Record<string, AssetMeta> = {};
        for (let index = 0; index < valid.length; index += 1) {
          const file = valid[index];
          setProgress(Math.round((index / valid.length) * 100));
          const prepared = await prepareImage(file);
          const [coverUrl, thumbUrl] = await Promise.all([
            uploadAsset(prepared.cover, `${file.name.replace(/\.[^.]+$/, "")}.webp`, (p) =>
              setProgress(Math.round(((index + p / 100) / valid.length) * 100)),
            ),
            uploadAsset(prepared.thumb, "thumb.webp", () => undefined),
          ]);
          uploadedMeta[coverUrl] = {
            thumbUrl,
            blurDataURL: prepared.blurDataURL,
          };
          uploaded.push(coverUrl);
        }

        const nextMeta = { ...meta, ...uploadedMeta };
        setUploadedMeta((current) => ({ ...current, ...uploadedMeta }));
        const nextGallery = [...value.gallery, ...uploaded].slice(0, maxFiles);
        commitGallery(nextGallery, nextMeta);
        setProgress(100);
      } catch (error) {
        const message = error instanceof Error ? error.message : "unknown";
        const friendly =
          message === "network"
            ? isAr
              ? "تعذر الاتصال بالخادم أثناء الرفع. تحقق من الشبكة وحاول مرة أخرى."
              : "The upload lost its network connection. Check your connection and retry."
            : message === "file_too_large"
              ? isAr
                ? "الملف كبير جداً بعد الضغط."
                : "The file is still too large after compression."
              : isAr
                ? "تعذر رفع الصورة. حاول مرة أخرى."
                : "The image could not be uploaded. Please retry.";
        setErrors((current) => [...current, friendly]);
      } finally {
        setBusy(false);
        setProgress(0);
        if (inputRef.current) inputRef.current.value = "";
      }
    },
    [commitGallery, isAr, maxFiles, meta, value.gallery],
  );

  const onPick = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    if (files.length) void acceptFiles(files);
  };

  const onDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragActive(false);
    const files = Array.from(event.dataTransfer.files ?? []);
    if (files.length) void acceptFiles(files);
  };

  const previewTitle = isAr ? titleAr || titleEn : titleEn || titleAr;

  return (
    <div className="space-y-3">
      <div
        role="group"
        aria-label={isAr ? "صور المشروع" : "Project images"}
        onDragEnter={(event) => {
          event.preventDefault();
          setDragActive(true);
        }}
        onDragOver={(event) => {
          event.preventDefault();
          setDragActive(true);
        }}
        onDragLeave={(event) => {
          if (event.currentTarget.contains(event.relatedTarget as Node)) return;
          setDragActive(false);
        }}
        onDrop={onDrop}
        className={cn(
          "rounded-[16px] border border-dashed p-4 transition-colors",
          dragActive
            ? "border-gold/70 bg-gold/[0.08]"
            : "border-white/15 bg-white/[0.02]",
        )}
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <span className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-[14px] border border-gold/25 bg-gold/10 text-gold">
            <UploadCloud className="h-5 w-5" strokeWidth={1.7} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[0.85rem] font-semibold text-ivory/85">
              {isAr ? "اسحب الصور هنا أو اختر من جهازك" : "Drag images here or choose from your device"}
            </p>
            <p className="mt-1 text-[0.72rem] leading-relaxed text-ivory/45">
              {isAr
                ? "ضغط تلقائي إلى WebP بعرض 1600 بكسل، مع صورة مصغرة 400 بكسل وبلور. الحد الأقصى 10 ميجابايت للصورة."
                : "Automatic WebP compression at 1600px, plus a 400px thumbnail and blur placeholder. Max 10 MB per photo."}
            </p>
          </div>
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={busy || value.gallery.length >= maxFiles}
            className="admin-focus-ring inline-flex min-h-[44px] shrink-0 items-center justify-center gap-2 rounded-[12px] border border-gold/35 bg-gold/10 px-4 text-[0.78rem] font-semibold text-gold transition-colors hover:bg-gold/15 disabled:cursor-not-allowed disabled:opacity-45"
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImagePlus className="h-4 w-4" />}
            {busy ? (isAr ? "جارٍ الرفع…" : "Uploading…") : isAr ? "اختيار صور" : "Choose images"}
          </button>
          <input
            ref={inputRef}
            type="file"
            accept={ACCEPTED.join(",")}
            multiple
            className="sr-only"
            onChange={onPick}
            tabIndex={-1}
          />
        </div>

        {busy ? (
          <div className="mt-4" role="status" aria-live="polite">
            <div className="flex items-center justify-between text-[0.72rem] text-ivory/55">
              <span>{isAr ? "ضغط ورفع الصور" : "Compressing and uploading"}</span>
              <span className="tabular-nums">{progress}%</span>
            </div>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10">
              <span
                className="block h-full rounded-full bg-[linear-gradient(270deg,#F3C86A,#C98F1E)] transition-[width] duration-200"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        ) : null}
      </div>

      {errors.length ? (
        <div
          role="alert"
          className="flex gap-2 rounded-[12px] border border-red-400/25 bg-red-400/[0.08] px-3 py-2.5 text-[0.74rem] leading-relaxed text-red-200"
        >
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <ul className="list-none space-y-1 p-0">
            {errors.map((error) => (
              <li key={error}>{error}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {value.gallery.length ? (
        <ul className="grid list-none grid-cols-2 gap-2 p-0 sm:grid-cols-4">
          {value.gallery.map((url, index) => (
            <li
              key={`${url}-${index}`}
              draggable
              onDragStart={() => {
                dragIndex.current = index;
              }}
              onDragOver={(event) => event.preventDefault()}
              onDrop={(event) => {
                event.preventDefault();
                const from = dragIndex.current;
                dragIndex.current = null;
                if (from === null) return;
                commitGallery(moveItem(value.gallery, from, index));
              }}
              onDragEnd={() => {
                dragIndex.current = null;
              }}
              className="group relative overflow-hidden rounded-[12px] border border-white/12 bg-[#12141B]"
            >
              <ProjectImage
                project={{
                  title: previewTitle,
                  category,
                  art,
                  coverUrl: url,
                  ...(index === 0 && meta[url]?.thumbUrl
                    ? { thumbUrl: meta[url]?.thumbUrl }
                    : {}),
                  ...(index === 0 && meta[url]?.blurDataURL
                    ? { blurDataURL: meta[url]?.blurDataURL }
                    : {}),
                }}
                variant="thumb"
                sizes="(max-width: 640px) 45vw, 180px"
                className="aspect-[16/10] w-full"
                alt={
                  isAr
                    ? `صورة المشروع ${index + 1}`
                    : `Project image ${index + 1}`
                }
              />
              <span className="absolute start-2 top-2 inline-flex items-center gap-1 rounded-full bg-obsidian/80 px-2 py-0.5 text-[0.58rem] font-semibold text-ivory/80 backdrop-blur">
                <GripVertical className="h-3 w-3" />
                {index === 0 ? (isAr ? "الغلاف" : "Cover") : index + 1}
              </span>
              <span className="absolute inset-x-1 bottom-1 flex items-center justify-center gap-1 rounded-[8px] bg-obsidian/80 p-1 opacity-0 backdrop-blur transition-opacity group-focus-within:opacity-100 group-hover:opacity-100">
                <button
                  type="button"
                  onClick={() => commitGallery(moveItem(value.gallery, index, index - 1))}
                  disabled={index === 0}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-[6px] text-ivory/70 hover:bg-white/10 hover:text-ivory disabled:opacity-30"
                  aria-label={isAr ? "تحريك لليسار" : "Move earlier"}
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => commitGallery(moveItem(value.gallery, index, index + 1))}
                  disabled={index === value.gallery.length - 1}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-[6px] text-ivory/70 hover:bg-white/10 hover:text-ivory disabled:opacity-30"
                  aria-label={isAr ? "تحريك لليمين" : "Move later"}
                >
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => commitGallery(value.gallery.filter((item) => item !== url))}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-[6px] text-[#FF9A8F] hover:bg-red-400/10"
                  aria-label={isAr ? "إزالة الصورة" : "Remove image"}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </span>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

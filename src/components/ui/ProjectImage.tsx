"use client";

import Image from "next/image";
import { useI18n } from "@/components/providers/I18nProvider";
import { BrandLogo } from "@/components/ui/BrandLogo";
import type { ArtVariant, ProjectCategory } from "@/data/projects";
import type { Localized } from "@/lib/dictionary";
import { isAllowedMediaSource } from "@/lib/cms";
import { cn } from "@/lib/utils";

type ProjectImageProject = {
  title?: Localized | string;
  category?: ProjectCategory | string;
  art?: ArtVariant;
  coverUrl?: string;
  thumbUrl?: string;
  blurDataURL?: string;
};

type ProjectImageProps = {
  project: ProjectImageProject;
  /** Responsive `sizes` passed to the Next.js image optimiser. */
  sizes?: string;
  /** Wrapper shape, radius, and aspect ratio. Must include relative sizing. */
  className?: string;
  /** Cover for cards/drawers, thumb for dense table rows. */
  variant?: "cover" | "thumb";
  priority?: boolean;
  alt?: string;
  imageClassName?: string;
};

const categoryTones: Record<
  string,
  { from: string; via: string; to: string; glow: string; text: string }
> = {
  infrastructure: {
    from: "#173B5C",
    via: "#10263D",
    to: "#0A1522",
    glow: "rgba(107,182,255,0.28)",
    text: "#DCEEFF",
  },
  residential: {
    from: "#173F2D",
    via: "#10291E",
    to: "#091710",
    glow: "rgba(76,203,150,0.26)",
    text: "#D9F7E9",
  },
  commercial: {
    from: "#4A3510",
    via: "#2B1F0A",
    to: "#171106",
    glow: "rgba(226,176,74,0.3)",
    text: "#FFF0C7",
  },
  industrial: {
    from: "#4A261A",
    via: "#2C160F",
    to: "#180C08",
    glow: "rgba(217,120,11,0.3)",
    text: "#FFE2CC",
  },
  hospitality: {
    from: "#38204A",
    via: "#21132C",
    to: "#120A18",
    glow: "rgba(176,124,255,0.28)",
    text: "#EEDCFF",
  },
};

function toneFor(project: ProjectImageProject) {
  if (project.category === "hospitality") return categoryTones.hospitality;
  if (project.category && categoryTones[project.category]) return categoryTones[project.category];
  if (project.art === "heritage") return categoryTones.hospitality;
  return categoryTones.commercial;
}

function plainTitle(value: ProjectImageProject["title"], locale: "ar" | "en") {
  if (!value) return "";
  if (typeof value === "string") return value;
  return value[locale] || value.en || value.ar || "";
}

function initialsFor(value: string) {
  const words = value
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .split(/\s+/)
    .filter(Boolean);
  if (!words.length) return "AA";
  return words
    .slice(0, 2)
    .map((word) => Array.from(word)[0] ?? "")
    .join("")
    .toUpperCase();
}

/**
 * The only project-image renderer used by the admin shell.
 *
 * Real photography uses `next/image` + `fill`, so the parent always owns the
 * aspect ratio and there is no layout shift. Projects without an uploaded
 * cover never fall back to a dash: they get a category-coloured branded panel
 * with the monogram watermark and the project initials.
 */
export function ProjectImage({
  project,
  sizes = "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw",
  className,
  variant = "cover",
  priority = false,
  alt,
  imageClassName,
}: ProjectImageProps) {
  const { locale } = useI18n();
  const source =
    variant === "thumb"
      ? project.thumbUrl || project.coverUrl
      : project.coverUrl || project.thumbUrl;
  const src = source && isAllowedMediaSource(source) ? source : "";
  const title = plainTitle(project.title, locale);
  const tone = toneFor(project);
  const initials = initialsFor(title);

  return (
    <span className={cn("relative block overflow-hidden bg-[#171A22]", className)}>
      {src ? (
        <Image
          src={src}
          alt={alt ?? title}
          fill
          sizes={sizes}
          placeholder={project.blurDataURL ? "blur" : "empty"}
          blurDataURL={project.blurDataURL}
          priority={priority}
          loading={priority ? undefined : "lazy"}
          className={cn("object-cover", imageClassName)}
        />
      ) : (
        <span
          aria-hidden="true"
          className="absolute inset-0 flex flex-col items-center justify-center gap-2 overflow-hidden"
          style={{
            background: `radial-gradient(120% 100% at 82% 12%, ${tone.glow}, transparent 58%), linear-gradient(145deg, ${tone.from} 0%, ${tone.via} 48%, ${tone.to} 100%)`,
          }}
        >
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 opacity-10"
          >
            <BrandLogo
              variant="mark"
              tone="light"
              className="h-full min-h-0 w-full justify-center [&_img]:h-[62%] [&_img]:w-auto [&_img]:max-w-[58%]"
            />
          </span>
          <span
            className="relative select-none font-display text-[1.35rem] font-semibold leading-none tracking-[0.08em] sm:text-[1.65rem]"
            style={{ color: tone.text }}
          >
            {initials}
          </span>
          <span
            className="relative max-w-[82%] truncate text-[0.6rem] font-medium uppercase tracking-[0.12em]"
            style={{ color: `${tone.text}B8` }}
            dir={locale === "ar" ? "rtl" : "ltr"}
          >
            {title || (locale === "ar" ? "مشروع" : "Project")}
          </span>
        </span>
      )}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 ring-1 ring-inset ring-white/[0.08]"
      />
    </span>
  );
}

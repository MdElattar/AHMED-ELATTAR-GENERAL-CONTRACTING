"use client";

import Image from "next/image";
import type { ArtVariant } from "@/data/projects";
import { projectPhotos } from "@/data/media";
import { cn } from "@/lib/utils";

type ProjectArtProps = {
  variant: ArtVariant;
  className?: string;
  label?: string;
  priority?: boolean;
};

/**
 * Photographic project artwork.
 *
 * Replaces the earlier vector wireframes with real construction photography
 * served through the Next.js optimiser. The wrapper always paints a charcoal
 * surface first, so a slow connection never exposes an empty card.
 */
export function ProjectArt({ variant, className, label, priority = false }: ProjectArtProps) {
  const photo = projectPhotos[variant] ?? projectPhotos.tower;

  return (
    <div className={cn("relative h-full w-full overflow-hidden bg-coal", className)}>
      <Image
        src={photo.src}
        alt={label ?? photo.alt}
        fill
        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
        preload={priority ? true : undefined}
        loading={priority ? undefined : "lazy"}
        className="project-art object-cover"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-gradient-to-t from-obsidian/50 via-obsidian/5 to-transparent"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 ring-1 ring-inset ring-white/[0.06]"
      />
    </div>
  );
}

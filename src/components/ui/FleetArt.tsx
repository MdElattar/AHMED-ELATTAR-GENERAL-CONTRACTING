"use client";

import Image from "next/image";
import type { FleetArtVariant } from "@/data/fleet";
import { fleetPhotos } from "@/data/media";
import { useI18n } from "@/components/providers/I18nProvider";
import { useWorkspace } from "@/components/providers/WorkspaceProvider";
import { resolveMedia } from "@/lib/cms";
import { cn } from "@/lib/utils";

export function FleetArt({
  variant,
  className,
  label,
}: {
  variant: FleetArtVariant;
  className?: string;
  label?: string;
}) {
  const { locale } = useI18n();
  const { content } = useWorkspace();
  const fallback = fleetPhotos[variant] ?? fleetPhotos["tower-crane"];
  const photo = resolveMedia(content.mediaOverrides, `fleet.${variant}`, fallback, locale);

  return (
    <div className={cn("relative h-full w-full overflow-hidden bg-coal", className)}>
      <Image
        src={photo.src}
        alt={label ?? photo.alt}
        fill
        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
        loading="lazy"
        className="object-cover photo-grade transition-transform duration-[1200ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.04]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-gradient-to-t from-obsidian/55 via-obsidian/10 to-transparent"
      />
    </div>
  );
}

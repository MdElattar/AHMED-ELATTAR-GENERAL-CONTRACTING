"use client";

import Image from "next/image";
import type { MediaAsset } from "@/data/media";
import { cn } from "@/lib/utils";

type PhotoLayerProps = {
  images: MediaAsset[];
  active?: number;
  className?: string;
  imageClassName?: string;
  sizes?: string;
  preloadFirst?: boolean;
  overlay?: "full" | "soft" | "none";
};

/**
 * Crossfading photographic backdrop.
 *
 * Every frame is stacked and only opacity is animated, so switching steps never
 * remounts an <Image>, never re-requests a decoded bitmap, and never touches
 * React state. A gradient scrim is always painted on top, which means a slow
 * network still leaves a deliberate charcoal/gold surface instead of a hole.
 */
export function PhotoLayer({
  images,
  active = 0,
  className,
  imageClassName,
  sizes = "100vw",
  preloadFirst = false,
  overlay = "full",
}: PhotoLayerProps) {
  const current = Math.max(0, Math.min(images.length - 1, active));

  return (
    <div
      className={cn("pointer-events-none absolute inset-0 overflow-hidden bg-obsidian", className)}
      aria-hidden="true"
    >
      {images.map((image, index) => (
        <div
          key={image.src}
          className={cn(
            "absolute inset-0 transition-opacity duration-[1400ms] ease-[cubic-bezier(0.16,1,0.3,1)]",
            index === current ? "opacity-100" : "opacity-0",
          )}
        >
          <Image
            src={image.src}
            alt=""
            fill
            sizes={sizes}
            preload={preloadFirst && index === 0 ? true : undefined}
            loading={preloadFirst && index === 0 ? undefined : "lazy"}
            className={cn("object-cover photo-grade", imageClassName)}
          />
        </div>
      ))}

      {overlay !== "none" ? (
        <>
          <div
            className={cn(
              "absolute inset-0",
              overlay === "full" ? "photo-scrim" : "bg-gradient-to-b from-obsidian/80 via-obsidian/20 to-obsidian/90",
            )}
          />
          <div className="photo-warmth absolute inset-0" />
        </>
      ) : null}
    </div>
  );
}

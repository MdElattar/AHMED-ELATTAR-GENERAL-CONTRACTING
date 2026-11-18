import type { MetadataRoute } from "next";
import { BRAND } from "@/lib/brand";

/** Installable, offline-capable executive portfolio manifest. */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${BRAND.nameAr} | ${BRAND.nameEn}`,
    short_name: `${BRAND.shortAr} · ${BRAND.shortEn}`,
    description: `${BRAND.descriptionAr} ${BRAND.descriptionEn}`,
    id: "/",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "any",
    background_color: BRAND.backgroundColor,
    theme_color: BRAND.themeColor,
    categories: ["business", "productivity"],
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}

import type { FleetArtVariant } from "@/data/fleet";
import type { ArtVariant } from "@/data/projects";

export type MediaAsset = {
  /** Optimiser-ready source URL. */
  src: string;
  /** Human description used for accessible, non-decorative imagery. */
  alt: string;
};

const unsplash = (id: string, width = 2400) =>
  `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${width}&q=80`;

/**
 * Central photography registry.
 *
 * Every image is a remote Unsplash asset served through the Next.js image
 * optimiser (`/_next/image`). That keeps the browser request same-origin, so
 * the strict `img-src 'self'` CSP remains intact while the optimiser negotiates
 * AVIF/WebP and the correct width for the viewport.
 *
 * The palette is intentionally warm: golden-hour construction sites, bronze
 * structural steel, and architectural glass. Each consumer still paints a
 * gradient scrim behind the photo, so a slow/failed network never leaves a
 * blank panel.
 */
export const heroPhoto: MediaAsset = {
  src: unsplash("1541888946425-d81bb19240f5"),
  alt: "Tower cranes rising over a major construction site at golden hour",
};

export const cranePhotos: MediaAsset[] = [
  {
    src: unsplash("1504307651254-35680f356dfd"),
    alt: "Site engineers coordinating a precision lift",
  },
  {
    src: unsplash("1508450859948-4e04fabaa4ea"),
    alt: "Heavy lifting equipment operating on a live site",
  },
  {
    src: unsplash("1517089596392-fb9a9033e05b"),
    alt: "Tower crane silhouetted against a warm evening sky",
  },
  {
    src: unsplash("1531834685032-c34bf0d84c77"),
    alt: "Structural steel assembly in progress",
  },
  {
    src: unsplash("1486406146926-c627a92ad1ab"),
    alt: "Completed high-rise tower against the sky",
  },
];

export const craftsmanshipPhotos: MediaAsset[] = [
  {
    src: unsplash("1523413651479-597eb2da0ad6"),
    alt: "Foundation and groundworks on a construction site",
  },
  {
    src: unsplash("1590496793929-36417d3117de"),
    alt: "Reinforcement steel and formwork prepared for a concrete pour",
  },
  {
    src: unsplash("1517581177682-a085bb7ffb15"),
    alt: "Concrete structural frame under construction",
  },
  {
    src: unsplash("1511818966892-d7d671e672a2"),
    alt: "Architectural envelope and glazing detail",
  },
  {
    src: unsplash("1512917774080-9991f1c4c750"),
    alt: "Completed contemporary residence at dusk",
  },
];

export const fleetPhotos: Record<FleetArtVariant, MediaAsset> = {
  "tower-crane": {
    src: unsplash("1508450859948-4e04fabaa4ea"),
    alt: "Tower crane on a high-rise construction site",
  },
  crawler: {
    src: unsplash("1541888946425-d81bb19240f5"),
    alt: "Crawler crane working alongside a structural frame",
  },
  excavator: {
    src: unsplash("1531834685032-c34bf0d84c77"),
    alt: "Heavy earthmoving equipment on site",
  },
  mobile: {
    src: unsplash("1517089596392-fb9a9033e05b"),
    alt: "Mobile lifting equipment at sunset",
  },
  piling: {
    src: unsplash("1599707254554-027aeb4deacd"),
    alt: "Piling and deep-foundation equipment",
  },
  hauler: {
    src: unsplash("1504307651254-35680f356dfd"),
    alt: "Site haulage and logistics operations",
  },
};

export const projectPhotos: Record<ArtVariant, MediaAsset> = {
  tower: {
    src: unsplash("1486406146926-c627a92ad1ab"),
    alt: "Contemporary high-rise tower",
  },
  villa: {
    src: unsplash("1512917774080-9991f1c4c750"),
    alt: "Contemporary private residence",
  },
  bridge: {
    src: unsplash("1473625247510-8ceb1760943f"),
    alt: "Long-span bridge infrastructure",
  },
  industrial: {
    src: unsplash("1581094794329-c8112a89af12"),
    alt: "Industrial engineering and process facility",
  },
  heritage: {
    src: unsplash("1511818966892-d7d671e672a2"),
    alt: "Heritage-inspired architectural facade",
  },
  interchange: {
    src: unsplash("1477959858617-67f85cf4f1df"),
    alt: "Urban transport interchange and city skyline",
  },
  marina: {
    src: unsplash("1519501025264-65ba15a82390"),
    alt: "Waterfront marina and mixed-use development",
  },
  solar: {
    src: unsplash("1509391366360-2e959784a276"),
    alt: "Utility-scale solar energy installation",
  },
};

export const liveSitePhotos: Record<"riyadh" | "cairo" | "mansoura", MediaAsset> = {
  riyadh: {
    src: unsplash("1486406146926-c627a92ad1ab"),
    alt: "Aurora Tower rising over Riyadh",
  },
  cairo: {
    src: unsplash("1518005020951-eccb494ad742"),
    alt: "Nile Crest mixed-use development in Cairo",
  },
  mansoura: {
    src: unsplash("1541888946425-d81bb19240f5"),
    alt: "Delta Logistics Hub under construction in Mansoura",
  },
};

export const liveSiteGalleryPhotos: Record<
  "riyadh" | "cairo" | "mansoura",
  [MediaAsset, MediaAsset]
> = {
  riyadh: [
    liveSitePhotos.riyadh,
    {
      src: unsplash("1511818966892-d7d671e672a2"),
      alt: "Aurora Tower façade detail",
    },
  ],
  cairo: [
    liveSitePhotos.cairo,
    {
      src: unsplash("1503387762-592deb58ef4e"),
      alt: "Nile Crest architectural detail",
    },
  ],
  mansoura: [
    liveSitePhotos.mansoura,
    {
      src: unsplash("1531834685032-c34bf0d84c77"),
      alt: "Delta Logistics Hub structural works",
    },
  ],
};

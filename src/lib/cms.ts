import {
  dictionary,
  type Dictionary,
  type Locale,
  type Localized,
} from "@/lib/dictionary";
import {
  craftsmanshipPhotos,
  cranePhotos,
  fleetPhotos,
  heroPhoto,
  liveSiteGalleryPhotos,
  liveSitePhotos,
  projectPhotos,
  type MediaAsset,
} from "@/data/media";
import type { ArtVariant } from "@/data/projects";
import type { FleetArtVariant } from "@/data/fleet";

/**
 * The CMS stores copy and media overrides as a flat map. A path such as
 * `hero.titleTop` addresses the matching leaf in the bilingual dictionary,
 * while `project.tower` addresses the shared photography registry. Keeping the
 * persisted payload flat makes every individual string independently editable
 * without rewriting whole sections.
 */
export type MediaOverride = {
  src: string;
  alt: Localized;
};

export type CopyField = {
  path: string;
  group: string;
  kind: "string" | "number";
  ar: string;
  en: string;
};

export type MediaCatalogEntry = {
  key: string;
  group: string;
  label: Localized;
  fallback: MediaAsset;
};

export const copyGroupLabels: Record<string, Localized> = {
  meta: { ar: "بيانات الصفحة", en: "Page metadata" },
  nav: { ar: "التنقل", en: "Navigation" },
  common: { ar: "العناصر المشتركة", en: "Shared labels" },
  hero: { ar: "الواجهة الرئيسية", en: "Homepage hero" },
  manifesto: { ar: "الفلسفة", en: "Manifesto" },
  stats: { ar: "الأرقام", en: "Statistics" },
  featured: { ar: "المشاريع المختارة", en: "Featured projects" },
  crane: { ar: "الرافعة", en: "Crane experience" },
  fleet: { ar: "الأسطول", en: "Fleet" },
  process: { ar: "المنهجية", en: "Process" },
  testimonials: { ar: "الشهادات", en: "Testimonials" },
  clients: { ar: "العملاء", en: "Clients" },
  cta: { ar: "الدعوة لاتخاذ إجراء", en: "Call to action" },
  footer: { ar: "التذييل", en: "Footer" },
  projectsPage: { ar: "صفحة المشاريع", en: "Projects page" },
  projectDetail: { ar: "تفاصيل المشروع", en: "Project detail" },
  servicesPage: { ar: "صفحة الخدمات", en: "Services page" },
  aboutPage: { ar: "صفحة من نحن", en: "About page" },
  contactPage: { ar: "صفحة التواصل", en: "Contact page" },
  auth: { ar: "المصادقة", en: "Authentication" },
  portal: { ar: "بوابة العملاء", en: "Client portal" },
  notFound: { ar: "صفحة غير موجودة", en: "Not found" },
  errors: { ar: "رسائل الأخطاء", en: "Error messages" },
  sections: { ar: "نسخ الأقسام", en: "Section copy" },
  "sections.certifications": { ar: "الشهادات", en: "Certifications" },
  "sections.craftsmanship": { ar: "حرفية التنفيذ", en: "Craftsmanship" },
  "sections.estimator": { ar: "حاسبة التكلفة", en: "Cost estimator" },
  "sections.fleet": { ar: "الأسطول", en: "Fleet" },
  "sections.liveSites": { ar: "المواقع الحية", en: "Live sites" },
  "sections.regionalMap": { ar: "الحضور الإقليمي", en: "Regional map" },
  "sections.servicesGrid": { ar: "شبكة الخدمات", en: "Services grid" },
  "sections.projectCost": { ar: "هندسة التكلفة", en: "Project cost" },
  "sections.projectCinema": { ar: "سينما المشروع", en: "Project cinema" },
  "sections.consultation": { ar: "الاستشارة التنفيذية", en: "Consultation" },
  "sections.proposal": { ar: "عرض PDF", en: "PDF proposal" },
  "sections.legal": { ar: "الخصوصية والشروط", en: "Legal pages" },
  "sections.smartConsultant": { ar: "المستشار الذكي", en: "Smart consultant" },
  "sections.inline": { ar: "عناوين مضمّنة", en: "Inline labels" },
  "sections.manifestoPillars": { ar: "ركائز الفلسفة", en: "Manifesto pillars" },
  "sections.servicesApproach": { ar: "منهجية الخدمات", en: "Services approach" },
  "sections.footerExpertise": { ar: "خبرات التذييل", en: "Footer expertise" },
};

const FORBIDDEN_SEGMENTS = new Set(["__proto__", "prototype", "constructor"]);

export function isCmsPath(value: string): boolean {
  if (!value || value.length > 180) return false;
  return value
    .split(".")
    .every(
      (segment) =>
        segment.length > 0 &&
        segment.length <= 80 &&
        !FORBIDDEN_SEGMENTS.has(segment) &&
        /^[a-zA-Z0-9_-]+$/.test(segment),
    );
}

const MEDIA_EXTENSIONS = new Set([
  "avif",
  "gif",
  "jpeg",
  "jpg",
  "png",
  "svg",
  "webp",
]);

/**
 * Validate a CMS media link before it reaches next/image. Relative paths must
 * stay on this origin, and remote assets must use HTTPS with a recognised image
 * extension when one is present.
 */
export function isAllowedMediaSource(value: string): boolean {
  const source = value.trim();
  if (!source || source.length > 2000) return false;
  if (/[\u0000-\u001f\\]/.test(source) || source.includes("..")) return false;

  if (source.startsWith("/") && !source.startsWith("//")) return true;

  try {
    const url = new URL(source);
    if (url.protocol !== "https:" || url.username || url.password) return false;
    if (url.pathname.includes("..")) return false;

    const fileName = url.pathname.split("/").pop() ?? "";
    const extension = fileName.includes(".")
      ? fileName.split(".").pop()?.toLowerCase()
      : "";
    if (extension && !MEDIA_EXTENSIONS.has(extension)) return false;

    return true;
  } catch {
    return false;
  }
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * Walk the canonical dictionary and return every editable string/number leaf.
 * Arrays are addressed by numeric segments (`hero.stats.0.label`) so the
 * administrator can edit every repeated item as well as every heading.
 */
export function flattenCopy(base: Dictionary = dictionary.ar): CopyField[] {
  const fields: CopyField[] = [];

  const visit = (node: unknown, path: string[], group: string) => {
    if (typeof node === "string" || typeof node === "number") {
      const key = path.join(".");
      if (!isCmsPath(key)) return;
      const counterpart = getAtPath(dictionary.en, path);
      fields.push({
        path: key,
        group,
        kind: typeof node === "number" ? "number" : "string",
        ar: typeof node === "number" ? String(node) : node,
        en:
          typeof counterpart === "number"
            ? String(counterpart)
            : typeof counterpart === "string"
              ? counterpart
              : String(node),
      });
      return;
    }

    if (Array.isArray(node)) {
      node.forEach((item, index) => visit(item, [...path, String(index)], group));
      return;
    }

    if (isRecord(node)) {
      for (const [key, value] of Object.entries(node)) {
        // Keep the hand-authored section copy grouped by component rather than
        // collapsing its hundreds of fields into one giant `sections` bucket.
        const childGroup =
          path.length === 0
            ? key
            : group === "sections" && path.length === 1
              ? `sections.${key}`
              : group;
        visit(value, [...path, key], childGroup);
      }
    }
  };

  visit(base, [], "meta");
  return fields;
}

function getAtPath(root: unknown, path: string[]): unknown {
  let cursor: unknown = root;
  for (const segment of path) {
    if (Array.isArray(cursor)) {
      const index = Number(segment);
      if (!Number.isInteger(index) || index < 0 || index >= cursor.length) return undefined;
      cursor = cursor[index];
    } else if (isRecord(cursor)) {
      if (!(segment in cursor)) return undefined;
      cursor = cursor[segment];
    } else {
      return undefined;
    }
  }
  return cursor;
}

function setAtPath(root: unknown, path: string[], value: string | number): void {
  let cursor: unknown = root;
  for (let index = 0; index < path.length - 1; index += 1) {
    const segment = path[index];
    if (Array.isArray(cursor)) {
      const arrayIndex = Number(segment);
      if (!Number.isInteger(arrayIndex) || arrayIndex < 0 || arrayIndex >= cursor.length) {
        return;
      }
      cursor = cursor[arrayIndex];
    } else if (isRecord(cursor)) {
      if (!(segment in cursor)) return;
      cursor = cursor[segment];
    } else {
      return;
    }
  }

  const last = path[path.length - 1];
  if (Array.isArray(cursor)) {
    const arrayIndex = Number(last);
    if (Number.isInteger(arrayIndex) && arrayIndex >= 0 && arrayIndex < cursor.length) {
      cursor[arrayIndex] = value;
    }
    return;
  }

  if (isRecord(cursor) && last in cursor) {
    const current = cursor[last];
    if (typeof current === "string") cursor[last] = value;
    if (typeof current === "number" && typeof value === "number") cursor[last] = value;
  }
}

/**
 * Return a locale-specific dictionary with every non-empty CMS override
 * applied. Invalid or stale paths are ignored instead of mutating the source.
 */
export function applyCopyOverrides(
  base: Dictionary,
  overrides: Record<string, Localized>,
  locale: Locale,
): Dictionary {
  const entries = Object.entries(overrides);
  if (entries.length === 0) return base;

  const merged = clone(base);
  for (const [path, localized] of entries) {
    if (!isCmsPath(path) || !localized) continue;
    const value = localized[locale];
    if (typeof value !== "string" || value.length === 0) continue;

    const segments = path.split(".");
    const original = getAtPath(merged, segments);
    if (typeof original === "string") {
      setAtPath(merged, segments, value.slice(0, 8000));
    } else if (typeof original === "number") {
      const parsed = Number(value);
      if (Number.isFinite(parsed)) setAtPath(merged, segments, parsed);
    }
  }

  return merged;
}

const catalog = (
  key: string,
  group: string,
  labelAr: string,
  labelEn: string,
  fallback: MediaAsset,
): MediaCatalogEntry => ({
  key,
  group,
  label: { ar: labelAr, en: labelEn },
  fallback,
});

/**
 * Every photographic slot used by the public site. The order mirrors the
 * visitor's journey: hero, site craft, fleet, portfolio, live cities.
 */
export const mediaCatalog: MediaCatalogEntry[] = [
  catalog("hero", "hero", "صورة الواجهة الرئيسية", "Homepage hero photograph", heroPhoto),
  ...cranePhotos.map((photo, index) =>
    catalog(
      `crane.${index}`,
      "crane",
      `الرافعة — لقطة ${index + 1}`,
      `Crane — frame ${index + 1}`,
      photo,
    ),
  ),
  ...craftsmanshipPhotos.map((photo, index) =>
    catalog(
      `craftsmanship.${index}`,
      "craftsmanship",
      `الحرفية — مرحلة ${index + 1}`,
      `Craftsmanship — phase ${index + 1}`,
      photo,
    ),
  ),
  ...(Object.keys(fleetPhotos) as FleetArtVariant[]).map((variant) =>
    catalog(
      `fleet.${variant}`,
      "fleet",
      `الأسطول — ${variant}`,
      `Fleet — ${variant}`,
      fleetPhotos[variant],
    ),
  ),
  ...(Object.keys(projectPhotos) as ArtVariant[]).map((variant) =>
    catalog(
      `project.${variant}`,
      "project",
      `المشاريع — ${variant}`,
      `Projects — ${variant}`,
      projectPhotos[variant],
    ),
  ),
  ...(Object.keys(liveSitePhotos) as Array<keyof typeof liveSitePhotos>).map((slug) =>
    catalog(
      `liveSite.${slug}`,
      "liveSite",
      `الموقع الحي — ${slug}`,
      `Live site — ${slug}`,
      liveSitePhotos[slug],
    ),
  ),
  ...(Object.keys(liveSiteGalleryPhotos) as Array<keyof typeof liveSiteGalleryPhotos>).flatMap(
    (slug) =>
      liveSiteGalleryPhotos[slug].map((photo, index) =>
        catalog(
          `liveSiteGallery.${slug}.${index}`,
          "liveSiteGallery",
          `معرض الموقع الحي — ${slug} ${index + 1}`,
          `Live site gallery — ${slug} ${index + 1}`,
          photo,
        ),
      ),
  ),
];

export const mediaGroupLabels: Record<string, Localized> = {
  hero: { ar: "الواجهة", en: "Hero" },
  crane: { ar: "الرافعة", en: "Crane" },
  craftsmanship: { ar: "الحرفية", en: "Craftsmanship" },
  fleet: { ar: "الأسطول", en: "Fleet" },
  project: { ar: "المشاريع", en: "Projects" },
  liveSite: { ar: "المواقع الحية", en: "Live sites" },
  liveSiteGallery: { ar: "معارض المواقع", en: "Live site galleries" },
};

/**
 * Resolve a registry slot against the persisted overrides. Empty values are
 * treated as "inherit the factory asset", which keeps the public site intact
 * if an administrator clears a field.
 */
export function resolveMedia(
  overrides: Record<string, MediaOverride>,
  key: string,
  fallback: MediaAsset,
  locale: Locale,
): MediaAsset {
  const override = overrides[key];
  const src =
    override && isAllowedMediaSource(override.src) ? override.src : fallback.src;
  const alt =
    override && override.alt && typeof override.alt[locale] === "string"
      ? override.alt[locale].trim() || fallback.alt
      : fallback.alt;
  return { src, alt };
}

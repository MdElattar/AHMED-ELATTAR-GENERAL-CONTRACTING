import { L, type Localized } from "@/lib/dictionary";
import { projectPhotos, cranePhotos, craftsmanshipPhotos, type MediaAsset } from "@/data/media";

/**
 * Engineering intelligence layer for the portfolio.
 *
 * Keeps the core `projects` registry lean while giving the immersive project
 * modal (and any future surface) real engineering milestones, coordinates and
 * a photo gallery per asset. Milestone status mirrors the project's own
 * lifecycle, so an ongoing project shows its current phase in the rail.
 */

export type ProjectCity = "riyadh" | "jeddah" | "jubail" | "alula" | "neom";

export type ProjectMilestone = {
  title: Localized;
  date: string;
  status: "complete" | "current" | "upcoming";
};

export const cityLabels: Record<ProjectCity, Localized> = {
  riyadh: L("الرياض", "Riyadh"),
  jeddah: L("جدة", "Jeddah"),
  jubail: L("الجبيل", "Jubail"),
  alula: L("العلا", "AlUla"),
  neom: L("نيوم", "NEOM"),
};

export const projectCities: ProjectCity[] = ["riyadh", "jeddah", "jubail", "alula", "neom"];

export const projectCity: Record<string, ProjectCity> = {
  "aurora-tower": "riyadh",
  "palm-oasis": "jeddah",
  "wadi-crossing": "riyadh",
  "advanced-industries": "jubail",
  "al-hijr-hotel": "alula",
  "riyadh-central-interchange": "riyadh",
  "marina-quarter": "jeddah",
  "solar-energy-park": "neom",
};

export const projectCoordinates: Record<string, string> = {
  "aurora-tower": "24.7136° N · 46.6753° E",
  "palm-oasis": "21.7172° N · 39.1064° E",
  "wadi-crossing": "24.5247° N · 46.6300° E",
  "advanced-industries": "27.0054° N · 49.6477° E",
  "al-hijr-hotel": "26.7917° N · 37.9525° E",
  "riyadh-central-interchange": "24.7719° N · 46.6187° E",
  "marina-quarter": "21.5439° N · 39.1728° E",
  "solar-energy-park": "28.4187° N · 36.4471° E",
};

export const projectMilestones: Record<string, ProjectMilestone[]> = {
  "aurora-tower": [
    { title: L("التصميم والتصاريح", "Design & permits"), date: "2021", status: "complete" },
    { title: L("الأساسات والجذع", "Foundations & core"), date: "2022", status: "complete" },
    { title: L("الهيكل والواجهات", "Structure & façades"), date: "2023", status: "complete" },
    { title: L("الأنظمة والتشغيل", "Systems & commissioning"), date: "2024", status: "complete" },
    { title: L("التسليم والاختبار", "Handover & testing"), date: "2025", status: "complete" },
  ],
  "palm-oasis": [
    { title: L("التصميم والبنية التحتية", "Design & infrastructure"), date: "2022", status: "complete" },
    { title: L("الفيلات — المرحلة الأولى", "Villas — phase one"), date: "2023", status: "complete" },
    { title: L("المرافق المجتمعية", "Community amenities"), date: "2024", status: "complete" },
    { title: L("الاستدامة والزراعة", "Sustainability & landscaping"), date: "2024", status: "complete" },
    { title: L("التسليم النهائي", "Final handover"), date: "2025", status: "complete" },
  ],
  "wadi-crossing": [
    { title: L("دراسات الهيدرولوجيا", "Hydrology studies"), date: "2021", status: "complete" },
    { title: L("الأكوام والركائز", "Piles & piers"), date: "2022", status: "complete" },
    { title: L("الكمرات والجسور", "Girders & spans"), date: "2023", status: "complete" },
    { title: L("السطح والإنارة", "Deck & lighting"), date: "2024", status: "complete" },
    { title: L("الافتتاح", "Opening"), date: "2025", status: "complete" },
  ],
  "advanced-industries": [
    { title: L("الأعمال الأرضية والأساسات", "Earthworks & foundations"), date: "2025", status: "complete" },
    { title: L("الهياكل الفولاذية — المرحلة الأولى", "Steel structures — phase one"), date: "2025", status: "complete" },
    { title: L("تركيب الوحدة ٧", "Unit 7 installation"), date: "2026", status: "current" },
    { title: L("الأنظمة الميكانيكية", "Mechanical systems"), date: "2027", status: "upcoming" },
    { title: L("التشغيل التجريبي والتسليم", "Commissioning & handover"), date: "2027", status: "upcoming" },
  ],
  "al-hijr-hotel": [
    { title: L("الترميم والحفاظ", "Restoration & conservation"), date: "2025", status: "complete" },
    { title: L("الأعمال الحجرية", "Stonework"), date: "2026", status: "current" },
    { title: L("التشطيبات الداخلية", "Interior finishes"), date: "2027", status: "upcoming" },
    { title: L("تنسيق المواقع", "Landscape"), date: "2027", status: "upcoming" },
    { title: L("التسليم", "Handover"), date: "2027", status: "upcoming" },
  ],
  "riyadh-central-interchange": [
    { title: L("تحويل المرافق", "Utility diversions"), date: "2021", status: "complete" },
    { title: L("الجسور والأنفاق", "Bridges & underpasses"), date: "2022", status: "complete" },
    { title: L("الطبقات الإسفلتية", "Asphalt layers"), date: "2023", status: "complete" },
    { title: L("الأنظمة الذكية للمرور", "Smart traffic systems"), date: "2024", status: "complete" },
    { title: L("الافتتاح", "Opening"), date: "2024", status: "complete" },
  ],
  "marina-quarter": [
    { title: L("دراسة الجدوى", "Feasibility study"), date: "2026", status: "complete" },
    { title: L("التصميم التفصيلي", "Detailed design"), date: "2026", status: "current" },
    { title: L("التمكين والبدء", "Mobilization & start"), date: "2027", status: "upcoming" },
    { title: L("الأعمال البحرية", "Marine works"), date: "2027", status: "upcoming" },
    { title: L("التسليم", "Handover"), date: "2030", status: "upcoming" },
  ],
  "solar-energy-park": [
    { title: L("مسح الموقع والدراسات", "Site survey & studies"), date: "2025", status: "complete" },
    { title: L("الهياكل الحاملة", "Support structures"), date: "2026", status: "current" },
    { title: L("تركيب الألواح والمحولات", "Panels & inverters"), date: "2027", status: "upcoming" },
    { title: L("ربط الشبكة", "Grid connection"), date: "2027", status: "upcoming" },
    { title: L("التشغيل الكامل", "Full operation"), date: "2028", status: "upcoming" },
  ],
};

/**
 * Photo gallery per project: the hero shot from the shared registry plus two
 * supporting frames of live construction craft, all served through the
 * same-origin Next.js image optimiser.
 */
export const projectGallery: Record<string, MediaAsset[]> = {
  "aurora-tower": [projectPhotos.tower, cranePhotos[2], craftsmanshipPhotos[4]],
  "palm-oasis": [projectPhotos.villa, craftsmanshipPhotos[4], craftsmanshipPhotos[3]],
  "wadi-crossing": [projectPhotos.bridge, cranePhotos[3], craftsmanshipPhotos[0]],
  "advanced-industries": [
    projectPhotos.industrial,
    cranePhotos[1],
    craftsmanshipPhotos[2],
  ],
  "al-hijr-hotel": [projectPhotos.heritage, craftsmanshipPhotos[3], craftsmanshipPhotos[1]],
  "riyadh-central-interchange": [
    projectPhotos.interchange,
    cranePhotos[0],
    craftsmanshipPhotos[2],
  ],
  "marina-quarter": [projectPhotos.marina, craftsmanshipPhotos[4], cranePhotos[4]],
  "solar-energy-park": [projectPhotos.solar, cranePhotos[4], craftsmanshipPhotos[0]],
};

export function getProjectGallery(slug: string, art: keyof typeof projectPhotos): MediaAsset[] {
  return projectGallery[slug] ?? [projectPhotos[art]];
}

export function getProjectMilestones(slug: string): ProjectMilestone[] {
  return projectMilestones[slug] ?? [];
}

export function getProjectCity(slug: string): ProjectCity {
  return projectCity[slug] ?? "riyadh";
}

export function getProjectCoordinates(slug: string): string | null {
  return projectCoordinates[slug] ?? null;
}

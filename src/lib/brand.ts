import { surfaceTokens } from "@/lib/design/tokens";

/** Canonical brand facts shared by metadata, PWA manifest and install UI. */
export const BRAND = {
  nameAr: "شركة أحمد العطار للمقاولات العامة",
  nameEn: "Ahmed Elattar General Contracting Co.",
  shortAr: "العطار",
  shortEn: "Alattar",
  siteUrl: "https://alattar.sa",
  descriptionAr:
    "أربعة عقود من الهندسة الدقيقة والمشاريع الضخمة في المملكة العربية السعودية.",
  descriptionEn:
    "Four decades of precise engineering and landmark construction in Saudi Arabia.",
  themeColor: surfaceTokens.bg,
  backgroundColor: surfaceTokens.bg,
} as const;

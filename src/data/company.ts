import { L, type Localized } from "@/lib/dictionary";

export type Certification = {
  code: string;
  title: Localized;
  issuer: Localized;
  year: string;
  note: Localized;
};

export const certifications: Certification[] = [
  {
    code: "ISO 9001",
    title: L("إدارة الجودة", "Quality management"),
    issuer: L("المنظمة الدولية للمعايير", "International Organization for Standardization"),
    year: "2025",
    note: L("تدقيق مستقل سنوي", "Annual independent audit"),
  },
  {
    code: "ISO 45001",
    title: L("الصحة والسلامة المهنية", "Occupational health & safety"),
    issuer: L("المنظمة الدولية للمعايير", "International Organization for Standardization"),
    year: "2025",
    note: L("أربعة ملايين ساعة آمنة", "Four million safe hours"),
  },
  {
    code: "ISO 14001",
    title: L("الإدارة البيئية", "Environmental management"),
    issuer: L("المنظمة الدولية للمعايير", "International Organization for Standardization"),
    year: "2024",
    note: L("خفض البصمة الكربونية ٢٧٪", "27% carbon footprint reduction"),
  },
  {
    code: "LEED",
    title: L("البناء الأخضر", "Green building"),
    issuer: L("مجلس المباني الخضراء الأمريكي", "U.S. Green Building Council"),
    year: "2024",
    note: L("اعتماد ذهبي لـ ٩ مشاريع", "Gold certification across 9 projects"),
  },
  {
    code: "OSHA",
    title: L("معايير السلامة الأمريكية", "U.S. safety standards"),
    issuer: L("إدارة السلامة والصحة المهنية", "Occupational Safety and Health Administration"),
    year: "2025",
    note: L("برنامج امتثال معتمد", "Certified compliance program"),
  },
  {
    code: "Saudi Vision",
    title: L("شريك الرؤية ٢٠٣٠", "Vision 2030 partner"),
    issuer: L("برنامج شريك الرؤية", "Vision Partner Program"),
    year: "2025",
    note: L("مشاريع استراتيجية كبرى", "Major strategic projects"),
  },
];

export type RegionMarker = {
  id: string;
  city: Localized;
  country: Localized;
  x: number;
  y: number;
  projects: number;
  value: string;
  flagship: Localized;
  status: "delivered" | "active" | "upcoming";
};

export const regionMarkers: RegionMarker[] = [
  {
    id: "riyadh",
    city: L("الرياض", "Riyadh"),
    country: L("السعودية", "Saudi Arabia"),
    x: 548,
    y: 328,
    projects: 86,
    value: "SAR 1.8B",
    flagship: L("برج أورورا · مركز المدينة", "Aurora Tower · Downtown"),
    status: "active",
  },
  {
    id: "jeddah",
    city: L("جدة", "Jeddah"),
    country: L("السعودية", "Saudi Arabia"),
    x: 430,
    y: 398,
    projects: 42,
    value: "SAR 720M",
    flagship: L("واجهة المرسى · البحر الأحمر", "Marina Quarter · Red Sea"),
    status: "active",
  },
  {
    id: "alula",
    city: L("العلا", "AlUla"),
    country: L("السعودية", "Saudi Arabia"),
    x: 438,
    y: 286,
    projects: 14,
    value: "SAR 650M",
    flagship: L("فندق الحِجر التراثي", "Al Hijr Heritage Hotel"),
    status: "active",
  },
  {
    id: "neom",
    city: L("نيوم", "NEOM"),
    country: L("السعودية", "Saudi Arabia"),
    x: 348,
    y: 226,
    projects: 9,
    value: "SAR 1.1B",
    flagship: L("مجمع الصناعات المتقدمة", "Advanced Industries Complex"),
    status: "upcoming",
  },
  {
    id: "dammam",
    city: L("الدمام", "Dammam"),
    country: L("السعودية", "Saudi Arabia"),
    x: 646,
    y: 312,
    projects: 31,
    value: "SAR 410M",
    flagship: L("ميناء الملك عبدالعزيز", "King Abdulaziz Port"),
    status: "delivered",
  },
  {
    id: "dubai",
    city: L("دبي", "Dubai"),
    country: L("الإمارات", "UAE"),
    x: 766,
    y: 362,
    projects: 18,
    value: "SAR 390M",
    flagship: L("مركز دبي المالي", "Dubai Financial Centre"),
    status: "delivered",
  },
  {
    id: "doha",
    city: L("الدوحة", "Doha"),
    country: L("قطر", "Qatar"),
    x: 704,
    y: 360,
    projects: 11,
    value: "SAR 280M",
    flagship: L("واجهة الخليج الغربية", "West Bay Waterfront"),
    status: "delivered",
  },
  {
    id: "muscat",
    city: L("مسقط", "Muscat"),
    country: L("عُمان", "Oman"),
    x: 856,
    y: 430,
    projects: 8,
    value: "SAR 190M",
    flagship: L("مجمع الطاقة الشمسية", "Solar Energy Park"),
    status: "upcoming",
  },
];

export const regionStats = {
  countries: 4,
  projects: 219,
  value: "SAR 5.5B",
  cities: 8,
};

import { L, type Localized } from "@/lib/dictionary";

export type FleetArtVariant =
  | "tower-crane"
  | "crawler"
  | "excavator"
  | "mobile"
  | "piling"
  | "hauler";

export type Machine = {
  id: string;
  name: string;
  category: Localized;
  description: Localized;
  capacity: string;
  reach: string;
  units: string;
  year: string;
  art: FleetArtVariant;
  featured?: boolean;
};

export const fleet: Machine[] = [
  {
    id: "titan-3000",
    name: "TITAN 3000",
    category: L("رافعة زاحفة", "Crawler crane"),
    description: L(
      "رافعة زاحفة فائقة القدرة للأعمال الثقيلة والتركيبات الإنشائية في المواقع الضيقة.",
      "A high-capacity crawler crane for heavy lifts and structural installations in constrained sites.",
    ),
    capacity: "300 T",
    reach: "196 M",
    units: "06",
    year: "2023",
    art: "crawler",
    featured: true,
  },
  {
    id: "skyline-380",
    name: "SKYLINE 380",
    category: L("رافعة برجية", "Tower crane"),
    description: L(
      "رافعة برجية سريعة التجميع، مثالية للأبراج الشاهقة والمواقع الحضرية عالية الكثافة.",
      "A fast-erecting tower crane, ideal for high-rise towers and dense urban sites.",
    ),
    capacity: "16 T",
    reach: "75 M",
    units: "12",
    year: "2024",
    art: "tower-crane",
    featured: true,
  },
  {
    id: "atlas-95",
    name: "ATLAS 95",
    category: L("حفارة ثقيلة", "Heavy excavator"),
    description: L(
      "حفارة هيدروليكية عالية الإنتاجية للأعمال الأرضية والحفريات العميقة والتحميل.",
      "A high-productivity hydraulic excavator for earthworks, deep excavation, and loading.",
    ),
    capacity: "3.4 M³",
    reach: "12 M",
    units: "18",
    year: "2022",
    art: "excavator",
    featured: true,
  },
  {
    id: "nomad-750",
    name: "NOMAD 750",
    category: L("رافعة متحركة", "Mobile crane"),
    description: L(
      "رافعة متحركة بعجلات متعددة، للتركيبات السريعة في المواقع المفتوحة والمشاريع الصناعية.",
      "A multi-axle mobile crane for rapid installations on open sites and industrial projects.",
    ),
    capacity: "750 T",
    reach: "96 M",
    units: "04",
    year: "2024",
    art: "mobile",
  },
  {
    id: "foundation-45",
    name: "FOUNDATION 45",
    category: L("معدة خوازيق", "Piling rig"),
    description: L(
      "معدة حفر خوازيق دوارة للأساسات العميقة والتربة الصخرية، بعمق يصل إلى ٤٥ متراً.",
      "A rotary piling rig for deep foundations and rocky ground, reaching depths of 45 metres.",
    ),
    capacity: "45 M",
    reach: "2.5 M",
    units: "08",
    year: "2023",
    art: "piling",
  },
  {
    id: "hauler-60",
    name: "HAULER 60",
    category: L("قلاب مفصلي", "Articulated hauler"),
    description: L(
      "قلاب مفصلي عالي التحمل لنقل المواد في التضاريس الوعرة ومواقع البناء الكبرى.",
      "A heavy-duty articulated hauler for material transport across rough terrain and large sites.",
    ),
    capacity: "55 T",
    reach: "24 M³",
    units: "24",
    year: "2022",
    art: "hauler",
  },
];

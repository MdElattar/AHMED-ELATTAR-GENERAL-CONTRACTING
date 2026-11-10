import { L, type Localized } from "@/lib/dictionary";

export type Certification = {
  code: string;
  title: Localized;
  issuer: Localized;
};

export const certifications: Certification[] = [
  {
    code: "ISO 9001",
    title: L("إدارة الجودة", "Quality Management"),
    issuer: L("المنظمة الدولية للمعايير", "International Organization for Standardization"),
  },
  {
    code: "ISO 45001",
    title: L("الصحة والسلامة المهنية", "Occupational Health & Safety"),
    issuer: L("المنظمة الدولية للمعايير", "International Organization for Standardization"),
  },
  {
    code: "ISO 14001",
    title: L("الإدارة البيئية", "Environmental Management"),
    issuer: L("المنظمة الدولية للمعايير", "International Organization for Standardization"),
  },
  {
    code: "GRADE 1",
    title: L("تصنيف المقاولين — الدرجة الأولى", "Contractor Classification — Grade One"),
    issuer: L("الهيئة السعودية للمقاولين", "Saudi Contractors Authority"),
  },
  {
    code: "LEED GOLD",
    title: L("المباني الخضراء — المستوى الذهبي", "Green Building — Gold Level"),
    issuer: L("مجلس المباني الخضراء الأمريكي", "U.S. Green Building Council"),
  },
  {
    code: "BIM L2",
    title: L("نمذجة معلومات البناء — المستوى الثاني", "Building Information Modelling — Level 2"),
    issuer: L("معهد BIM البريطاني", "UK BIM Institute"),
  },
];

export type Milestone = {
  year: string;
  title: Localized;
  text: Localized;
};

export const milestones: Milestone[] = [
  {
    year: "1987",
    title: L("التأسيس", "Founded"),
    text: L(
      "ورشة صغيرة في الرياض، وعقد واحد، ومبدأ واحد: الإتقان قبل التوسع.",
      "A small workshop in Riyadh, one contract, and one principle: mastery before growth.",
    ),
  },
  {
    year: "1994",
    title: L("أول برج", "First tower"),
    text: L(
      "تسليم أول برج تجاري من ١٨ طابقاً، وبداية التخصص في المباني الشاهقة.",
      "Handover of our first 18-storey commercial tower, and the beginning of our high-rise specialism.",
    ),
  },
  {
    year: "2003",
    title: L("قسم البنية التحتية", "Infrastructure division"),
    text: L(
      "تأسيس قسم متخصص للجسور والطرق، بالتزامن مع انطلاق موجة التوسع العمراني.",
      "Establishment of a dedicated bridges and roads division, aligned with the urban expansion wave.",
    ),
  },
  {
    year: "2012",
    title: L("المشروع رقم ١٠٠", "Project 100"),
    text: L(
      "إنجاز المشروع المئة، ودخول السوق الإماراتية عبر مكتب دبي.",
      "Completion of our 100th project, and entry into the UAE market through our Dubai office.",
    ),
  },
  {
    year: "2018",
    title: L("التحول الرقمي", "Digital transformation"),
    text: L(
      "اعتماد BIM والتوأم الرقمي في كل المشاريع، وتأسيس مركز تحكم رقمي مركزي.",
      "Adoption of BIM and digital twins across all projects, and the launch of a central digital control centre.",
    ),
  },
  {
    year: "2023",
    title: L("محفظة ٤ مليارات", "SAR 4B portfolio"),
    text: L(
      "تجاوز قيمة المشاريع المنفذة ٤ مليارات ريال، مع أكثر من ١٬٢٠٠ كادر داخلي.",
      "Executed project value surpassed SAR 4 billion, with more than 1,200 in-house staff.",
    ),
  },
  {
    year: "2026",
    title: L("الفصل القادم", "The next chapter"),
    text: L(
      "٢٤٠ مشروعاً منجزاً، وطموح يمتد إلى ما هو أبعد من البناء.",
      "240 projects delivered, and an ambition that extends beyond construction.",
    ),
  },
];

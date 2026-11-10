import { L, type Localized } from "@/lib/dictionary";
import type { ProjectStatus } from "@/data/projects";

export type PortalMilestone = {
  title: Localized;
  date: Localized;
  status: "complete" | "current" | "upcoming";
};

export type PortalDocument = {
  name: Localized;
  type: "contract" | "drawing" | "report" | "certificate";
  date: string;
  size: string;
};

export type PortalInvoice = {
  number: string;
  title: Localized;
  amount: string;
  date: string;
  status: "paid" | "due" | "pending";
};

export type PortalProject = {
  slug: string;
  name: Localized;
  location: Localized;
  status: ProjectStatus;
  progress: number;
  phase: Localized;
  value: Localized;
  manager: Localized;
  lastUpdate: Localized;
  nextMilestone: Localized;
  milestones: PortalMilestone[];
  documents: PortalDocument[];
  invoices: PortalInvoice[];
};

export const portalProjects: PortalProject[] = [
  {
    slug: "advanced-industries",
    name: L("مجمع الصناعات المتقدمة", "Advanced Industries Complex"),
    location: L("الجبيل — المدينة الصناعية الثانية", "Jubail — Industrial City II"),
    status: "ongoing",
    progress: 68,
    phase: L("تركيب الهياكل الفولاذية", "Steel structure installation"),
    value: L("١.١ مليار ر.س", "SAR 1.1B"),
    manager: L("م. سلطان الحربي", "Eng. Sultan Al-Harbi"),
    lastUpdate: L("اليوم، ٩:٤٠ ص", "Today, 9:40 AM"),
    nextMilestone: L("اكتمال تركيب الوحدة ٧", "Completion of Unit 7 installation"),
    milestones: [
      {
        title: L("الأعمال الأرضية والأساسات", "Earthworks and foundations"),
        date: L("يناير ٢٠٢٥", "January 2025"),
        status: "complete",
      },
      {
        title: L("الهياكل الفولاذية — المرحلة الأولى", "Steel structures — phase one"),
        date: L("مايو ٢٠٢٥", "May 2025"),
        status: "complete",
      },
      {
        title: L("تركيب الوحدة ٧", "Unit 7 installation"),
        date: L("نوفمبر ٢٠٢٦", "November 2026"),
        status: "current",
      },
      {
        title: L("الأنظمة الميكانيكية", "Mechanical systems"),
        date: L("مارس ٢٠٢٧", "March 2027"),
        status: "upcoming",
      },
      {
        title: L("التشغيل التجريبي والتسليم", "Commissioning and handover"),
        date: L("أغسطس ٢٠٢٧", "August 2027"),
        status: "upcoming",
      },
    ],
    documents: [
      {
        name: L("العقد الرئيسي — النسخة الموقعة", "Main contract — signed copy"),
        type: "contract",
        date: "2024/08/12",
        size: "4.2 MB",
      },
      {
        name: L("مخطط الهياكل الفولاذية — R12", "Steel structure drawing — R12"),
        type: "drawing",
        date: "2026/09/28",
        size: "18.6 MB",
      },
      {
        name: L("تقرير الجودة — الربع الثالث", "Quality report — Q3"),
        type: "report",
        date: "2026/10/01",
        size: "2.8 MB",
      },
      {
        name: L("شهادة سلامة الموقع", "Site safety certificate"),
        type: "certificate",
        date: "2026/09/15",
        size: "1.1 MB",
      },
    ],
    invoices: [
      {
        number: "INV-2026-0184",
        title: L("مستخلص الأعمال — سبتمبر", "Works payment — September"),
        amount: "SAR 18,400,000",
        date: "2026/10/02",
        status: "due",
      },
      {
        number: "INV-2026-0171",
        title: L("مستخلص الأعمال — أغسطس", "Works payment — August"),
        amount: "SAR 22,750,000",
        date: "2026/09/03",
        status: "paid",
      },
      {
        number: "INV-2026-0159",
        title: L("دفعة التوريد — الهياكل", "Procurement payment — structures"),
        amount: "SAR 9,300,000",
        date: "2026/08/11",
        status: "paid",
      },
    ],
  },
  {
    slug: "al-hijr-hotel",
    name: L("فندق الحِجر", "Al Hijr Heritage Hotel"),
    location: L("العلا — البلدة القديمة", "AlUla — Old Town"),
    status: "ongoing",
    progress: 42,
    phase: L("الأعمال الحجرية والتشطيبات", "Stonework and finishes"),
    value: L("٦٥٠ مليون ر.س", "SAR 650M"),
    manager: L("م. ريم القحطاني", "Eng. Reem Al-Qahtani"),
    lastUpdate: L("أمس، ٤:١٥ م", "Yesterday, 4:15 PM"),
    nextMilestone: L("اكتمال الجناح الشرقي", "Completion of the east wing"),
    milestones: [
      {
        title: L("الترميم والحفاظ", "Restoration and conservation"),
        date: L("مارس ٢٠٢٥", "March 2025"),
        status: "complete",
      },
      {
        title: L("الأعمال الحجرية", "Stonework"),
        date: L("أكتوبر ٢٠٢٦", "October 2026"),
        status: "current",
      },
      {
        title: L("التشطيبات الداخلية", "Interior finishes"),
        date: L("فبراير ٢٠٢٧", "February 2027"),
        status: "upcoming",
      },
      {
        title: L("تنسيق المواقع", "Landscape"),
        date: L("يونيو ٢٠٢٧", "June 2027"),
        status: "upcoming",
      },
      {
        title: L("التسليم", "Handover"),
        date: L("ديسمبر ٢٠٢٧", "December 2027"),
        status: "upcoming",
      },
    ],
    documents: [
      {
        name: L("العقد الرئيسي", "Main contract"),
        type: "contract",
        date: "2024/11/20",
        size: "3.6 MB",
      },
      {
        name: L("مخططات الواجهات الحجرية", "Stone façade drawings"),
        type: "drawing",
        date: "2026/09/12",
        size: "12.4 MB",
      },
      {
        name: L("تقرير الحفاظ على التراث", "Heritage conservation report"),
        type: "report",
        date: "2026/08/30",
        size: "6.1 MB",
      },
    ],
    invoices: [
      {
        number: "INV-2026-0190",
        title: L("مستخلص الأعمال — سبتمبر", "Works payment — September"),
        amount: "SAR 11,200,000",
        date: "2026/10/04",
        status: "pending",
      },
      {
        number: "INV-2026-0168",
        title: L("مستخلص الأعمال — أغسطس", "Works payment — August"),
        amount: "SAR 14,600,000",
        date: "2026/09/01",
        status: "paid",
      },
    ],
  },
  {
    slug: "marina-quarter",
    name: L("حي المرسى", "Marina Quarter"),
    location: L("جدة — الواجهة البحرية", "Jeddah — Waterfront"),
    status: "upcoming",
    progress: 12,
    phase: L("التصميم التفصيلي والتمكين", "Detailed design and mobilization"),
    value: L("١.٨ مليار ر.س", "SAR 1.8B"),
    manager: L("م. عمر الشريف", "Eng. Omar Al-Sharif"),
    lastUpdate: L("٣ أكتوبر ٢٠٢٦", "3 October 2026"),
    nextMilestone: L("اعتماد المخطط الرئيسي النهائي", "Final master plan approval"),
    milestones: [
      {
        title: L("دراسة الجدوى", "Feasibility study"),
        date: L("يونيو ٢٠٢٦", "June 2026"),
        status: "complete",
      },
      {
        title: L("التصميم التفصيلي", "Detailed design"),
        date: L("ديسمبر ٢٠٢٦", "December 2026"),
        status: "current",
      },
      {
        title: L("التمكين والبدء", "Mobilization and start"),
        date: L("مارس ٢٠٢٧", "March 2027"),
        status: "upcoming",
      },
      {
        title: L("الأعمال البحرية", "Marine works"),
        date: L("سبتمبر ٢٠٢٧", "September 2027"),
        status: "upcoming",
      },
      {
        title: L("التسليم", "Handover"),
        date: L("٢٠٣٠", "2030"),
        status: "upcoming",
      },
    ],
    documents: [
      {
        name: L("اتفاقية التطوير", "Development agreement"),
        type: "contract",
        date: "2026/06/18",
        size: "5.4 MB",
      },
      {
        name: L("المخطط الرئيسي — R04", "Master plan — R04"),
        type: "drawing",
        date: "2026/09/22",
        size: "24.8 MB",
      },
      {
        name: L("تقرير الجدوى", "Feasibility report"),
        type: "report",
        date: "2026/07/05",
        size: "8.2 MB",
      },
    ],
    invoices: [
      {
        number: "INV-2026-0142",
        title: L("دفعة التصميم — المرحلة الأولى", "Design payment — phase one"),
        amount: "SAR 7,800,000",
        date: "2026/07/20",
        status: "paid",
      },
    ],
  },
];

import { L, type Localized } from "@/lib/dictionary";
import { projectImageDefaults } from "@/data/project-images";

export type ProjectCategory = "commercial" | "residential" | "infrastructure" | "industrial";
export type ProjectStatus = "completed" | "ongoing" | "upcoming";
export type ArtVariant =
  | "tower"
  | "villa"
  | "bridge"
  | "industrial"
  | "heritage"
  | "interchange"
  | "marina"
  | "solar";

export type Project = {
  slug: string;
  title: Localized;
  category: ProjectCategory;
  status: ProjectStatus;
  location: Localized;
  year: string;
  client: Localized;
  area: Localized;
  value: Localized;
  summary: Localized;
  description: Localized;
  scope: Localized[];
  highlights: { value: string; label: Localized }[];
  art: ArtVariant;
  featured?: boolean;
  /** Project-specific cover image. Falls back to the canonical art photography. */
  coverUrl?: string;
  /** 400px-wide derivative used by compact admin thumbs. */
  thumbUrl?: string;
  /** Tiny inline WebP used by next/image while the cover loads. */
  blurDataURL?: string;
  /** Ordered project gallery. The first entry is always the cover. */
  gallery?: string[];
  /** Photography/art variants used by the public project cinema. */
  artGallery?: ArtVariant[];
  /** Canonical city (English storage value; the public site still renders `location`). */
  city?: string;
  /** Canonical district (English storage value). */
  district?: string;
};

const projectSeeds: Project[] = [
  {
    slug: "aurora-tower",
    title: L("برج الشفق", "Aurora Tower"),
    category: "commercial",
    status: "completed",
    location: L("الرياض — طريق الملك فهد", "Riyadh — King Fahd Road"),
    year: "2025",
    client: L("شركة الرياض للتطوير", "Riyadh Development Holding"),
    area: L("١٨٦٬٠٠٠ م²", "186,000 m²"),
    value: L("١.٤ مليار ر.س", "SAR 1.4B"),
    summary: L(
      "برج تجاري من ٧٢ طابقاً، يُعادل أيقونة جديدة على طريق الملك فهد، بواجهة زجاجية مزدوجة العزل ونظام إدارة ذكي.",
      "A 72-storey commercial tower defining a new icon on King Fahd Road, with a double-skin façade and intelligent building management.",
    ),
    description: L(
      "صُمم برج الشفق ليكون أكثر من مبنى مكاتب؛ إنه بيان معماري على أحد أهم المحاور في الرياض. يجمع البرج بين هيكل خرساني عالي الأداء وواجهة زجاجية مزدوجة العزل تُخفّض الأحمال الحرارية بنسبة ٣٨٪، مع نظام إدارة مبانٍ متكامل يتحكم في الإضاءة والتهوية والطاقة لحظياً. نُفذ المشروع ضمن جدول زمني صارم بلغ ٣٦ شهراً، مع تسليم مبكر بستة أسابيع.",
      "Aurora Tower was designed to be more than an office building; it is an architectural statement on one of Riyadh's most important corridors. The tower combines a high-performance concrete structure with a double-skin façade that reduces thermal loads by 38%, alongside an integrated building management system that controls lighting, ventilation, and energy in real time. Delivered on a strict 36-month programme, with handover six weeks ahead of schedule.",
    ),
    scope: [
      L("الهيكل الخرساني والإنشائي", "Concrete and structural works"),
      L("الواجهات الزجاجية المزدوجة", "Double-skin curtain wall"),
      L("الأعمال الكهروميكانيكية", "MEP systems"),
      L("التشطيبات الداخلية الفاخرة", "Premium interior finishes"),
      L("إدارة المشروع والتنسيق", "Project management and coordination"),
    ],
    highlights: [
      { value: "72", label: L("طابقاً", "Floors") },
      { value: "38%", label: L("خفض الأحمال الحرارية", "Lower thermal load") },
      { value: "6", label: L("أسابيع تسليم مبكر", "Weeks early") },
    ],
    art: "tower",
    featured: true,
  },
  {
    slug: "palm-oasis",
    title: L("واحة النخيل", "Palm Oasis Residences"),
    category: "residential",
    status: "completed",
    location: L("جدة — أبحر الشمالية", "Jeddah — North Obhur"),
    year: "2024",
    client: L("مجموعة البحر الأحمر", "Red Sea Group"),
    area: L("٩٦٬٠٠٠ م²", "96,000 m²"),
    value: L("٧٨٠ مليون ر.س", "SAR 780M"),
    summary: L(
      "٨٤ فيلا فاخرة على الواجهة البحرية، بتصميم يستلهم العمارة العربية الحديثة وحدائق خاصة تطل على البحر.",
      "84 luxury waterfront villas inspired by contemporary Arab architecture, each with private gardens facing the sea.",
    ),
    description: L(
      "واحة النخيل مجتمع سكني خاص صُمم حول فكرة الخصوصية والضوء. كل فيلا لها فناء داخلي وحديقة خاصة وواجهة بحرية، مع مواد محلية مثل الحجر الطبيعي والخشب المعالج. عمل فريقنا على تنسيق أكثر من ٢٤ مقاولاً فرعياً، وأنجز المشروع بمعدل رضا سكان بلغ ٩٧٪ في تقييم ما بعد الإشغال.",
      "Palm Oasis is a private residential community designed around privacy and light. Each villa has an internal courtyard, private garden, and sea frontage, using local materials such as natural stone and treated timber. Our team coordinated more than 24 subcontractors and achieved a 97% resident satisfaction score in the post-occupancy review.",
    ),
    scope: [
      L("الأعمال المدنية والهيكلية", "Civil and structural works"),
      L("تنسيق المواقع والحدائق", "Landscape and gardens"),
      L("المسابح والواجهات البحرية", "Pools and waterfront works"),
      L("التشطيبات الفاخرة", "Luxury finishes"),
      L("البنية التحتية للمجمع", "Community infrastructure"),
    ],
    highlights: [
      { value: "84", label: L("فيلا فاخرة", "Luxury villas") },
      { value: "97%", label: L("رضا السكان", "Resident satisfaction") },
      { value: "24", label: L("مقاولاً فرعياً", "Subcontractors") },
    ],
    art: "villa",
    featured: true,
  },
  {
    slug: "wadi-crossing",
    title: L("جسر الوادي", "Wadi Crossing"),
    category: "infrastructure",
    status: "completed",
    location: L("الرياض — وادي حنيفة", "Riyadh — Wadi Hanifah"),
    year: "2023",
    client: L("الهيئة العامة للطرق", "General Authority for Roads"),
    area: L("١.٨ كم", "1.8 km"),
    value: L("٩٢٠ مليون ر.س", "SAR 920M"),
    summary: L(
      "جسر معلق بطول ١.٨ كم يعبر وادي حنيفة، ويختصر زمن التنقل ٢٢ دقيقة، بتصميم إنشائي مقاوم للسيول.",
      "A 1.8 km cable-stayed bridge across Wadi Hanifah, cutting travel time by 22 minutes with a flood-resilient structural design.",
    ),
    description: L(
      "تطلب جسر الوادي هندسة دقيقة للتعامل مع طبيعة الأرض والمياه الموسمية. نُفذت الأساسات على عمق ٣٨ متراً، واستُخدم نظام كابلات مزدوج لتحمل الأحمال الديناميكية. أصبح الجسر اليوم أحد أهم شرايين الحركة في غرب الرياض، مع صيانة تنبؤية تعتمد على مستشعرات إنشائية مدمجة.",
      "Wadi Crossing required precise engineering to address the terrain and seasonal water flows. Foundations were executed to a depth of 38 metres, with a dual-cable system to withstand dynamic loads. The bridge is now a key movement artery in west Riyadh, supported by predictive maintenance using embedded structural sensors.",
    ),
    scope: [
      L("الأساسات العميقة", "Deep foundations"),
      L("الأعمدة والكابلات الإنشائية", "Pylons and stay cables"),
      L("سطح الجسر والفواصل", "Deck and expansion joints"),
      L("أعمال الحماية من السيول", "Flood protection works"),
      L("الإضاءة وأنظمة المراقبة", "Lighting and monitoring systems"),
    ],
    highlights: [
      { value: "1.8", label: L("كيلومتر طولاً", "Kilometres") },
      { value: "38", label: L("متراً عمق الأساسات", "Metre foundation depth") },
      { value: "22", label: L("دقيقة توفير", "Minutes saved") },
    ],
    art: "bridge",
    featured: true,
  },
  {
    slug: "advanced-industries",
    title: L("مجمع الصناعات المتقدمة", "Advanced Industries Complex"),
    category: "industrial",
    status: "ongoing",
    location: L("الجبيل — المدينة الصناعية الثانية", "Jubail — Industrial City II"),
    year: "2024–2027",
    client: L("الهيئة الملكية للجبيل وينبع", "Royal Commission for Jubail and Yanbu"),
    area: L("٢٤٠٬٠٠٠ م²", "240,000 m²"),
    value: L("١.١ مليار ر.س", "SAR 1.1B"),
    summary: L(
      "مجمع صناعي متكامل يضم ١٢ وحدة إنتاج ومركزاً لوجستياً، بمعايير سلامة وكفاءة طاقة من الطراز العالمي.",
      "An integrated industrial complex with 12 production units and a logistics hub, built to world-class safety and energy efficiency standards.",
    ),
    description: L(
      "يُعد المجمع أحد أكبر مشاريع البناء الصناعي في المنطقة الشرقية. يشمل الأعمال الأرضية والهياكل الفولاذية والأنظمة الميكانيكية الثقيلة، مع توأم رقمي يُستخدم لإدارة التركيب والاختبار. يعمل المشروع بنظام تسليم متعدد المراحل، مما يسمح بتشغيل أول وحدة إنتاج قبل اكتمال بقية المجمع.",
      "The complex is one of the largest industrial construction projects in the Eastern Province. It includes earthworks, steel structures, and heavy mechanical systems, with a digital twin used to manage installation and commissioning. The project follows a multi-phase handover model, allowing the first production unit to operate before the wider complex is complete.",
    ),
    scope: [
      L("الأعمال الأرضية والبنية التحتية", "Earthworks and infrastructure"),
      L("الهياكل الفولاذية الثقيلة", "Heavy steel structures"),
      L("الأنظمة الميكانيكية والأنابيب", "Mechanical and piping systems"),
      L("المباني الإدارية واللوجستية", "Administrative and logistics buildings"),
      L("التوأم الرقمي والتشغيل التجريبي", "Digital twin and commissioning"),
    ],
    highlights: [
      { value: "12", label: L("وحدة إنتاج", "Production units") },
      { value: "240K", label: L("متر مربع", "Square metres") },
      { value: "35%", label: L("كفاءة طاقة أعلى", "Higher energy efficiency") },
    ],
    art: "industrial",
    featured: true,
  },
  {
    slug: "al-hijr-hotel",
    title: L("فندق الحِجر", "Al Hijr Heritage Hotel"),
    category: "commercial",
    status: "ongoing",
    location: L("العلا — البلدة القديمة", "AlUla — Old Town"),
    year: "2024–2026",
    client: L("هيئة تطوير العلا", "Royal Commission for AlUla"),
    area: L("٤٢٬٠٠٠ م²", "42,000 m²"),
    value: L("٦٥٠ مليون ر.س", "SAR 650M"),
    summary: L(
      "فندق تراثي من ١٢٠ مفتاحاً، مندمج في النسيج العمراني للبلدة القديمة، بمواد محلية وحرفية يدوية.",
      "A 120-key heritage hotel woven into the urban fabric of AlUla's Old Town, using local materials and handcrafted detail.",
    ),
    description: L(
      "كان التحدي في فندق الحِجر هو البناء داخل موقع تراثي دون المساس بهويته. اعتمدنا على الحجر الرملي المحلي، والأقواس التقليدية، والتبريد السلبي، مع إخفاء كل الأنظمة الحديثة بعناية. حصل المشروع على اعتماد «المباني الخضراء» من المستوى الذهبي، ويستهدف أعلى معايير الضيافة الفاخرة.",
      "The challenge at Al Hijr was building within a heritage site without compromising its identity. We relied on local sandstone, traditional arches, and passive cooling, carefully concealing all modern systems. The project achieved Gold-level green building certification and targets the highest standards of luxury hospitality.",
    ),
    scope: [
      L("الترميم والحفاظ على المباني التراثية", "Heritage restoration and conservation"),
      L("الأعمال الحجرية التقليدية", "Traditional stonework"),
      L("الأنظمة الفندقية والضيافة", "Hotel and hospitality systems"),
      L("تنسيق المواقع والحدائق", "Landscape and gardens"),
      L("التبريد السلبي وكفاءة الطاقة", "Passive cooling and energy efficiency"),
    ],
    highlights: [
      { value: "120", label: L("مفتاحاً فندقياً", "Hotel keys") },
      { value: "Gold", label: L("اعتماد المباني الخضراء", "Green building rating") },
      { value: "100%", label: L("مواد محلية المصدر", "Locally sourced") },
    ],
    art: "heritage",
    featured: true,
  },
  {
    slug: "riyadh-central-interchange",
    title: L("محطة الرياض المركزية", "Riyadh Central Interchange"),
    category: "infrastructure",
    status: "completed",
    location: L("الرياض — تقاطع طريق الملك سلمان", "Riyadh — King Salman Road Interchange"),
    year: "2022",
    client: L("الهيئة الملكية لمدينة الرياض", "Royal Commission for Riyadh City"),
    area: L("٤ مستويات", "4 levels"),
    value: L("٥٤٠ مليون ر.س", "SAR 540M"),
    summary: L(
      "تقاطع متعدد المستويات يعالج أكثر من ٢٤٠ ألف مركبة يومياً، مع مسارات للمشاة ومساحات خضراء.",
      "A multi-level interchange handling over 240,000 vehicles per day, with pedestrian routes and green spaces.",
    ),
    description: L(
      "صُمم التقاطع ليكون نموذجاً للبنية التحتية الحضرية الإنسانية. يضم أربعة مستويات مرورية، وجسوراً للمشاة، وحدائق على السطح، ونظام إضاءة ذكي يقلل استهلاك الطاقة بنسبة ٤٥٪. نُفذ المشروع دون إغلاق كامل للطريق الرئيسي، عبر خطة تحويلات مرورية على ١٤ مرحلة.",
      "The interchange was designed as a model for human-centred urban infrastructure. It includes four traffic levels, pedestrian bridges, rooftop gardens, and a smart lighting system that cuts energy use by 45%. The project was delivered without fully closing the main road, through a 14-stage traffic diversion plan.",
    ),
    scope: [
      L("الجسور والمنحدرات", "Bridges and ramps"),
      L("الأعمال المرورية والإشارات", "Traffic works and signals"),
      L("جسور المشاة", "Pedestrian bridges"),
      L("الحدائق والأسطح الخضراء", "Gardens and green roofs"),
      L("الإضاءة الذكية", "Smart lighting"),
    ],
    highlights: [
      { value: "240K", label: L("مركبة يومياً", "Vehicles per day") },
      { value: "14", label: L("مرحلة تحويل مروري", "Traffic stages") },
      { value: "45%", label: L("توفير في الطاقة", "Energy saved") },
    ],
    art: "interchange",
    featured: true,
  },
  {
    slug: "marina-quarter",
    title: L("حي المرسى", "Marina Quarter"),
    category: "commercial",
    status: "upcoming",
    location: L("جدة — الواجهة البحرية", "Jeddah — Waterfront"),
    year: "2027",
    client: L("شركة البحر الأحمر", "Red Sea Group"),
    area: L("٢١٠٬٠٠٠ م²", "210,000 m²"),
    value: L("١.٨ مليار ر.س", "SAR 1.8B"),
    summary: L(
      "واجهة بحرية متكاملة تضم ٦ أبراج وممشى ومرسى لليخوت، بتصميم يعيد تعريف الحياة على البحر.",
      "An integrated waterfront district with six towers, a promenade, and a yacht marina, redefining life on the sea.",
    ),
    description: L(
      "حي المرسى هو أحد أكثر المشاريع طموحاً في محفظتنا. يمتد على ٢.١ كيلومتر من الواجهة البحرية، ويجمع بين الاستخدامات السكنية والتجارية والفندقية حول مرسى لليخوت. يعمل فريقنا حالياً على مرحلة التصميم التفصيلي والتمكين، بالتعاون مع استشاريين عالميين في التخطيط البحري.",
      "Marina Quarter is one of the most ambitious projects in our portfolio. It stretches across 2.1 kilometres of waterfront, combining residential, commercial, and hospitality uses around a yacht marina. Our team is currently in detailed design and mobilization, working with international marine planning consultants.",
    ),
    scope: [
      L("التخطيط الرئيسي للمشروع", "Master planning"),
      L("الأبراج السكنية والتجارية", "Residential and commercial towers"),
      L("المرسى والأعمال البحرية", "Marina and marine works"),
      L("الممشى والمساحات العامة", "Promenade and public realm"),
      L("البنية التحتية الذكية", "Smart infrastructure"),
    ],
    highlights: [
      { value: "6", label: L("أبراج", "Towers") },
      { value: "2.1", label: L("كم واجهة بحرية", "Km of waterfront") },
      { value: "2027", label: L("التسليم المتوقع", "Expected handover") },
    ],
    art: "marina",
  },
  {
    slug: "solar-energy-park",
    title: L("مجمع الطاقة الشمسية", "Solar Energy Park"),
    category: "industrial",
    status: "ongoing",
    location: L("نيوم — تبوك", "NEOM — Tabuk"),
    year: "2024–2026",
    client: L("نيوم", "NEOM"),
    area: L("١.٢ جيجاواط", "1.2 GW"),
    value: L("٢.٣ مليار ر.س", "SAR 2.3B"),
    summary: L(
      "أحد أكبر مجمعات الطاقة الشمسية في المنطقة، يُبنى في بيئة صحراوية قاسية بمعايير استدامة غير مسبوقة.",
      "One of the region's largest solar parks, built in a harsh desert environment to unprecedented sustainability standards.",
    ),
    description: L(
      "يتطلب المشروع هندسة مدنية متقدمة للتعامل مع الرمال والرياح والحرارة. نُفذت أكثر من ٢٬٤٠٠ قاعدة خرسانية باستخدام تقنيات صب مسبق، مع روبوتات تنظيف شمسية ذاتية الحركة. يعمل المجمع على تشغيل مرحلة أولى بقدرة ٤٠٠ ميجاواط قبل اكتمال المشروع.",
      "The project required advanced civil engineering to handle sand, wind, and heat. More than 2,400 concrete foundations were executed using precast techniques, with autonomous solar cleaning robots. The park is already operating a first 400 MW phase ahead of full completion.",
    ),
    scope: [
      L("الأعمال المدنية والأساسات", "Civil works and foundations"),
      L("تركيب الألواح والهياكل", "Panel and mounting structures"),
      L("الكابلات ومحطات التحويل", "Cabling and substations"),
      L("أنظمة التنظيف الذاتي", "Autonomous cleaning systems"),
      L("مراقبة الأداء والسلامة", "Performance and safety monitoring"),
    ],
    highlights: [
      { value: "1.2", label: L("جيجاواط", "Gigawatts") },
      { value: "2,400", label: L("قاعدة خرسانية", "Concrete foundations") },
      { value: "400", label: L("ميجاواط تشغيل مبكر", "MW early operation") },
    ],
    art: "solar",
  },
];

export const projects: Project[] = projectSeeds.map((project) => {
  const [city = "", district = ""] = project.location.en
    .split("—")
    .map((part) => part.trim());

  return {
    ...project,
    ...projectImageDefaults[project.art],
    city,
    district,
  };
});

export const projectCategories: ProjectCategory[] = [
  "commercial",
  "residential",
  "infrastructure",
  "industrial",
];

export function getProject(slug: string) {
  return projects.find((project) => project.slug === slug);
}

export function getRelatedProjects(project: Project, limit = 3) {
  return projects
    .filter((item) => item.slug !== project.slug)
    .sort((a, b) => {
      const aScore = a.category === project.category ? 1 : 0;
      const bScore = b.category === project.category ? 1 : 0;
      return bScore - aScore;
    })
    .slice(0, limit);
}

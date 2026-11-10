import { L, type Localized } from "@/lib/dictionary";

export type ServiceIcon = "building" | "truck" | "compass" | "pen";

export type Service = {
  slug: string;
  number: string;
  title: Localized;
  tagline: Localized;
  description: Localized;
  detail: Localized;
  capabilities: Localized[];
  stats: { value: string; label: Localized }[];
  icon: ServiceIcon;
  art: "tower" | "bridge" | "villa" | "industrial";
};

export const services: Service[] = [
  {
    slug: "general-contracting",
    number: "01",
    title: L("المقاولات العامة", "General Contracting"),
    tagline: L("من أول حفرة إلى آخر مفتاح.", "From first excavation to final key."),
    description: L(
      "إدارة وتنفيذ المشاريع الكبرى تحت سقف واحد، بمسؤولية كاملة عن الجودة والتكلفة والجدول الزمني.",
      "Management and delivery of major projects under one roof, with full responsibility for quality, cost, and schedule.",
    ),
    detail: L(
      "نتولى المشروع كاملاً: التخطيط، التوريد، التنفيذ، والتسليم. فرقنا الميدانية تعمل بمنهجية موحدة، ولوحة تحكم رقمية تُظهر التقدم والتكاليف لكل stakeholder. لا نُسلّم مشروعاً إلا بعد اجتيازه ١٢٧ نقطة فحص مستقلة.",
      "We take ownership of the entire project: planning, procurement, construction, and handover. Our site teams operate under a unified methodology, with a digital dashboard that shows progress and cost to every stakeholder. No project is handed over until it passes 127 independent inspection points.",
    ),
    capabilities: [
      L("إدارة المشاريع الكبرى", "Large-scale project management"),
      L("التوريد وسلسلة الإمداد", "Procurement and supply chain"),
      L("إدارة المقاولين الفرعيين", "Subcontractor management"),
      L("مراقبة الجودة المستقلة", "Independent quality control"),
      L("التسليم والتشغيل التجريبي", "Handover and commissioning"),
    ],
    stats: [
      { value: "240+", label: L("مشروعاً منجزاً", "Projects delivered") },
      { value: "127", label: L("نقطة فحص", "Inspection points") },
      { value: "98%", label: L("تسليم في الموعد", "On-time delivery") },
    ],
    icon: "building",
    art: "tower",
  },
  {
    slug: "heavy-equipment",
    number: "02",
    title: L("تأجير المعدات الثقيلة", "Heavy Equipment Rental"),
    tagline: L("قوة جاهزة. بمعايير مملوكة.", "Power on demand. Standards owned."),
    description: L(
      "أسطول مملوك بالكامل من الرافعات والحفارات والمنصات، مع مشغلين معتمدين وصيانة تنبؤية.",
      "A fully owned fleet of cranes, excavators, and platforms, with certified operators and predictive maintenance.",
    ),
    detail: L(
      "نؤجر المعدات كما نستخدمها في مشاريعنا: بأعلى معايير السلامة وأحدث الصيانات. يشمل الأسطول أكثر من ١٢٠ وحدة، من رافعات ٧٥٠ طناً إلى منصات العمل الهوائية، مع مشغلين معتمدين من الجهات المختصة وخدمة دعم على مدار الساعة.",
      "We rent equipment the way we use it on our own projects: to the highest safety standards and with the latest maintenance. The fleet includes more than 120 units, from 750-tonne cranes to aerial work platforms, with authority-certified operators and 24/7 support.",
    ),
    capabilities: [
      L("رافعات متحركة وثابتة", "Mobile and tower cranes"),
      L("حفارات ولوادر ثقيلة", "Heavy excavators and loaders"),
      L("منصات عمل هوائية", "Aerial work platforms"),
      L("مشغلون معتمدون", "Certified operators"),
      L("صيانة ودعم ٢٤/٧", "24/7 maintenance and support"),
    ],
    stats: [
      { value: "120+", label: L("وحدة في الأسطول", "Fleet units") },
      { value: "750T", label: L("أقصى قدرة رفع", "Max lifting capacity") },
      { value: "24/7", label: L("دعم فني", "Technical support") },
    ],
    icon: "truck",
    art: "industrial",
  },
  {
    slug: "civil-engineering",
    number: "03",
    title: L("الهندسة المدنية", "Civil Engineering"),
    tagline: L("الأساس الذي يحمل كل شيء.", "The foundation that carries everything."),
    description: L(
      "تصميم وتنفيذ البنية التحتية والجسور والأعمال الأرضية، بهندسة مقاومة للزمن والظروف القاسية.",
      "Design and delivery of infrastructure, bridges, and earthworks, engineered for time and harsh conditions.",
    ),
    detail: L(
      "من تحليل التربة إلى تصميم الأساسات العميقة والجسور المعلقة، نُوظف خبرة أربعين عاماً في البيئة السعودية. نستخدم نمذجة BIM وتحليل العناصر المحدودة لاختبار كل فرضية قبل التنفيذ، ونُدمج مستشعرات المراقبة في المنشآت الحيوية.",
      "From soil analysis to the design of deep foundations and cable-stayed bridges, we apply four decades of experience in the Saudi environment. We use BIM and finite element analysis to test every assumption before construction, and embed monitoring sensors in critical structures.",
    ),
    capabilities: [
      L("الجسور والمنشآت الخاصة", "Bridges and special structures"),
      L("الأساسات العميقة", "Deep foundations"),
      L("الأعمال الأرضية والطرق", "Earthworks and roads"),
      L("الهيدرولوجيا والحماية من السيول", "Hydrology and flood protection"),
      L("المراقبة الإنشائية", "Structural monitoring"),
    ],
    stats: [
      { value: "1.8", label: L("كم أطول جسر", "Longest bridge km") },
      { value: "38", label: L("م عمق الأساسات", "Foundation depth m") },
      { value: "0", label: L("حوادث جوهرية", "Major incidents") },
    ],
    icon: "compass",
    art: "bridge",
  },
  {
    slug: "architectural-design",
    number: "04",
    title: L("التصميم المعماري", "Architectural Design"),
    tagline: L("رؤية تُترجم إلى مكان.", "Vision translated into place."),
    description: L(
      "تصميم معماري يبدأ من الإنسان والموقع والثقافة، وينتهي بتفاصيل قابلة للتنفيذ بلا تنازلات.",
      "Architecture that begins with people, place, and culture, and ends in buildable detail without compromise.",
    ),
    detail: L(
      "استوديو التصميم لدينا يعمل جنباً إلى جنب مع فرق الهندسة والتنفيذ، ما يضمن أن كل خط على الورق قابل للبناء. نُصمم مساكن وفنادق ومقرات ومجمعات، بمنهجية تُوازن بين الجمال والوظيفة والاستدامة والهوية المحلية.",
      "Our design studio works side by side with engineering and construction teams, ensuring every line on paper is buildable. We design homes, hotels, headquarters, and mixed-use districts with a methodology that balances beauty, function, sustainability, and local identity.",
    ),
    capabilities: [
      L("التصميم المعماري المتكامل", "Integrated architectural design"),
      L("التصميم الداخلي الفاخر", "Luxury interior design"),
      L("تخطيط المواقع الرئيسي", "Master planning"),
      L("نمذجة BIM والتوأم الرقمي", "BIM and digital twins"),
      L("الاستدامة وكفاءة الطاقة", "Sustainability and energy efficiency"),
    ],
    stats: [
      { value: "12", label: L("جائزة هندسية", "Design awards") },
      { value: "100%", label: L("نمذجة BIM", "BIM modelled") },
      { value: "4", label: L("دول", "Countries") },
    ],
    icon: "pen",
    art: "villa",
  },
];

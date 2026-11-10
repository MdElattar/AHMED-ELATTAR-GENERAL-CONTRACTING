import { L, type Localized } from "@/lib/dictionary";

export type Testimonial = {
  quote: Localized;
  name: Localized;
  role: Localized;
  company: Localized;
  project: Localized;
  projectSlug: string;
  initials: string;
};

export const testimonials: Testimonial[] = [
  {
    quote: L(
      "ما يميز أحمد العطار ليس ما يبنونه، بل كيف يبنونه. كل اجتماع كان واضحاً، كل رقم كان موثقاً، وكل وعد كان له تاريخ. برج الشفق سُلّم قبل الموعد، وبجودة تفوق ما تخيلناه.",
      "What sets Ahmed Elattar apart is not what they build, but how they build it. Every meeting was clear, every number documented, and every promise had a date. Aurora Tower was handed over ahead of schedule, at a quality beyond what we imagined.",
    ),
    name: L("م. فيصل الراشد", "Eng. Faisal Al-Rashed"),
    role: L("الرئيس التنفيذي", "Chief Executive Officer"),
    company: L("شركة الرياض للتطوير", "Riyadh Development Holding"),
    project: L("برج الشفق", "Aurora Tower"),
    projectSlug: "aurora-tower",
    initials: "FR",
  },
  {
    quote: L(
      "العمل داخل موقع تراثي لا يحتمل الخطأ. أظهر فريق أحمد العطار حساسية نادرة للتفاصيل، واحتراماً للمكان، وقدرة على الجمع بين الحداثة والهوية. فندق الحِجر سيكون علامة في الضيافة السعودية.",
      "Working within a heritage site leaves no room for error. The Ahmed Elattar team showed rare sensitivity to detail, respect for place, and the ability to bridge modernity and identity. Al Hijr will be a landmark in Saudi hospitality.",
    ),
    name: L("سارة المطيري", "Sarah Al-Mutairi"),
    role: L("مديرة المشاريع", "Director of Projects"),
    company: L("هيئة تطوير العلا", "Royal Commission for AlUla"),
    project: L("فندق الحِجر", "Al Hijr Heritage Hotel"),
    projectSlug: "al-hijr-hotel",
    initials: "SM",
  },
  {
    quote: L(
      "التقاطع كان اختباراً لوجستياً معقداً: ٢٤٠ ألف مركبة يومياً، وطريق لا يمكن إغلاقه. خطة التحويلات على ١٤ مرحلة نُفذت بدقة، ولم نشهد أي تأخير جوهري. هذا هو الاحتراف.",
      "The interchange was a complex logistical test: 240,000 vehicles a day on a road that could not close. The 14-stage diversion plan was executed precisely, with no material delay. That is professionalism.",
    ),
    name: L("م. خالد العتيبي", "Eng. Khalid Al-Otaibi"),
    role: L("رئيس البنية التحتية", "Head of Infrastructure"),
    company: L("الهيئة الملكية لمدينة الرياض", "Royal Commission for Riyadh City"),
    project: L("محطة الرياض المركزية", "Riyadh Central Interchange"),
    projectSlug: "riyadh-central-interchange",
    initials: "KO",
  },
  {
    quote: L(
      "في مشروع بحجم واحة النخيل، التفاصيل هي كل شيء. أحمد العطار لم يكتفِ بالتنفيذ، بل حسّن التصميم أثناء العمل لتقليل الهدر وتسريع الجدول. النتيجة مجتمع يستحق أن يُعاش فيه.",
      "On a project the size of Palm Oasis, details are everything. Ahmed Elattar did not just execute; they improved the design as they built to reduce waste and accelerate the programme. The result is a community worth living in.",
    ),
    name: L("د. نورة الصباح", "Dr. Noura Al-Sabah"),
    role: L("مديرة التطوير", "Development Director"),
    company: L("مجموعة البحر الأحمر", "Red Sea Group"),
    project: L("واحة النخيل", "Palm Oasis Residences"),
    projectSlug: "palm-oasis",
    initials: "NS",
  },
];

export const clients: Localized[] = [
  L("شركة الرياض للتطوير", "Riyadh Development Holding"),
  L("هيئة تطوير العلا", "Royal Commission for AlUla"),
  L("نيوم", "NEOM"),
  L("مجموعة البحر الأحمر", "Red Sea Group"),
  L("الهيئة الملكية لمدينة الرياض", "Royal Commission for Riyadh City"),
  L("الهيئة العامة للطرق", "General Authority for Roads"),
  L("الهيئة الملكية للجبيل وينبع", "Royal Commission for Jubail and Yanbu"),
  L("وزارة النقل", "Ministry of Transport"),
];

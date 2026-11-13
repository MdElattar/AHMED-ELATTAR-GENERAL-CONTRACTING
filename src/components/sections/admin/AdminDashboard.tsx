"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  Activity,
  ArrowUpRight,
  BarChart3,
  BellRing,
  CalendarDays,
  Check,
  ChevronDown,
  FileSignature,
  FileText,
  Flag,
  FolderKanban,
  Image as ImageIcon,
  Inbox,
  LayoutDashboard,
  Loader2,
  LogOut,
  Menu,
  MessageSquare,
  Pencil,
  Plus,
  RotateCcw,
  Save,
  Search,
  Send,
  Settings,
  ShieldCheck,
  Sparkles,
  Trash2,
  Wallet,
  X,
} from "lucide-react";
import { isAdminUser, useAuth } from "@/components/providers/AuthProvider";
import { useI18n } from "@/components/providers/I18nProvider";
import { useSmoothScroll } from "@/components/providers/SmoothScroll";
import {
  useWorkspace,
  type WorkspaceProject,
} from "@/components/providers/WorkspaceProvider";
import { AdminAccess } from "@/components/sections/admin/AdminAccess";
import { AdminCommandPalette } from "@/components/sections/admin/AdminCommandPalette";
import { AdminProjectEditor } from "@/components/sections/admin/AdminProjectEditor";
import { ExecutiveKpiBar } from "@/components/sections/admin/ExecutiveKpiBar";
import {
  AuditPanel,
  ConsultationsPanel,
  ContractsPanel,
  InquiriesPanel,
  MilestonesPanel,
  NotificationsPanel,
} from "@/components/sections/admin/AdminOperations";
import { Field, TextInput, Textarea } from "@/components/ui/Field";
import { ProjectArt } from "@/components/ui/ProjectArt";
import { Checkbox } from "@/components/ui/Checkbox";
import { AdminSectionBoundary } from "@/components/system/AdminSectionBoundary";
import { useToast } from "@/components/ui/Toast";
import type { ArtVariant } from "@/data/projects";
import { dictionary, L, type Localized } from "@/lib/dictionary";
import {
  copyGroupLabels,
  flattenCopy,
  isAllowedMediaSource,
  mediaCatalog,
  mediaGroupLabels,
  type CopyField,
  type MediaOverride,
} from "@/lib/cms";
import { acquireScrollLock, releaseScrollLock } from "@/lib/scroll/lock";
import { cn } from "@/lib/utils";

export type AdminSection =
  | "overview"
  | "projects"
  | "milestones"
  | "consultations"
  | "contracts"
  | "notifications"
  | "inquiries"
  | "financials"
  | "content"
  | "media"
  | "messages"
  | "audit"
  | "access";

type Section = AdminSection;

const sectionHrefs: Record<Section, string> = {
  overview: "/admin",
  projects: "/admin/projects",
  milestones: "/admin/milestones",
  consultations: "/admin/consultations",
  contracts: "/admin/contracts",
  notifications: "/admin/notifications",
  inquiries: "/admin/inquiries",
  financials: "/admin/financials",
  content: "/admin/site-content",
  media: "/admin/media",
  messages: "/admin/messages",
  audit: "/admin/audit",
  access: "/admin/access",
};

const copy = {
  ar: {
    admin: "لوحة الإدارة",
    control: "مركز التحكم",
    overview: "نظرة عامة",
    projects: "المشاريع",
    financials: "المالية والأرباح",
    content: "محتوى الموقع",
    media: "الوسائط والبانرات",
    messages: "رسائل العملاء",
    inquiries: "الاستفسارات",
    audit: "سجل النشاط",
    milestones: "المراحل",
    consultations: "الاستشارات",
    contracts: "العقود",
    notifications: "التنبيهات",
    access: "تفويض الصلاحيات",
    accessNavHint: "للمسؤول الرئيسي فقط",
    primaryAdmin: "المسؤول الرئيسي",
    back: "العودة للموقع",
    portal: "بوابة العملاء",
    signOut: "تسجيل الخروج",
    welcome: "مرحباً",
    commandSearch: "بحث سريع",
    commandHint: "الأوامر",
    totalProjects: "إجمالي المشاريع",
    activeProjects: "مشاريع قيد التنفيذ",
    portfolioValue: "قيمة المحفظة",
    netProfit: "صافي الربح",
    avgMargin: "متوسط الهامش",
    budgetVsSpent: "الميزانية مقابل المنفق",
    recent: "أحدث المشاريع",
    viewAll: "عرض الكل",
    addProject: "إضافة مشروع",
    search: "ابحث في المشاريع...",
    project: "المشروع",
    category: "الفئة",
    status: "الحالة",
    progress: "الإنجاز",
    value: "القيمة",
    actions: "إجراءات",
    edit: "تعديل",
    delete: "حذف",
    deleteConfirm: "هل أنت متأكد من حذف هذا المشروع؟",
    noProjects: "لا توجد مشاريع مطابقة.",
    selected: "محدد",
    selectAll: "تحديد الكل",
    clearSelection: "إلغاء التحديد",
    bulkStatus: "تغيير حالة المحدد",
    setOngoing: "قيد التنفيذ",
    setCompleted: "مكتمل",
    setUpcoming: "قادم",
    quickStatus: "اضغط لتغيير الحالة",
    exportInquiries: "تصدير الاستفسارات",
    exportAudit: "تصدير السجل",
    exportMilestones: "تصدير المراحل المالية",
    invalidMedia: "رابط غير صالح. استخدم مساراً داخلياً أو رابط HTTPS لصورة مدعومة.",
    validatingMedia: "جارٍ التحقق من الصور...",
    mediaTooLarge: "حجم الصورة يتجاوز 8 ميجابايت.",
    mediaDimensions: "يجب أن يكون كل ضلع في الصورة بين 300 و8000 بكسل.",
    mediaFormat: "الصيغة غير مدعومة. استخدم JPEG أو PNG أو WebP أو AVIF أو GIF.",
    mediaUnreachable: "تعذر الوصول إلى الصورة للتحقق منها.",
    mediaNotImage: "الرابط لا يشير إلى صورة صالحة.",
    budget: "الميزانية",
    spent: "المنفق",
    profit: "الربح",
    margin: "الهامش",
    contract: "قيمة العقد",
    paymentStages: "مراحل الدفع",
    invoice: "الفاتورة",
    amount: "القيمة",
    export: "تصدير CSV",
    selectProject: "اختر المشروع",
    heroContent: "محتوى الواجهة الرئيسية",
    heroEyebrow: "السطر العلوي",
    heroTitleTop: "العنوان — السطر الأول",
    heroTitleAccent: "العنوان — السطر المميز",
    heroDescription: "الوصف",
    promo: "شريط العرض",
    promoTitle: "عنوان الشريط",
    promoText: "نص الشريط",
    promoHref: "رابط الشريط",
    promoVisible: "إظهار الشريط",
    saveContent: "حفظ المحتوى",
    saved: "تم الحفظ.",
    serviceCards: "بطاقات الخدمات",
    selectService: "اختر الخدمة",
    serviceTitle: "عنوان الخدمة",
    serviceTagline: "السطر المختصر",
    serviceDescription: "الوصف",
    saveService: "حفظ الخدمة",
    siteCopy: "نسخ الموقع الكامل",
    siteCopyText:
      "كل نص في الموقع العام — العناوين، الأوصاف، الأزرار، القوائم، والبيانات — قابل للتعديل هنا ويُحفظ مباشرة في قاعدة البيانات.",
    searchCopy: "ابحث في النصوص...",
    resetCopy: "مسح جميع التعديلات النصية",
    saveCopy: "حفظ نسخ الموقع",
    copySaved: "تم حفظ نسخ الموقع.",
    allGroups: "كل الأقسام",
    noCopyResults: "لا توجد نصوص مطابقة لبحثك.",
    mediaAssets: "أصول الصور",
    mediaAssetsText:
      "استبدل أي صورة في الموقع برابط صورة جديد. اترك الحقل فارغاً للعودة إلى الصورة الأصلية.",
    imageSource: "رابط الصورة",
    imageAlt: "النص البديل",
    resetAsset: "استعادة الأصل",
    mediaHint: "https://... أو /path داخل الموقع",
    customised: "معدّل",
    original: "الأصل",
    mediaTitle: "مكتبة الوسائط",
    mediaText: "غيّر أغلفة المشاريع ومعارضها. التغييرات تظهر فوراً في الصفحة الرئيسية وصفحات المشاريع.",
    cover: "الغلاف",
    gallery: "المعرض",
    setCover: "تعيين كغلاف",
    messagesTitle: "رسائل العملاء",
    messagesText: "راجع رسائل بوابة العملاء وردّ مباشرة.",
    reply: "ردّ كمدير المشروع",
    replyPlaceholder: "اكتب ردك...",
    send: "إرسال الرد",
    noMessages: "لا توجد رسائل.",
    client: "العميل",
    manager: "مدير المشروع",
    accessTitle: "صلاحية إدارية مطلوبة",
    accessText: "سجّل الدخول بحساب إداري للوصول إلى لوحة التحكم.",
    signIn: "تسجيل الدخول",
    secureNote: "جلسة آمنة · بيانات محدثة مباشرة.",
    categoryLabels: {
      commercial: "تجاري",
      residential: "سكني",
      infrastructure: "بنية تحتية",
      industrial: "صناعي",
    },
    statusLabels: {
      completed: "مكتمل",
      ongoing: "قيد التنفيذ",
      upcoming: "قادم",
    },
    invoiceStatus: {
      paid: "مدفوع",
      due: "مستحق",
      pending: "معلق",
    },
    artLabels: {
      tower: "برج",
      villa: "فيلا",
      bridge: "جسر",
      industrial: "صناعي",
      heritage: "تراثي",
      interchange: "تقاطع",
      marina: "مارينا",
      solar: "طاقة شمسية",
    },
  },
  en: {
    admin: "Admin panel",
    control: "Control center",
    overview: "Overview",
    projects: "Projects",
    financials: "Financials & profit",
    content: "Site content",
    media: "Media & banners",
    messages: "Client messages",
    inquiries: "Inquiries",
    audit: "Audit trail",
    milestones: "Milestones",
    consultations: "Consultations",
    contracts: "Contracts",
    notifications: "Alerts",
    access: "Admin delegation",
    accessNavHint: "Primary admin only",
    primaryAdmin: "Primary admin",
    back: "Back to site",
    portal: "Client portal",
    signOut: "Sign out",
    welcome: "Welcome",
    commandSearch: "Quick search",
    commandHint: "Commands",
    totalProjects: "Total projects",
    activeProjects: "Active projects",
    portfolioValue: "Portfolio value",
    netProfit: "Net profit",
    avgMargin: "Average margin",
    budgetVsSpent: "Budget vs spent",
    recent: "Recent projects",
    viewAll: "View all",
    addProject: "Add project",
    search: "Search projects...",
    project: "Project",
    category: "Category",
    status: "Status",
    progress: "Progress",
    value: "Value",
    actions: "Actions",
    edit: "Edit",
    delete: "Delete",
    deleteConfirm: "Delete this project?",
    noProjects: "No matching projects.",
    selected: "selected",
    selectAll: "Select all",
    clearSelection: "Clear selection",
    bulkStatus: "Bulk status",
    setOngoing: "Ongoing",
    setCompleted: "Completed",
    setUpcoming: "Upcoming",
    quickStatus: "Click to change status",
    exportInquiries: "Export inquiries",
    exportAudit: "Export log",
    exportMilestones: "Export milestones",
    invalidMedia: "Invalid link. Use a local path or an HTTPS URL for a supported image.",
    validatingMedia: "Validating images...",
    mediaTooLarge: "Image file is larger than 8 MB.",
    mediaDimensions: "Image edges must be between 300 and 8000 pixels.",
    mediaFormat: "Unsupported format. Use JPEG, PNG, WebP, AVIF, or GIF.",
    mediaUnreachable: "The image could not be reached for validation.",
    mediaNotImage: "The link is not a valid image.",
    budget: "Budget",
    spent: "Spent",
    profit: "Profit",
    margin: "Margin",
    contract: "Contract value",
    paymentStages: "Payment stages",
    invoice: "Invoice",
    amount: "Amount",
    export: "Export CSV",
    selectProject: "Select project",
    heroContent: "Homepage hero content",
    heroEyebrow: "Eyebrow",
    heroTitleTop: "Title — first line",
    heroTitleAccent: "Title — accent line",
    heroDescription: "Description",
    promo: "Promo banner",
    promoTitle: "Banner title",
    promoText: "Banner text",
    promoHref: "Banner link",
    promoVisible: "Show banner",
    saveContent: "Save content",
    saved: "Saved.",
    serviceCards: "Service cards",
    selectService: "Select service",
    serviceTitle: "Service title",
    serviceTagline: "Short tagline",
    serviceDescription: "Description",
    saveService: "Save service",
    siteCopy: "Complete site copy",
    siteCopyText:
      "Every string on the public site — headlines, descriptions, buttons, menus, and metadata — is editable here and persisted directly to the database.",
    searchCopy: "Search copy...",
    resetCopy: "Clear all copy overrides",
    saveCopy: "Save site copy",
    copySaved: "Site copy saved.",
    allGroups: "All sections",
    noCopyResults: "No copy matches your search.",
    mediaAssets: "Image assets",
    mediaAssetsText:
      "Replace any photograph on the public site with a new image URL. Leave a field empty to inherit the original.",
    imageSource: "Image URL",
    imageAlt: "Alt text",
    resetAsset: "Reset to original",
    mediaHint: "https://... or a /path inside this site",
    customised: "Customised",
    original: "Original",
    mediaTitle: "Media library",
    mediaText: "Change project covers and galleries. Changes appear instantly on the homepage and project pages.",
    cover: "Cover",
    gallery: "Gallery",
    setCover: "Set as cover",
    messagesTitle: "Client messages",
    messagesText: "Review client portal messages and reply directly.",
    reply: "Reply as project manager",
    replyPlaceholder: "Write your reply...",
    send: "Send reply",
    noMessages: "No messages.",
    client: "Client",
    manager: "Project manager",
    accessTitle: "Admin access required",
    accessText: "Sign in with an administrator account to access the control center.",
    signIn: "Sign in",
    secureNote: "Secure session · live data.",
    categoryLabels: {
      commercial: "Commercial",
      residential: "Residential",
      infrastructure: "Infrastructure",
      industrial: "Industrial",
    },
    statusLabels: {
      completed: "Completed",
      ongoing: "Ongoing",
      upcoming: "Upcoming",
    },
    invoiceStatus: {
      paid: "Paid",
      due: "Due",
      pending: "Pending",
    },
    artLabels: {
      tower: "Tower",
      villa: "Villa",
      bridge: "Bridge",
      industrial: "Industrial",
      heritage: "Heritage",
      interchange: "Interchange",
      marina: "Marina",
      solar: "Solar",
    },
  },
};

const artVariants: ArtVariant[] = [
  "tower",
  "villa",
  "bridge",
  "industrial",
  "heritage",
  "interchange",
  "marina",
  "solar",
];

const formatM = (value: number, locale: "ar" | "en") =>
  `${new Intl.NumberFormat(locale === "ar" ? "ar-SA" : "en-US", {
    maximumFractionDigits: 1,
  }).format(value)}M`;

const formatMoney = (value: number, locale: "ar" | "en") => {
  const sar = locale === "ar" ? "ر.س" : "SAR";
  const abs = Math.abs(value);
  if (abs >= 1000) {
    const formatted = new Intl.NumberFormat(locale === "ar" ? "ar-SA" : "en-US", {
      maximumFractionDigits: 2,
    }).format(value / 1000);
    return `${sar} ${formatted}B`;
  }
  const formatted = new Intl.NumberFormat(locale === "ar" ? "ar-SA" : "en-US", {
    maximumFractionDigits: 1,
  }).format(value);
  return `${sar} ${formatted}M`;
};

const budgetRisk = (spent: number, budget: number) => {
  const ratio = budget > 0 ? spent / budget : 0;
  if (ratio >= 0.95) return "critical";
  if (ratio >= 0.8) return "warning";
  return "healthy";
};

export function AdminDashboard({
  initialSection = "overview",
}: {
  initialSection?: AdminSection;
}) {
  const { locale } = useI18n();
  const { user, ready, signOut } = useAuth();
  const { projects, messages, addProject, updateProject, deleteProject } =
    useWorkspace();
  const { scrollToTop, stop, start } = useSmoothScroll();
  const router = useRouter();
  const c = copy[locale];
  const [section, setSection] = useState<Section>(initialSection);
  const [editing, setEditing] = useState<WorkspaceProject | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    if (paletteOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setPaletteOpen(true);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [paletteOpen]);

  useEffect(() => {
    if (!mobileNavOpen) return;
    acquireScrollLock(stop);
    return () => releaseScrollLock(start);
  }, [mobileNavOpen, start, stop]);

  useEffect(() => {
    if (!mobileNavOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMobileNavOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [mobileNavOpen]);

  const navigateToSection = (next: Section, focusId?: string) => {
    setSection(next);
    setMobileNavOpen(false);
    const href = sectionHrefs[next];
    router.push(
      focusId ? `${href}?focus=${encodeURIComponent(focusId)}` : href,
    );
  };

  if (!ready) {
    return (
      <section className="flex min-h-[80svh] items-center justify-center bg-obsidian pt-24">
        <span className="h-8 w-8 animate-spin rounded-full border border-white/15 border-t-gold" />
      </section>
    );
  }

  const isAdmin = isAdminUser(user);

  if (!user || !isAdmin) {
    return (
      <section className="relative flex min-h-[100svh] items-center overflow-hidden bg-obsidian pt-24">
        <div className="blueprint-grid pointer-events-none absolute inset-0 opacity-40" />
        <div className="container-lux relative">
          <div className="mx-auto flex max-w-lg flex-col items-center text-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-full border border-gold/30 bg-gold/5 text-gold">
              <ShieldCheck className="h-5 w-5" />
            </span>
            <h1 className="display-title mt-6 text-[clamp(2.6rem,5vw,4.4rem)] text-ivory">
              {c.accessTitle}
            </h1>
            <p className="mt-5 max-w-md text-[0.9rem] leading-[1.9] text-ivory/60">
              {c.accessText}
            </p>
            <Link
              href="/sign-in"
              className="btn-shine mt-9 inline-flex h-12 items-center gap-2.5 bg-gold px-7 text-[0.8rem] font-semibold uppercase tracking-[0.16em] text-obsidian transition-colors hover:bg-gold-light"
            >
              {c.signIn}
              <ArrowUpRight className="h-4 w-4" />
            </Link>
            <p className="mt-6 text-[0.76rem] text-ivory/40">{c.secureNote}</p>
          </div>
        </div>
      </section>
    );
  }

  const navGroups: { title: string; items: { id: Section; label: string; icon: typeof LayoutDashboard }[] }[] = [
    {
      title: locale === "ar" ? "العمليات" : "Operations",
      items: [
        { id: "overview", label: c.overview, icon: LayoutDashboard },
        { id: "projects", label: c.projects, icon: FolderKanban },
        { id: "milestones", label: c.milestones, icon: Flag },
        { id: "contracts", label: c.contracts, icon: FileSignature },
      ],
    },
    {
      title: locale === "ar" ? "الأعمال" : "Business",
      items: [
        { id: "consultations", label: c.consultations, icon: CalendarDays },
        { id: "inquiries", label: c.inquiries, icon: Inbox },
        { id: "financials", label: c.financials, icon: Wallet },
      ],
    },
    {
      title: locale === "ar" ? "المحتوى" : "Content",
      items: [
        { id: "content", label: c.content, icon: Settings },
        { id: "media", label: c.media, icon: ImageIcon },
        { id: "messages", label: c.messages, icon: MessageSquare },
      ],
    },
    {
      title: locale === "ar" ? "النظام" : "System",
      items: [
        { id: "notifications", label: c.notifications, icon: BellRing },
        { id: "audit", label: c.audit, icon: Activity },
        ...(user.primaryAdmin
          ? ([{ id: "access", label: c.access, icon: ShieldCheck }] satisfies {
              id: Section;
              label: string;
              icon: typeof LayoutDashboard;
            }[])
          : []),
      ],
    },
  ];

  const navItems = navGroups.flatMap((group) => group.items);
  const paletteSections = navItems.map(({ id, label }) => ({ id, label }));

  const openNew = () => {
    setEditing(null);
    setEditorOpen(true);
  };

  const openEdit = (project: WorkspaceProject) => {
    setEditing(project);
    setEditorOpen(true);
  };

  const saveProject = (project: WorkspaceProject) => {
    if (editing) updateProject(editing.slug, project);
    else addProject(project);
    setEditorOpen(false);
    setEditing(null);
  };

  const sidebarContent = (collapsed = false) => (
    <>
      <div className={cn("flex items-start justify-between gap-3 border-b border-white/10 pb-4", collapsed && "justify-center")}>
        {!collapsed ? (
          <div className="min-w-0">
            <span className="text-[0.66rem] uppercase tracking-[0.18em] text-gold">
              {c.admin}
            </span>
            <p className="mt-1 truncate font-display text-xl leading-none text-ivory sm:text-2xl">
              AHMED ELATTAR
            </p>
            <p className="mt-1 text-[0.7rem] uppercase tracking-[0.14em] text-ivory/45">{c.control}</p>
          </div>
        ) : (
          <span className="font-display text-lg text-gold" title="AHMED ELATTAR">AE</span>
        )}
        <button
          type="button"
          onClick={() => setMobileNavOpen(false)}
          className="inline-flex h-10 w-10 items-center justify-center border border-white/12 text-ivory/60 transition-colors hover:border-gold/40 hover:text-gold lg:hidden"
          aria-label={c.back}
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      <nav className="mt-3 flex flex-col gap-4" aria-label={c.admin}>
        {navGroups.map((group) => (
          <div key={group.title}>
            {!collapsed ? (
              <p className="mb-1.5 px-3 text-[0.62rem] font-semibold uppercase tracking-[0.16em] text-ivory/35">
                {group.title}
              </p>
            ) : (
              <div className="mb-1.5 h-px bg-white/10" aria-hidden="true" />
            )}
            <div className="flex flex-col gap-1">
              {group.items.map(({ id, label, icon: Icon }) => {
                const active = section === id;
                const badge = id === "messages" ? messages.length : 0;
                return (
                  <Link
                    key={id}
                    href={sectionHrefs[id]}
                    title={collapsed ? label : undefined}
                    onClick={() => {
                      setSection(id);
                      setMobileNavOpen(false);
                      if (active) scrollToTop();
                    }}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "group relative flex min-h-11 items-center gap-2.5 overflow-hidden border-s-2 px-3 py-2.5 text-start text-[0.8rem] font-medium transition-all duration-150 ease-[cubic-bezier(0.16,1,0.3,1)]",
                      collapsed && "justify-center px-2",
                      active
                        ? "border-gold bg-transparent text-gold"
                        : "border-transparent text-ivory/60 hover:bg-white/[0.03] hover:text-gold/90",
                    )}
                  >
                    <span
                      className={cn(
                        "relative flex h-8 w-8 shrink-0 items-center justify-center rounded-sm transition-colors duration-150",
                        active ? "bg-gold/10 text-gold" : "bg-white/[0.03] text-ivory/60 group-hover:text-gold",
                      )}
                    >
                      <Icon className="h-4 w-4" />
                    </span>
                    {!collapsed ? <span className="relative flex-1 truncate">{label}</span> : null}
                    {!collapsed && badge > 0 ? (
                      <span className="relative inline-flex min-w-5 items-center justify-center rounded-full border border-gold/30 bg-gold/10 px-1.5 py-0.5 text-[0.62rem] tabular-nums text-gold">
                        {badge}
                      </span>
                    ) : null}
                    {collapsed && badge > 0 ? (
                      <span className="absolute end-1 top-1 h-2 w-2 rounded-full bg-gold" aria-hidden="true" />
                    ) : null}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {!collapsed ? (
        <div className="mt-4 space-y-1 border-t border-white/10 pt-3">
          <Link
            href="/portal"
            onClick={() => setMobileNavOpen(false)}
            className="flex min-h-10 items-center gap-2.5 px-3 py-2 text-[0.78rem] text-ivory/55 transition-colors hover:text-gold"
          >
            <LayoutDashboard className="h-3.5 w-3.5" />
            {c.portal}
          </Link>
          <button
            type="button"
            onClick={() => {
              setMobileNavOpen(false);
              signOut();
              router.push("/");
            }}
            className="flex min-h-10 w-full items-center gap-2.5 px-3 py-2 text-start text-[0.78rem] text-ivory/55 transition-colors hover:text-gold"
          >
            <LogOut className="h-3.5 w-3.5" />
            {c.signOut}
          </button>
        </div>
      ) : null}
    </>
  );

  return (
    <>
      <section className="relative min-h-[100svh] overflow-hidden bg-obsidian pt-28 pb-12 text-ivory sm:pt-28">
        <div className="blueprint-grid pointer-events-none absolute inset-0 opacity-25" />
        <div className="pointer-events-none absolute -end-20 top-24 select-none text-[14rem] font-semibold leading-none tracking-tighter text-white/[0.02] sm:text-[20rem]">
          ADMIN
        </div>
        {mobileNavOpen ? (
          <div className="fixed inset-0 z-[120] overscroll-contain lg:hidden" role="dialog" aria-modal="true">
            <button
              type="button"
              className="absolute inset-0 bg-obsidian/70 backdrop-blur-sm"
              aria-label={c.back}
              onClick={() => setMobileNavOpen(false)}
            />
            <aside
              data-lenis-prevent
              className="absolute inset-y-0 start-0 h-full w-[min(22rem,88vw)] overflow-y-auto overscroll-contain border-e border-white/10 bg-[#0e1017]/98 p-4 shadow-lux backdrop-blur-md"
            >
              {sidebarContent(false)}
            </aside>
          </div>
        ) : null}

        <div className="relative mx-auto w-full max-w-[1600px] px-4 sm:px-6 lg:px-8">
          <div className={cn("lg:grid lg:items-start lg:gap-6", sidebarCollapsed ? "lg:grid-cols-[88px_1fr]" : "lg:grid-cols-[280px_1fr]")}>
            <aside className={cn("hidden border border-white/10 bg-[#0e1017]/95 p-4 backdrop-blur transition-all duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] hover:border-gold/20 lg:block lg:self-stretch", sidebarCollapsed && "px-2")}>
              <div className={cn("mb-3 flex", sidebarCollapsed ? "justify-center" : "justify-end")}>
                <button
                  type="button"
                  onClick={() => setSidebarCollapsed((v) => !v)}
                  className="inline-flex h-9 w-9 items-center justify-center border border-white/12 text-ivory/55 transition-colors hover:border-gold/40 hover:text-gold"
                  aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
                  title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
                >
                  <ChevronDown className={cn("h-4 w-4 transition-transform", sidebarCollapsed ? "-rotate-90 rtl:rotate-90" : "rotate-90 rtl:-rotate-90")} />
                </button>
              </div>
              {sidebarContent(sidebarCollapsed)}
            </aside>

            <div className="min-w-0 border border-white/10 bg-[#0e1017]/70">
              <div className="flex flex-col justify-between gap-3 border-b border-white/10 bg-[#0e1017]/95 p-4 backdrop-blur sm:flex-row sm:items-center sm:p-5">
                <div className="flex min-w-0 items-start gap-3">
                  <button
                    type="button"
                    onClick={() => setMobileNavOpen(true)}
                    className="mt-0.5 inline-flex h-10 w-10 shrink-0 items-center justify-center border border-white/12 text-ivory/70 transition-colors hover:border-gold/40 hover:text-gold lg:hidden"
                    aria-label={c.admin}
                  >
                    <Menu className="h-4 w-4" />
                  </button>
                  <div className="min-w-0">
                    <span className="text-[0.68rem] uppercase tracking-[0.16em] text-gold/80">
                      {c.welcome}
                    </span>
                    <h1 className="mt-1 font-display text-xl leading-tight text-ivory sm:text-2xl">
                      {user.name}
                    </h1>
                    <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[0.76rem] text-ivory/45 sm:text-[0.8rem]">
                      <span className="max-w-full truncate tabular-nums" dir="ltr" title={user.email}>
                        {user.email}
                      </span>
                      {user.primaryAdmin ? (
                        <span className="border border-gold/25 px-2 py-0.5 text-[0.64rem] uppercase tracking-[0.1em] text-gold">
                          {c.primaryAdmin}
                        </span>
                      ) : null}
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Link
                    href="/portal"
                    className="inline-flex h-10 items-center gap-2 border border-white/12 px-3.5 text-[0.7rem] font-semibold uppercase tracking-[0.12em] text-ivory/60 transition-colors hover:border-gold/40 hover:text-gold"
                  >
                    {c.portal}
                    <ArrowUpRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>

              <div className="px-4 py-5 sm:px-6 sm:py-6 lg:px-8">
                <AdminSectionBoundary label={navItems.find((item) => item.id === section)?.label}>
                  {section === "overview" ? (
                  <OverviewSection projects={projects} messages={messages} onNew={openNew} onNavigate={navigateToSection} />
                ) : null}
                {section === "projects" ? (
                  <ProjectsSection
                    projects={projects}
                    onNew={openNew}
                    onEdit={openEdit}
                    onDelete={(project) => {
                      if (window.confirm(c.deleteConfirm)) {
                        deleteProject(project.slug);
                      }
                    }}
                  />
                ) : null}
                {section === "milestones" ? <MilestonesPanel /> : null}
                {section === "consultations" ? <ConsultationsPanel /> : null}
                {section === "contracts" ? <ContractsPanel /> : null}
                {section === "notifications" ? <NotificationsPanel /> : null}
                {section === "inquiries" ? <InquiriesPanel /> : null}
                {section === "financials" ? <FinancialsSection projects={projects} /> : null}
                {section === "content" ? <ContentSection /> : null}
                {section === "access" ? <AdminAccess /> : null}
                {section === "media" ? <MediaSection projects={projects} /> : null}
                {section === "messages" ? <MessagesSection projects={projects} /> : null}
                  {section === "audit" ? <AuditPanel /> : null}
                </AdminSectionBoundary>
              </div>
            </div>
          </div>
        </div>
      </section>

      {paletteOpen ? (
        <AdminCommandPalette
          projects={projects}
          sections={paletteSections}
          onClose={() => setPaletteOpen(false)}
          onOpenProject={openEdit}
          onNavigate={navigateToSection}
        />
      ) : null}

      {editorOpen ? (
        <AdminProjectEditor
          key={editing?.slug ?? "new"}
          project={editing}
          existingSlugs={projects.map((project) => project.slug)}
          onClose={() => {
            setEditorOpen(false);
            setEditing(null);
          }}
          onSave={saveProject}
        />
      ) : null}
    </>
  );
}

function OverviewSection({
  projects,
  messages,
  onNew,
  onNavigate,
}: {
  projects: WorkspaceProject[];
  messages: { id: string }[];
  onNew: () => void;
  onNavigate: (section: Section) => void;
}) {
  const { locale, l } = useI18n();
  const c = copy[locale];
  const [showMetrics, setShowMetrics] = useState(true);
  const totalValue = projects.reduce((sum, project) => sum + project.contractValue, 0);
  const totalProfit = projects.reduce((sum, project) => sum + project.profit, 0);
  const avgMargin = totalValue ? (totalProfit / totalValue) * 100 : 0;
  const top = [...projects].sort((a, b) => b.budget - a.budget).slice(0, 5);

  const exportOverviewCsv = () => {
    const rows = [
      ["Project", "Category", "Status", "Progress", "Budget", "Spent", "Profit", "Contract Value"],
      ...projects.map((project) => [
        project.title.en || project.title.ar || project.slug,
        project.category,
        project.status,
        String(project.progress),
        String(project.budget),
        String(project.spent),
        String(project.profit),
        String(project.contractValue),
      ]),
    ];
    const content = rows.map((row) => row.join(",")).join("\n");
    const blob = new Blob([content], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "admin-overview-analytics.csv";
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 border border-white/10 bg-coal/80 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-gold">
            {locale === "ar" ? "إجراءات سريعة وتحليلات" : "Quick actions & analytics"}
          </p>
          <p className="mt-1 text-[0.76rem] text-ivory/45">
            {locale === "ar"
              ? "تصدير فوري للبيانات والتحكم في عرض مؤشرات الأداء."
              : "Export live data instantly and toggle executive performance metrics."}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setShowMetrics((value) => !value)}
            className={cn(
              "inline-flex h-10 items-center gap-2 border px-3.5 text-[0.7rem] font-semibold uppercase tracking-[0.12em] transition-colors",
              showMetrics
                ? "border-gold/40 bg-gold/10 text-gold"
                : "border-white/12 text-ivory/60 hover:border-gold/40 hover:text-gold",
            )}
          >
            <BarChart3 className="h-3.5 w-3.5" />
            {showMetrics
              ? locale === "ar"
                ? "إخفاء المؤشرات"
                : "Hide metrics"
              : locale === "ar"
                ? "إظهار المؤشرات"
                : "Show metrics"}
          </button>
          <button
            type="button"
            onClick={exportOverviewCsv}
            className="inline-flex h-10 items-center gap-2 border border-white/12 px-3.5 text-[0.7rem] font-semibold uppercase tracking-[0.12em] text-ivory/60 transition-colors hover:border-gold/40 hover:text-gold"
          >
            <FileText className="h-3.5 w-3.5" />
            {locale === "ar" ? "تصدير التحليلات" : "Export analytics"}
          </button>
          <button
            type="button"
            onClick={onNew}
            className="inline-flex h-10 items-center gap-2 bg-gold px-3.5 text-[0.7rem] font-semibold uppercase tracking-[0.12em] text-obsidian transition-colors hover:bg-gold-light"
          >
            <Plus className="h-3.5 w-3.5" />
            {c.addProject}
          </button>
        </div>
      </div>

      {showMetrics ? <ExecutiveKpiBar /> : null}

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="border border-white/10 bg-coal p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-gold">
              {c.budgetVsSpent}
            </span>
            <span className="tabular text-[0.7rem] text-ivory/40">
              {c.avgMargin} {avgMargin.toFixed(1)}%
            </span>
          </div>
          <div className="mt-6 space-y-5">
            {([...top]
              .sort((a, b) => b.spent / Math.max(1, b.budget) - a.spent / Math.max(1, a.budget))
            ).map((project) => {
              const risk = budgetRisk(project.spent, project.budget);
              const ratio = Math.min(100, (project.spent / Math.max(1, project.budget)) * 100);
              return (
                <div key={project.slug}>
                  <div className="flex items-center justify-between gap-3 text-[0.74rem]">
                    <span className="truncate text-ivory/60">{l(project.title)}</span>
                    <span className={cn("tabular-nums shrink-0", risk === "critical" ? "text-red-300/80" : risk === "warning" ? "text-amber-300/80" : "text-ivory/45")}>
                      {formatMoney(project.spent, locale)} / {formatMoney(project.budget, locale)}
                    </span>
                  </div>
                  <div className="mt-1.5 flex h-1.5 overflow-hidden bg-white/10">
                    <div
                      className={cn("h-full", risk === "critical" ? "bg-red-400/80" : risk === "warning" ? "bg-amber-400/80" : "bg-emerald-400/70")}
                      style={{ width: `${ratio}%` }}
                    />
                  </div>
                  {risk === "critical" ? (
                    <p className="mt-1 text-[0.66rem] text-red-300/75">
                      {locale === "ar" ? "تحذير: ميزانية حرجة" : "Critical budget risk"}
                    </p>
                  ) : null}
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <button
            type="button"
            onClick={onNew}
            className="group flex items-center justify-between gap-4 border border-gold/30 bg-gold/[0.06] p-6 text-start transition-colors hover:border-gold/70"
          >
            <div>
              <p className="flex items-center gap-2 text-[0.88rem] font-medium text-ivory">
                <Plus className="h-4 w-4 text-gold" />
                {c.addProject}
              </p>
              <p className="mt-1.5 text-[0.74rem] text-ivory/50">{c.projects}</p>
            </div>
            <ArrowUpRight className="h-4 w-4 text-gold transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
          </button>
          <button
            type="button"
            onClick={() => onNavigate("financials")}
            className="group flex items-center justify-between gap-4 border border-white/10 bg-coal p-6 text-start transition-colors hover:border-gold/40"
          >
            <div>
              <p className="flex items-center gap-2 text-[0.88rem] font-medium text-ivory">
                <BarChart3 className="h-4 w-4 text-gold" />
                {c.financials}
              </p>
              <p className="mt-1.5 text-[0.74rem] text-ivory/50">{c.paymentStages}</p>
            </div>
            <ArrowUpRight className="h-4 w-4 text-gold transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
          </button>
          <button
            type="button"
            onClick={() => onNavigate("messages")}
            className="group flex items-center justify-between gap-4 border border-white/10 bg-coal p-6 text-start transition-colors hover:border-gold/40"
          >
            <div>
              <p className="flex items-center gap-2 text-[0.88rem] font-medium text-ivory">
                <MessageSquare className="h-4 w-4 text-gold" />
                {c.messages}
              </p>
              <p className="mt-1.5 text-[0.74rem] text-ivory/50">
                {messages.length} {c.messages}
              </p>
            </div>
            <ArrowUpRight className="h-4 w-4 text-gold transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
          </button>
        </div>
      </div>

      <div className="border border-white/10 bg-coal">
        <div className="flex items-center justify-between gap-3 border-b border-white/10 px-5 py-4">
          <span className="text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-gold">
            {c.recent}
          </span>
          <button
            type="button"
            onClick={() => onNavigate("projects")}
            className="text-[0.7rem] font-semibold uppercase tracking-[0.12em] text-ivory/45 transition-colors hover:text-gold"
          >
            {c.viewAll}
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px] text-start">
            <thead>
              <tr className="border-b border-white/8 text-[0.64rem] uppercase tracking-[0.14em] text-ivory/40">
                <th className="px-5 py-3.5 text-start font-medium">{c.project}</th>
                <th className="px-4 py-3.5 text-start font-medium">{c.category}</th>
                <th className="px-4 py-3.5 text-start font-medium">{c.status}</th>
                <th className="px-4 py-3.5 text-start font-medium">{c.progress}</th>
                <th className="px-5 py-3.5 text-end font-medium">{c.value}</th>
              </tr>
            </thead>
            <tbody>
              {projects.slice(0, 5).map((project) => (
                <tr key={project.slug} className="border-b border-white/6 last:border-0">
                  <td className="px-5 py-4">
                    <span className="text-[0.82rem] text-ivory/75">{l(project.title)}</span>
                  </td>
                  <td className="px-4 py-4 text-[0.72rem] text-ivory/50">
                    {c.categoryLabels[project.category]}
                  </td>
                  <td className="px-4 py-4">
                    <span
                      className={cn(
                        "inline-flex min-h-7 items-center px-2.5 text-[0.64rem] uppercase tracking-[0.1em]",
                        project.status === "ongoing"
                          ? "bg-gold/15 text-gold"
                          : project.status === "completed"
                            ? "bg-emerald-400/10 text-emerald-300/80"
                            : "bg-sky-400/10 text-sky-300/80",
                      )}
                    >
                      {c.statusLabels[project.status]}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <span className="flex items-center gap-2">
                      <span className="h-1.5 w-14 overflow-hidden bg-white/10">
                        <span
                          className="block h-full bg-gold"
                          style={{ width: `${project.progress}%` }}
                        />
                      </span>
                      <span className="tabular text-[0.7rem] text-ivory/45">
                        {project.progress}%
                      </span>
                    </span>
                  </td>
                  <td className="px-5 py-4 text-end text-[0.74rem] text-ivory/55">
                    {l(project.value)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function ProjectsSection({
  projects,
  onNew,
  onEdit,
  onDelete,
}: {
  projects: WorkspaceProject[];
  onNew: () => void;
  onEdit: (project: WorkspaceProject) => void;
  onDelete: (project: WorkspaceProject) => void;
}) {
  const { locale, l } = useI18n();
  const c = copy[locale];
  const { updateProject } = useWorkspace();
  const { toast } = useToast();
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | WorkspaceProject["status"]>("all");
  const [categoryFilter, setCategoryFilter] = useState<"all" | WorkspaceProject["category"]>("all");
  const [sortBy, setSortBy] = useState<"updated" | "budget" | "progress" | "risk">("risk");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Set<string>>(() => new Set());
  const [detail, setDetail] = useState<WorkspaceProject | null>(null);
  const pageSize = 8;

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    const base = projects.filter((project) => {
      if (statusFilter !== "all" && project.status !== statusFilter) return false;
      if (categoryFilter !== "all" && project.category !== categoryFilter) return false;
      if (!normalized) return true;
      return [project.title.ar, project.title.en, project.location.ar, project.location.en, project.category]
        .join(" ")
        .toLowerCase()
        .includes(normalized);
    });
    const sorted = [...base].sort((a, b) => {
      if (sortBy === "budget") return b.budget - a.budget;
      if (sortBy === "progress") return b.progress - a.progress;
      if (sortBy === "risk") {
        const ra = a.spent / Math.max(1, a.budget);
        const rb = b.spent / Math.max(1, b.budget);
        return rb - ra;
      }
      return (b.updatedAt || "").localeCompare(a.updatedAt || "");
    });
    return sorted;
  }, [categoryFilter, projects, query, sortBy, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const paged = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const allSelected =
    paged.length > 0 && paged.every((project) => selected.has(project.slug));

  const toggleSelected = (slug: string) => {
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(slug)) next.delete(slug);
      else next.add(slug);
      return next;
    });
  };

  const toggleAll = () => {
    setSelected((current) => {
      const next = new Set(current);
      if (paged.every((project) => current.has(project.slug))) {
        paged.forEach((project) => next.delete(project.slug));
      } else {
        paged.forEach((project) => next.add(project.slug));
      }
      return next;
    });
  };

  const cycleStatus = (project: WorkspaceProject) => {
    const nextStatus: Record<WorkspaceProject["status"], WorkspaceProject["status"]> = {
      ongoing: "completed",
      completed: "upcoming",
      upcoming: "ongoing",
    };
    updateProject(project.slug, { status: nextStatus[project.status] });
  };

  const applyBulkStatus = (status: WorkspaceProject["status"]) => {
    const known = new Set(projects.map((project) => project.slug));
    for (const slug of selected) {
      if (known.has(slug)) updateProject(slug, { status });
    }
    toast(locale === "ar" ? "تم تحديث الحالة" : "Status updated", "success");
    setSelected(new Set<string>());
  };

  const exportCsv = () => {
    const rows = [
      ["Project", "Category", "Status", "Progress", "Value", "Budget", "Spent"],
      ...filtered.map((project) => [
        project.title.en || project.title.ar,
        project.category,
        project.status,
        String(project.progress),
        project.value.en || project.value.ar || "",
        String(project.budget),
        String(project.spent),
      ]),
    ];
    const blob = new Blob([rows.map((r) => r.join(",")).join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "ahmed-elattar-projects.csv";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    toast(locale === "ar" ? "تم التصدير" : "Export ready", "success");
  };

  const handleDelete = (project: WorkspaceProject) => {
    if (!window.confirm(c.deleteConfirm)) return;
    onDelete(project);
    toast(
      locale === "ar"
        ? "تمت إزالة المشروع. يمكنك إعادة الإضافة عند الحاجة."
        : "Project removed. You can restore/recreate it if needed.",
      "success",
    );
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col justify-between gap-3 xl:flex-row xl:items-end">
        <div>
          <h2 className="font-display text-2xl text-ivory">{c.projects}</h2>
          <p className="mt-1 text-[0.76rem] tabular-nums text-ivory/45">
            {filtered.length} / {projects.length}
          </p>
        </div>
        <div className="grid w-full gap-2 sm:grid-cols-2 xl:flex xl:w-auto xl:flex-wrap xl:items-center">
          <input
            value={query}
            onChange={(event) => { setQuery(event.target.value); setPage(1); }}
            placeholder={c.search}
            className="h-10 w-full border border-white/12 bg-transparent px-3 text-[0.8rem] text-ivory outline-none placeholder:text-ivory/35 focus:border-gold/50 xl:w-56"
          />
          <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value as typeof statusFilter); setPage(1); }} className="h-10 border border-white/12 bg-coal px-3 text-[0.74rem] text-ivory/70 outline-none focus:border-gold/50">
            <option value="all">{locale === "ar" ? "كل الحالات" : "All statuses"}</option>
            <option value="ongoing">{c.statusLabels.ongoing}</option>
            <option value="completed">{c.statusLabels.completed}</option>
            <option value="upcoming">{c.statusLabels.upcoming}</option>
          </select>
          <select value={categoryFilter} onChange={(e) => { setCategoryFilter(e.target.value as typeof categoryFilter); setPage(1); }} className="h-10 border border-white/12 bg-coal px-3 text-[0.74rem] text-ivory/70 outline-none focus:border-gold/50">
            <option value="all">{locale === "ar" ? "كل الفئات" : "All categories"}</option>
            <option value="commercial">{c.categoryLabels.commercial}</option>
            <option value="residential">{c.categoryLabels.residential}</option>
            <option value="infrastructure">{c.categoryLabels.infrastructure}</option>
            <option value="industrial">{c.categoryLabels.industrial}</option>
          </select>
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value as typeof sortBy)} className="h-10 border border-white/12 bg-coal px-3 text-[0.74rem] text-ivory/70 outline-none focus:border-gold/50">
            <option value="risk">{locale === "ar" ? "الأعلى خطورة" : "Highest risk"}</option>
            <option value="budget">{locale === "ar" ? "الميزانية" : "Budget"}</option>
            <option value="progress">{locale === "ar" ? "الإنجاز" : "Progress"}</option>
            <option value="updated">{locale === "ar" ? "الأحدث" : "Latest"}</option>
          </select>
          <button type="button" onClick={exportCsv} className="inline-flex h-10 items-center justify-center gap-2 border border-white/12 px-3.5 text-[0.7rem] font-semibold uppercase tracking-[0.12em] text-ivory/60 transition-colors hover:border-gold/40 hover:text-gold">
            <FileText className="h-3.5 w-3.5" />
            {c.export}
          </button>
          <button type="button" onClick={onNew} className="inline-flex h-10 items-center justify-center gap-2 bg-gold px-4 text-[0.7rem] font-semibold uppercase tracking-[0.12em] text-obsidian transition-colors hover:bg-gold-light">
            <Plus className="h-4 w-4" />
            {c.addProject}
          </button>
        </div>
      </div>

      {selected.size > 0 ? (
        <div className="sticky bottom-4 z-20 flex flex-wrap items-center gap-2 border border-gold/25 bg-[#0e1017]/95 px-3 py-2.5 shadow-lux backdrop-blur">
          <span className="text-[0.7rem] font-semibold uppercase tracking-[0.12em] text-gold tabular-nums">
            {selected.size} {c.selected}
          </span>
          <span className="text-[0.66rem] uppercase tracking-[0.1em] text-ivory/45">{c.bulkStatus}</span>
          {(["ongoing", "completed", "upcoming"] as const).map((status) => (
            <button key={status} type="button" onClick={() => applyBulkStatus(status)} className="h-8 border border-white/12 px-3 text-[0.66rem] font-semibold uppercase tracking-[0.1em] text-ivory/60 transition-colors hover:border-gold/45 hover:text-gold">
              {c.statusLabels[status]}
            </button>
          ))}
          <button type="button" onClick={exportCsv} className="h-8 border border-white/12 px-3 text-[0.66rem] font-semibold uppercase tracking-[0.1em] text-ivory/60 transition-colors hover:border-gold/45 hover:text-gold">
            {locale === "ar" ? "تصدير المحدد" : "Export"}
          </button>
          <button type="button" onClick={() => setSelected(new Set<string>())} className="ms-auto h-8 px-2 text-[0.66rem] uppercase tracking-[0.1em] text-ivory/40 transition-colors hover:text-gold">
            {c.clearSelection}
          </button>
        </div>
      ) : null}

      {/* Mobile luxury cards */}
      <div className="grid gap-3 md:hidden">
        {paged.map((project) => {
          const risk = budgetRisk(project.spent, project.budget);
          return (
            <button key={project.slug} type="button" onClick={() => setDetail(project)} className="border border-white/10 bg-coal p-4 text-start transition-colors hover:border-gold/30">
              <div className="flex items-start gap-3">
                <span className="relative h-16 w-20 shrink-0 overflow-hidden border border-white/10">
                  <ProjectArt variant={project.art} className="h-full w-full" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <p className="truncate text-[0.9rem] font-medium text-ivory">{l(project.title)}</p>
                    <span className={cn("shrink-0 px-2 py-0.5 text-[0.62rem] uppercase tracking-[0.1em]", project.status === "ongoing" ? "bg-gold/15 text-gold" : project.status === "completed" ? "bg-emerald-400/10 text-emerald-300/80" : "bg-sky-400/10 text-sky-300/80")}>
                      {c.statusLabels[project.status]}
                    </span>
                  </div>
                  <p className="mt-1 truncate text-[0.72rem] text-ivory/45">{l(project.location)}</p>
                  <div className="mt-3 flex items-center gap-2">
                    <span className="h-1.5 flex-1 overflow-hidden bg-white/10">
                      <span className={cn("block h-full", risk === "critical" ? "bg-red-400/80" : risk === "warning" ? "bg-amber-400/80" : "bg-gold")} style={{ width: `${project.progress}%` }} />
                    </span>
                    <span className="tabular-nums text-[0.68rem] text-ivory/45">{project.progress}%</span>
                  </div>
                  <div className="mt-2 flex items-center justify-between text-[0.72rem]">
                    <span className="text-ivory/45">{c.categoryLabels[project.category]}</span>
                    <span className="tabular-nums text-gold">{formatMoney(project.contractValue || project.budget, locale)}</span>
                  </div>
                </div>
              </div>
            </button>
          );
        })}
        {!paged.length ? (
          <div className="border border-dashed border-white/12 bg-coal/40 p-10 text-center">
            <p className="font-display text-xl text-ivory/70">{c.noProjects}</p>
            <p className="mt-2 text-[0.78rem] text-ivory/40">{locale === "ar" ? "جرّب تعديل عوامل التصفية أو أضف مشروعاً جديداً." : "Try adjusting filters or add a new project."}</p>
          </div>
        ) : null}
      </div>

      {/* Desktop/tablet table */}
      <div className="hidden overflow-x-auto border border-white/10 bg-coal md:block">
        <table className="w-full min-w-[960px]">
          <thead>
            <tr className="border-b border-white/8 text-[0.64rem] uppercase tracking-[0.14em] text-ivory/40">
              <th className="w-12 px-4 py-4 text-start font-medium">
                <Checkbox checked={allSelected} onChange={toggleAll} aria-label={c.selectAll} />
              </th>
              <th className="px-4 py-4 text-start font-medium">{c.project}</th>
              <th className="px-4 py-4 text-start font-medium">{c.category}</th>
              <th className="px-4 py-4 text-start font-medium">{c.status}</th>
              <th className="px-4 py-4 text-start font-medium">{c.progress}</th>
              <th className="px-4 py-4 text-end font-medium">{c.value}</th>
              <th className="px-4 py-4 text-end font-medium">{c.actions}</th>
            </tr>
          </thead>
          <tbody>
            {paged.map((project) => {
              const risk = budgetRisk(project.spent, project.budget);
              return (
                <tr key={project.slug} onClick={() => setDetail(project)} className={cn("cursor-pointer border-b border-white/6 last:border-0 transition-colors hover:bg-white/[0.02]", selected.has(project.slug) && "bg-gold/[0.045]")}>
                  <td className="px-4 py-4" onClick={(e) => e.stopPropagation()}>
                    <Checkbox checked={selected.has(project.slug)} onChange={() => toggleSelected(project.slug)} aria-label={`${c.selectAll}: ${l(project.title)}`} />
                  </td>
                  <td className="px-4 py-4">
                    <span className="flex items-center gap-3">
                      <span className="relative h-10 w-14 shrink-0 overflow-hidden border border-white/10">
                        <ProjectArt variant={project.art} className="h-full w-full" />
                      </span>
                      <span className="flex min-w-0 flex-col gap-0.5">
                        <span className="truncate text-[0.82rem] text-ivory/75">{l(project.title)}</span>
                        <span className="truncate text-[0.7rem] text-ivory/40">{l(project.location)}</span>
                      </span>
                    </span>
                  </td>
                  <td className="px-4 py-4 text-[0.72rem] text-ivory/50">{c.categoryLabels[project.category]}</td>
                  <td className="px-4 py-4" onClick={(e) => e.stopPropagation()}>
                    <button type="button" onClick={() => cycleStatus(project)} title={c.quickStatus} className={cn("inline-flex min-h-8 items-center px-2.5 text-[0.64rem] uppercase tracking-[0.1em] transition-[filter,background-color] duration-150 hover:brightness-125", project.status === "ongoing" ? "bg-gold/15 text-gold" : project.status === "completed" ? "bg-emerald-400/10 text-emerald-300/80" : "bg-sky-400/10 text-sky-300/80")}>
                      {c.statusLabels[project.status]}
                    </button>
                  </td>
                  <td className="px-4 py-4">
                    <span className="flex items-center gap-2">
                      <span className="h-1.5 w-14 overflow-hidden bg-white/10">
                        <span className={cn("block h-full", risk === "critical" ? "bg-red-400/80" : risk === "warning" ? "bg-amber-400/80" : "bg-gold")} style={{ width: `${project.progress}%` }} />
                      </span>
                      <span className="tabular-nums text-[0.7rem] text-ivory/45">{project.progress}%</span>
                    </span>
                  </td>
                  <td className="px-4 py-4 text-end text-[0.72rem] tabular-nums text-ivory/55">{formatMoney(project.contractValue || project.budget, locale)}</td>
                  <td className="px-4 py-4" onClick={(e) => e.stopPropagation()}>
                    <span className="flex items-center justify-end gap-2">
                      <button type="button" onClick={() => onEdit(project)} className="flex h-9 w-9 items-center justify-center border border-white/12 text-ivory/55 transition-colors duration-150 hover:border-gold/50 hover:text-gold" aria-label={`${c.edit} ${l(project.title)}`}>
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button type="button" onClick={() => handleDelete(project)} className="flex h-9 w-9 items-center justify-center border border-white/12 text-ivory/55 transition-colors duration-150 hover:border-red-400/50 hover:text-red-300" aria-label={`${c.delete} ${l(project.title)}`}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {!paged.length ? (
          <div className="p-10 text-center">
            <p className="font-display text-xl text-ivory/70">{c.noProjects}</p>
            <p className="mt-2 text-[0.78rem] text-ivory/40">{locale === "ar" ? "لا توجد نتائج مطابقة — عدّل البحث أو الفلاتر." : "No matching results — adjust search or filters."}</p>
          </div>
        ) : null}
      </div>

      {totalPages > 1 ? (
        <div className="flex flex-wrap items-center justify-between gap-3 border border-white/10 bg-coal px-4 py-3">
          <p className="text-[0.72rem] tabular-nums text-ivory/45">
            {locale === "ar" ? `صفحة ${currentPage} من ${totalPages}` : `Page ${currentPage} of ${totalPages}`}
          </p>
          <div className="flex items-center gap-2">
            <button type="button" disabled={currentPage <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))} className="h-9 border border-white/12 px-3 text-[0.7rem] text-ivory/60 transition-colors hover:border-gold/40 hover:text-gold disabled:opacity-30">
              {locale === "ar" ? "السابق" : "Previous"}
            </button>
            <button type="button" disabled={currentPage >= totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))} className="h-9 border border-white/12 px-3 text-[0.7rem] text-ivory/60 transition-colors hover:border-gold/40 hover:text-gold disabled:opacity-30">
              {locale === "ar" ? "التالي" : "Next"}
            </button>
          </div>
        </div>
      ) : null}

      {detail ? (
        <div className="fixed inset-0 z-[230] flex justify-end bg-obsidian/70 backdrop-blur-sm" onMouseDown={(e) => { if (e.target === e.currentTarget) setDetail(null); }}>
          <aside data-lenis-prevent className="h-full w-full max-w-xl overflow-y-auto overscroll-contain border-s border-white/10 bg-[#0e1017] p-5 shadow-lux sm:p-6">
            <div className="flex items-start justify-between gap-3 border-b border-white/10 pb-4">
              <div className="min-w-0">
                <p className="text-[0.68rem] uppercase tracking-[0.16em] text-gold">{locale === "ar" ? "تفاصيل المشروع" : "Project details"}</p>
                <h3 className="mt-1 truncate font-display text-2xl text-ivory">{l(detail.title)}</h3>
                <p className="mt-1 text-[0.78rem] text-ivory/45">{l(detail.location)}</p>
              </div>
              <button type="button" onClick={() => setDetail(null)} className="inline-flex h-10 w-10 items-center justify-center border border-white/12 text-ivory/60 transition-colors hover:border-gold/40 hover:text-gold" aria-label="Close">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="mt-5 space-y-4">
              <div className="relative h-44 overflow-hidden border border-white/10">
                <ProjectArt variant={detail.art} className="h-full w-full" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                {[
                  [c.status, c.statusLabels[detail.status]],
                  [c.category, c.categoryLabels[detail.category]],
                  [c.progress, `${detail.progress}%`],
                  [c.value, formatMoney(detail.contractValue || detail.budget, locale)],
                  [c.budget, formatMoney(detail.budget, locale)],
                  [c.spent, formatMoney(detail.spent, locale)],
                ].map(([label, value]) => (
                  <div key={String(label)} className="border border-white/10 bg-coal p-3">
                    <p className="text-[0.64rem] uppercase tracking-[0.12em] text-ivory/40">{label}</p>
                    <p className="mt-1 text-[0.86rem] tabular-nums text-ivory">{value}</p>
                  </div>
                ))}
              </div>
              <div className="flex flex-wrap gap-2 pt-2">
                <button type="button" onClick={() => { onEdit(detail); setDetail(null); }} className="inline-flex h-10 items-center gap-2 bg-gold px-4 text-[0.72rem] font-semibold uppercase tracking-[0.12em] text-obsidian transition-colors hover:bg-gold-light">
                  <Pencil className="h-3.5 w-3.5" />{c.edit}
                </button>
                <button type="button" onClick={() => setDetail(null)} className="inline-flex h-10 items-center gap-2 border border-white/12 px-4 text-[0.72rem] font-semibold uppercase tracking-[0.12em] text-ivory/60 transition-colors hover:border-gold/40 hover:text-gold">
                  {locale === "ar" ? "إغلاق" : "Close"}
                </button>
              </div>
            </div>
          </aside>
        </div>
      ) : null}
    </div>
  );
}

function FinancialsSection({ projects }: { projects: WorkspaceProject[] }) {
  const { locale, l } = useI18n();
  const c = copy[locale];
  const { updateProject } = useWorkspace();
  const [selected, setSelected] = useState(projects[0]?.slug ?? "");
  const activeSlug = projects.some((project) => project.slug === selected)
    ? selected
    : (projects[0]?.slug ?? "");
  const selectedProject = projects.find((project) => project.slug === activeSlug) ?? projects[0];

  const totalBudget = projects.reduce((sum, project) => sum + project.budget, 0);
  const totalSpent = projects.reduce((sum, project) => sum + project.spent, 0);
  const totalProfit = projects.reduce((sum, project) => sum + project.profit, 0);
  const totalContract = projects.reduce((sum, project) => sum + project.contractValue, 0);

  const exportCsv = () => {
    const rows = [
      ["Project", "Budget", "Spent", "Profit", "Contract", "Margin"],
      ...projects.map((project) => [
        project.title.en,
        String(project.budget),
        String(project.spent),
        String(project.profit),
        String(project.contractValue),
        `${project.contractValue ? ((project.profit / project.contractValue) * 100).toFixed(1) : 0}%`,
      ]),
    ];
    const content = rows.map((row) => row.join(",")).join("\n");
    const blob = new Blob([content], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "ahmed-elattar-financials.csv";
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-px border border-white/10 bg-white/10 lg:grid-cols-4">
        {[
          { label: c.contract, value: formatM(totalContract, locale) },
          { label: c.budget, value: formatM(totalBudget, locale) },
          { label: c.spent, value: formatM(totalSpent, locale) },
          { label: c.profit, value: formatM(totalProfit, locale) },
        ].map((stat) => (
          <div key={stat.label} className="bg-coal p-5">
            <p className="tabular font-display text-2xl leading-none text-ivory">{stat.value}</p>
            <p className="mt-2.5 text-[0.7rem] uppercase tracking-[0.14em] text-ivory/40">
              {stat.label}
            </p>
          </div>
        ))}
      </div>

      <div className="border border-white/10 bg-coal">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 px-5 py-4">
          <span className="text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-gold">
            {c.financials}
          </span>
          <button
            type="button"
            onClick={exportCsv}
            className="inline-flex h-9 items-center gap-2 border border-white/12 px-3.5 text-[0.68rem] font-semibold uppercase tracking-[0.12em] text-ivory/55 transition-colors hover:border-gold/40 hover:text-gold"
          >
            <FileText className="h-3.5 w-3.5" />
            {c.export}
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[880px]">
            <thead>
              <tr className="border-b border-white/8 text-[0.64rem] uppercase tracking-[0.14em] text-ivory/40">
                <th className="px-5 py-4 text-start font-medium">{c.project}</th>
                <th className="px-4 py-4 text-start font-medium">{c.budget}</th>
                <th className="px-4 py-4 text-start font-medium">{c.spent}</th>
                <th className="px-4 py-4 text-start font-medium">{c.profit}</th>
                <th className="px-4 py-4 text-start font-medium">{c.contract}</th>
                <th className="px-5 py-4 text-end font-medium">{c.margin}</th>
              </tr>
            </thead>
            <tbody>
              {projects.map((project) => {
                const margin = project.contractValue
                  ? (project.profit / project.contractValue) * 100
                  : 0;
                return (
                  <tr key={project.slug} className="border-b border-white/6 last:border-0">
                    <td className="px-5 py-4 text-[0.8rem] text-ivory/70">{l(project.title)}</td>
                    {(["budget", "spent", "profit", "contractValue"] as const).map((key) => (
                      <td key={key} className="px-4 py-3">
                        <input
                          type="number"
                          min={0}
                          value={project[key]}
                          onChange={(event) =>
                            updateProject(project.slug, { [key]: Number(event.target.value) })
                          }
                          className="h-10 w-24 border border-white/10 bg-transparent px-3 text-[0.78rem] text-ivory/70 outline-none focus:border-gold/50"
                        />
                      </td>
                    ))}
                    <td className="px-5 py-4 text-end">
                      <span
                        className={cn(
                          "tabular text-[0.8rem]",
                          margin >= 18 ? "text-emerald-300/80" : "text-gold",
                        )}
                      >
                        {margin.toFixed(1)}%
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <div className="border border-white/10 bg-coal p-6">
          <span className="text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-gold">
            {c.budgetVsSpent}
          </span>
          <div className="mt-6 space-y-5">
            {projects.slice(0, 6).map((project) => {
              const max = Math.max(1, project.budget);
              return (
                <div key={project.slug}>
                  <div className="flex items-center justify-between gap-3 text-[0.74rem]">
                    <span className="truncate text-ivory/60">{l(project.title)}</span>
                    <span className="tabular shrink-0 text-ivory/45">
                      {formatM(project.spent, locale)} / {formatM(project.budget, locale)}
                    </span>
                  </div>
                  <div className="mt-1.5 flex h-1.5 overflow-hidden bg-white/10">
                    <div
                      className="h-full bg-gold"
                      style={{ width: `${Math.min(100, (project.spent / max) * 100)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="border border-white/10 bg-coal">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 px-5 py-4">
            <span className="text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-gold">
              {c.paymentStages}
            </span>
            <select
              value={activeSlug}
              onChange={(event) => setSelected(event.target.value)}
              className="h-10 max-w-full border border-white/12 bg-coal px-3 text-[0.74rem] text-ivory/60 outline-none focus:border-gold/50"
            >
              {projects.map((project) => (
                <option key={project.slug} value={project.slug}>
                  {l(project.title)}
                </option>
              ))}
            </select>
          </div>
          {selectedProject && selectedProject.invoices.length > 0 ? (
            <div className="divide-y divide-white/6">
              {selectedProject.invoices.map((invoice) => (
                <div key={invoice.number} className="flex items-center gap-3 px-6 py-4">
                  <FileText className="h-4 w-4 shrink-0 text-gold" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[0.84rem] text-ivory/65">{l(invoice.title)}</p>
                    <span className="mt-0.5 block text-[0.7rem] text-ivory/40">
                      {invoice.number} · {invoice.date}
                    </span>
                  </div>
                  <div className="text-end">
                    <p className="tabular text-[0.8rem] text-ivory/65">{invoice.amount}</p>
                    <span
                      className={cn(
                        "text-[0.64rem] uppercase tracking-[0.1em]",
                        invoice.status === "paid"
                          ? "text-emerald-300/80"
                          : invoice.status === "due"
                            ? "text-gold"
                            : "text-ivory/40",
                      )}
                    >
                      {c.invoiceStatus[invoice.status]}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="p-6 text-center text-[0.76rem] text-ivory/40">{c.noProjects}</p>
          )}
          <div className="border-t border-white/10 px-5 py-3 text-[0.7rem] text-ivory/40">
            {selectedProject ? l(selectedProject.title) : ""}
          </div>
        </div>
      </div>
    </div>
  );
}

function ContentSection() {
  const { locale, l } = useI18n();
  const c = copy[locale];
  const { content, updateContent, updateService } = useWorkspace();
  const services = content.services;
  const [hero, setHero] = useState({
    eyebrowAr: content.heroEyebrow.ar,
    eyebrowEn: content.heroEyebrow.en,
    titleTopAr: content.heroTitleTop.ar,
    titleTopEn: content.heroTitleTop.en,
    titleAccentAr: content.heroTitleAccent.ar,
    titleAccentEn: content.heroTitleAccent.en,
    descriptionAr: content.heroDescription.ar,
    descriptionEn: content.heroDescription.en,
    promoTitleAr: content.promoTitle.ar,
    promoTitleEn: content.promoTitle.en,
    promoTextAr: content.promoText.ar,
    promoTextEn: content.promoText.en,
    promoHref: content.promoHref,
    promoVisible: content.promoVisible,
  });
  const [saved, setSaved] = useState(false);
  const savedTimer = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (savedTimer.current) window.clearTimeout(savedTimer.current);
    };
  }, []);

  const flashSaved = () => {
    setSaved(true);
    if (savedTimer.current) window.clearTimeout(savedTimer.current);
    savedTimer.current = window.setTimeout(() => setSaved(false), 2400);
  };

  const buildServiceForm = useCallback(
    (slug: string) => {
      const service = services.find((item) => item.slug === slug) ?? services[0];
      const override = content.serviceOverrides[slug];
      return {
        titleAr: override?.title.ar ?? service?.title.ar ?? "",
        titleEn: override?.title.en ?? service?.title.en ?? "",
        taglineAr: override?.tagline.ar ?? service?.tagline.ar ?? "",
        taglineEn: override?.tagline.en ?? service?.tagline.en ?? "",
        descriptionAr: override?.description.ar ?? service?.description.ar ?? "",
        descriptionEn: override?.description.en ?? service?.description.en ?? "",
      };
    },
    [content.serviceOverrides, services],
  );
  const [serviceSlug, setServiceSlug] = useState("");
  const [serviceDraft, setServiceDraft] = useState<ReturnType<
    typeof buildServiceForm
  > | null>(null);
  const activeServiceSlug = serviceSlug || services[0]?.slug || "";
  const serviceForm = serviceDraft ?? buildServiceForm(activeServiceSlug);

  const selectService = (slug: string) => {
    setServiceSlug(slug);
    setServiceDraft(null);
  };

  const saveContent = (event: React.FormEvent) => {
    event.preventDefault();
    // The hero form is the direct control for these four fields. Remove any
    // older copy override for the same paths so the form is authoritative.
    const copyOverrides = { ...content.copyOverrides };
    delete copyOverrides["hero.eyebrow"];
    delete copyOverrides["hero.titleTop"];
    delete copyOverrides["hero.titleAccent"];
    delete copyOverrides["hero.description"];

    updateContent({
      heroEyebrow: L(hero.eyebrowAr, hero.eyebrowEn),
      heroTitleTop: L(hero.titleTopAr, hero.titleTopEn),
      heroTitleAccent: L(hero.titleAccentAr, hero.titleAccentEn),
      heroDescription: L(hero.descriptionAr, hero.descriptionEn),
      promoTitle: L(hero.promoTitleAr, hero.promoTitleEn),
      promoText: L(hero.promoTextAr, hero.promoTextEn),
      promoHref: hero.promoHref,
      promoVisible: hero.promoVisible,
      copyOverrides,
    });
    flashSaved();
  };

  const saveService = (event: React.FormEvent) => {
    event.preventDefault();
    if (!activeServiceSlug) return;
    updateService(activeServiceSlug, {
      title: L(serviceForm.titleAr, serviceForm.titleEn),
      tagline: L(serviceForm.taglineAr, serviceForm.taglineEn),
      description: L(serviceForm.descriptionAr, serviceForm.descriptionEn),
    });
    flashSaved();
  };

  const copyFields = useMemo(() => flattenCopy(dictionary.ar), []);
  const copyGroups = useMemo(
    () => Array.from(new Set(copyFields.map((field) => field.group))),
    [copyFields],
  );
  const [copyDraft, setCopyDraft] = useState<Record<string, Localized>>({});
  const [copyQuery, setCopyQuery] = useState("");
  const [copyGroup, setCopyGroup] = useState("all");
  const [copyNotice, setCopyNotice] = useState(false);
  const copyNoticeTimer = useRef<number | null>(null);

  const fieldFallback = useCallback(
    (field: CopyField): Localized => {
      if (field.path === "hero.eyebrow") return content.heroEyebrow;
      if (field.path === "hero.titleTop") return content.heroTitleTop;
      if (field.path === "hero.titleAccent") return content.heroTitleAccent;
      if (field.path === "hero.description") return content.heroDescription;
      return { ar: field.ar, en: field.en };
    },
    [
      content.heroDescription,
      content.heroEyebrow,
      content.heroTitleAccent,
      content.heroTitleTop,
    ],
  );

  const flashCopyNotice = () => {
    setCopyNotice(true);
    if (copyNoticeTimer.current) window.clearTimeout(copyNoticeTimer.current);
    copyNoticeTimer.current = window.setTimeout(() => setCopyNotice(false), 2400);
  };

  const effectiveCopy = useCallback(
    (path: string, fallback: Localized, lang: "ar" | "en") =>
      copyDraft[path]?.[lang] ??
      content.copyOverrides[path]?.[lang] ??
      fallback[lang],
    [content.copyOverrides, copyDraft],
  );

  const updateCopyValue = (
    path: string,
    fallback: Localized,
    lang: "ar" | "en",
    value: string,
  ) => {
    setCopyDraft((current) => ({
      ...current,
      [path]: {
        ar: lang === "ar" ? value : effectiveCopy(path, fallback, "ar"),
        en: lang === "en" ? value : effectiveCopy(path, fallback, "en"),
      },
    }));
  };

  const saveCopy = (event: React.FormEvent) => {
    event.preventDefault();
    const next: Record<string, Localized> = {};
    for (const field of copyFields) {
      const fallback = fieldFallback(field);
      const ar = effectiveCopy(field.path, fallback, "ar").trim();
      const en = effectiveCopy(field.path, fallback, "en").trim();
      if ((ar && ar !== fallback.ar) || (en && en !== fallback.en)) {
        next[field.path] = { ar, en };
      }
    }
    updateContent({ copyOverrides: next });
    setCopyDraft({});
    flashCopyNotice();
  };

  const resetCopy = () => {
    setCopyDraft({});
    updateContent({ copyOverrides: {} });
    flashCopyNotice();
  };

  const filteredCopyFields = useMemo(() => {
    const query = copyQuery.trim().toLowerCase();
    return copyFields.filter((field) => {
      if (copyGroup !== "all" && field.group !== copyGroup) return false;
      if (!query) return true;
      return (
        field.path.toLowerCase().includes(query) ||
        field.ar.toLowerCase().includes(query) ||
        field.en.toLowerCase().includes(query)
      );
    });
  }, [copyFields, copyGroup, copyQuery]);

  const [mediaDraft, setMediaDraft] = useState<Record<string, MediaOverride>>({});
  const [mediaNotice, setMediaNotice] = useState(false);
  const [mediaError, setMediaError] = useState("");
  const [mediaValidating, setMediaValidating] = useState(false);
  const mediaNoticeTimer = useRef<number | null>(null);
  const mediaGroups = useMemo(
    () => Array.from(new Set(mediaCatalog.map((asset) => asset.group))),
    [],
  );

  const flashMediaNotice = () => {
    setMediaNotice(true);
    setMediaError("");
    if (mediaNoticeTimer.current) window.clearTimeout(mediaNoticeTimer.current);
    mediaNoticeTimer.current = window.setTimeout(() => setMediaNotice(false), 2400);
  };

  const effectiveMedia = (key: string): MediaOverride =>
    mediaDraft[key] ??
    content.mediaOverrides[key] ?? {
      src: "",
      alt: L("", ""),
    };

  const previewMedia = (key: string) => {
    const override = effectiveMedia(key);
    const entry = mediaCatalog.find((asset) => asset.key === key);
    return override.src.trim() || entry?.fallback.src || "";
  };

  const updateMedia = (key: string, patch: Partial<MediaOverride>) => {
    setMediaError("");
    const current = effectiveMedia(key);
    setMediaDraft((draft) => ({
      ...draft,
      [key]: {
        src: patch.src ?? current.src,
        alt: patch.alt ?? current.alt,
      },
    }));
  };

  const updateMediaAlt = (key: string, lang: "ar" | "en", value: string) => {
    const current = effectiveMedia(key);
    updateMedia(key, {
      alt: {
        ar: lang === "ar" ? value : current.alt.ar,
        en: lang === "en" ? value : current.alt.en,
      },
    });
  };

  const mediaValidationMessage = (reason?: string) => {
    switch (reason) {
      case "too_large":
        return c.mediaTooLarge;
      case "dimensions":
        return c.mediaDimensions;
      case "format":
        return c.mediaFormat;
      case "unreachable":
        return c.mediaUnreachable;
      case "not_image":
        return c.mediaNotImage;
      default:
        return c.invalidMedia;
    }
  };

  const saveMedia = async (event: React.FormEvent) => {
    event.preventDefault();
    const invalid = mediaCatalog.find((asset) => {
      const src = effectiveMedia(asset.key).src.trim();
      return Boolean(src) && !isAllowedMediaSource(src);
    });
    if (invalid) {
      setMediaNotice(false);
      setMediaError(c.invalidMedia);
      return;
    }

    const next: Record<string, MediaOverride> = {};
    for (const asset of mediaCatalog) {
      const current = effectiveMedia(asset.key);
      const src = current.src.trim();
      if (!src) continue;
      next[asset.key] = {
        src,
        alt: {
          ar: current.alt.ar.trim(),
          en: current.alt.en.trim(),
        },
      };
    }

    const mediaSources = Array.from(
      new Set(Object.values(next).map((override) => override.src)),
    );

    if (mediaSources.length > 0) {
      setMediaNotice(false);
      setMediaError("");
      setMediaValidating(true);
      try {
        // Validate in small batches so a full-catalog update stays responsive
        // and never exceeds the API's per-request inspection limit.
        for (let index = 0; index < mediaSources.length; index += 8) {
          const response = await fetch("/api/admin/media/validate", {
            method: "POST",
            credentials: "same-origin",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ sources: mediaSources.slice(index, index + 8) }),
          });
          const payload = response.ok
            ? ((await response.json().catch(() => null)) as
                | {
                    valid?: boolean;
                    results?: Array<{ ok?: boolean; reason?: string }>;
                  }
                | null)
            : null;

          if (!response.ok || !payload) {
            setMediaError(c.mediaUnreachable);
            return;
          }

          if (!payload.valid) {
            const failed = payload.results?.find((result) => !result.ok);
            setMediaError(mediaValidationMessage(failed?.reason));
            return;
          }
        }
      } catch {
        setMediaError(c.mediaUnreachable);
        return;
      } finally {
        setMediaValidating(false);
      }
    }

    updateContent({ mediaOverrides: next });
    setMediaDraft({});
    flashMediaNotice();
  };

  const resetMedia = (key: string) => {
    setMediaError("");
    const nextDraft = { ...mediaDraft };
    delete nextDraft[key];
    setMediaDraft(nextDraft);
    const nextOverrides = { ...content.mediaOverrides };
    delete nextOverrides[key];
    updateContent({ mediaOverrides: nextOverrides });
    flashMediaNotice();
  };

  useEffect(() => {
    return () => {
      if (copyNoticeTimer.current) window.clearTimeout(copyNoticeTimer.current);
      if (mediaNoticeTimer.current) window.clearTimeout(mediaNoticeTimer.current);
    };
  }, []);

  return (
    <div className="space-y-6">
      <form onSubmit={saveContent} className="border border-white/10 bg-coal">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 px-5 py-4">
          <span className="text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-gold">
            {c.heroContent}
          </span>
          <Link
            href="/"
            target="_blank"
            className="inline-flex items-center gap-1.5 text-[0.68rem] uppercase tracking-[0.12em] text-ivory/45 transition-colors hover:text-gold"
          >
            {c.back}
            <ArrowUpRight className="h-3 w-3" />
          </Link>
        </div>
        <div className="grid gap-4 p-5 sm:grid-cols-2">
          <Field label={c.heroEyebrow} htmlFor="content-eyebrow-ar">
            <TextInput
              id="content-eyebrow-ar"
              value={hero.eyebrowAr}
              onChange={(event) => setHero({ ...hero, eyebrowAr: event.target.value })}
              dir="rtl"
            />
          </Field>
          <Field label={c.heroEyebrow} htmlFor="content-eyebrow-en">
            <TextInput
              id="content-eyebrow-en"
              value={hero.eyebrowEn}
              onChange={(event) => setHero({ ...hero, eyebrowEn: event.target.value })}
            />
          </Field>
          <Field label={c.heroTitleTop} htmlFor="content-title-top-ar">
            <TextInput
              id="content-title-top-ar"
              value={hero.titleTopAr}
              onChange={(event) => setHero({ ...hero, titleTopAr: event.target.value })}
              dir="rtl"
            />
          </Field>
          <Field label={c.heroTitleTop} htmlFor="content-title-top-en">
            <TextInput
              id="content-title-top-en"
              value={hero.titleTopEn}
              onChange={(event) => setHero({ ...hero, titleTopEn: event.target.value })}
            />
          </Field>
          <Field label={c.heroTitleAccent} htmlFor="content-title-accent-ar">
            <TextInput
              id="content-title-accent-ar"
              value={hero.titleAccentAr}
              onChange={(event) => setHero({ ...hero, titleAccentAr: event.target.value })}
              dir="rtl"
            />
          </Field>
          <Field label={c.heroTitleAccent} htmlFor="content-title-accent-en">
            <TextInput
              id="content-title-accent-en"
              value={hero.titleAccentEn}
              onChange={(event) => setHero({ ...hero, titleAccentEn: event.target.value })}
            />
          </Field>
          <Field label={c.heroDescription} htmlFor="content-description-ar">
            <Textarea
              id="content-description-ar"
              rows={3}
              value={hero.descriptionAr}
              onChange={(event) => setHero({ ...hero, descriptionAr: event.target.value })}
              dir="rtl"
            />
          </Field>
          <Field label={c.heroDescription} htmlFor="content-description-en">
            <Textarea
              id="content-description-en"
              rows={3}
              value={hero.descriptionEn}
              onChange={(event) => setHero({ ...hero, descriptionEn: event.target.value })}
            />
          </Field>
        </div>

        <div className="border-t border-white/10 p-5">
          <p className="mb-4 text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-gold/80">
            {c.promo}
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={c.promoTitle} htmlFor="content-promo-title-ar">
              <TextInput
                id="content-promo-title-ar"
                value={hero.promoTitleAr}
                onChange={(event) => setHero({ ...hero, promoTitleAr: event.target.value })}
                dir="rtl"
              />
            </Field>
            <Field label={c.promoTitle} htmlFor="content-promo-title-en">
              <TextInput
                id="content-promo-title-en"
                value={hero.promoTitleEn}
                onChange={(event) => setHero({ ...hero, promoTitleEn: event.target.value })}
              />
            </Field>
            <Field label={c.promoText} htmlFor="content-promo-text-ar">
              <Textarea
                id="content-promo-text-ar"
                rows={3}
                value={hero.promoTextAr}
                onChange={(event) => setHero({ ...hero, promoTextAr: event.target.value })}
                dir="rtl"
              />
            </Field>
            <Field label={c.promoText} htmlFor="content-promo-text-en">
              <Textarea
                id="content-promo-text-en"
                rows={3}
                value={hero.promoTextEn}
                onChange={(event) => setHero({ ...hero, promoTextEn: event.target.value })}
              />
            </Field>
            <Field label={c.promoHref} htmlFor="content-promo-href">
              <TextInput
                id="content-promo-href"
                value={hero.promoHref}
                onChange={(event) => setHero({ ...hero, promoHref: event.target.value })}
              />
            </Field>
            <label className="flex items-end gap-2 pb-2 text-[0.82rem] text-ivory/65">
              <input
                type="checkbox"
                checked={hero.promoVisible}
                onChange={(event) => setHero({ ...hero, promoVisible: event.target.checked })}
                className="h-3.5 w-3.5 accent-gold"
              />
              {c.promoVisible}
            </label>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/10 p-4">
          <span className="text-[0.72rem] text-ivory/40">{saved ? c.saved : ""}</span>
          <button
            type="submit"
            className="inline-flex h-9 items-center gap-2 bg-gold px-4 text-[0.7rem] font-semibold uppercase tracking-[0.12em] text-obsidian transition-colors hover:bg-gold-light"
          >
            {saved ? <Check className="h-3.5 w-3.5" /> : <Save className="h-3.5 w-3.5" />}
            {c.saveContent}
          </button>
        </div>
      </form>

      <form onSubmit={saveService} className="border border-white/10 bg-coal">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 px-5 py-4">
          <span className="text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-gold">
            {c.serviceCards}
          </span>
          <select
            value={activeServiceSlug}
            onChange={(event) => selectService(event.target.value)}
            className="h-8 border border-white/12 bg-coal px-2 text-[0.74rem] text-ivory/60 outline-none focus:border-gold/50"
          >
            {services.map((service) => (
              <option key={service.slug} value={service.slug}>
                {l(content.serviceOverrides[service.slug]?.title ?? service.title)}
              </option>
            ))}
            {services.length === 0 ? <option value="">—</option> : null}
          </select>
        </div>
        <div className="grid gap-4 p-5 sm:grid-cols-2">
          <Field label={c.serviceTitle} htmlFor="service-title-ar">
            <TextInput
              id="service-title-ar"
              value={serviceForm.titleAr}
              onChange={(event) => setServiceDraft({ ...serviceForm, titleAr: event.target.value })}
              dir="rtl"
            />
          </Field>
          <Field label={c.serviceTitle} htmlFor="service-title-en">
            <TextInput
              id="service-title-en"
              value={serviceForm.titleEn}
              onChange={(event) => setServiceDraft({ ...serviceForm, titleEn: event.target.value })}
            />
          </Field>
          <Field label={c.serviceTagline} htmlFor="service-tagline-ar">
            <TextInput
              id="service-tagline-ar"
              value={serviceForm.taglineAr}
              onChange={(event) => setServiceDraft({ ...serviceForm, taglineAr: event.target.value })}
              dir="rtl"
            />
          </Field>
          <Field label={c.serviceTagline} htmlFor="service-tagline-en">
            <TextInput
              id="service-tagline-en"
              value={serviceForm.taglineEn}
              onChange={(event) => setServiceDraft({ ...serviceForm, taglineEn: event.target.value })}
            />
          </Field>
          <Field label={c.serviceDescription} htmlFor="service-description-ar">
            <Textarea
              id="service-description-ar"
              rows={4}
              value={serviceForm.descriptionAr}
              onChange={(event) =>
                setServiceDraft({ ...serviceForm, descriptionAr: event.target.value })
              }
              dir="rtl"
            />
          </Field>
          <Field label={c.serviceDescription} htmlFor="service-description-en">
            <Textarea
              id="service-description-en"
              rows={4}
              value={serviceForm.descriptionEn}
              onChange={(event) =>
                setServiceDraft({ ...serviceForm, descriptionEn: event.target.value })
              }
            />
          </Field>
        </div>
        <div className="flex justify-end border-t border-white/10 p-4">
          <button
            type="submit"
            className="inline-flex h-9 items-center gap-2 border border-gold/40 px-4 text-[0.7rem] font-semibold uppercase tracking-[0.12em] text-gold transition-colors hover:bg-gold hover:text-obsidian"
          >
            <Save className="h-3.5 w-3.5" />
            {c.saveService}
          </button>
        </div>
      </form>
      <form onSubmit={saveCopy} className="border border-white/10 bg-coal">
        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-white/10 px-5 py-4">
          <div>
            <span className="flex items-center gap-2 text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-gold">
              <Sparkles className="h-3.5 w-3.5" />
              {c.siteCopy}
            </span>
            <p className="mt-2 max-w-2xl text-[0.74rem] leading-relaxed text-ivory/45">
              {c.siteCopyText}
            </p>
          </div>
          <button
            type="button"
            onClick={resetCopy}
            className="inline-flex h-8 items-center gap-1.5 border border-white/12 px-3 text-[0.68rem] font-semibold uppercase tracking-[0.12em] text-ivory/50 transition-all duration-300 hover:border-gold/40 hover:text-gold active:scale-[0.98]"
          >
            <RotateCcw className="h-3 w-3" />
            {c.resetCopy}
          </button>
        </div>

        <div className="flex flex-col gap-3 border-b border-white/10 p-4 sm:flex-row sm:items-center">
          <label className="relative flex-1">
            <Search className="pointer-events-none absolute start-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ivory/35" />
            <TextInput
              value={copyQuery}
              onChange={(event) => setCopyQuery(event.target.value)}
              placeholder={c.searchCopy}
              className="ps-9"
              aria-label={c.searchCopy}
            />
          </label>
          <select
            value={copyGroup}
            onChange={(event) => setCopyGroup(event.target.value)}
            className="h-10 border border-white/12 bg-coal px-3 text-[0.76rem] text-ivory/60 outline-none transition-colors focus:border-gold/50"
            aria-label={c.allGroups}
          >
            <option value="all">{c.allGroups}</option>
            {copyGroups.map((group) => (
              <option key={group} value={group}>
                {(copyGroupLabels[group] ?? { ar: group, en: group })[locale]}
              </option>
            ))}
          </select>
          <span className="text-[0.7rem] text-ivory/40">
            {filteredCopyFields.length} / {copyFields.length}
          </span>
        </div>

        <div className="space-y-2 p-4">
          {filteredCopyFields.length === 0 ? (
            <p className="py-8 text-center text-[0.76rem] text-ivory/40">{c.noCopyResults}</p>
          ) : (
            copyGroups.map((group) => {
              const groupFields = filteredCopyFields.filter((field) => field.group === group);
              if (groupFields.length === 0) return null;
              const label = copyGroupLabels[group] ?? { ar: group, en: group };
              return (
                <details
                  key={group}
                  open={copyQuery.trim().length > 0 ? true : undefined}
                  className="group/copy border border-white/8 bg-obsidian/25"
                >
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 text-[0.72rem] font-semibold uppercase tracking-[0.14em] text-ivory/65 transition-colors hover:text-gold [&::-webkit-details-marker]:hidden">
                    <span className="flex items-center gap-2">
                      <ChevronDown className="h-3.5 w-3.5 text-gold/60 transition-transform duration-300 group-open/copy:rotate-180" />
                      {label[locale]}
                    </span>
                    <span className="tabular text-[0.66rem] text-ivory/35">{groupFields.length}</span>
                  </summary>
                  <div className="space-y-1 border-t border-white/8 p-3">
                    {groupFields.map((field) => {
                      const customised = Boolean(
                        copyDraft[field.path] || content.copyOverrides[field.path],
                      );
                      return (
                        <div
                          key={field.path}
                          className="grid gap-2 rounded-sm border border-transparent px-2 py-2 transition-colors hover:border-white/8 hover:bg-white/[0.025] lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.2fr)_minmax(0,1.2fr)] lg:items-center"
                        >
                          <div className="min-w-0">
                            <code className="block truncate text-[0.7rem] text-ivory/50" dir="ltr">
                              {field.path}
                            </code>
                            <span
                              className={cn(
                                "mt-0.5 inline-block text-[0.62rem] uppercase tracking-[0.12em]",
                                customised ? "text-gold/70" : "text-ivory/30",
                              )}
                            >
                              {customised ? c.customised : c.original}
                            </span>
                          </div>
                          <TextInput
                            value={effectiveCopy(
                              field.path,
                              fieldFallback(field),
                              "ar",
                            )}
                            onChange={(event) =>
                              updateCopyValue(
                                field.path,
                                fieldFallback(field),
                                "ar",
                                event.target.value,
                              )
                            }
                            dir="rtl"
                            aria-label={`${field.path} — العربية`}
                          />
                          <TextInput
                            value={effectiveCopy(
                              field.path,
                              fieldFallback(field),
                              "en",
                            )}
                            onChange={(event) =>
                              updateCopyValue(
                                field.path,
                                fieldFallback(field),
                                "en",
                                event.target.value,
                              )
                            }
                            dir="ltr"
                            aria-label={`${field.path} — English`}
                          />
                        </div>
                      );
                    })}
                  </div>
                </details>
              );
            })
          )}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/10 p-4">
          <span className="text-[0.72rem] text-ivory/40">{copyNotice ? c.copySaved : ""}</span>
          <button
            type="submit"
            className="inline-flex h-9 items-center gap-2 bg-gold px-4 text-[0.7rem] font-semibold uppercase tracking-[0.12em] text-obsidian transition-all duration-300 hover:bg-gold-light active:scale-[0.98]"
          >
            {copyNotice ? <Check className="h-3.5 w-3.5" /> : <Save className="h-3.5 w-3.5" />}
            {c.saveCopy}
          </button>
        </div>
      </form>

      <form onSubmit={saveMedia} className="border border-white/10 bg-coal">
        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-white/10 px-5 py-4">
          <div>
            <span className="flex items-center gap-2 text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-gold">
              <ImageIcon className="h-3.5 w-3.5" />
              {c.mediaAssets}
            </span>
            <p className="mt-2 max-w-2xl text-[0.74rem] leading-relaxed text-ivory/45">
              {c.mediaAssetsText}
            </p>
          </div>
          <span className="border border-white/10 px-2.5 py-1 text-[0.64rem] uppercase tracking-[0.12em] text-ivory/40">
            {mediaCatalog.length}
          </span>
        </div>

        <div className="space-y-2 p-4">
          {mediaGroups.map((group) => {
            const assets = mediaCatalog.filter((asset) => asset.group === group);
            const label = mediaGroupLabels[group] ?? { ar: group, en: group };
            return (
              <details
                key={group}
                className="group/media border border-white/8 bg-obsidian/25"
              >
                <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 text-[0.72rem] font-semibold uppercase tracking-[0.14em] text-ivory/65 transition-colors hover:text-gold [&::-webkit-details-marker]:hidden">
                  <span className="flex items-center gap-2">
                    <ChevronDown className="h-3.5 w-3.5 text-gold/60 transition-transform duration-300 group-open/media:rotate-180" />
                    {label[locale]}
                  </span>
                  <span className="tabular text-[0.66rem] text-ivory/35">{assets.length}</span>
                </summary>
                <div className="grid gap-3 border-t border-white/8 p-3 xl:grid-cols-2">
                  {assets.map((asset) => {
                    const value = effectiveMedia(asset.key);
                    const preview = previewMedia(asset.key);
                    const customised = Boolean(
                      mediaDraft[asset.key] || content.mediaOverrides[asset.key],
                    );
                    const srcInvalid =
                      Boolean(value.src.trim()) && !isAllowedMediaSource(value.src.trim());
                    return (
                      <div
                        key={asset.key}
                        className="grid gap-3 border border-white/8 bg-coal/60 p-3 sm:grid-cols-[112px_1fr]"
                      >
                        <div className="relative aspect-[4/3] overflow-hidden border border-white/10 bg-obsidian">
                          {preview ? (
                            <Image
                              src={preview}
                              alt=""
                              fill
                              sizes="112px"
                              className="object-cover"
                            />
                          ) : null}
                        </div>
                        <div className="min-w-0 space-y-2">
                          <div className="flex items-center justify-between gap-2">
                            <div className="min-w-0">
                              <p className="truncate text-[0.76rem] text-ivory/65">
                                {asset.label[locale]}
                              </p>
                              <code className="block truncate text-[0.64rem] text-ivory/40" dir="ltr">
                                {asset.key}
                              </code>
                            </div>
                            <button
                              type="button"
                              onClick={() => resetMedia(asset.key)}
                              className="shrink-0 text-ivory/35 transition-colors hover:text-gold"
                              title={c.resetAsset}
                              aria-label={`${c.resetAsset}: ${asset.key}`}
                            >
                              <RotateCcw className="h-3.5 w-3.5" />
                            </button>
                          </div>
                          <TextInput
                            value={value.src}
                            placeholder={asset.fallback.src}
                            onChange={(event) =>
                              updateMedia(asset.key, { src: event.target.value })
                            }
                            dir="ltr"
                            aria-label={`${c.imageSource}: ${asset.key}`}
                            aria-invalid={srcInvalid}
                          />
                          {srcInvalid ? (
                            <p className="text-[0.66rem] leading-relaxed text-red-300/80">
                              {c.invalidMedia}
                            </p>
                          ) : null}
                          <div className="grid gap-2 sm:grid-cols-2">
                            <TextInput
                              value={value.alt.ar}
                              placeholder={asset.fallback.alt}
                              onChange={(event) =>
                                updateMediaAlt(asset.key, "ar", event.target.value)
                              }
                              dir="rtl"
                              aria-label={`${c.imageAlt} — العربية`}
                            />
                            <TextInput
                              value={value.alt.en}
                              placeholder={asset.fallback.alt}
                              onChange={(event) =>
                                updateMediaAlt(asset.key, "en", event.target.value)
                              }
                              dir="ltr"
                              aria-label={`${c.imageAlt} — English`}
                            />
                          </div>
                          <div className="flex items-center justify-between gap-2 text-[0.62rem] uppercase tracking-[0.1em]">
                            <span className={customised ? "text-gold/70" : "text-ivory/30"}>
                              {customised ? c.customised : c.original}
                            </span>
                            <span className="truncate text-ivory/30">{c.mediaHint}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </details>
            );
          })}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/10 p-4">
          <span
            className={cn(
              "text-[0.72rem]",
              mediaError ? "text-red-300/85" : "text-ivory/40",
            )}
            role={mediaError ? "alert" : undefined}
          >
            {mediaError || (mediaValidating ? c.validatingMedia : mediaNotice ? c.saved : "")}
          </span>
          <button
            type="submit"
            disabled={mediaValidating}
            className="inline-flex h-9 items-center gap-2 border border-gold/40 px-4 text-[0.7rem] font-semibold uppercase tracking-[0.12em] text-gold transition-all duration-300 hover:bg-gold hover:text-obsidian active:scale-[0.98] disabled:cursor-wait disabled:opacity-60 disabled:hover:bg-transparent disabled:hover:text-gold"
          >
            {mediaValidating ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : mediaNotice ? (
              <Check className="h-3.5 w-3.5" />
            ) : (
              <Save className="h-3.5 w-3.5" />
            )}
            {mediaValidating ? c.validatingMedia : c.mediaAssets}
          </button>
        </div>
      </form>
    </div>
  );
}

function MediaSection({ projects }: { projects: WorkspaceProject[] }) {
  const { locale, l } = useI18n();
  const c = copy[locale];
  const { updateProject } = useWorkspace();

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-3 border border-white/10 bg-coal p-5 sm:flex-row sm:items-center">
        <div>
          <h2 className="font-display text-2xl text-ivory">{c.mediaTitle}</h2>
          <p className="mt-1 max-w-2xl text-[0.76rem] leading-relaxed text-ivory/45">
            {c.mediaText}
          </p>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {projects.map((project) => (
          <div key={project.slug} className="border border-white/10 bg-coal p-4">
            <div className="flex items-center justify-between gap-3">
              <span className="truncate text-[0.82rem] text-ivory/70">{l(project.title)}</span>
              <span className="text-[0.66rem] uppercase tracking-[0.12em] text-ivory/40">
                {c.cover}: {c.artLabels[project.art]}
              </span>
            </div>
            <div className="mt-3 grid grid-cols-4 gap-2">
              {artVariants.map((variant) => (
                <button
                  key={variant}
                  type="button"
                  onClick={() =>
                    updateProject(project.slug, {
                      art: variant,
                      gallery: project.gallery.includes(variant)
                        ? project.gallery
                        : [...project.gallery, variant],
                    })
                  }
                  className={cn(
                    "group relative aspect-[4/3] overflow-hidden border transition-colors",
                    project.art === variant
                      ? "border-gold"
                      : "border-white/10 hover:border-gold/50",
                  )}
                  aria-label={`${c.setCover}: ${c.artLabels[variant]}`}
                >
                  <ProjectArt variant={variant} className="h-full w-full" />
                  <span className="absolute inset-x-0 bottom-0 bg-obsidian/75 px-1 py-0.5 text-[0.6rem] uppercase tracking-[0.08em] text-ivory/60">
                    {c.artLabels[variant]}
                  </span>
                </button>
              ))}
            </div>
            <p className="mt-3 text-[0.68rem] text-ivory/40">
              {c.gallery}: {project.gallery.length}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

function MessagesSection({ projects }: { projects: WorkspaceProject[] }) {
  const { locale, l } = useI18n();
  const c = copy[locale];
  const { messages, replyMessage } = useWorkspace();
  const [selected, setSelected] = useState(messages[0]?.projectSlug ?? projects[0]?.slug ?? "");
  const [draft, setDraft] = useState("");
  const activeSlug = projects.some((project) => project.slug === selected)
    ? selected
    : (projects[0]?.slug ?? messages[0]?.projectSlug ?? "");
  const projectMessages = messages.filter((message) => message.projectSlug === activeSlug);
  const dateFormat = new Intl.DateTimeFormat(locale === "ar" ? "ar-SA" : "en-GB", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!draft.trim() || !activeSlug) return;
    replyMessage(activeSlug, draft);
    setDraft("");
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[0.72fr_1.28fr]">
      <div className="border border-white/10 bg-coal">
        <div className="border-b border-white/10 px-5 py-4">
          <h2 className="font-display text-2xl text-ivory">{c.messagesTitle}</h2>
          <p className="mt-1 text-[0.74rem] leading-relaxed text-ivory/45">{c.messagesText}</p>
        </div>
        <div className="divide-y divide-white/6">
          {projects.map((project) => {
            const count = messages.filter((message) => message.projectSlug === project.slug).length;
            return (
              <button
                key={project.slug}
                type="button"
                onClick={() => setSelected(project.slug)}
                className={cn(
                  "flex w-full items-center justify-between gap-3 px-5 py-3.5 text-start transition-colors",
                  activeSlug === project.slug ? "bg-gold/10" : "hover:bg-white/4",
                )}
              >
                <span className="min-w-0">
                  <span className="block truncate text-[0.8rem] text-ivory/70">
                    {l(project.title)}
                  </span>
                  <span className="text-[0.66rem] text-ivory/40">{l(project.location)}</span>
                </span>
                <span
                  className={cn(
                    "tabular flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-[0.66rem]",
                    count ? "bg-gold text-obsidian" : "bg-white/10 text-ivory/40",
                  )}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="border border-white/10 bg-coal">
        <div className="flex items-center justify-between gap-3 border-b border-white/10 px-5 py-4">
          <span className="text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-gold">
            {c.messagesTitle}
          </span>
          <span className="text-[0.68rem] text-ivory/40">
            {projectMessages.length} {c.messages}
          </span>
        </div>
        <div className="max-h-[420px] space-y-3 overflow-y-auto p-5">
          {projectMessages.length ? (
            projectMessages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  "flex flex-col gap-1",
                  message.author === "manager" ? "items-end" : "items-start",
                )}
              >
                <span className="flex items-center gap-1.5 text-[0.64rem] uppercase tracking-[0.12em] text-ivory/40">
                  {message.author === "manager" ? c.manager : c.client}
                  <span className="text-ivory/30">{dateFormat.format(new Date(message.at))}</span>
                </span>
                <p
                  className={cn(
                    "max-w-[90%] px-3 py-2 text-[0.82rem] leading-relaxed",
                    message.author === "manager"
                      ? "bg-gold text-obsidian"
                      : "border border-white/10 bg-white/5 text-ivory/65",
                  )}
                >
                  {message.text}
                </p>
              </div>
            ))
          ) : (
            <p className="py-10 text-center text-[0.76rem] text-ivory/40">{c.noMessages}</p>
          )}
        </div>
        <form onSubmit={submit} className="border-t border-white/10 p-4">
          <p className="mb-2 text-[0.66rem] uppercase tracking-[0.14em] text-ivory/40">{c.reply}</p>
          <div className="flex gap-2">
            <input
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              placeholder={c.replyPlaceholder}
              className="h-10 min-w-0 flex-1 border border-white/12 bg-transparent px-3 text-[0.8rem] text-ivory outline-none placeholder:text-ivory/35 focus:border-gold/50"
            />
            <button
              type="submit"
              className="flex h-10 items-center gap-2 bg-gold px-4 text-[0.7rem] font-semibold uppercase tracking-[0.12em] text-obsidian transition-colors hover:bg-gold-light"
            >
              <Send className="h-3.5 w-3.5" />
              {c.send}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

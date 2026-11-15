"use client";

import { useCallback, useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { LazyMotion, domAnimation, m, useReducedMotion } from "framer-motion";
import { toast as sonnerToast } from "sonner";
import {
  Activity,
  Archive,
  ArrowUpRight,
  Building2,
  Bell,
  BellRing,
  CalendarDays,
  Check,
  ChevronDown,
  Copy,
  ExternalLink,
  FileSignature,
  FileText,
  Flag,
  FolderKanban,
  Eye,
  Image as ImageIcon,
  Inbox,
  LayoutDashboard,
  Loader2,
  Menu,
  MessageSquare,
  MoreVertical,
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
  UserRound,
  Wallet,
  Wrench,
  X,
} from "lucide-react";
import { isAdminUser, useAuth, type PortalUser } from "@/components/providers/AuthProvider";
import { useI18n } from "@/components/providers/I18nProvider";

import {
  useWorkspace,
  type WorkspaceProject,
} from "@/components/providers/WorkspaceProvider";
import { AdminAccess } from "@/components/sections/admin/AdminAccess";
import { AdminCommandPalette } from "@/components/sections/admin/AdminCommandPalette";
import { AdminProfile, AdminProfilePrompt } from "@/components/sections/admin/AdminProfile";
import { AdminNotificationsDrawer } from "@/components/sections/admin/AdminNotificationsDrawer";
import { AdminProjectEditor } from "@/components/sections/admin/AdminProjectEditor";
import { AdminMaintenance } from "@/components/sections/admin/AdminMaintenance";
import {
  AuditPanel,
  ConsultationsPanel,
  ContractsPanel,
  InquiriesPanel,
  MilestonesPanel,
  NotificationsPanel,
} from "@/components/sections/admin/AdminOperations";
import { BrandLogo } from "@/components/ui/BrandLogo";
import { Field, TextInput, Textarea } from "@/components/ui/Field";
import { ProjectArt } from "@/components/ui/ProjectArt";
import { Checkbox } from "@/components/ui/Checkbox";
import { AdminSectionBoundary } from "@/components/system/AdminSectionBoundary";
import { Button, Card, Chip, DataTable, EmptyState, PageHeader, StatusPill, Table, TD, TH, THead, TR, AdminInput, AdminSelect } from "@/components/ui/admin";
import { ConfirmDialog, Drawer, Modal, Popover } from "@/components/ui/admin/overlay";
import { Input as FieldInput, Select as FieldSelect, Slider } from "@/components/ui/admin/form";
import { ProjectImage } from "@/components/ui/ProjectImage";
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

import { cn } from "@/lib/utils";
import {
  buildAlerts,
  budgetHealthCopy,
  byCity,
  formatSAR,
  getBudgetHealth,
  needsAttention as projectNeedsAttention,
  projectCity,
  projectName,
  toMetricsProject,
  type Alert,
} from "@/lib/project-metrics";

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
  | "maintenance"
  | "profile"
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
  maintenance: "/admin/maintenance",
  profile: "/admin/profile",
  access: "/admin/access",
};

function sectionFromPath(pathname: string | null): Section | null {
  if (!pathname || !pathname.startsWith("/admin")) return null;
  const path = pathname.replace(/\/+$/, "");
  if (path === "/admin" || path === "/admin/overview") return "overview";
  const slug = path.slice("/admin/".length);
  if (slug === "site-content" || slug === "content") return "content";
  if (slug in sectionHrefs) return slug as Section;
  return null;
}

function viewportTier() {
  if (typeof window === "undefined") return "xl" as const;
  if (window.innerWidth < 1024) return "mobile" as const;
  if (window.innerWidth < 1280) return "lg" as const;
  return "xl" as const;
}

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
    profile: "الملف الشخصي",
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
    cancel: "إلغاء",
    delete: "حذف",
    archive: "أرشفة",
    archived: "المؤرشفة",
    restore: "استعادة",
    undo: "تراجع",
    archiveTitle: "أرشفة المشروع؟",
    archiveBody: "سيُخفى المشروع من الموقع العام ويمكنك استعادته من تبويب المؤرشفة.",
    archivedToast: "تمت أرشفة المشروع",
    restoredToast: "تمت استعادة المشروع",
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
    profile: "Profile",
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
    cancel: "Cancel",
    delete: "Delete",
    archive: "Archive",
    archived: "Archived",
    restore: "Restore",
    undo: "Undo",
    archiveTitle: "Archive project?",
    archiveBody: "The project will be hidden from the public site. Restore it any time from the Archived tab.",
    archivedToast: "Project archived",
    restoredToast: "Project restored",
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

const formatM = (value: number, locale: "ar" | "en") => formatSAR(value, locale);
const formatMoney = (value: number, locale: "ar" | "en") => formatSAR(value, locale);

export function AdminDashboard({
  initialSection = "overview",
}: {
  initialSection?: AdminSection;
}) {
  const { locale, toggleLocale } = useI18n();
  const { user, ready } = useAuth();
  const { projects, messages, addProject, updateProject, ready: workspaceReady } = useWorkspace();
  const router = useRouter();
  const pathname = usePathname();
  const c = copy[locale];
  const section = sectionFromPath(pathname) ?? initialSection;
  const [editing, setEditing] = useState<WorkspaceProject | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [tier, setTier] = useState<"mobile" | "lg" | "xl">("xl");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    if (typeof window === "undefined") return false;
    try { return localStorage.getItem("admin-sidebar-collapsed") === "1"; } catch { return false; }
  });
  const [fontScale, setFontScale] = useState<"normal" | "large">(() => {
    if (typeof window === "undefined") return "normal";
    try { const f = localStorage.getItem("admin-font-size"); return f === "large" ? "large" : "normal"; } catch { return "normal"; }
  });
  const [density, setDensity] = useState<"comfortable" | "compact">(() => {
    if (typeof window === "undefined") return "comfortable";
    try { const d = localStorage.getItem("admin-density"); return d === "compact" ? "compact" : "comfortable"; } catch { return "comfortable"; }
  });
  const [theme, setTheme] = useState<"dark" | "light">(() => {
    if (typeof window === "undefined") return "dark";
    try { const t = localStorage.getItem("admin-theme"); return t === "light" ? "light" : "dark"; } catch { return "dark"; }
  });
  const mainRef = useRef<HTMLElement | null>(null);
  const autoCollapsed = tier === "lg";
  const collapsed = autoCollapsed || sidebarCollapsed;

  useEffect(() => {
    const update = () => setTier(viewportTier());
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  useEffect(() => {
    const main = mainRef.current;
    if (!main) return;
    main.scrollTo({ top: 0, behavior: "auto" });
  }, []);

  const scrollPositions = useRef(new Map<string, number>());

  useEffect(() => {
    const main = mainRef.current;
    if (!main) return;
    const saved = scrollPositions.current.get(pathname) ?? 0;
    main.scrollTo({ top: saved, behavior: "auto" });
    const onScroll = () => {
      scrollPositions.current.set(pathname, main.scrollTop);
    };
    main.addEventListener("scroll", onScroll, { passive: true });
    return () => main.removeEventListener("scroll", onScroll);
  }, [pathname]);

  useEffect(() => { try { localStorage.setItem("admin-density", density); } catch {} }, [density]);
  useEffect(() => { try { localStorage.setItem("admin-font-size", fontScale); } catch {} }, [fontScale]);
  useEffect(() => { try { localStorage.setItem("admin-sidebar-collapsed", sidebarCollapsed ? "1" : "0"); } catch {} }, [sidebarCollapsed]);
  useEffect(() => {
    try { localStorage.setItem("admin-theme", theme); } catch {}
    const root = document.documentElement;
    if (theme === "light") root.setAttribute("data-theme", "light");
    else root.removeAttribute("data-theme");
  }, [theme]);

  const navigateToSection = useCallback((next: Section, focusId?: string) => {
    setMobileNavOpen(false);
    setMoreOpen(false);
    const href = sectionHrefs[next];
    router.push(
      focusId ? `${href}?focus=${encodeURIComponent(focusId)}` : href,
    );
  }, [router]);

  useEffect(() => {
    if (paletteOpen || shortcutsOpen) return;
    let gPressed = false;
    let gTimer = 0;
    const isTyping = (target: EventTarget | null) => {
      const element = target as HTMLElement | null;
      if (!element) return false;
      return Boolean(
        element.closest("input, textarea, select, [contenteditable='true']"),
      );
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setPaletteOpen(true);
        return;
      }
      if (event.metaKey || event.ctrlKey || event.altKey || isTyping(event.target)) {
        return;
      }
      if (event.key === "/") {
        event.preventDefault();
        setPaletteOpen(true);
        return;
      }
      if (event.key === "?") {
        event.preventDefault();
        setShortcutsOpen(true);
        return;
      }
      if (event.key.toLowerCase() === "n") {
        event.preventDefault();
        navigateToSection("projects");
        setEditing(null);
        setEditorOpen(true);
        return;
      }
      if (event.key.toLowerCase() === "g") {
        gPressed = true;
        window.clearTimeout(gTimer);
        gTimer = window.setTimeout(() => {
          gPressed = false;
        }, 900);
        return;
      }
      if (gPressed) {
        const key = event.key.toLowerCase();
        gPressed = false;
        window.clearTimeout(gTimer);
        if (key === "p") {
          event.preventDefault();
          navigateToSection("projects");
        } else if (key === "o") {
          event.preventDefault();
          navigateToSection("overview");
        } else if (key === "i") {
          event.preventDefault();
          navigateToSection("inquiries");
        } else if (key === "c") {
          event.preventDefault();
          navigateToSection("contracts");
        }
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.clearTimeout(gTimer);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [paletteOpen, shortcutsOpen, navigateToSection]);

  if (!ready) {
    return (
      <section className="admin-shell flex h-dvh min-h-0 overflow-hidden bg-[var(--admin-bg)]">
        <div className="relative mx-auto flex h-full min-h-0 w-full max-w-[1600px]">
          <aside className="hidden w-[264px] shrink-0 flex-col border-e border-[var(--admin-card-border)] bg-[var(--admin-sidebar)] lg:flex">
            <div className="h-[72px] border-b border-[var(--admin-card-border)]" />
            <div className="flex flex-col gap-2 p-3">
              {Array.from({ length: 8 }).map((_, index) => (
                <div key={index} className="h-11 animate-pulse rounded-[12px] bg-white/[0.045]" />
              ))}
            </div>
          </aside>
          <div className="flex min-w-0 flex-1 flex-col">
            <header className="flex h-[72px] shrink-0 items-center gap-3 border-b border-[var(--admin-card-border)] px-4 sm:px-8">
              <div className="h-11 w-11 animate-pulse rounded-full bg-white/[0.05] lg:hidden" />
              <div className="h-10 w-48 animate-pulse rounded-full bg-white/[0.05]" />
              <div className="ms-auto h-11 w-36 animate-pulse rounded-full bg-white/[0.05]" />
            </header>
            <main className="flex-1 space-y-5 overflow-hidden p-4 sm:p-6 lg:p-8" aria-busy="true" aria-label="Loading admin dashboard">
              <div className="h-44 animate-pulse rounded-[24px] bg-white/[0.04]" />
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
                {Array.from({ length: 5 }).map((_, index) => (
                  <div key={index} className="h-36 animate-pulse rounded-[20px] bg-white/[0.04]" />
                ))}
              </div>
              <div className="grid gap-4 xl:grid-cols-[1.7fr_1fr]">
                <div className="h-64 animate-pulse rounded-[22px] bg-white/[0.04]" />
                <div className="h-64 animate-pulse rounded-[22px] bg-white/[0.04]" />
              </div>
            </main>
          </div>
        </div>
      </section>
    );
  }

  const isAdmin = isAdminUser(user);

  if (!user || !isAdmin) {
    return (
      <section className="relative flex h-dvh items-center overflow-hidden bg-obsidian">
        <div className="blueprint-grid pointer-events-none absolute inset-0 opacity-40" />
        <div className="container-lux relative">
          <div className="mx-auto flex max-w-lg flex-col items-center text-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-full border border-gold/30 bg-gold/5 text-gold">
              <ShieldCheck className="h-5 w-5" />
            </span>
            <h1 className="mt-6 text-[clamp(2.2rem,5vw,3.6rem)] font-bold leading-tight text-ivory [font-family:var(--font-inter),var(--font-arabic),system-ui,sans-serif]">
              {c.accessTitle}
            </h1>
            <p className="mt-5 max-w-md text-[0.9rem] leading-[1.9] text-ivory/60">
              {c.accessText}
            </p>
            <Link
              href="/sign-in"
              className="btn-shine mt-9 inline-flex min-h-[44px] items-center gap-2.5 rounded-[12px] bg-gold px-7 text-[15px] font-bold text-obsidian transition-colors hover:bg-gold-light"
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
        { id: "profile", label: c.profile, icon: UserRound },
        { id: "notifications", label: c.notifications, icon: BellRing },
        { id: "audit", label: c.audit, icon: Activity },
        {
          id: "maintenance",
          label: locale === "ar" ? "الصيانة" : "Maintenance",
          icon: Wrench,
        },
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
  };

  const sidebarBrand = (collapsed: boolean) => (
    <div className="flex h-[72px] shrink-0 items-center gap-2 border-b border-[var(--admin-card-border)] px-4">
      <Link
        href="/admin"
        onClick={() => { setMobileNavOpen(false); setMoreOpen(false); }}
        className="min-w-0 flex-1 rounded-[12px] admin-focus-ring"
        aria-label={locale === "ar" ? "نظرة عامة" : "Overview"}
      >
        <BrandLogo variant="full" collapsed={collapsed} tone={theme === "light" ? "dark" : "light"} />
      </Link>
      <button
        type="button"
        onClick={() => setSidebarCollapsed((value) => !value)}
        className={cn("admin-focus-ring hidden h-10 w-10 shrink-0 items-center justify-center rounded-[12px] text-[var(--admin-muted)] hover:bg-[var(--admin-pill-surface)] xl:inline-flex", collapsed && "-rotate-90 rtl:rotate-90")}
        aria-label={collapsed ? (locale === "ar" ? "توسيع الشريط" : "Expand sidebar") : (locale === "ar" ? "طي الشريط" : "Collapse sidebar")}
      >
        <ChevronDown className="h-4 w-4 rotate-90 rtl:-rotate-90" />
      </button>
      <button
        type="button"
        onClick={() => setMobileNavOpen(false)}
        className="admin-focus-ring inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] text-[var(--admin-muted)] hover:bg-[var(--admin-pill-surface)] lg:hidden"
        aria-label={locale === "ar" ? "إغلاق" : "Close"}
      >
        <X className="h-5 w-5" strokeWidth={1.7} />
      </button>
    </div>
  );

  const sidebarNav = (collapsed: boolean) => (
    <nav
      className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 py-2 [scrollbar-width:thin]"
      aria-label={locale === "ar" ? "تنقل الإدارة" : "Admin navigation"}
    >
      {navGroups.map((group) => (
        <div key={group.title} className="mt-1 first:mt-0">
          {!collapsed ? (
            <p className="px-3 pb-[6px] pt-[18px] text-[12px] text-[var(--admin-muted)]">{group.title}</p>
          ) : (
            <div className="my-2 h-px bg-[var(--admin-card-border)]" />
          )}
          <div className="flex flex-col gap-[2px]">
            {group.items.map(({ id, label, icon: Icon }) => {
              const active = section === id;
              const badge = id === "messages" ? messages.length : id === "notifications" ? 1 : 0;
              return (
                <Link
                  key={id}
                  href={sectionHrefs[id]}
                  prefetch
                  title={collapsed ? label : undefined}
                  aria-label={label}
                  onClick={() => {
                    setMobileNavOpen(false);
                    setMoreOpen(false);
                    if (active && mainRef.current) mainRef.current.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "admin-focus-ring group relative flex min-h-[44px] items-center gap-3 rounded-[12px] px-3 py-[11px] text-[15px] transition-colors",
                    collapsed && "justify-center px-0",
                    active
                      ? "bg-[linear-gradient(90deg,rgba(226,176,74,0.20),rgba(226,176,74,0.04))] text-[#F3C86A] shadow-[inset_0_0_0_1px_rgba(226,176,74,0.25)]"
                      : "text-[var(--admin-muted)] hover:bg-[var(--admin-pill-surface)] hover:text-[var(--admin-text)]",
                  )}
                >
                  <Icon className="h-5 w-5 shrink-0" strokeWidth={1.7} />
                  {!collapsed ? <span className="flex-1 truncate">{label}</span> : null}
                  {!collapsed && badge > 0 ? <span className="ms-auto rounded-[9px] bg-[var(--admin-red)] px-[7px] py-0 text-[12px] leading-[18px] text-white">{badge}</span> : null}
                  {collapsed && badge > 0 ? <span className="absolute end-2 top-2 h-2 w-2 rounded-full bg-[var(--admin-red)]" /> : null}
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </nav>
  );

  const sidebarUser = (collapsed: boolean) => (
    <div className="shrink-0 border-t border-[var(--admin-card-border)] p-3">
      {!collapsed ? (
        <div className="flex items-center gap-[10px] rounded-[14px] border border-[var(--admin-card-border)] bg-[var(--admin-pill-surface)] p-3">
          <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[linear-gradient(135deg,#F3C86A,#C98F1E)] text-[14px] font-extrabold text-[#1a1205]">
            {profileMonogram(user, locale)}
            <span className="absolute bottom-0 end-0 h-[11px] w-[11px] rounded-full border-2 border-[var(--admin-bg)] bg-[var(--admin-green)]" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-[14px] font-medium text-[var(--admin-text)]">{profileName(user, locale) || "—"}</p>
            <p className="truncate text-[12px] text-[var(--admin-muted)]">{userRoleLabel(user, locale)}</p>
          </div>
        </div>
      ) : (
        <div
          className="relative mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-[linear-gradient(135deg,#F3C86A,#C98F1E)] text-[13px] font-extrabold text-[#1a1205]"
          title={profileName(user, locale) || "—"}
        >
          {profileMonogram(user, locale)}
          <span className="absolute bottom-0 end-0 h-[10px] w-[10px] rounded-full border-2 border-[var(--admin-bg)] bg-[var(--admin-green)]" />
        </div>
      )}
    </div>
  );

  const moreGroups = navGroups
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => !["overview", "projects", "notifications"].includes(item.id)),
    }))
    .filter((group) => group.items.length > 0);

  return (
    <LazyMotion features={domAnimation}>
      <section
        className={cn(
          "admin-shell relative flex h-dvh min-h-0 overflow-hidden",
          fontScale === "large" ? "text-[18px]" : "text-[16px]",
          density === "compact" && "[--admin-card-gap:16px] [--admin-page-pad:24px]",
        )}
        data-admin-theme={theme}
      >
        <div className="relative mx-auto flex h-full min-h-0 w-full max-w-[1600px]">
          <aside
            data-collapsed={collapsed ? "true" : "false"}
            className={cn(
              "hidden h-dvh w-[264px] shrink-0 flex-col border-e border-[var(--admin-card-border)] bg-[var(--admin-sidebar)] transition-[width] duration-200 data-[collapsed=true]:w-[76px] lg:flex",
            )}
          >
            {sidebarBrand(collapsed)}
            {sidebarNav(collapsed)}
            {sidebarUser(collapsed)}
          </aside>

          <div className="flex min-w-0 flex-1 flex-col">
            <header className="flex h-[72px] shrink-0 items-center gap-2 border-b border-[var(--admin-card-border)] px-3 sm:px-6 lg:px-8">
              <button
                type="button"
                onClick={() => setMobileNavOpen(true)}
                className="admin-focus-ring inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-[12px] text-[var(--admin-muted)] hover:bg-[var(--admin-pill-surface)] lg:hidden"
                aria-label={locale === "ar" ? "فتح القائمة" : "Open menu"}
              >
                <Menu className="h-5 w-5" strokeWidth={1.7} />
              </button>

              <Link
                href="/admin"
                onClick={() => setMoreOpen(false)}
                className="shrink-0 rounded-[12px] admin-focus-ring lg:hidden"
                aria-label={locale === "ar" ? "نظرة عامة" : "Overview"}
              >
                <BrandLogo variant="mark" className="sm:hidden" priority tone={theme === "light" ? "dark" : "light"} />
                <BrandLogo variant="full" className="hidden sm:flex" priority tone={theme === "light" ? "dark" : "light"} />
              </Link>

              <nav aria-label="Breadcrumb" className="hidden items-center gap-2 text-[14px] text-[var(--admin-muted)] lg:flex">
                <span>{locale === "ar" ? "الرئيسية" : "Home"}</span>
                <span aria-hidden="true">‹</span>
                <span className="text-[var(--admin-text)]/80">{navItems.find((i) => i.id === section)?.label ?? (locale === "ar" ? "نظرة عامة" : "Overview")}</span>
              </nav>

              <button
                type="button"
                onClick={() => setPaletteOpen(true)}
                className="admin-focus-ring ms-auto hidden h-11 min-w-0 max-w-[360px] flex-1 items-center gap-[10px] rounded-[999px] border border-[var(--admin-card-border)] bg-[var(--admin-pill-surface)] px-4 text-[14px] text-[var(--admin-muted)] md:flex"
              >
                <Search className="h-5 w-5 shrink-0" strokeWidth={1.7} />
                <span className="truncate">{locale === "ar" ? "ابحث في المشاريع والعقود…" : "Search projects and contracts…"}</span>
                <kbd className="ms-auto shrink-0 rounded-[6px] border border-[var(--admin-card-border)] px-[7px] py-[1px] text-[12px]">⌘K</kbd>
              </button>

              <button
                type="button"
                onClick={() => setPaletteOpen(true)}
                className="admin-focus-ring ms-auto inline-flex h-11 w-11 items-center justify-center rounded-full border border-[var(--admin-card-border)] bg-[var(--admin-pill-surface)] text-[var(--admin-muted)] md:hidden"
                aria-label={locale === "ar" ? "بحث" : "Search"}
              >
                <Search className="h-5 w-5" strokeWidth={1.7} />
              </button>

              <button type="button" onClick={() => setTheme((t) => (t === "dark" ? "light" : "dark"))} className="admin-focus-ring inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-[var(--admin-card-border)] bg-[var(--admin-pill-surface)] text-[13px] font-bold text-[var(--admin-text)]" aria-label={theme === "dark" ? (locale === "ar" ? "الوضع الفاتح" : "Light mode") : (locale === "ar" ? "الوضع الداكن" : "Dark mode")}>{theme === "dark" ? "☀" : "☾"}</button>
              <button type="button" onClick={toggleLocale} className="admin-focus-ring inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-[var(--admin-card-border)] bg-[var(--admin-pill-surface)] text-[13px] font-bold text-[var(--admin-text)]" aria-label={locale === "ar" ? "English" : "العربية"}>{locale === "ar" ? "EN" : "AR"}</button>
              <button type="button" onClick={() => setNotificationsOpen(true)} className="admin-focus-ring relative inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-[var(--admin-card-border)] bg-[var(--admin-pill-surface)] text-[var(--admin-text)]" aria-label={locale === "ar" ? "التنبيهات" : "Notifications"} aria-haspopup="dialog">
                <Bell className="h-5 w-5" strokeWidth={1.7} />
                <span className="absolute top-[10px] end-[11px] h-2 w-2 rounded-full bg-[var(--admin-gold)]" />
              </button>
            </header>

            <main
              ref={mainRef}
              id="main"
              className="min-h-0 flex-1 overflow-y-auto overscroll-contain scroll-smooth px-4 py-5 pb-[calc(64px+env(safe-area-inset-bottom,0px)+20px)] sm:px-6 md:px-8 md:py-6 md:pb-6 lg:px-[var(--admin-page-pad)]"
            >
              <div className="mb-5 hidden items-center justify-between border-b border-[var(--admin-card-border)] pb-4 print:flex">
                <BrandLogo variant="full" tone="dark" />
                <span className="text-[12px] text-[var(--admin-muted)]">{formatRiyadhDate(locale)}</span>
              </div>
              <AdminSectionBoundary label={navItems.find((item) => item.id === section)?.label}>
                {section === "overview" ? (
                  <OverviewSection projects={projects} ready={workspaceReady} user={user} onNew={openNew} onNavigate={navigateToSection} density={density} setDensity={setDensity} fontScale={fontScale} setFontScale={setFontScale} setPaletteOpen={setPaletteOpen} locale={locale} />
                ) : null}
                {section === "projects" ? (
                  <ProjectsSection projects={projects} onNew={openNew} onEdit={openEdit} />
                ) : null}
                {section === "milestones" ? <MilestonesPanel /> : null}
                {section === "consultations" ? <ConsultationsPanel /> : null}
                {section === "contracts" ? <ContractsPanel /> : null}
                {section === "notifications" ? <NotificationsPanel /> : null}
                {section === "financials" ? <FinancialsSection projects={projects} /> : null}
                {section === "inquiries" ? <InquiriesPanel /> : null}
                {section === "content" ? <ContentSection /> : null}
                {section === "media" ? <MediaSection projects={projects} /> : null}
                {section === "messages" ? <MessagesSection projects={projects} /> : null}
                {section === "audit" ? <AuditPanel /> : null}
                {section === "maintenance" ? <AdminMaintenance /> : null}
                {section === "profile" ? <AdminProfile /> : null}
                {section === "access" ? <AdminAccess /> : null}
              </AdminSectionBoundary>
            </main>
          </div>
        </div>

        <Drawer
          open={mobileNavOpen}
          onOpenChange={setMobileNavOpen}
          title={locale === "ar" ? "قائمة التنقل" : "Navigation menu"}
          closeLabel={locale === "ar" ? "إغلاق" : "Close"}
          side="start"
          bare
          widthClassName="w-[min(300px,88vw)]!"
          className="bg-[var(--admin-sidebar)] bg-none lg:hidden"
          bodyClassName="flex min-h-0 flex-1 flex-col overflow-y-auto p-0"
        >
          {sidebarBrand(false)}
          {sidebarNav(false)}
          {sidebarUser(false)}
        </Drawer>

        <Modal
          open={moreOpen}
          onOpenChange={setMoreOpen}
          title={locale === "ar" ? "المزيد" : "More"}
          closeLabel={locale === "ar" ? "إغلاق" : "Close"}
          size="sm"
          className="md:hidden"
        >
          <div className="flex flex-col gap-4">
            {moreGroups.map((group) => (
              <div key={group.title}>
                <p className="mb-1 px-1 text-[13px] text-[var(--admin-muted)]">{group.title}</p>
                <div className="grid grid-cols-2 gap-2">
                  {group.items.map(({ id, label, icon: Icon }) => {
                    const active = section === id;
                    return (
                      <Link
                        key={id}
                        href={sectionHrefs[id]}
                        prefetch
                        onClick={() => setMoreOpen(false)}
                        aria-current={active ? "page" : undefined}
                        className={cn(
                          "admin-focus-ring flex min-h-[52px] items-center gap-3 rounded-xl border px-3 text-[14px]",
                          active
                            ? "border-[rgba(226,176,74,0.28)] bg-[rgba(226,176,74,0.12)] text-[var(--admin-gold)]"
                            : "border-[var(--admin-card-border)] bg-[var(--admin-pill-surface)] text-[var(--admin-text)]",
                        )}
                      >
                        <Icon className="h-5 w-5 shrink-0" strokeWidth={1.7} />
                        <span className="truncate">{label}</span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </Modal>

        <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-[var(--admin-card-border)] bg-[var(--admin-bg)]/95 pb-[env(safe-area-inset-bottom,0px)] backdrop-blur md:hidden" aria-label={locale === "ar" ? "تنقل سفلي" : "Bottom navigation"}>
          <div className="mx-auto grid h-16 max-w-3xl grid-cols-4 px-2">
            {([
              { id: "overview" as Section, label: locale === "ar" ? "نظرة عامة" : "Overview", icon: LayoutDashboard },
              { id: "projects" as Section, label: locale === "ar" ? "المشاريع" : "Projects", icon: FolderKanban },
              { id: "notifications" as Section, label: locale === "ar" ? "التنبيهات" : "Alerts", icon: BellRing },
            ]).map(({ id, label, icon: Icon }) => {
              const active = section === id;
              return (
                <button key={id} type="button" onClick={() => navigateToSection(id)} className={cn("admin-focus-ring flex min-h-[52px] flex-col items-center justify-center gap-1 rounded-[12px] px-2 text-[12px] whitespace-nowrap", active ? "text-[var(--admin-gold)]" : "text-[var(--admin-muted)]")}>
                  <Icon className="h-5 w-5" strokeWidth={1.7} />
                  <span className="truncate">{label}</span>
                </button>
              );
            })}
            <button type="button" onClick={() => setMoreOpen(true)} className={cn("admin-focus-ring flex min-h-[52px] flex-col items-center justify-center gap-1 rounded-[12px] px-2 text-[12px] whitespace-nowrap", moreOpen ? "text-[var(--admin-gold)]" : "text-[var(--admin-muted)]")}>
              <MoreVertical className="h-5 w-5" strokeWidth={1.7} />
              <span className="truncate">{locale === "ar" ? "المزيد" : "More"}</span>
            </button>
          </div>
        </nav>
      </section>

      <AdminNotificationsDrawer
        open={notificationsOpen}
        onOpenChange={setNotificationsOpen}
        projects={projects}
        onNavigate={(target) => {
          setNotificationsOpen(false);
          navigateToSection(target);
        }}
      />
      {shortcutsOpen ? (
        <Modal
          open
          onOpenChange={(open) => {
            if (!open) setShortcutsOpen(false);
          }}
          title={locale === "ar" ? "اختصارات لوحة المفاتيح" : "Keyboard shortcuts"}
          closeLabel={locale === "ar" ? "إغلاق" : "Close"}
          size="sm"
        >
          <dl className="divide-y divide-[var(--admin-card-border)]">
            {[
              ["⌘ / Ctrl + K", locale === "ar" ? "فتح الأوامر السريعة" : "Open command palette"],
              ["/", locale === "ar" ? "التركيز على البحث" : "Focus search"],
              ["g p", locale === "ar" ? "الانتقال إلى المشاريع" : "Go to projects"],
              ["g o", locale === "ar" ? "الانتقال إلى النظرة العامة" : "Go to overview"],
              ["g i", locale === "ar" ? "الانتقال إلى الاستفسارات" : "Go to inquiries"],
              ["g c", locale === "ar" ? "الانتقال إلى العقود" : "Go to contracts"],
              ["n", locale === "ar" ? "مشروع جديد" : "New project"],
              ["?", locale === "ar" ? "عرض هذه القائمة" : "Show this list"],
            ].map(([keys, label]) => (
              <div key={keys} className="flex items-center justify-between gap-4 py-2.5">
                <dt className="text-[14px] text-[var(--admin-text)]">{label}</dt>
                <dd>
                  <kbd className="whitespace-nowrap rounded-md border border-[var(--admin-card-border)] bg-[var(--admin-pill-surface)] px-2 py-1 font-mono text-[12px] text-[var(--admin-muted)]">
                    {keys}
                  </kbd>
                </dd>
              </div>
            ))}
          </dl>
        </Modal>
      ) : null}
      {paletteOpen ? (
        <AdminCommandPalette projects={projects} sections={paletteSections} onClose={() => setPaletteOpen(false)} onOpenProject={openEdit} onNavigate={navigateToSection} />
      ) : null}
      {editorOpen ? (
        <AdminProjectEditor key={editing?.slug ?? "new"} project={editing} existingSlugs={projects.map((project) => project.slug)} onClose={() => { setEditorOpen(false); setEditing(null); }} onSave={saveProject} />
      ) : null}
      {ready && isAdmin ? <AdminProfilePrompt /> : null}
    </LazyMotion>
  );
}



function userInitials(name: string) {
  const parts = (name || "").trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "—";
  return parts.slice(0, 2).map((p) => Array.from(p)[0] || "").join("").toUpperCase();
}

function userRoleLabel(user: { role?: string; primaryAdmin?: boolean; company?: string }, locale: "ar" | "en") {
  if (user.primaryAdmin) return locale === "ar" ? "المسؤول الرئيسي" : "Primary admin";
  if (user.role === "admin") return locale === "ar" ? "مسؤول" : "Admin";
  if (user.role === "client") return locale === "ar" ? "عميل" : "Client";
  return user.company || (locale === "ar" ? "مستخدم" : "User");
}

/** The signed-in profile's name, not a hardcoded role or placeholder. */
function profileName(user: PortalUser, locale: "ar" | "en") {
  const name = locale === "ar" ? user.nameAr || user.name : user.name;
  const honorific = locale === "ar" ? user.honorificAr || user.honorific : user.honorific;
  return [honorific, name].filter(Boolean).join(" ").trim();
}

function profileMonogram(user: PortalUser, locale: "ar" | "en") {
  return userInitials(locale === "ar" ? user.nameAr || user.name : user.name);
}

function riyadhHour() {
  try {
    const parts = new Intl.DateTimeFormat("en-US", { timeZone: "Asia/Riyadh", hour: "numeric", hour12: false }).formatToParts(new Date());
    const h = Number(parts.find((p) => p.type === "hour")?.value || "0");
    return h;
  } catch {
    return new Date().getHours();
  }
}

function greetingFor(locale: "ar" | "en") {
  const h = riyadhHour();
  if (locale === "ar") {
    if (h >= 5 && h < 12) return "صباح الخير";
    if (h >= 12 && h < 17) return "مساء الخير";
    return "مساء الخير";
  }
  if (h >= 5 && h < 12) return "Good morning";
  if (h >= 12 && h < 17) return "Good afternoon";
  return "Good evening";
}

function formatRiyadhDate(locale: "ar" | "en") {
  try {
    return new Intl.DateTimeFormat(locale === "ar" ? "ar-SA" : "en-US", { dateStyle: "full", timeZone: "Asia/Riyadh" }).format(new Date());
  } catch {
    return "";
  }
}

const BUDGET_HEALTH_RANK: Record<string, number> = { overrun: 0, over: 1, watch: 2, on_track: 3, saved: 4, no_data: 5 };

function StatusDonut({ completed, ongoing, upcoming }: { completed: number; ongoing: number; upcoming: number }) {
  const total = completed + ongoing + upcoming || 1;
  const C = 2 * Math.PI * 40;
  const seg = (n: number) => (n / total) * C;
  const a = seg(completed), b = seg(ongoing), c = seg(upcoming), gap = 4;
  const arc = (len: number, offset: number, color: string) => len > 0 ? (
    <circle cx="50" cy="50" r="40" stroke={color} strokeLinecap="round"
      strokeDasharray={`${Math.max(len - gap, 0)} ${C}`} strokeDashoffset={-offset} />
  ) : null;
  return (
    <svg width="150" height="150" viewBox="0 0 100 100" role="img"
         aria-label={`${completed} of ${total} projects completed`}>
      <g fill="none" strokeWidth="9" transform="rotate(-90 50 50)">
        <circle cx="50" cy="50" r="40" stroke="#232632" />
        {arc(a, 0, "#4CCB96")}{arc(b, a, "#E2B04A")}{arc(c, a + b, "#6BB6FF")}
      </g>
      <text x="50" y="56" textAnchor="middle" fill="#F1EEE8" fontSize="20" fontWeight="800">{completed}/{total}</text>
    </svg>
  );
}

function AdminWatermarkMark() {
  return (
    <Image
      src="/brand/logo-mark.svg"
      alt=""
      aria-hidden="true"
      width={390}
      height={328}
      unoptimized
      className="pointer-events-none absolute -start-[30px] -bottom-[40px] h-[354px] w-auto opacity-[0.07] brightness-0 invert"
    />
  );
}

function OverviewSection({
  projects,
  ready,
  user,
  onNew,
  onNavigate,
  density,
  setDensity,
  fontScale,
  setFontScale,
  setPaletteOpen: _setPaletteOpen,
  locale,
}: {
  projects: WorkspaceProject[];
  ready: boolean;
  user: PortalUser;
  onNew: () => void;
  onNavigate: (section: Section) => void;
  density: "comfortable" | "compact";
  setDensity: (v: "comfortable" | "compact") => void;
  fontScale: "normal" | "large";
  setFontScale: (v: "normal" | "large") => void;
  setPaletteOpen?: (v: boolean) => void;
  locale: "ar" | "en";
}) {
  void _setPaletteOpen;
  const isAr = locale === "ar";
  const reduce = useReducedMotion();
  const nf = useMemo(() => new Intl.NumberFormat(isAr ? "ar-SA" : "en-US"), [isAr]);
  const metrics = useMemo(() => projects.map(toMetricsProject), [projects]);
  const alerts = useMemo(() => buildAlerts(metrics), [metrics]);
  const byId = useMemo(() => new Map(metrics.map((p) => [p.id, p])), [metrics]);
  const [kpiState, setKpiState] = useState<
    | { status: "loading"; newInquiries: number | null; signedContracts: number | null }
    | { status: "ready"; newInquiries: number; signedContracts: number }
    | { status: "error"; newInquiries: null; signedContracts: null }
  >({ status: "loading", newInquiries: null, signedContracts: null });

  const refreshKpis = useCallback(async () => {
    try {
      const response = await fetch("/api/admin/kpis", {
        cache: "no-store",
        credentials: "same-origin",
      });
      if (!response.ok) throw new Error("kpi_unavailable");
      const data = (await response.json().catch(() => null)) as
        | { kpis?: { newInquiries?: unknown; signedContracts?: unknown } }
        | null;
      const newInquiries = data?.kpis?.newInquiries;
      const signedContracts = data?.kpis?.signedContracts;
      if (
        typeof newInquiries !== "number" ||
        !Number.isFinite(newInquiries) ||
        typeof signedContracts !== "number" ||
        !Number.isFinite(signedContracts)
      ) {
        throw new Error("kpi_invalid");
      }
      setKpiState({ status: "ready", newInquiries, signedContracts });
    } catch {
      setKpiState({ status: "error", newInquiries: null, signedContracts: null });
    }
  }, []);

  useEffect(() => {
    const initial = window.setTimeout(() => void refreshKpis(), 0);
    const timer = window.setInterval(() => void refreshKpis(), 60_000);
    const onFocus = () => {
      if (document.visibilityState === "visible") void refreshKpis();
    };
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onFocus);
    return () => {
      window.clearTimeout(initial);
      window.clearInterval(timer);
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onFocus);
    };
  }, [refreshKpis]);

  const kpiNumber = (value: number | null) =>
    kpiState.status === "error" || value == null ? "—" : nf.format(value);

  const completed = metrics.filter((p) => p.status === "completed").length;
  const ongoing = metrics.filter((p) => p.status === "ongoing").length;
  const upcoming = metrics.filter((p) => p.status === "upcoming").length;
  const totalCount = metrics.length;
  const totalValue = metrics.reduce((s, p) => s + (Number.isFinite(p.value) ? p.value : 0), 0);
  const totalProfit = metrics.reduce((s, p) => s + (Number.isFinite(p.profit) ? p.profit : 0), 0);
  const margin = totalValue > 0 ? (totalProfit / totalValue) * 100 : null;
  const cities = byCity(metrics);
  const distinctCities = cities.length;

  const alertText = (a: Alert) => {
    const name = projectName(byId.get(a.projectId)!, locale);
    if (a.type === "budget_ahead") {
      return isAr
        ? `${name}: المصروف يسبق الإنجاز بـ ${nf.format(a.params.gap || 0)} نقطة. راجع الدفعات القادمة.`
        : `${name}: spending is ${nf.format(a.params.gap || 0)} points ahead of progress. Review upcoming payments.`;
    }
    if (a.type === "budget_watch") {
      return isAr
        ? `${name}: المصروف يقترب من تجاوز الإنجاز بـ ${nf.format(a.params.gap || 0)} نقطة.`
        : `${name}: spending is nearing progress by ${nf.format(a.params.gap || 0)} points.`;
    }
    return isAr
      ? `${name}: تجاوز الميزانية بمقدار ${formatSAR(a.params.amount || 0, locale)}.`
      : `${name}: budget overrun by ${formatSAR(a.params.amount || 0, locale)}.`;
  };

  const topAlert = alerts[0];
  const attentionSentence = topAlert
    ? (isAr
        ? `مشروع يحتاج انتباهك اليوم: ${alertText(topAlert)}`
        : `One project needs your attention today: ${alertText(topAlert)}`)
    : (isAr ? "جميع المشاريع في المسار الصحيح." : "All projects are on track.");

  const greetingName = profileName(user, locale);
  const greeting = `${greetingFor(locale)}${greetingName ? (isAr ? `، ${greetingName}` : `, ${greetingName}`) : ""}`;
  const dateStr = formatRiyadhDate(locale);


  const budgetRows = useMemo(() => {
    return [...metrics]
      .sort((a, b) => {
        const ha = getBudgetHealth(a);
        const hb = getBudgetHealth(b);
        const ra = BUDGET_HEALTH_RANK[ha.key] ?? 9;
        const rb = BUDGET_HEALTH_RANK[hb.key] ?? 9;
        if (ra !== rb) return ra - rb;
        const sa = a.status === "ongoing" ? 0 : a.status === "upcoming" ? 1 : 2;
        const sb = b.status === "ongoing" ? 0 : b.status === "upcoming" ? 1 : 2;
        if (sa !== sb) return sa - sb;
        return b.value - a.value;
      });
  }, [metrics]);

  const activeUpcoming = useMemo(
    () => metrics.filter((p) => p.status === "ongoing" || p.status === "upcoming").slice(0, 4),
    [metrics],
  );

  const pillFor = (h: ReturnType<typeof getBudgetHealth>) => {
    const copy = budgetHealthCopy(h, locale);
    const cls =
      copy.tone === "success"
        ? "bg-[rgba(76,203,150,0.14)] text-[#7BE0B4]"
        : copy.tone === "warning"
          ? "bg-[rgba(226,176,74,0.14)] text-[#F3C86A]"
          : copy.tone === "danger"
            ? "bg-[rgba(255,107,94,0.14)] text-[#FF9A8F]"
            : "bg-white/10 text-[#A6A9B4]";
    return { text: copy.short, tooltip: copy.tooltip, cls };
  };

  const insight = useMemo(() => {
    if (!metrics.length) return isAr ? "لا توجد مشاريع حالياً. أضف مشروعاً لبدء التحليل." : "No projects yet. Add a project to start insights.";
    if (!alerts.length) return isAr ? "جميع المشاريع في المسار الصحيح من حيث الميزانية والإنجاز." : "All projects are on track in budget and progress.";
    const critical = alerts.filter((a) => a.severity === "critical").length;
    const warning = alerts.filter((a) => a.severity === "warning").length;
    const over = alerts.find((a) => a.type === "budget_ahead");
    if (over) {
      const name = projectName(byId.get(over.projectId)!, locale);
      return isAr
        ? `${name} يتطلب انتباهاً: المصروف يسبق الإنجاز بـ ${nf.format(over.params.gap || 0)} نقطة. ${critical + warning > 1 ? `إجمالي التنبيهات: ${nf.format(critical + warning)}.` : "باقي المشاريع مستقرة."}`
        : `${name} needs attention: spending is ${nf.format(over.params.gap || 0)} points ahead of progress. ${critical + warning > 1 ? `Total alerts: ${nf.format(critical + warning)}.` : "Other projects are stable."}`;
    }
    const first = alerts[0];
    const name = projectName(byId.get(first.projectId)!, locale);
    return isAr ? `تنبيه على ${name}. إجمالي التنبيهات: ${nf.format(alerts.length)}.` : `Alert on ${name}. Total alerts: ${nf.format(alerts.length)}.`;
  }, [alerts, metrics, byId, isAr, locale, nf]);

  const fadeUp = { hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0, transition: { duration: reduce ? 0 : 0.24, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] } } };
  const stagger = { show: { transition: { staggerChildren: reduce ? 0 : 0.04 } } };

  const splitMoney = (s: string) => {
    if (s === "—") return { num: "—", unit: "" };
    if (isAr) {
      const parts = s.split(" ");
      const unit = parts.slice(-2).join(" ");
      const num = parts.slice(0, -2).join(" ");
      return { num: num || s, unit: num ? unit : "" };
    }
    const m = s.match(/^(\S+)\s+(.+)$/);
    return m ? { num: m[2], unit: m[1] } : { num: s, unit: "" };
  };

  const portfolioStr = totalValue > 0 ? formatSAR(totalValue, locale) : "—";
  const profitStr = totalProfit > 0 || (totalValue > 0 && Number.isFinite(totalProfit)) ? formatSAR(totalProfit, locale) : "—";
  const portfolio = splitMoney(portfolioStr);
  const profit = splitMoney(profitStr);
  const marginStr = margin == null ? "—" : `${nf.format(Number(margin.toFixed(1)))}%`;

  const card = "flex flex-col gap-2 rounded-[20px] border border-white/[.07] bg-gradient-to-b from-white/[.055] to-white/[.02] p-5 transition-all duration-[160ms] hover:-translate-y-0.5 hover:border-[rgba(226,176,74,0.25)]";
  const panel = "flex flex-col gap-[18px] rounded-[22px] border border-white/[.07] bg-gradient-to-b from-white/[.05] to-white/[.018] p-[22px_24px]";

  if (!ready) {
    return (
      <div className="flex flex-col gap-[22px] animate-pulse">
        <div className="h-48 rounded-[24px] bg-white/[0.04]" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">{Array.from({length:5}).map((_,i)=><div key={i} className="h-36 rounded-[20px] bg-white/[0.04]" />)}</div>
        <div className="grid gap-[22px] xl:grid-cols-[1.7fr_1fr]"><div className="h-64 rounded-[22px] bg-white/[0.04]" /><div className="h-64 rounded-[22px] bg-white/[0.04]" /></div>
      </div>
    );
  }

  const maxCity = cities.length ? Math.max(...cities.map((c) => c.value), 1) : 1;

  return (
    <m.div className="flex flex-col gap-[22px]" initial="hidden" animate="show" variants={stagger}>
      <m.section variants={fadeUp} className="relative overflow-hidden rounded-[24px] border border-[rgba(226,176,74,0.22)] p-8 lg:px-9" style={{ background: "linear-gradient(135deg,#1D1608 0%,#12131A 55%,#0F1117 100%)" }}>
        <div className="pointer-events-none absolute inset-0 opacity-[0.045]" style={{ background: "linear-gradient(rgba(255,255,255,1) 1px, transparent 1px) 0 0/36px 36px, linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px) 0 0/36px 36px", WebkitMaskImage: "linear-gradient(270deg,#000,transparent 70%)", maskImage: "linear-gradient(270deg,#000,transparent 70%)" }} />
        <AdminWatermarkMark />
        <div className="relative flex flex-col gap-8 lg:flex-row lg:items-center">
          <div className="min-w-0 flex-1">
            <h1 className="text-[28px] font-bold leading-tight text-[#F1EEE8] [font-family:var(--font-inter),var(--font-arabic),system-ui,sans-serif]">{greeting}</h1>
            <p className="mt-2 max-w-[560px] text-[15px] leading-[1.8] text-[#C9CAD1]">
              {dateStr ? `${dateStr} · ` : ""}{attentionSentence}
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <button type="button" onClick={onNew} className="admin-focus-ring inline-flex min-h-[44px] items-center gap-2 rounded-[12px] border border-transparent bg-[linear-gradient(180deg,#F3C86A,#D9A03A)] px-5 py-3 text-[15px] font-bold text-[#1a1205] shadow-[0_8px_24px_rgba(226,176,74,0.28)] transition-transform duration-[160ms] hover:-translate-y-0.5">{isAr ? "+ إضافة مشروع" : "+ Add project"}</button>
              <button type="button" onClick={() => window.print()} className="admin-focus-ring inline-flex min-h-[44px] items-center gap-2 rounded-[12px] border border-white/15 bg-white/[0.04] px-5 py-3 text-[15px] font-bold text-[#F1EEE8] transition-all duration-[160ms] hover:-translate-y-0.5 hover:border-[rgba(226,176,74,0.25)]">{isAr ? "تقرير تنفيذي PDF" : "Executive PDF report"}</button>
              <button type="button" onClick={() => onNavigate("access")} className="admin-focus-ring inline-flex min-h-[44px] items-center gap-2 rounded-[12px] border border-white/15 bg-white/[0.04] px-5 py-3 text-[15px] font-bold text-[#F1EEE8] transition-all duration-[160ms] hover:-translate-y-0.5 hover:border-[rgba(226,176,74,0.25)]">{isAr ? "دعوة عضو للفريق" : "Invite team member"}</button>
            </div>
          </div>
          <div className="flex items-center gap-5 lg:ms-auto">
            <StatusDonut completed={completed} ongoing={ongoing} upcoming={upcoming} />
            <ul className="m-0 flex list-none flex-col gap-2 p-0 text-[14px] text-[#C9CAD1]">
              <li><span className="me-2 inline-block h-[9px] w-[9px] rounded-full align-middle" style={{ background: "#4CCB96" }} />{nf.format(completed)} {isAr ? "مكتمل" : "Completed"}</li>
              <li><span className="me-2 inline-block h-[9px] w-[9px] rounded-full align-middle" style={{ background: "#E2B04A" }} />{nf.format(ongoing)} {isAr ? "جارٍ" : "Ongoing"}</li>
              <li><span className="me-2 inline-block h-[9px] w-[9px] rounded-full align-middle" style={{ background: "#6BB6FF" }} />{nf.format(upcoming)} {isAr ? "قادم" : "Upcoming"}</li>
            </ul>
          </div>
        </div>
      </m.section>

      <m.section variants={stagger} className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        <m.div variants={fadeUp} className={card}>
          <div className="flex items-center gap-[10px] text-[14px] text-[#A6A9B4]"><Building2 className="h-5 w-5 text-[#E2B04A]" strokeWidth={1.7} />{isAr ? "إجمالي المشاريع" : "Total projects"}</div>
          <div className="whitespace-nowrap text-[28px] font-extrabold tabular-nums text-[#F1EEE8] [font-family:var(--font-inter),var(--font-arabic),system-ui,sans-serif]">{nf.format(totalCount)}</div>
          <div className="flex gap-[6px]">{Array.from({ length: Math.max(totalCount, 1) }).slice(0, 12).map((_, i) => {
            const p = metrics[i];
            const color = !p ? "#232632" : p.status === "completed" ? "#4CCB96" : p.status === "ongoing" ? "#E2B04A" : "#6BB6FF";
            return <span key={i} className="h-3 w-3 rounded-full" style={{ background: color }} />;
          })}</div>
          {totalCount === 0 ? <p className="text-[13px] text-[#A6A9B4]">{isAr ? "لا توجد مشاريع بعد" : "No projects yet"}</p> : null}
        </m.div>

        <m.div variants={fadeUp} className={card}>
          <div className="flex items-center gap-[10px] text-[14px] text-[#A6A9B4]"><Wallet className="h-5 w-5 text-[#E2B04A]" strokeWidth={1.7} />{isAr ? "قيمة المحفظة" : "Portfolio value"}</div>
          <div className="whitespace-nowrap text-[28px] font-extrabold tabular-nums text-[#F1EEE8] [font-family:var(--font-inter),var(--font-arabic),system-ui,sans-serif]">
            {portfolioStr === "—" ? "—" : (isAr ? <>{portfolio.num} <span className="text-[14px] font-medium text-[#A6A9B4]">{portfolio.unit}</span></> : <><span className="text-[14px] font-medium text-[#A6A9B4]">{portfolio.unit} </span>{portfolio.num}</>)}
          </div>
          <div className="flex h-2 gap-[3px] overflow-hidden rounded-full">
            {cities.length ? cities.slice(0, 5).map((c, i) => <span key={c.id} style={{ flex: c.value || 1, background: ["#F3C86A","#E2B04A","#C98F1E","#9A6A14","#6B4A10"][i] || "#6B4A10" }} />) : <span className="flex-1 bg-[#232632]" />}
          </div>
          <p className="text-[13px] text-[#A6A9B4]">{distinctCities ? (isAr ? `موزعة على ${nf.format(distinctCities)} مدن` : `Across ${nf.format(distinctCities)} cities`) : (isAr ? "لا توجد بيانات مدن" : "No city data")}</p>
        </m.div>

        <m.div variants={fadeUp} className={card}>
          <div className="flex items-center gap-[10px] text-[14px] text-[#A6A9B4]"><Activity className="h-5 w-5 text-[#E2B04A]" strokeWidth={1.7} />{isAr ? "صافي الربح" : "Net profit"}</div>
          <div className="whitespace-nowrap text-[28px] font-extrabold tabular-nums text-[#F1EEE8] [font-family:var(--font-inter),var(--font-arabic),system-ui,sans-serif]">
            {profitStr === "—" ? "—" : (isAr ? <>{profit.num} <span className="text-[14px] font-medium text-[#A6A9B4]">{profit.unit}</span></> : <><span className="text-[14px] font-medium text-[#A6A9B4]">{profit.unit} </span>{profit.num}</>)}
          </div>
          <div className="flex h-2 gap-[3px] overflow-hidden rounded-full">
            {margin == null ? <span className="flex-1 bg-[#232632]" /> : <><span style={{ flex: Math.max(0, Math.min(100, margin)), background: "#4CCB96" }} /><span style={{ flex: Math.max(0, 100 - margin), background: "#232632" }} /></>}
          </div>
          <p className="text-[13px] text-[#A6A9B4]">{margin == null ? (isAr ? "لا توجد بيانات هامش" : "No margin data") : (isAr ? `هامش الربح ${marginStr}` : `Margin ${marginStr}`)}</p>
        </m.div>

        <m.div variants={fadeUp} className={card}>
          <div className="flex items-center gap-[10px] text-[14px] text-[#A6A9B4]"><MessageSquare className="h-5 w-5 text-[#E2B04A]" strokeWidth={1.7} />{isAr ? "استفسارات جديدة" : "New inquiries"}</div>
          <div className="whitespace-nowrap text-[28px] font-extrabold tabular-nums text-[#F1EEE8] [font-family:var(--font-inter),var(--font-arabic),system-ui,sans-serif]">{kpiNumber(kpiState.newInquiries)}</div>
          {kpiState.status === "error" ? (
            <button type="button" onClick={() => void refreshKpis()} className="admin-focus-ring w-fit text-start text-[13px] text-[#E2B04A] underline-offset-4 hover:underline">
              {isAr ? "تعذر التحميل — إعادة المحاولة" : "Could not load — retry"}
            </button>
          ) : (
            <p className="text-[13px] text-[#A6A9B4]">
              {kpiState.status === "loading"
                ? (isAr ? "جارٍ التحميل…" : "Loading…")
                : (isAr ? "حسب الحالة: جديد" : "Counted where status is new")}
            </p>
          )}
        </m.div>

        <m.div variants={fadeUp} className={card}>
          <div className="flex items-center gap-[10px] text-[14px] text-[#A6A9B4]"><FileSignature className="h-5 w-5 text-[#E2B04A]" strokeWidth={1.7} />{isAr ? "عقود موقّعة" : "Signed contracts"}</div>
          <div className="whitespace-nowrap text-[28px] font-extrabold tabular-nums text-[#F1EEE8] [font-family:var(--font-inter),var(--font-arabic),system-ui,sans-serif]">{kpiNumber(kpiState.signedContracts)}</div>
          {kpiState.status === "error" ? (
            <button type="button" onClick={() => void refreshKpis()} className="admin-focus-ring w-fit text-start text-[13px] text-[#E2B04A] underline-offset-4 hover:underline">
              {isAr ? "تعذر التحميل — إعادة المحاولة" : "Could not load — retry"}
            </button>
          ) : (
            <p className="text-[13px] text-[#A6A9B4]">
              {kpiState.status === "loading"
                ? (isAr ? "جارٍ التحميل…" : "Loading…")
                : (isAr ? "العقود الموقّعة المؤكدة" : "Verified signed contracts")}
            </p>
          )}
        </m.div>
      </m.section>

      <section className="grid gap-[22px] lg:grid-cols-1 xl:grid-cols-[1.7fr_1fr]">
        <div className="flex flex-col gap-[22px]">
          <m.section variants={fadeUp} className={panel}>
            <div className="flex items-center gap-[10px]"><span className="text-[16px] tracking-[-2px] text-[#5c5f6b]">⋮⋮</span><h2 className="m-0 text-[19px] font-bold text-[#F1EEE8] [font-family:var(--font-inter),var(--font-arabic),system-ui,sans-serif]">{isAr ? "صحة الميزانية" : "Budget health"}</h2><button type="button" onClick={() => onNavigate("projects")} className="admin-focus-ring ms-auto text-[14px] text-[#E2B04A]">{isAr ? "كل المشاريع ‹" : "All projects ›"}</button></div>
            <div className="-mt-3 text-[13px] text-[#A6A9B4]">{isAr ? "الشريط = المصروف · العلامة البيضاء = الإنجاز الفعلي" : "Bar = spent · white marker = actual progress"}</div>
            {budgetRows.length === 0 ? (
              <p className="py-6 text-[14px] text-[#A6A9B4]">{isAr ? "لا توجد مشاريع لعرض صحة الميزانية." : "No projects to show budget health."}</p>
            ) : budgetRows.map((p) => {
              const h = getBudgetHealth(p);
              const spentPct = p.budget > 0 ? Math.min(100, (p.spent / p.budget) * 100) : 0;
              const progressPct = Math.min(100, Math.max(0, p.progress || 0));
              const pill = pillFor(h);
              const color = h.key === "over" || h.key === "overrun" ? "#FF6B5E" : h.key === "watch" ? "#E2B04A" : "#4CCB96";
              const sub = p.budget > 0
                ? `${formatSAR(p.spent, locale)} / ${formatSAR(p.budget, locale)}`
                : (isAr ? "بيانات الميزانية غير متاحة" : "Budget data unavailable");
              return (
                <div key={p.id} className="grid items-center gap-4 md:grid-cols-[170px_1fr_190px]">
                  <div className="text-[15px] text-[#F1EEE8]"><div>{projectName(p, locale)}</div><small className="block text-[13px] text-[#A6A9B4]">{sub}</small></div>
                  <div className="relative h-3 rounded-full bg-[#232632]">
                    <div className="absolute inset-y-0 start-0 rounded-full" style={{ width: `${spentPct}%`, background: color }} />
                    <div className="absolute -top-[5px] h-[22px] w-[3px] rounded-sm bg-white" style={{ insetInlineStart: `${progressPct}%` }} />
                  </div>
                  <div title={pill.tooltip} className={cn("whitespace-nowrap rounded-full px-3 py-[5px] text-center text-[13px] font-medium", pill.cls)}>{pill.text}</div>
                </div>
              );
            })}
          </m.section>

          <m.section variants={fadeUp} className={panel}>
            <div className="flex items-center gap-[10px]"><span className="text-[16px] tracking-[-2px] text-[#5c5f6b]">⋮⋮</span><h2 className="m-0 text-[19px] font-bold text-[#F1EEE8] [font-family:var(--font-inter),var(--font-arabic),system-ui,sans-serif]">{isAr ? "قيمة المحفظة حسب المدينة" : "Portfolio value by city"}</h2></div>
            {cities.length === 0 ? (
              <p className="py-2 text-[14px] text-[#A6A9B4]">{isAr ? "لا توجد بيانات مدن." : "No city data."}</p>
            ) : cities.map((c) => (
              <div key={c.id} className="flex flex-col gap-2 text-[15px] sm:grid sm:items-center sm:gap-[14px] sm:[grid-template-columns:70px_1fr_110px]">
                <div className="flex items-center justify-between gap-2 sm:block">
                  <span className="text-[#F1EEE8]">{isAr ? (c.nameAr || c.nameEn) : c.nameEn}</span>
                  <span className="whitespace-nowrap text-[13px] text-[#D7D8DE] tabular-nums sm:hidden">{formatSAR(c.value, locale)}</span>
                </div>
                <div className="relative h-3 rounded-full bg-[#232632]"><div className="absolute inset-y-0 start-0 rounded-full" style={{ width: `${(c.value / maxCity) * 100}%`, background: "linear-gradient(270deg,#F3C86A,#B8801C)" }} /></div>
                <span className="hidden whitespace-nowrap text-end text-[#D7D8DE] tabular-nums [font-family:var(--font-inter),var(--font-arabic),system-ui,sans-serif] sm:block">{formatSAR(c.value, locale)}</span>
              </div>
            ))}
          </m.section>
        </div>

        <div className="flex flex-col gap-[22px]">
          <m.section variants={fadeUp} className="flex flex-col gap-[18px] rounded-[22px] border border-[rgba(226,176,74,0.25)] p-[22px_24px]" style={{ background: "linear-gradient(180deg,rgba(226,176,74,0.09),rgba(255,255,255,0.02))" }}>
            <div className="flex items-center gap-[10px]"><Sparkles className="h-5 w-5 text-[#E2B04A]" strokeWidth={1.7} /><h2 className="m-0 text-[19px] font-bold text-[#F1EEE8] [font-family:var(--font-inter),var(--font-arabic),system-ui,sans-serif]">{isAr ? "رؤية ذكية" : "Insight"}</h2></div>
            <div className="rounded-[14px] rounded-es-[4px] bg-white/[0.05] p-[12px_14px] text-[14px] leading-[1.8] text-[#E5E3DE]">{insight}</div>
            <div className="flex items-center justify-between rounded-[14px] border border-white/[.07] bg-white/[0.03] p-[12px_14px] text-[14px] text-[#A6A9B4] opacity-70">
              <span>{isAr ? "اسأل عن مشاريعك وأرقامك…" : "Ask about your projects and numbers…"}</span>
              <span className="rounded-full border border-white/15 px-2 py-0.5 text-[12px]">{isAr ? "قريباً" : "Coming soon"}</span>
            </div>
          </m.section>

          <m.section variants={fadeUp} className={panel}>
            <div className="flex items-center"><h2 className="m-0 text-[19px] font-bold text-[#F1EEE8] [font-family:var(--font-inter),var(--font-arabic),system-ui,sans-serif]">{isAr ? "تنبيهات ذكية" : "Smart alerts"}</h2><button type="button" onClick={() => onNavigate("notifications")} className="admin-focus-ring ms-auto text-[14px] text-[#E2B04A]">{isAr ? "عرض الكل ‹" : "View all ›"}</button></div>
            {alerts.length === 0 ? (
              <div className="flex items-center gap-3 px-0.5 text-[14px] text-[#A6A9B4]"><MessageSquare className="h-5 w-5" strokeWidth={1.7} />{isAr ? "لا توجد تنبيهات. جميع المشاريع في المسار الصحيح." : "No alerts. All projects are on track."}</div>
            ) : alerts.map((a) => (
              <div key={a.id} className={cn("flex gap-3 rounded-[14px] border p-[14px] text-[14px] leading-[1.7] text-[#F1EEE8]", a.severity === "critical" ? "border-[rgba(255,107,94,0.25)] bg-[rgba(255,107,94,0.09)]" : "border-[rgba(226,176,74,0.25)] bg-[rgba(226,176,74,0.08)]")}>
                <Bell className={cn("mt-0.5 h-5 w-5 shrink-0", a.severity === "critical" ? "text-[#FF8A7E]" : "text-[#F3C86A]")} strokeWidth={1.7} />
                <div>{alertText(a)}</div>
              </div>
            ))}
          </m.section>

          <m.section variants={fadeUp} className={panel}>
            <h2 className="m-0 text-[19px] font-bold text-[#F1EEE8] [font-family:var(--font-inter),var(--font-arabic),system-ui,sans-serif]">{isAr ? "تخصيص اللوحة" : "Customize dashboard"}</h2>
            <div className="flex flex-wrap items-center gap-2 text-[14px]"><span className="text-[#A6A9B4]">{isAr ? "الكثافة" : "Density"}</span>
              <button type="button" onClick={() => setDensity("comfortable")} className={cn("admin-focus-ring min-h-[44px] rounded-[999px] border px-3 py-[6px]", density === "comfortable" ? "border-[rgba(226,176,74,0.3)] bg-[rgba(226,176,74,0.14)] text-[#F3C86A]" : "border-white/[.07] text-[#A6A9B4]")}>{isAr ? "مريح" : "Comfortable"}</button>
              <button type="button" onClick={() => setDensity("compact")} className={cn("admin-focus-ring min-h-[44px] rounded-[999px] border px-3 py-[6px]", density === "compact" ? "border-[rgba(226,176,74,0.3)] bg-[rgba(226,176,74,0.14)] text-[#F3C86A]" : "border-white/[.07] text-[#A6A9B4]")}>{isAr ? "مضغوط" : "Compact"}</button>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-[14px]"><span className="text-[#A6A9B4]">{isAr ? "حجم الخط" : "Font size"}</span>
              <button type="button" onClick={() => setFontScale("normal")} className={cn("admin-focus-ring min-h-[44px] rounded-[999px] border px-3 py-[6px]", fontScale === "normal" ? "border-[rgba(226,176,74,0.3)] bg-[rgba(226,176,74,0.14)] text-[#F3C86A]" : "border-white/[.07] text-[#A6A9B4]")}>{isAr ? "عادي" : "Normal"}</button>
              <button type="button" onClick={() => setFontScale("large")} className={cn("admin-focus-ring min-h-[44px] rounded-[999px] border px-3 py-[6px]", fontScale === "large" ? "border-[rgba(226,176,74,0.3)] bg-[rgba(226,176,74,0.14)] text-[#F3C86A]" : "border-white/[.07] text-[#A6A9B4]")}>{isAr ? "كبير" : "Large"}</button>
            </div>
          </m.section>
        </div>
      </section>

      <div className="flex items-center gap-2"><h2 className="m-0 text-[28px] font-bold text-[#F1EEE8] [font-family:var(--font-inter),var(--font-arabic),system-ui,sans-serif]">{isAr ? "مشاريع جارية وقادمة" : "Active and upcoming projects"}</h2><button type="button" onClick={() => onNavigate("projects")} className="admin-focus-ring ms-auto text-[14px] text-[#E2B04A]">{isAr ? "عرض الكل ‹" : "View all ›"}</button></div>
      {activeUpcoming.length === 0 ? (
        <div className="rounded-[20px] border border-white/[.07] bg-white/[0.02] p-6 text-[14px] text-[#A6A9B4]">{isAr ? "لا توجد مشاريع جارية أو قادمة." : "No active or upcoming projects."}</div>
      ) : (
        <m.section variants={stagger} className="grid gap-[18px] sm:grid-cols-2 xl:grid-cols-4">
          {activeUpcoming.map((p, idx) => {
            const statusLabel = p.status === "ongoing" ? (isAr ? "قيد التنفيذ" : "Ongoing") : p.status === "upcoming" ? (isAr ? "قادم" : "Upcoming") : (isAr ? "مكتمل" : "Completed");
            const sourceProject = projects.find((project) => project.slug === p.id);
            return (
              <m.button key={p.id} variants={fadeUp} type="button" onClick={() => onNavigate("projects")} className="admin-focus-ring overflow-hidden rounded-[20px] border border-white/[.07] bg-[#12141B] text-start transition-all duration-[160ms] hover:-translate-y-0.5 hover:border-[rgba(226,176,74,0.25)]">
                <div className="relative">
                  <ProjectImage
                    project={sourceProject ?? p}
                    className="aspect-[16/10] w-full rounded-t-[20px]"
                    sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 25vw"
                    priority={idx === 0}
                  />
                  <span className="absolute top-3 start-3 rounded-[999px] bg-[rgba(11,12,16,0.7)] px-[10px] py-1 text-[12px]" style={{ color: p.status === "upcoming" ? "#8CC7FF" : "#F3C86A" }}>{statusLabel}</span>
                </div>
                <div className="flex flex-col gap-[10px] p-[14px_16px] text-[15px] text-[#F1EEE8]">
                  <div>{projectName(p, locale)}<small className="block text-[13px] text-[#A6A9B4]">{projectCity(p, locale)}</small></div>
                  <div className="h-[6px] overflow-hidden rounded-[9px] bg-[#232632]"><span className="block h-full rounded-[9px] bg-[linear-gradient(270deg,#F3C86A,#C98F1E)]" style={{ width: `${Math.min(100, Math.max(0, p.progress || 0))}%` }} /></div>
                  <small className="text-[13px] text-[#A6A9B4] tabular-nums [font-family:var(--font-inter),var(--font-arabic),system-ui,sans-serif]">{nf.format(Math.round(p.progress || 0))}% {isAr ? "إنجاز" : "complete"} · {formatSAR(p.value, locale)}</small>
                </div>
              </m.button>
            );
          })}
        </m.section>
      )}
    </m.div>
  );
}
function ProjectsSection({
  projects,
  onNew,
  onEdit,
}: {
  projects: WorkspaceProject[];
  onNew: () => void;
  onEdit: (project: WorkspaceProject) => void;
}) {
  const { locale, l } = useI18n();
  const c = copy[locale];
  const { updateProject, addProject } = useWorkspace();
  const { toast } = useToast();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const urlStatus = searchParams.get("status") ?? "all";
  const urlCategory = searchParams.get("category") ?? "all";
  const urlSort = searchParams.get("sort") ?? "risk";
  const urlView = searchParams.get("view") ?? "table";
  const urlQuery = searchParams.get("q") ?? "";
  const urlPage = Number(searchParams.get("page") ?? "1");
  const validStatuses = ["all", "ongoing", "attention", "completed", "upcoming", "archived"] as const;
  const validCategories = ["all", "commercial", "residential", "infrastructure", "industrial"] as const;
  const validSorts = ["updated", "budget", "progress", "risk"] as const;
  const validViews = ["table", "cards", "timeline"] as const;
  const [query, setQuery] = useState(urlQuery);
  const [debouncedQuery, setDebouncedQuery] = useState(urlQuery);
  const deferredQuery = useDeferredValue(debouncedQuery);
  const [tab, setTab] = useState<(typeof validStatuses)[number]>(
    validStatuses.includes(urlStatus as (typeof validStatuses)[number])
      ? (urlStatus as (typeof validStatuses)[number])
      : "all",
  );
  const [categoryFilter, setCategoryFilter] = useState<(typeof validCategories)[number]>(
    validCategories.includes(urlCategory as (typeof validCategories)[number])
      ? (urlCategory as (typeof validCategories)[number])
      : "all",
  );
  const [sortBy, setSortBy] = useState<(typeof validSorts)[number]>(
    validSorts.includes(urlSort as (typeof validSorts)[number])
      ? (urlSort as (typeof validSorts)[number])
      : "risk",
  );
  const [view, setView] = useState<(typeof validViews)[number]>(
    validViews.includes(urlView as (typeof validViews)[number])
      ? (urlView as (typeof validViews)[number])
      : "table",
  );
  const [page, setPage] = useState(() =>
    Number.isFinite(urlPage) && urlPage > 0 ? Math.floor(urlPage) : 1,
  );
  const [selected, setSelected] = useState<Set<string>>(() => new Set());
  const [detail, setDetail] = useState<WorkspaceProject | null>(null);
  const [detailTab, setDetailTab] = useState<"overview" | "milestones" | "documents" | "financials">("overview");
  const [rowActions, setRowActions] = useState<string | null>(null);
  const [mobileActions, setMobileActions] = useState<string | null>(null);
  const [archiveTarget, setArchiveTarget] = useState<WorkspaceProject | null>(null);
  const [archiving, setArchiving] = useState(false);
  const pageSize = 8;

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedQuery(query), 250);
    return () => window.clearTimeout(timer);
  }, [query]);

  // Filters, sort, view and page live in the URL so a refresh (or a shared
  // link) restores the exact table state instead of resetting to defaults.
  useEffect(() => {
    const params = new URLSearchParams();
    if (tab !== "all") params.set("status", tab);
    if (categoryFilter !== "all") params.set("category", categoryFilter);
    if (sortBy !== "risk") params.set("sort", sortBy);
    if (view !== "table") params.set("view", view);
    if (debouncedQuery.trim()) params.set("q", debouncedQuery.trim());
    if (page > 1) params.set("page", String(page));
    const next = params.toString();
    const current = window.location.search.replace(/^\?/, "");
    if (next === current) return;
    router.replace(`${pathname}${next ? `?${next}` : ""}`, { scroll: false });
  }, [tab, categoryFilter, sortBy, view, debouncedQuery, page, pathname, router]);

  const metricsBySlug = useMemo(() => {
    const m = new Map<string, ReturnType<typeof toMetricsProject>>();
    projects.forEach((p) => m.set(p.slug, toMetricsProject(p)));
    return m;
  }, [projects]);

  const tabCounts = useMemo(() => {
    const live = projects.filter((p) => !p.archivedAt);
    const all = live.length;
    const ongoing = live.filter((p) => p.status === "ongoing").length;
    const completed = live.filter((p) => p.status === "completed").length;
    const upcoming = live.filter((p) => p.status === "upcoming").length;
    const archived = projects.filter((p) => Boolean(p.archivedAt)).length;
    const attention = live.filter((p) => {
      const mp = metricsBySlug.get(p.slug);
      return mp ? projectNeedsAttention(mp) : false;
    }).length;
    return { all, ongoing, completed, upcoming, attention, archived };
  }, [projects, metricsBySlug]);

  const filtered = useMemo(() => {
    const normalized = deferredQuery.trim().toLowerCase();
    const base = projects.filter((project) => {
      if (tab === "archived") {
        if (!project.archivedAt) return false;
      } else if (project.archivedAt) {
        return false;
      }
      const mp = metricsBySlug.get(project.slug);
      const needsAttention = mp ? projectNeedsAttention(mp) : false;
      if (tab === "attention" && !needsAttention) return false;
      if (tab === "ongoing" && project.status !== "ongoing") return false;
      if (tab === "completed" && project.status !== "completed") return false;
      if (tab === "upcoming" && project.status !== "upcoming") return false;
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
  }, [categoryFilter, deferredQuery, projects, sortBy, tab, metricsBySlug]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const paged = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const allSelected = paged.length > 0 && paged.every((project) => selected.has(project.slug));

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

  const openDetail = (
    project: WorkspaceProject,
    tab: "overview" | "milestones" | "documents" | "financials" = "overview",
  ) => {
    setDetailTab(tab);
    setDetail(project);
  };

  const applyInline = (
    project: WorkspaceProject,
    patch: Partial<Pick<WorkspaceProject, "status" | "progress">>,
  ) => {
    const previous = {
      status: project.status,
      progress: project.progress,
    };
    updateProject(project.slug, patch);
    sonnerToast.success(locale === "ar" ? "تم تحديث المشروع" : "Project updated", {
      duration: 7000,
      action: {
        label: c.undo,
        onClick: () => {
          updateProject(project.slug, previous);
          sonnerToast.success(locale === "ar" ? "تم التراجع" : "Change undone");
        },
      },
    });
  };

  const duplicateProject = (project: WorkspaceProject) => {
    const base = `${project.slug}-copy`;
    let slug = base;
    let index = 2;
    while (projects.some((item) => item.slug === slug)) {
      slug = `${base}-${index}`;
      index += 1;
    }
    const { archivedAt: _archivedAt, ...copy } = project;
    void _archivedAt;
    addProject({
      ...copy,
      slug,
      featured: false,
      title: {
        ar: `${project.title.ar || project.title.en} (نسخة)`,
        en: `${project.title.en || project.title.ar} (copy)`,
      },
    });
    setRowActions(null);
    toast(locale === "ar" ? "تم نسخ المشروع" : "Project duplicated", "success");
  };

  const bulkArchive = () => {
    const archived = [...selected]
      .map((slug) => projects.find((project) => project.slug === slug))
      .filter((project): project is WorkspaceProject => Boolean(project && !project.archivedAt));
    if (!archived.length) {
      toast(locale === "ar" ? "المشاريع محددة مؤرشفة بالفعل" : "Selected projects are already archived", "success");
      return;
    }
    const stamp = new Date().toISOString();
    archived.forEach((project) => updateProject(project.slug, { archivedAt: stamp }));
    setSelected(new Set<string>());
    sonnerToast.success(
      locale === "ar" ? `تمت أرشفة ${archived.length} مشروع` : `${archived.length} projects archived`,
      {
        duration: 8000,
        action: {
          label: c.undo,
          onClick: () => {
            archived.forEach((project) => updateProject(project.slug, { archivedAt: null }));
            sonnerToast.success(locale === "ar" ? "تمت الاستعادة" : "Projects restored");
          },
        },
      },
    );
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

  const archiveProject = (project: WorkspaceProject) => {
    setArchiving(true);
    updateProject(project.slug, { archivedAt: new Date().toISOString() });
    setArchiving(false);
    setArchiveTarget(null);
    setDetail(null);
    setMobileActions(null);
    sonnerToast.success(c.archivedToast, {
      duration: 8000,
      action: {
        label: c.undo,
        onClick: () => {
          updateProject(project.slug, { archivedAt: null });
          sonnerToast.success(c.restoredToast);
        },
      },
    });
  };

  const restoreProject = (project: WorkspaceProject) => {
    updateProject(project.slug, { archivedAt: null });
    setMobileActions(null);
    sonnerToast.success(c.restoredToast);
  };

  const budgetHealthFor = (project: WorkspaceProject) => {
    const mp = metricsBySlug.get(project.slug);
    if (!mp) return budgetHealthCopy({ key: "no_data" }, locale);
    return budgetHealthCopy(getBudgetHealth(mp), locale);
  };

  return (
    <div className="space-y-5">
      <PageHeader
        title={c.projects}
        description={`${filtered.length} / ${projects.length}`}
        actions={([
          ["table", locale === "ar" ? "جدول" : "Table"],
          ["cards", locale === "ar" ? "بطاقات" : "Cards"],
          ["timeline", locale === "ar" ? "مخطط زمني" : "Timeline"],
        ] as const).map(([id, label]) => (
          <Chip key={id} active={view === id} onClick={() => setView(id)}>{label}</Chip>
        ))}
      />

      <Card className="flex flex-wrap gap-2 p-3">
        {([
          ["all", locale === "ar" ? "الكل" : "All", tabCounts.all],
          ["ongoing", locale === "ar" ? "جارية" : "Ongoing", tabCounts.ongoing],
          ["attention", locale === "ar" ? "تحتاج انتباه" : "Needs attention", tabCounts.attention],
          ["completed", locale === "ar" ? "مكتملة" : "Completed", tabCounts.completed],
          ["upcoming", locale === "ar" ? "قادمة" : "Upcoming", tabCounts.upcoming],
          ["archived", c.archived, tabCounts.archived],
        ] as const).map(([id, label, count]) => (
          <Chip key={id} active={tab === id} onClick={() => { setTab(id); setPage(1); }} className="whitespace-nowrap">
            {label} <span className="tabular-nums opacity-70">({count})</span>
          </Chip>
        ))}
      </Card>

      <div className="grid w-full gap-2 sm:grid-cols-2 xl:flex xl:flex-wrap xl:items-center">
        <AdminInput
          value={query}
          onChange={(event) => { setQuery(event.target.value); setPage(1); }}
          placeholder={c.search}
          className="xl:w-56"
        />

        <AdminSelect value={categoryFilter} onChange={(e) => { setCategoryFilter(e.target.value as typeof categoryFilter); setPage(1); }} className="">
          <option value="all">{locale === "ar" ? "كل الفئات" : "All categories"}</option>
          <option value="commercial">{c.categoryLabels.commercial}</option>
          <option value="residential">{c.categoryLabels.residential}</option>
          <option value="infrastructure">{c.categoryLabels.infrastructure}</option>
          <option value="industrial">{c.categoryLabels.industrial}</option>
        </AdminSelect>
        <AdminSelect value={sortBy} onChange={(e) => setSortBy(e.target.value as typeof sortBy)} className="">
          <option value="risk">{locale === "ar" ? "الأعلى خطورة" : "Highest risk"}</option>
          <option value="budget">{locale === "ar" ? "الميزانية" : "Budget"}</option>
          <option value="progress">{locale === "ar" ? "الإنجاز" : "Progress"}</option>
          <option value="updated">{locale === "ar" ? "الأحدث" : "Latest"}</option>
        </AdminSelect>
        <Button variant="secondary" size="sm" onClick={exportCsv}>
          <FileText className="h-4 w-4" />{c.export}
        </Button>
        <Button variant="primary" size="sm" onClick={onNew}>
          <Plus className="h-4 w-4" />{c.addProject}
        </Button>
      </div>

      {selected.size > 0 ? (
        <div className="sticky bottom-20 z-20 flex flex-wrap items-center gap-2 rounded-[20px] border border-[rgba(226,176,74,0.25)] bg-[#14161d]/95 px-4 py-3 shadow-[0_8px_24px_rgba(0,0,0,0.35)] backdrop-blur lg:bottom-4">
          <span className="text-[14px] font-semibold text-[#F3C86A] tabular-nums">{selected.size} {c.selected}</span>
          <span className="text-[13px] text-[#A6A9B4]">{c.bulkStatus}</span>
          {(["ongoing", "completed", "upcoming"] as const).map((status) => (
            <button key={status} type="button" onClick={() => applyBulkStatus(status)} className="h-8 border border-white/12 px-3 text-[0.66rem] font-semibold  text-ivory/60 transition-colors hover:border-gold/45 hover:text-gold">
              {c.statusLabels[status]}
            </button>
          ))}
          <button type="button" onClick={exportCsv} className="h-8 border border-white/12 px-3 text-[0.66rem] font-semibold  text-ivory/60 transition-colors hover:border-gold/45 hover:text-gold">
            {locale === "ar" ? "تصدير Excel" : "Export Excel"}
          </button>
          <button type="button" onClick={bulkArchive} className="h-8 border border-[rgba(255,107,94,0.3)] px-3 text-[0.66rem] font-semibold text-[#FF9A8F] transition-colors hover:bg-[rgba(255,107,94,0.1)]">
            {c.archive}
          </button>
          <button type="button" onClick={() => setSelected(new Set<string>())} className="ms-auto h-8 px-2 text-[0.66rem]  text-ivory/40 transition-colors hover:text-gold">{c.clearSelection}</button>
        </div>
      ) : null}

      {view === "timeline" ? (
        <div className="space-y-3 rounded-[22px] border border-white/[.07] bg-gradient-to-b from-white/[.05] to-white/[.018] p-4 sm:p-5">
          {paged.map((project) => (
            <button key={project.slug} type="button" onClick={() => openDetail(project)} className="w-full border border-white/10 bg-[#0e1017]/60 p-4 text-start transition-colors hover:border-gold/30">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate text-[0.88rem] font-medium text-ivory">{l(project.title)}</p>
                  <p className="mt-1 text-[0.7rem] text-ivory/45" title={budgetHealthFor(project).tooltip}>{budgetHealthFor(project).short}</p>
                </div>
                <span className="text-[0.68rem] tabular-nums text-ivory/45">{c.statusLabels[project.status]}</span>
              </div>
              <div className="mt-3 h-2 overflow-hidden bg-white/10">
                <div className="h-full bg-gold/70" style={{ width: `${project.progress}%` }} />
              </div>
              <div className="mt-2 flex items-center justify-between text-[0.68rem] tabular-nums text-ivory/45">
                <span>{project.progress}%</span>
                <span>{formatMoney(project.spent, locale)} / {formatMoney(project.budget, locale)}</span>
              </div>
            </button>
          ))}
          {!paged.length ? <EmptyProjects locale={locale} label={c.noProjects} /> : null}
        </div>
      ) : view === "cards" ? (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {paged.map((project, index) => (
            <button key={project.slug} type="button" onClick={() => openDetail(project)} className="overflow-hidden rounded-[20px] border border-white/[.07] bg-gradient-to-b from-white/[.05] to-white/[.018] text-start transition-colors hover:border-gold/30">
              <ProjectImage
                project={project}
                sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 33vw"
                priority={index === 0}
                className="aspect-[16/10] w-full rounded-t-[20px]"
              />
              <div className="p-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <p className="truncate text-[0.9rem] font-medium text-ivory">{l(project.title)}</p>
                    <span className={cn("shrink-0 px-2 py-0.5 text-[0.62rem] ", project.status === "ongoing" ? "bg-gold/15 text-gold" : project.status === "completed" ? "bg-emerald-400/10 text-emerald-300/80" : "bg-sky-400/10 text-sky-300/80")}>{c.statusLabels[project.status]}</span>
                  </div>
                  <p className="mt-1 truncate text-[0.72rem] text-ivory/45">{l(project.location)}</p>
                  <p className="mt-1 text-[0.68rem] text-ivory/45" title={budgetHealthFor(project).tooltip}>{budgetHealthFor(project).short}</p>
                  <div className="mt-3 flex items-center gap-2">
                    <span className="h-1.5 flex-1 overflow-hidden bg-white/10"><span className="block h-full bg-gold/70" style={{ width: `${project.progress}%` }} /></span>
                    <span className="tabular-nums text-[0.68rem] text-ivory/45">{project.progress}%</span>
                  </div>
                  <div className="mt-2 flex items-center justify-between text-[0.72rem]">
                    <span className="text-ivory/45">{c.categoryLabels[project.category]}</span>
                    <span className="tabular-nums text-gold">{formatMoney(project.contractValue || project.budget, locale)}</span>
                  </div>
                </div>
              </div>
            </button>
          ))}
          {!paged.length ? <EmptyProjects locale={locale} label={c.noProjects} full /> : null}
        </div>
      ) : (
        <>
          <div className="grid gap-3 md:hidden">
            {paged.map((project, index) => {
              const statusTone: "warning" | "success" | "info" = project.status === "ongoing" ? "warning" : project.status === "completed" ? "success" : "info";
              return (
                <Card key={project.slug} className="relative p-4">
                  <div className="flex items-start gap-3">
                    <ProjectImage project={project} variant="thumb" sizes="70px" priority={index === 0} className="h-14 w-[70px] shrink-0 rounded-xl border border-[var(--admin-card-border)]" />
                    <button type="button" onClick={() => openDetail(project)} className="min-w-0 flex-1 text-start admin-focus-ring rounded-[12px]">
                      <p className="truncate text-[15px] font-medium text-[var(--admin-text)]">{l(project.title)}</p>
                      <p className="mt-1 truncate text-[13px] text-[var(--admin-muted)]">{l(project.location)}</p>
                      <span className="mt-3 flex items-center gap-2">
                        <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-[var(--admin-track)]">
                          <span className="block h-full rounded-full bg-[linear-gradient(270deg,#F3C86A,#C98F1E)]" style={{ width: `${project.progress}%` }} />
                        </span>
                        <span className="whitespace-nowrap tabular-nums text-[13px] text-[var(--admin-muted)]">{project.progress}%</span>
                      </span>
                      <span className="mt-2 block whitespace-nowrap text-[14px] tabular-nums text-[var(--admin-gold)]">{formatMoney(project.contractValue || project.budget, locale)}</span>
                    </button>
                    <span className="flex shrink-0 flex-col items-end gap-2">
                      <StatusPill tone={statusTone} className="whitespace-nowrap">{c.statusLabels[project.status]}</StatusPill>
                      <Popover
                        open={mobileActions === project.slug}
                        onOpenChange={(open) => setMobileActions(open ? project.slug : null)}
                        align="end"
                        trigger={
                          <button
                            type="button"
                            className="admin-focus-ring inline-flex h-9 w-9 items-center justify-center rounded-[10px] border border-[var(--admin-card-border)] text-[var(--admin-muted)]"
                            aria-label={locale === "ar" ? "إجراءات المشروع" : "Project actions"}
                          >
                            <MoreVertical className="h-4 w-4" />
                          </button>
                        }
                      >
                        {project.archivedAt ? (
                          <button type="button" onClick={() => restoreProject(project)} className="admin-focus-ring flex min-h-[40px] w-full items-center gap-2 rounded-lg px-3 text-start text-[13px] text-[var(--admin-text)] hover:bg-[var(--admin-pill-surface)]">
                            <RotateCcw className="h-4 w-4" />{c.restore}
                          </button>
                        ) : (
                          <>
                            <button type="button" onClick={() => { setMobileActions(null); onEdit(project); }} className="admin-focus-ring flex min-h-[40px] w-full items-center gap-2 rounded-lg px-3 text-start text-[13px] text-[var(--admin-text)] hover:bg-[var(--admin-pill-surface)]">
                              <Pencil className="h-4 w-4" />{c.edit}
                            </button>
                            <button type="button" onClick={() => { setMobileActions(null); setArchiveTarget(project); }} className="admin-focus-ring flex min-h-[40px] w-full items-center gap-2 rounded-lg px-3 text-start text-[13px] text-[#FF9A8F] hover:bg-[rgba(255,107,94,0.1)]">
                              <Trash2 className="h-4 w-4" />{c.archive}
                            </button>
                          </>
                        )}
                      </Popover>
                    </span>
                  </div>
                </Card>
              );
            })}
            {!paged.length ? <EmptyProjects locale={locale} label={c.noProjects} /> : null}
          </div>
          <div className="hidden md:block">
            <DataTable>
              <Table className="min-w-[1040px]">
                <THead>
                  <tr>
                    <TH className="w-12"><Checkbox checked={allSelected} onChange={toggleAll} aria-label={c.selectAll} /></TH>
                    <TH>{c.project}</TH>
                    <TH>{c.category}</TH>
                    <TH>{c.status}</TH>
                    <TH>{locale === "ar" ? "صحة الميزانية" : "Budget health"}</TH>
                    <TH>{c.progress}</TH>
                    <TH className="text-end">{c.value}</TH>
                    <TH className="text-end">{c.actions}</TH>
                  </tr>
                </THead>
                <tbody>
                  {paged.map((project, index) => {
                    const mp = metricsBySlug.get(project.slug);
                    const h = mp ? getBudgetHealth(mp) : { key: "no_data" as const };
                    const tone: "success" | "warning" | "danger" | "neutral" = h.key === "on_track" || h.key === "saved" ? "success" : h.key === "watch" ? "warning" : h.key === "over" || h.key === "overrun" ? "danger" : "neutral";
                    const statusTone: "warning" | "success" | "info" = project.status === "ongoing" ? "warning" : project.status === "completed" ? "success" : "info";
                    return (
                      <TR key={project.slug} onClick={() => openDetail(project)} className={cn("cursor-pointer", selected.has(project.slug) && "bg-[rgba(226,176,74,0.06)]")}>
                        <TD onClick={(e) => e.stopPropagation()}><Checkbox checked={selected.has(project.slug)} onChange={() => toggleSelected(project.slug)} aria-label={`${c.selectAll}: ${l(project.title)}`} /></TD>
                        <TD>
                          <span className="flex items-center gap-3">
                            <ProjectImage project={project} variant="thumb" sizes="64px" priority={index === 0} className="h-12 w-16 shrink-0 rounded-xl border border-[var(--admin-card-border)]" />
                            <span className="flex min-w-0 flex-col gap-0.5">
                              <span className="truncate text-[14px] font-medium text-[#F1EEE8]">{l(project.title)}</span>
                              <span className="truncate text-[13px] text-[#A6A9B4]">{l(project.location)}</span>
                            </span>
                          </span>
                        </TD>
                        <TD><span className="text-[14px] text-[#C9CAD1]">{c.categoryLabels[project.category]}</span></TD>
                        <TD onClick={(e) => e.stopPropagation()}>
                          <Popover
                            align="start"
                            trigger={
                              <button type="button" title={locale === "ar" ? "تعديل الحالة والإنجاز" : "Edit status and progress"} className="admin-focus-ring">
                                <StatusPill tone={statusTone}>{c.statusLabels[project.status]}</StatusPill>
                              </button>
                            }
                          >
                            <InlineProjectControls
                              key={`${project.status}-${project.progress}`}
                              project={project}
                              locale={locale}
                              onApply={(patch) => applyInline(project, patch)}
                            />
                          </Popover>
                        </TD>
                        <TD><StatusPill tone={tone} title={budgetHealthFor(project).tooltip} className="whitespace-nowrap">{budgetHealthFor(project).short}</StatusPill></TD>
                        <TD>
                          <span className="flex items-center gap-2">
                            <span className="h-1.5 w-16 overflow-hidden rounded-full bg-[#232632]"><span className="block h-full rounded-full bg-[linear-gradient(270deg,#F3C86A,#C98F1E)]" style={{ width: `${project.progress}%` }} /></span>
                            <span className="tabular-nums text-[13px] text-[#A6A9B4]">{project.progress}%</span>
                          </span>
                        </TD>
                        <TD className="text-end tabular-nums text-[#D7D8DE]">{formatMoney(project.contractValue || project.budget, locale)}</TD>
                        <TD onClick={(e) => e.stopPropagation()}>
                          <span className="flex items-center justify-end">
                            <Popover
                              open={rowActions === project.slug}
                              onOpenChange={(open) => setRowActions(open ? project.slug : null)}
                              trigger={
                                <button
                                  type="button"
                                  className="admin-focus-ring inline-flex h-10 w-10 items-center justify-center rounded-[10px] border border-[var(--admin-card-border)] text-[var(--admin-muted)] transition-colors hover:border-[rgba(226,176,74,0.25)] hover:text-[var(--admin-text)]"
                                  aria-label={`${locale === "ar" ? "إجراءات" : "Actions"}: ${l(project.title)}`}
                                >
                                  <MoreVertical className="h-4 w-4" />
                                </button>
                              }
                            >
                              <div className="flex min-w-[190px] flex-col gap-0.5">
                                {project.archivedAt ? (
                                  <button type="button" onClick={() => { setRowActions(null); restoreProject(project); }} className="admin-focus-ring flex min-h-11 w-full items-center gap-2 rounded-lg px-3 text-start text-[13px] text-[var(--admin-text)] hover:bg-[var(--admin-pill-surface)]">
                                    <RotateCcw className="h-4 w-4" />{c.restore}
                                  </button>
                                ) : (
                                  <>
                                    <button type="button" onClick={() => { setRowActions(null); setDetailTab("overview"); setDetail(project); }} className="admin-focus-ring flex min-h-11 w-full items-center gap-2 rounded-lg px-3 text-start text-[13px] text-[var(--admin-text)] hover:bg-[var(--admin-pill-surface)]">
                                      <Eye className="h-4 w-4" />{locale === "ar" ? "عرض سريع" : "Quick view"}
                                    </button>
                                    <button type="button" onClick={() => { setRowActions(null); onEdit(project); }} className="admin-focus-ring flex min-h-11 w-full items-center gap-2 rounded-lg px-3 text-start text-[13px] text-[var(--admin-text)] hover:bg-[var(--admin-pill-surface)]">
                                      <Pencil className="h-4 w-4" />{c.edit}
                                    </button>
                                    <button type="button" onClick={() => duplicateProject(project)} className="admin-focus-ring flex min-h-11 w-full items-center gap-2 rounded-lg px-3 text-start text-[13px] text-[var(--admin-text)] hover:bg-[var(--admin-pill-surface)]">
                                      <Copy className="h-4 w-4" />{locale === "ar" ? "نسخ" : "Duplicate"}
                                    </button>
                                    <Link href={`/projects/${project.slug}`} target="_blank" onClick={() => setRowActions(null)} className="admin-focus-ring flex min-h-11 w-full items-center gap-2 rounded-lg px-3 text-start text-[13px] text-[var(--admin-text)] hover:bg-[var(--admin-pill-surface)]">
                                      <ExternalLink className="h-4 w-4" />{locale === "ar" ? "فتح الصفحة" : "Open public page"}
                                    </Link>
                                    <button type="button" onClick={() => { setRowActions(null); setArchiveTarget(project); }} className="admin-focus-ring flex min-h-11 w-full items-center gap-2 rounded-lg px-3 text-start text-[13px] text-[#FF9A8F] hover:bg-[rgba(255,107,94,0.1)]">
                                      <Archive className="h-4 w-4" />{c.archive}
                                    </button>
                                  </>
                                )}
                              </div>
                            </Popover>
                          </span>
                        </TD>
                      </TR>
                    );
                  })}
                </tbody>
              </Table>
              {!paged.length ? <div className="p-6"><EmptyState title={c.noProjects} /></div> : null}
            </DataTable>
          </div>
        </>
      )}

      {totalPages > 1 ? (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-[22px] border border-white/[.07] bg-gradient-to-b from-white/[.05] to-white/[.018] px-4 py-3">
          <p className="text-[0.72rem] tabular-nums text-ivory/45">{locale === "ar" ? `صفحة ${currentPage} من ${totalPages}` : `Page ${currentPage} of ${totalPages}`}</p>
          <div className="flex items-center gap-2">
            <button type="button" disabled={currentPage <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))} className="h-9 border border-white/12 px-3 text-[0.7rem] text-ivory/60 transition-colors hover:border-gold/40 hover:text-gold disabled:opacity-30">{locale === "ar" ? "السابق" : "Previous"}</button>
            <button type="button" disabled={currentPage >= totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))} className="h-9 border border-white/12 px-3 text-[0.7rem] text-ivory/60 transition-colors hover:border-gold/40 hover:text-gold disabled:opacity-30">{locale === "ar" ? "التالي" : "Next"}</button>
          </div>
        </div>
      ) : null}

      <Drawer
        open={Boolean(detail)}
        onOpenChange={(open) => {
          if (!open) setDetail(null);
        }}
        title={locale === "ar" ? "تفاصيل المشروع" : "Project details"}
        description={detail ? `${l(detail.location)} · ${c.statusLabels[detail.status]}` : undefined}
        closeLabel={locale === "ar" ? "إغلاق" : "Close"}
        footer={
          detail ? (
            <>
              <Button variant="ghost" onClick={() => setDetail(null)}>
                {locale === "ar" ? "إغلاق" : "Close"}
              </Button>
              <Link
                href={`/projects/${detail.slug}`}
                target="_blank"
                className="admin-focus-ring inline-flex min-h-[44px] items-center justify-center gap-2 rounded-[12px] border border-[var(--admin-card-border)] px-4 text-[14px] font-medium text-[var(--admin-text)]"
              >
                <ExternalLink className="h-4 w-4" />
                {locale === "ar" ? "الصفحة الكاملة" : "Open full page"}
              </Link>
              {detail.archivedAt ? (
                <Button variant="primary" onClick={() => restoreProject(detail)}>
                  <RotateCcw className="h-4 w-4" />
                  {c.restore}
                </Button>
              ) : (
                <Button
                  variant="primary"
                  onClick={() => {
                    onEdit(detail);
                    setDetail(null);
                  }}
                >
                  <Pencil className="h-4 w-4" />
                  {c.edit}
                </Button>
              )}
            </>
          ) : undefined
        }
      >
        {detail ? (
          <div className="space-y-4">
            <ProjectImage
              project={detail}
              sizes="(max-width: 640px) 100vw, 560px"
              priority
              className="aspect-[16/9] w-full rounded-2xl border border-white/10"
            />
            <div>
              <h3 className="truncate text-[24px] font-bold text-[var(--admin-text,#F1EEE8)]">
                {l(detail.title)}
              </h3>
              <p className="mt-1 text-[14px] text-[var(--admin-muted,#A6A9B4)]">
                {l(detail.location)}
              </p>
            </div>

            <div
              role="tablist"
              aria-label={locale === "ar" ? "أقسام المشروع" : "Project sections"}
              className="flex flex-wrap gap-1 rounded-xl border border-[var(--admin-card-border)] bg-[var(--admin-pill-surface)] p-1"
            >
              {([
                ["overview", locale === "ar" ? "نظرة عامة" : "Overview"],
                ["milestones", locale === "ar" ? "المراحل" : "Milestones"],
                ["documents", locale === "ar" ? "المستندات" : "Documents"],
                ["financials", locale === "ar" ? "المالية" : "Financials"],
              ] as const).map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  role="tab"
                  aria-selected={detailTab === id}
                  onClick={() => setDetailTab(id)}
                  className={cn(
                    "admin-focus-ring min-h-10 rounded-lg px-3 text-[13px] font-medium transition-colors",
                    detailTab === id
                      ? "bg-[rgba(226,176,74,0.14)] text-[#F3C86A]"
                      : "text-[var(--admin-muted)] hover:bg-[var(--admin-pill-surface)] hover:text-[var(--admin-text)]",
                  )}
                >
                  {label}
                </button>
              ))}
            </div>

            {detailTab === "overview" ? (
              <>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    [c.status, c.statusLabels[detail.status]],
                    [c.category, c.categoryLabels[detail.category]],
                    [c.progress, `${detail.progress}%`],
                    [c.value, formatMoney(detail.contractValue || detail.budget, locale)],
                    [c.budget, formatMoney(detail.budget, locale)],
                    [c.spent, formatMoney(detail.spent, locale)],
                  ].map(([label, value]) => (
                    <div
                      key={String(label)}
                      className="rounded-2xl border border-white/[.07] bg-white/[.025] p-3.5"
                    >
                      <p className="text-[13px] text-[var(--admin-muted,#A6A9B4)]">{label}</p>
                      <p className="mt-1 text-[14px] tabular-nums text-[var(--admin-text,#F1EEE8)]">
                        {value}
                      </p>
                    </div>
                  ))}
                </div>
                <div className="rounded-2xl border border-white/[.07] bg-white/[.025] p-3.5">
                  <p className="text-[13px] text-[var(--admin-muted,#A6A9B4)]">
                    {locale === "ar" ? "صحة الميزانية" : "Budget health"}
                  </p>
                  <p className="mt-1 text-[14px] text-[var(--admin-text,#F1EEE8)]/80" title={budgetHealthFor(detail).tooltip}>
                    {budgetHealthFor(detail).short}
                  </p>
                </div>
              </>
            ) : null}

            {detailTab === "milestones" ? (
              detail.milestones.length ? (
                <ol className="space-y-2">
                  {detail.milestones.map((milestone, index) => (
                    <li key={`${milestone.title.en}-${index}`} className="flex items-start gap-3 rounded-xl border border-white/[.07] bg-white/[.025] p-3.5">
                      <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-[#E2B04A]/30 bg-[#E2B04A]/10 text-[12px] text-[#F3C86A] tabular-nums">{index + 1}</span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[14px] text-[var(--admin-text)]">{l(milestone.title)}</p>
                        <p className="mt-0.5 text-[13px] text-[var(--admin-muted)]">{l(milestone.date)}</p>
                      </div>
                      <span className="rounded-full border border-white/10 px-2 py-0.5 text-[11px] text-[var(--admin-muted)]">
                        {milestone.status === "complete" ? (locale === "ar" ? "مكتملة" : "Complete") : milestone.status === "current" ? (locale === "ar" ? "الحالية" : "Current") : (locale === "ar" ? "قادمة" : "Upcoming")}
                      </span>
                    </li>
                  ))}
                </ol>
              ) : (
                <div className="rounded-2xl border border-dashed border-[var(--admin-card-border)] p-6 text-center">
                  <Flag className="mx-auto h-6 w-6 text-[var(--admin-muted)]" />
                  <p className="mt-2 text-[14px] text-[var(--admin-text)]">{locale === "ar" ? "لا توجد مراحل بعد." : "No milestones yet."}</p>
                  <Button variant="secondary" size="sm" className="mt-3" onClick={() => { onEdit(detail); setDetail(null); }}>
                    <Plus className="h-4 w-4" />{locale === "ar" ? "إضافة أول مرحلة" : "Add first milestone"}
                  </Button>
                </div>
              )
            ) : null}

            {detailTab === "documents" ? (
              detail.documents.length ? (
                <ul className="divide-y divide-[var(--admin-card-border)] rounded-2xl border border-white/[.07] bg-white/[.025]">
                  {detail.documents.map((document, index) => (
                    <li key={`${document.name.en}-${index}`} className="flex items-center gap-3 p-3.5">
                      <FileText className="h-4 w-4 shrink-0 text-[#E2B04A]" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[14px] text-[var(--admin-text)]">{l(document.name)}</p>
                        <p className="text-[12px] text-[var(--admin-muted)]">{document.date} · {document.size}</p>
                      </div>
                      <span className="text-[12px] text-[var(--admin-muted)]">{document.type}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="rounded-2xl border border-dashed border-[var(--admin-card-border)] p-6 text-center text-[14px] text-[var(--admin-muted)]">{locale === "ar" ? "لا توجد مستندات." : "No documents."}</p>
              )
            ) : null}

            {detailTab === "financials" ? (
              <div className="space-y-3">
                {[
                  [c.value, formatMoney(detail.contractValue || detail.budget, locale)],
                  [c.budget, formatMoney(detail.budget, locale)],
                  [c.spent, formatMoney(detail.spent, locale)],
                  [c.profit, formatMoney(detail.profit, locale)],
                ].map(([label, value]) => (
                  <div key={label} className="flex items-center justify-between rounded-xl border border-white/[.07] bg-white/[.025] px-4 py-3">
                    <span className="text-[13px] text-[var(--admin-muted)]">{label}</span>
                    <span className="tabular-nums text-[14px] text-[var(--admin-text)]">{value}</span>
                  </div>
                ))}
                {detail.invoices.length ? (
                  <div className="rounded-xl border border-white/[.07] bg-white/[.025] p-3.5">
                    <p className="mb-2 text-[13px] text-[var(--admin-muted)]">{locale === "ar" ? "الفواتير" : "Invoices"}</p>
                    {detail.invoices.map((invoice) => (
                      <div key={invoice.number} className="flex items-center justify-between gap-3 border-t border-white/[.06] py-2 first:border-0">
                        <span className="truncate text-[13px] text-[var(--admin-text)]">{l(invoice.title)}</span>
                        <span className="whitespace-nowrap tabular-nums text-[13px] text-[var(--admin-muted)]">{invoice.amount}</span>
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>
        ) : null}
      </Drawer>

      <ConfirmDialog
        open={Boolean(archiveTarget)}
        onOpenChange={(open) => {
          if (!open) setArchiveTarget(null);
        }}
        title={c.archiveTitle}
        description={archiveTarget ? `${c.archiveBody} ${l(archiveTarget.title)}` : c.archiveBody}
        confirmLabel={c.archive}
        cancelLabel={c.cancel}
        destructive
        requireText={archiveTarget ? l(archiveTarget.title) : undefined}
        busy={archiving}
        onConfirm={() => {
          if (archiveTarget) archiveProject(archiveTarget);
        }}
      />
    </div>
  );
}

function InlineProjectControls({
  project,
  locale,
  onApply,
}: {
  project: WorkspaceProject;
  locale: "ar" | "en";
  onApply: (patch: Partial<Pick<WorkspaceProject, "status" | "progress">>) => void;
}) {
  const [status, setStatus] = useState(project.status);
  const [progress, setProgress] = useState(project.progress);

  const labels: Record<WorkspaceProject["status"], string> =
    locale === "ar"
      ? { ongoing: "قيد التنفيذ", completed: "مكتمل", upcoming: "قادم" }
      : { ongoing: "Ongoing", completed: "Completed", upcoming: "Upcoming" };

  return (
    <div className="w-[260px] p-2.5">
      <p className="mb-2 text-[13px] font-medium text-[var(--admin-muted)]">
        {locale === "ar" ? "الحالة" : "Status"}
      </p>
      <div className="grid grid-cols-3 gap-1.5">
        {(["ongoing", "completed", "upcoming"] as const).map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => setStatus(option)}
            className={cn(
              "admin-focus-ring min-h-10 rounded-lg border px-2 text-[12px] transition-colors",
              status === option
                ? "border-[rgba(226,176,74,0.35)] bg-[rgba(226,176,74,0.14)] text-[#F3C86A]"
                : "border-white/10 text-[var(--admin-muted)] hover:border-white/20",
            )}
          >
            {labels[option]}
          </button>
        ))}
      </div>
      <div className="mt-4 flex items-center justify-between gap-3">
        <p className="text-[13px] font-medium text-[var(--admin-muted)]">
          {locale === "ar" ? "الإنجاز" : "Progress"}
        </p>
        <span className="tabular-nums text-[13px] text-[var(--admin-text)]">{progress}%</span>
      </div>
      <Slider value={progress} onValueChange={setProgress} label={locale === "ar" ? "الإنجاز" : "Progress"} />
      <div className="mt-3 flex justify-end gap-2">
        <Button
          variant="primary"
          size="sm"
          onClick={() => onApply({ status, progress })}
          disabled={status === project.status && progress === project.progress}
        >
          {locale === "ar" ? "حفظ" : "Save"}
        </Button>
      </div>
    </div>
  );
}

function EmptyProjects({ locale, label, full }: { locale: "ar" | "en"; label: string; full?: boolean }) {
  return (
    <div className={cn("border border-dashed border-white/12 bg-coal/40 p-10 text-center", full && "col-span-full")}>
      <p className="[font-family:var(--font-inter),var(--font-arabic),system-ui,sans-serif] text-xl text-ivory/70">{label}</p>
      <p className="mt-2 text-[0.78rem] text-ivory/40">{locale === "ar" ? "جرّب تعديل عوامل التصفية أو أضف مشروعاً جديداً." : "Try adjusting filters or add a new project."}</p>
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
            <p className="tabular text-[28px] font-bold leading-none text-[#F1EEE8] [font-family:var(--font-inter),var(--font-arabic),system-ui,sans-serif]">{stat.value}</p>
            <p className="mt-2.5 text-[0.7rem]  text-ivory/40">
              {stat.label}
            </p>
          </div>
        ))}
      </div>

      <div className="rounded-[22px] border border-white/[.07] bg-gradient-to-b from-white/[.05] to-white/[.018]">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 px-5 py-2">
          <span className="text-[0.7rem] font-semibold  text-gold">
            {c.financials}
          </span>
          <button
            type="button"
            onClick={exportCsv}
            className="inline-flex h-9 items-center gap-2 border border-white/12 px-3.5 text-[0.68rem] font-semibold  text-ivory/55 transition-colors hover:border-gold/40 hover:text-gold"
          >
            <FileText className="h-3.5 w-3.5" />
            {c.export}
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[880px]">
            <thead>
              <tr className="border-b border-white/8 text-[0.64rem]  text-ivory/40">
                <th className="px-5 py-2 text-start font-medium">{c.project}</th>
                <th className="px-4 py-2 text-start font-medium">{c.budget}</th>
                <th className="px-4 py-2 text-start font-medium">{c.spent}</th>
                <th className="px-4 py-2 text-start font-medium">{c.profit}</th>
                <th className="px-4 py-2 text-start font-medium">{c.contract}</th>
                <th className="px-5 py-2 text-end font-medium">{c.margin}</th>
              </tr>
            </thead>
            <tbody>
              {projects.map((project) => {
                const margin = project.contractValue
                  ? (project.profit / project.contractValue) * 100
                  : 0;
                return (
                  <tr key={project.slug} className="border-b border-white/6 last:border-0">
                    <td className="px-5 py-2 text-[0.8rem] text-ivory/70">{l(project.title)}</td>
                    {(["budget", "spent", "profit", "contractValue"] as const).map((key) => (
                      <td key={key} className="px-4 py-3">
                        <FieldInput
                          type="number"
                          min={0}
                          value={project[key]}
                          onChange={(event) =>
                            updateProject(project.slug, { [key]: Number(event.target.value) })
                          }
                          className="h-10 w-24 text-[13px]"
                          aria-label={l(project.title)}
                        />
                      </td>
                    ))}
                    <td className="px-5 py-2 text-end">
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
        <div className="rounded-[22px] border border-white/[.07] bg-gradient-to-b from-white/[.05] to-white/[.018] p-6">
          <span className="text-[0.7rem] font-semibold  text-gold">
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

        <div className="rounded-[22px] border border-white/[.07] bg-gradient-to-b from-white/[.05] to-white/[.018]">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 px-5 py-2">
            <span className="text-[0.7rem] font-semibold  text-gold">
              {c.paymentStages}
            </span>
            <FieldSelect
              value={activeSlug}
              onValueChange={setSelected}
              options={projects.map((project) => ({ value: project.slug, label: l(project.title) }))}
              className="h-10 max-w-full text-[13px]"
              aria-label={c.project}
            />
          </div>
          {selectedProject && selectedProject.invoices.length > 0 ? (
            <div className="divide-y divide-white/6">
              {selectedProject.invoices.map((invoice) => (
                <div key={invoice.number} className="flex items-center gap-3 px-6 py-2">
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
                        "text-[0.64rem] ",
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
      <form onSubmit={saveContent} className="rounded-[22px] border border-white/[.07] bg-gradient-to-b from-white/[.05] to-white/[.018]">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 px-5 py-2">
          <span className="text-[0.7rem] font-semibold  text-gold">
            {c.heroContent}
          </span>
          <Link
            href="/"
            target="_blank"
            className="inline-flex items-center gap-1.5 text-[0.68rem]  text-ivory/45 transition-colors hover:text-gold"
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
          <p className="mb-4 text-[0.7rem] font-semibold  text-gold/80">
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
            className="inline-flex h-9 items-center gap-2 bg-gold px-4 text-[0.7rem] font-semibold  text-obsidian transition-colors hover:bg-gold-light"
          >
            {saved ? <Check className="h-3.5 w-3.5" /> : <Save className="h-3.5 w-3.5" />}
            {c.saveContent}
          </button>
        </div>
      </form>

      <form onSubmit={saveService} className="rounded-[22px] border border-white/[.07] bg-gradient-to-b from-white/[.05] to-white/[.018]">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 px-5 py-2">
          <span className="text-[0.7rem] font-semibold  text-gold">
            {c.serviceCards}
          </span>
          <FieldSelect
            value={activeServiceSlug}
            onValueChange={selectService}
            options={
              services.length
                ? services.map((service) => ({
                    value: service.slug,
                    label: l(content.serviceOverrides[service.slug]?.title ?? service.title),
                  }))
                : [{ value: "none", label: "—" }]
            }
            className="h-9 max-w-full text-[13px]"
            aria-label={c.serviceCards}
          />
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
            className="inline-flex h-9 items-center gap-2 border border-gold/40 px-4 text-[0.7rem] font-semibold  text-gold transition-colors hover:bg-gold hover:text-obsidian"
          >
            <Save className="h-3.5 w-3.5" />
            {c.saveService}
          </button>
        </div>
      </form>
      <form onSubmit={saveCopy} className="rounded-[22px] border border-white/[.07] bg-gradient-to-b from-white/[.05] to-white/[.018]">
        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-white/10 px-5 py-2">
          <div>
            <span className="flex items-center gap-2 text-[0.7rem] font-semibold  text-gold">
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
            className="inline-flex h-8 items-center gap-1.5 border border-white/12 px-3 text-[0.68rem] font-semibold  text-ivory/50 transition-all duration-300 hover:border-gold/40 hover:text-gold active:scale-[0.98]"
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
          <FieldSelect
            value={copyGroup}
            onValueChange={setCopyGroup}
            options={[
              { value: "all", label: c.allGroups },
              ...copyGroups.map((group) => ({
                value: group,
                label: (copyGroupLabels[group] ?? { ar: group, en: group })[locale],
              })),
            ]}
            className="h-10 text-[13px]"
            aria-label={c.allGroups}
          />
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
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 text-[0.72rem] font-semibold  text-ivory/65 transition-colors hover:text-gold [&::-webkit-details-marker]:hidden">
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
                                "mt-0.5 inline-block text-[0.62rem] ",
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
            className="inline-flex h-9 items-center gap-2 bg-gold px-4 text-[0.7rem] font-semibold  text-obsidian transition-all duration-300 hover:bg-gold-light active:scale-[0.98]"
          >
            {copyNotice ? <Check className="h-3.5 w-3.5" /> : <Save className="h-3.5 w-3.5" />}
            {c.saveCopy}
          </button>
        </div>
      </form>

      <form onSubmit={saveMedia} className="rounded-[22px] border border-white/[.07] bg-gradient-to-b from-white/[.05] to-white/[.018]">
        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-white/10 px-5 py-2">
          <div>
            <span className="flex items-center gap-2 text-[0.7rem] font-semibold  text-gold">
              <ImageIcon className="h-3.5 w-3.5" />
              {c.mediaAssets}
            </span>
            <p className="mt-2 max-w-2xl text-[0.74rem] leading-relaxed text-ivory/45">
              {c.mediaAssetsText}
            </p>
          </div>
          <span className="border border-white/10 px-2.5 py-1 text-[0.64rem]  text-ivory/40">
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
                <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 text-[0.72rem] font-semibold  text-ivory/65 transition-colors hover:text-gold [&::-webkit-details-marker]:hidden">
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
                          <div className="flex items-center justify-between gap-2 text-[0.62rem] ">
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
            className="inline-flex h-9 items-center gap-2 border border-gold/40 px-4 text-[0.7rem] font-semibold  text-gold transition-all duration-300 hover:bg-gold hover:text-obsidian active:scale-[0.98] disabled:cursor-wait disabled:opacity-60 disabled:hover:bg-transparent disabled:hover:text-gold"
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
      <div className="flex flex-col justify-between gap-3 rounded-[22px] border border-white/[.07] bg-gradient-to-b from-white/[.05] to-white/[.018] p-5 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-[28px] font-bold text-[#F1EEE8] [font-family:var(--font-inter),var(--font-arabic),system-ui,sans-serif]">{c.mediaTitle}</h2>
          <p className="mt-1 max-w-2xl text-[0.76rem] leading-relaxed text-ivory/45">
            {c.mediaText}
          </p>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {projects.map((project) => (
          <div key={project.slug} className="rounded-[22px] border border-white/[.07] bg-gradient-to-b from-white/[.05] to-white/[.018] p-4">
            <div className="flex items-center justify-between gap-3">
              <span className="truncate text-[0.82rem] text-ivory/70">{l(project.title)}</span>
              <span className="text-[0.66rem]  text-ivory/40">
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
                      artGallery: project.artGallery.includes(variant)
                        ? project.artGallery
                        : [...project.artGallery, variant],
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
                  <span className="absolute inset-x-0 bottom-0 bg-obsidian/75 px-1 py-0.5 text-[0.6rem]  text-ivory/60">
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
      <div className="rounded-[22px] border border-white/[.07] bg-gradient-to-b from-white/[.05] to-white/[.018]">
        <div className="border-b border-white/10 px-5 py-2">
          <h2 className="text-[28px] font-bold text-[#F1EEE8] [font-family:var(--font-inter),var(--font-arabic),system-ui,sans-serif]">{c.messagesTitle}</h2>
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

      <div className="rounded-[22px] border border-white/[.07] bg-gradient-to-b from-white/[.05] to-white/[.018]">
        <div className="flex items-center justify-between gap-3 border-b border-white/10 px-5 py-2">
          <span className="text-[0.7rem] font-semibold  text-gold">
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
                <span className="flex items-center gap-1.5 text-[0.64rem]  text-ivory/40">
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
          <p className="mb-2 text-[0.66rem]  text-ivory/40">{c.reply}</p>
          <div className="flex gap-2">
            <FieldInput
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              placeholder={c.replyPlaceholder}
              className="h-10 min-w-0 flex-1 text-[13px]"
              aria-label={c.replyPlaceholder}
            />
            <button
              type="submit"
              className="flex h-10 items-center gap-2 bg-gold px-4 text-[0.7rem] font-semibold  text-obsidian transition-colors hover:bg-gold-light"
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

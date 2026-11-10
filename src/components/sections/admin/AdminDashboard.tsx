"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowUpRight,
  BarChart3,
  Building2,
  Check,
  CircleDollarSign,
  FileText,
  FolderKanban,
  Image as ImageIcon,
  LayoutDashboard,
  LogOut,
  MessageSquare,
  Pencil,
  Plus,
  RefreshCcw,
  Save,
  Send,
  Settings,
  ShieldCheck,
  Trash2,
  TrendingUp,
  Wallet,
} from "lucide-react";
import { isAdminUser, useAuth } from "@/components/providers/AuthProvider";
import { useI18n } from "@/components/providers/I18nProvider";
import {
  useWorkspace,
  type WorkspaceProject,
} from "@/components/providers/WorkspaceProvider";
import { AdminProjectEditor } from "@/components/sections/admin/AdminProjectEditor";
import { Field, TextInput, Textarea } from "@/components/ui/Field";
import { ProjectArt } from "@/components/ui/ProjectArt";
import { portalProjects } from "@/data/portal";
import { services } from "@/data/services";
import type { ArtVariant } from "@/data/projects";
import { L } from "@/lib/dictionary";
import { cn } from "@/lib/utils";

type Section = "overview" | "projects" | "financials" | "content" | "media" | "messages";

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
    back: "العودة للموقع",
    portal: "بوابة العملاء",
    signOut: "تسجيل الخروج",
    welcome: "مرحباً",
    demo: "مساحة عرض تجريبية",
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
    mediaTitle: "مكتبة الوسائط",
    mediaText: "غيّر أغلفة المشاريع ومعارضها. التغييرات تظهر فوراً في الصفحة الرئيسية وصفحات المشاريع.",
    cover: "الغلاف",
    gallery: "المعرض",
    setCover: "تعيين كغلاف",
    reset: "إعادة تعيين مساحة العرض",
    resetConfirm: "سيتم حذف كل التعديلات التجريبية والعودة للبيانات الأصلية. متابعة؟",
    messagesTitle: "رسائل العملاء",
    messagesText: "راجع رسائل بوابة العملاء وردّ مباشرة.",
    reply: "ردّ كمدير المشروع",
    replyPlaceholder: "اكتب ردك...",
    send: "إرسال الرد",
    noMessages: "لا توجد رسائل.",
    client: "العميل",
    manager: "مدير المشروع",
    accessTitle: "صلاحية إدارية مطلوبة",
    accessText: "سجّل الدخول بحساب العرض الإداري للوصول إلى لوحة التحكم.",
    signIn: "تسجيل الدخول",
    demoHint: "demo@alattar.sa · demo1234",
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
    back: "Back to site",
    portal: "Client portal",
    signOut: "Sign out",
    welcome: "Welcome",
    demo: "Demo workspace",
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
    mediaTitle: "Media library",
    mediaText: "Change project covers and galleries. Changes appear instantly on the homepage and project pages.",
    cover: "Cover",
    gallery: "Gallery",
    setCover: "Set as cover",
    reset: "Reset demo workspace",
    resetConfirm: "This will remove all demo edits and restore the original data. Continue?",
    messagesTitle: "Client messages",
    messagesText: "Review client portal messages and reply directly.",
    reply: "Reply as project manager",
    replyPlaceholder: "Write your reply...",
    send: "Send reply",
    noMessages: "No messages.",
    client: "Client",
    manager: "Project manager",
    accessTitle: "Admin access required",
    accessText: "Sign in with the demo admin account to access the control center.",
    signIn: "Sign in",
    demoHint: "demo@alattar.sa · demo1234",
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

export function AdminDashboard() {
  const { locale } = useI18n();
  const { user, ready, signOut } = useAuth();
  const { projects, messages, addProject, updateProject, deleteProject, resetWorkspace } =
    useWorkspace();
  const router = useRouter();
  const c = copy[locale];
  const [section, setSection] = useState<Section>("overview");
  const [editing, setEditing] = useState<WorkspaceProject | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);

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
            <p className="mt-5 max-w-md text-[0.9rem] leading-[1.9] text-ivory/50">
              {c.accessText}
            </p>
            <Link
              href="/sign-in"
              className="btn-shine mt-9 inline-flex h-12 items-center gap-2.5 bg-gold px-7 text-[0.66rem] font-semibold uppercase tracking-[0.16em] text-obsidian transition-colors hover:bg-gold-light"
            >
              {c.signIn}
              <ArrowUpRight className="h-4 w-4" />
            </Link>
            <p className="mt-6 text-[0.62rem] text-ivory/30">{c.demoHint}</p>
          </div>
        </div>
      </section>
    );
  }

  const navItems: { id: Section; label: string; icon: typeof LayoutDashboard }[] = [
    { id: "overview", label: c.overview, icon: LayoutDashboard },
    { id: "projects", label: c.projects, icon: FolderKanban },
    { id: "financials", label: c.financials, icon: Wallet },
    { id: "content", label: c.content, icon: Settings },
    { id: "media", label: c.media, icon: ImageIcon },
    { id: "messages", label: c.messages, icon: MessageSquare },
  ];

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

  return (
    <>
      <section className="relative min-h-[100svh] overflow-hidden bg-obsidian pb-16 pt-28 text-ivory sm:pt-32">
        <div className="blueprint-grid pointer-events-none absolute inset-0 opacity-25" />
        <div className="pointer-events-none absolute -end-20 top-10 select-none text-[14rem] font-semibold leading-none tracking-tighter text-white/[0.02] sm:text-[20rem]">
          ADMIN
        </div>
        <div className="container-lux relative">
          <div className="grid gap-6 lg:grid-cols-[220px_1fr]">
            <aside className="h-fit border border-white/10 bg-coal/80 p-4 backdrop-blur">
              <div className="border-b border-white/10 pb-4">
                <span className="text-[0.52rem] uppercase tracking-[0.18em] text-gold">
                  {c.admin}
                </span>
                <p className="mt-1 font-display text-2xl leading-none text-ivory">{c.control}</p>
              </div>
              <nav className="mt-3 flex flex-col gap-1" aria-label={c.admin}>
                {navItems.map(({ id, label, icon: Icon }) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setSection(id)}
                    className={cn(
                      "flex items-center gap-2.5 px-3 py-2.5 text-start text-[0.66rem] font-medium transition-colors",
                      section === id
                        ? "bg-gold text-obsidian"
                        : "text-ivory/50 hover:bg-white/5 hover:text-ivory",
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    <span className="flex-1">{label}</span>
                    {id === "messages" ? (
                      <span className="tabular text-[0.55rem] opacity-60">{messages.length}</span>
                    ) : null}
                  </button>
                ))}
              </nav>

              <div className="mt-4 space-y-1 border-t border-white/10 pt-3">
                <Link
                  href="/portal"
                  className="flex items-center gap-2.5 px-3 py-2 text-[0.64rem] text-ivory/45 transition-colors hover:text-gold"
                >
                  <LayoutDashboard className="h-3.5 w-3.5" />
                  {c.portal}
                </Link>
                <Link
                  href="/"
                  className="flex items-center gap-2.5 px-3 py-2 text-[0.64rem] text-ivory/45 transition-colors hover:text-gold"
                >
                  <ArrowUpRight className="h-3.5 w-3.5" />
                  {c.back}
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    signOut();
                    router.push("/");
                  }}
                  className="flex w-full items-center gap-2.5 px-3 py-2 text-start text-[0.64rem] text-ivory/45 transition-colors hover:text-gold"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  {c.signOut}
                </button>
              </div>
            </aside>

            <div className="min-w-0">
              <div className="flex flex-col justify-between gap-4 border border-white/10 bg-coal/60 p-5 backdrop-blur sm:flex-row sm:items-center">
                <div>
                  <span className="text-[0.52rem] uppercase tracking-[0.16em] text-gold/80">
                    {c.welcome}
                  </span>
                  <h1 className="mt-1 font-display text-2xl leading-none text-ivory sm:text-3xl">
                    {user.name}
                  </h1>
                  <p className="mt-1 text-[0.6rem] text-ivory/35">
                    {user.email} · {c.demo}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Link
                    href="/portal"
                    className="inline-flex h-9 items-center gap-2 border border-white/12 px-3.5 text-[0.56rem] font-semibold uppercase tracking-[0.12em] text-ivory/50 transition-colors hover:border-gold/40 hover:text-gold"
                  >
                    {c.portal}
                    <ArrowUpRight className="h-3.5 w-3.5" />
                  </Link>
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gold text-[0.62rem] font-semibold text-obsidian">
                    {user.name
                      .split(" ")
                      .slice(0, 2)
                      .map((part) => part.charAt(0))
                      .join("")}
                  </span>
                </div>
              </div>

              <div className="mt-6">
                {section === "overview" ? (
                  <OverviewSection projects={projects} messages={messages} onNew={openNew} onNavigate={setSection} />
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
                {section === "financials" ? <FinancialsSection projects={projects} /> : null}
                {section === "content" ? <ContentSection /> : null}
                {section === "media" ? (
                  <MediaSection projects={projects} onReset={resetWorkspace} />
                ) : null}
                {section === "messages" ? <MessagesSection projects={projects} /> : null}
              </div>
            </div>
          </div>
        </div>
      </section>

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
  const totalValue = projects.reduce((sum, project) => sum + project.contractValue, 0);
  const totalProfit = projects.reduce((sum, project) => sum + project.profit, 0);
  const active = projects.filter((project) => project.status === "ongoing").length;
  const avgMargin = totalValue ? (totalProfit / totalValue) * 100 : 0;
  const top = [...projects].sort((a, b) => b.budget - a.budget).slice(0, 5);
  const maxBudget = Math.max(1, ...top.map((project) => project.budget));

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-px border border-white/10 bg-white/10 lg:grid-cols-4">
        {[
          { label: c.totalProjects, value: `${projects.length}`, icon: Building2 },
          { label: c.activeProjects, value: `${active}`, icon: FolderKanban },
          { label: c.portfolioValue, value: formatM(totalValue, locale), icon: CircleDollarSign },
          { label: c.netProfit, value: formatM(totalProfit, locale), icon: TrendingUp },
        ].map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="bg-coal p-4">
              <Icon className="h-4 w-4 text-gold" />
              <p className="mt-3 tabular font-display text-2xl leading-none text-ivory">
                {stat.value}
              </p>
              <p className="mt-2 text-[0.48rem] uppercase tracking-[0.14em] text-ivory/30">
                {stat.label}
              </p>
            </div>
          );
        })}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="border border-white/10 bg-coal p-5">
          <div className="flex items-center justify-between gap-3">
            <span className="text-[0.55rem] font-semibold uppercase tracking-[0.16em] text-gold">
              {c.budgetVsSpent}
            </span>
            <span className="tabular text-[0.55rem] text-ivory/30">
              {c.avgMargin} {avgMargin.toFixed(1)}%
            </span>
          </div>
          <div className="mt-6 space-y-4">
            {top.map((project) => (
              <div key={project.slug}>
                <div className="flex items-center justify-between gap-3 text-[0.6rem]">
                  <span className="truncate text-ivory/60">{l(project.title)}</span>
                  <span className="tabular shrink-0 text-ivory/35">
                    {formatM(project.spent, locale)} / {formatM(project.budget, locale)}
                  </span>
                </div>
                <div className="mt-1.5 flex h-1.5 overflow-hidden bg-white/10">
                  <div
                    className="h-full bg-gold"
                    style={{ width: `${Math.min(100, (project.spent / maxBudget) * 100)}%` }}
                  />
                  <div
                    className="h-full bg-gold/25"
                    style={{ width: `${Math.min(100, ((project.budget - project.spent) / maxBudget) * 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <button
            type="button"
            onClick={onNew}
            className="group flex items-center justify-between gap-4 border border-gold/30 bg-gold/[0.06] p-5 text-start transition-colors hover:border-gold/70"
          >
            <div>
              <p className="flex items-center gap-2 text-[0.72rem] font-medium text-ivory">
                <Plus className="h-4 w-4 text-gold" />
                {c.addProject}
              </p>
              <p className="mt-1 text-[0.6rem] text-ivory/40">{c.projects}</p>
            </div>
            <ArrowUpRight className="h-4 w-4 text-gold transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
          </button>
          <button
            type="button"
            onClick={() => onNavigate("financials")}
            className="group flex items-center justify-between gap-4 border border-white/10 bg-coal p-5 text-start transition-colors hover:border-gold/40"
          >
            <div>
              <p className="flex items-center gap-2 text-[0.72rem] font-medium text-ivory">
                <BarChart3 className="h-4 w-4 text-gold" />
                {c.financials}
              </p>
              <p className="mt-1 text-[0.6rem] text-ivory/40">{c.paymentStages}</p>
            </div>
            <ArrowUpRight className="h-4 w-4 text-gold transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
          </button>
          <button
            type="button"
            onClick={() => onNavigate("messages")}
            className="group flex items-center justify-between gap-4 border border-white/10 bg-coal p-5 text-start transition-colors hover:border-gold/40"
          >
            <div>
              <p className="flex items-center gap-2 text-[0.72rem] font-medium text-ivory">
                <MessageSquare className="h-4 w-4 text-gold" />
                {c.messages}
              </p>
              <p className="mt-1 text-[0.6rem] text-ivory/40">
                {messages.length} {c.messages}
              </p>
            </div>
            <ArrowUpRight className="h-4 w-4 text-gold transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
          </button>
        </div>
      </div>

      <div className="border border-white/10 bg-coal">
        <div className="flex items-center justify-between gap-3 border-b border-white/10 px-5 py-4">
          <span className="text-[0.55rem] font-semibold uppercase tracking-[0.16em] text-gold">
            {c.recent}
          </span>
          <button
            type="button"
            onClick={() => onNavigate("projects")}
            className="text-[0.55rem] font-semibold uppercase tracking-[0.12em] text-ivory/35 transition-colors hover:text-gold"
          >
            {c.viewAll}
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[620px] text-start">
            <thead>
              <tr className="border-b border-white/8 text-[0.48rem] uppercase tracking-[0.14em] text-ivory/30">
                <th className="px-5 py-3 text-start font-medium">{c.project}</th>
                <th className="px-3 py-3 text-start font-medium">{c.category}</th>
                <th className="px-3 py-3 text-start font-medium">{c.status}</th>
                <th className="px-3 py-3 text-start font-medium">{c.progress}</th>
                <th className="px-5 py-3 text-end font-medium">{c.value}</th>
              </tr>
            </thead>
            <tbody>
              {projects.slice(0, 5).map((project) => (
                <tr key={project.slug} className="border-b border-white/6 last:border-0">
                  <td className="px-5 py-3">
                    <span className="text-[0.68rem] text-ivory/75">{l(project.title)}</span>
                  </td>
                  <td className="px-3 py-3 text-[0.58rem] text-ivory/40">
                    {c.categoryLabels[project.category]}
                  </td>
                  <td className="px-3 py-3">
                    <span
                      className={cn(
                        "px-2 py-0.5 text-[0.48rem] uppercase tracking-[0.1em]",
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
                  <td className="px-3 py-3">
                    <span className="flex items-center gap-2">
                      <span className="h-1 w-12 overflow-hidden bg-white/10">
                        <span
                          className="block h-full bg-gold"
                          style={{ width: `${project.progress}%` }}
                        />
                      </span>
                      <span className="tabular text-[0.55rem] text-ivory/35">
                        {project.progress}%
                      </span>
                    </span>
                  </td>
                  <td className="px-5 py-3 text-end text-[0.6rem] text-ivory/45">
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
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return projects;
    return projects.filter((project) =>
      [project.title.ar, project.title.en, project.location.ar, project.location.en]
        .join(" ")
        .toLowerCase()
        .includes(normalized),
    );
  }, [projects, query]);

  return (
    <div className="space-y-5">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h2 className="font-display text-2xl text-ivory">{c.projects}</h2>
          <p className="mt-1 text-[0.62rem] text-ivory/35">
            {filtered.length} / {projects.length}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={c.search}
            className="h-9 w-full border border-white/12 bg-transparent px-3 text-[0.65rem] text-ivory outline-none placeholder:text-ivory/25 focus:border-gold/50 sm:w-56"
          />
          <button
            type="button"
            onClick={onNew}
            className="inline-flex h-9 shrink-0 items-center gap-2 bg-gold px-4 text-[0.56rem] font-semibold uppercase tracking-[0.12em] text-obsidian transition-colors hover:bg-gold-light"
          >
            <Plus className="h-3.5 w-3.5" />
            {c.addProject}
          </button>
        </div>
      </div>

      <div className="overflow-x-auto border border-white/10 bg-coal">
        <table className="w-full min-w-[760px]">
          <thead>
            <tr className="border-b border-white/8 text-[0.48rem] uppercase tracking-[0.14em] text-ivory/30">
              <th className="px-4 py-3 text-start font-medium">{c.project}</th>
              <th className="px-3 py-3 text-start font-medium">{c.category}</th>
              <th className="px-3 py-3 text-start font-medium">{c.status}</th>
              <th className="px-3 py-3 text-start font-medium">{c.progress}</th>
              <th className="px-3 py-3 text-end font-medium">{c.value}</th>
              <th className="px-4 py-3 text-end font-medium">{c.actions}</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((project) => (
              <tr key={project.slug} className="border-b border-white/6 last:border-0">
                <td className="px-4 py-3">
                  <span className="flex items-center gap-3">
                    <span className="relative h-8 w-11 overflow-hidden border border-white/10">
                      <ProjectArt variant={project.art} className="h-full w-full" />
                    </span>
                    <span className="flex min-w-0 flex-col">
                      <span className="truncate text-[0.68rem] text-ivory/75">
                        {l(project.title)}
                      </span>
                      <span className="truncate text-[0.5rem] text-ivory/30">
                        {l(project.location)}
                      </span>
                    </span>
                  </span>
                </td>
                <td className="px-3 py-3 text-[0.58rem] text-ivory/40">
                  {c.categoryLabels[project.category]}
                </td>
                <td className="px-3 py-3">
                  <span
                    className={cn(
                      "px-2 py-0.5 text-[0.48rem] uppercase tracking-[0.1em]",
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
                <td className="px-3 py-3">
                  <span className="flex items-center gap-2">
                    <span className="h-1 w-12 overflow-hidden bg-white/10">
                      <span
                        className="block h-full bg-gold"
                        style={{ width: `${project.progress}%` }}
                      />
                    </span>
                    <span className="tabular text-[0.55rem] text-ivory/35">
                      {project.progress}%
                    </span>
                  </span>
                </td>
                <td className="px-3 py-3 text-end text-[0.58rem] text-ivory/45">
                  {l(project.value)}
                </td>
                <td className="px-4 py-3">
                  <span className="flex items-center justify-end gap-1.5">
                    <button
                      type="button"
                      onClick={() => onEdit(project)}
                      className="flex h-7 w-7 items-center justify-center border border-white/12 text-ivory/45 transition-colors hover:border-gold/50 hover:text-gold"
                      aria-label={`${c.edit} ${l(project.title)}`}
                    >
                      <Pencil className="h-3 w-3" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onDelete(project)}
                      className="flex h-7 w-7 items-center justify-center border border-white/12 text-ivory/45 transition-colors hover:border-red-400/50 hover:text-red-300"
                      aria-label={`${c.delete} ${l(project.title)}`}
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!filtered.length ? (
          <p className="p-8 text-center text-[0.68rem] text-ivory/35">{c.noProjects}</p>
        ) : null}
      </div>
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
  const portalProject = portalProjects.find((project) => project.slug === activeSlug);

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
          <div key={stat.label} className="bg-coal p-4">
            <p className="tabular font-display text-2xl leading-none text-ivory">{stat.value}</p>
            <p className="mt-2 text-[0.48rem] uppercase tracking-[0.14em] text-ivory/30">
              {stat.label}
            </p>
          </div>
        ))}
      </div>

      <div className="border border-white/10 bg-coal">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 px-5 py-4">
          <span className="text-[0.55rem] font-semibold uppercase tracking-[0.16em] text-gold">
            {c.financials}
          </span>
          <button
            type="button"
            onClick={exportCsv}
            className="inline-flex h-8 items-center gap-2 border border-white/12 px-3 text-[0.52rem] font-semibold uppercase tracking-[0.12em] text-ivory/45 transition-colors hover:border-gold/40 hover:text-gold"
          >
            <FileText className="h-3 w-3" />
            {c.export}
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px]">
            <thead>
              <tr className="border-b border-white/8 text-[0.48rem] uppercase tracking-[0.14em] text-ivory/30">
                <th className="px-5 py-3 text-start font-medium">{c.project}</th>
                <th className="px-3 py-3 text-start font-medium">{c.budget}</th>
                <th className="px-3 py-3 text-start font-medium">{c.spent}</th>
                <th className="px-3 py-3 text-start font-medium">{c.profit}</th>
                <th className="px-3 py-3 text-start font-medium">{c.contract}</th>
                <th className="px-5 py-3 text-end font-medium">{c.margin}</th>
              </tr>
            </thead>
            <tbody>
              {projects.map((project) => {
                const margin = project.contractValue
                  ? (project.profit / project.contractValue) * 100
                  : 0;
                return (
                  <tr key={project.slug} className="border-b border-white/6 last:border-0">
                    <td className="px-5 py-3 text-[0.66rem] text-ivory/70">{l(project.title)}</td>
                    {(["budget", "spent", "profit", "contractValue"] as const).map((key) => (
                      <td key={key} className="px-3 py-2">
                        <input
                          type="number"
                          min={0}
                          value={project[key]}
                          onChange={(event) =>
                            updateProject(project.slug, { [key]: Number(event.target.value) })
                          }
                          className="h-8 w-20 border border-white/10 bg-transparent px-2 text-[0.6rem] text-ivory/70 outline-none focus:border-gold/50"
                        />
                      </td>
                    ))}
                    <td className="px-5 py-3 text-end">
                      <span
                        className={cn(
                          "tabular text-[0.62rem]",
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
        <div className="border border-white/10 bg-coal p-5">
          <span className="text-[0.55rem] font-semibold uppercase tracking-[0.16em] text-gold">
            {c.budgetVsSpent}
          </span>
          <div className="mt-6 space-y-4">
            {projects.slice(0, 6).map((project) => {
              const max = Math.max(1, project.budget);
              return (
                <div key={project.slug}>
                  <div className="flex items-center justify-between gap-3 text-[0.6rem]">
                    <span className="truncate text-ivory/60">{l(project.title)}</span>
                    <span className="tabular shrink-0 text-ivory/35">
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
            <span className="text-[0.55rem] font-semibold uppercase tracking-[0.16em] text-gold">
              {c.paymentStages}
            </span>
            <select
              value={activeSlug}
              onChange={(event) => setSelected(event.target.value)}
              className="h-8 border border-white/12 bg-coal px-2 text-[0.6rem] text-ivory/60 outline-none focus:border-gold/50"
            >
              {projects.map((project) => (
                <option key={project.slug} value={project.slug}>
                  {l(project.title)}
                </option>
              ))}
            </select>
          </div>
          {selectedProject && portalProject ? (
            <div className="divide-y divide-white/6">
              {portalProject.invoices.map((invoice) => (
                <div key={invoice.number} className="flex items-center gap-3 px-5 py-3.5">
                  <FileText className="h-3.5 w-3.5 shrink-0 text-gold" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[0.65rem] text-ivory/65">{l(invoice.title)}</p>
                    <span className="text-[0.5rem] text-ivory/30">
                      {invoice.number} · {invoice.date}
                    </span>
                  </div>
                  <div className="text-end">
                    <p className="tabular text-[0.62rem] text-ivory/55">{invoice.amount}</p>
                    <span
                      className={cn(
                        "text-[0.48rem] uppercase tracking-[0.1em]",
                        invoice.status === "paid"
                          ? "text-emerald-300/80"
                          : invoice.status === "due"
                            ? "text-gold"
                            : "text-ivory/30",
                      )}
                    >
                      {c.invoiceStatus[invoice.status]}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="p-6 text-center text-[0.62rem] text-ivory/30">{c.noProjects}</p>
          )}
          <div className="border-t border-white/10 px-5 py-3 text-[0.55rem] text-ivory/30">
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
  const buildServiceForm = (slug: string) => {
    const service = services.find((item) => item.slug === slug) ?? services[0];
    const override = content.serviceOverrides[slug];
    return {
      titleAr: override?.title.ar ?? service.title.ar,
      titleEn: override?.title.en ?? service.title.en,
      taglineAr: override?.tagline.ar ?? service.tagline.ar,
      taglineEn: override?.tagline.en ?? service.tagline.en,
      descriptionAr: override?.description.ar ?? service.description.ar,
      descriptionEn: override?.description.en ?? service.description.en,
    };
  };
  const [serviceSlug, setServiceSlug] = useState(services[0].slug);
  const [serviceForm, setServiceForm] = useState(() => buildServiceForm(services[0].slug));

  const selectService = (slug: string) => {
    setServiceSlug(slug);
    setServiceForm(buildServiceForm(slug));
  };

  const saveContent = (event: React.FormEvent) => {
    event.preventDefault();
    updateContent({
      heroEyebrow: L(hero.eyebrowAr, hero.eyebrowEn),
      heroTitleTop: L(hero.titleTopAr, hero.titleTopEn),
      heroTitleAccent: L(hero.titleAccentAr, hero.titleAccentEn),
      heroDescription: L(hero.descriptionAr, hero.descriptionEn),
      promoTitle: L(hero.promoTitleAr, hero.promoTitleEn),
      promoText: L(hero.promoTextAr, hero.promoTextEn),
      promoHref: hero.promoHref,
      promoVisible: hero.promoVisible,
    });
    setSaved(true);
    window.setTimeout(() => setSaved(false), 2400);
  };

  const saveService = (event: React.FormEvent) => {
    event.preventDefault();
    updateService(serviceSlug, {
      title: L(serviceForm.titleAr, serviceForm.titleEn),
      tagline: L(serviceForm.taglineAr, serviceForm.taglineEn),
      description: L(serviceForm.descriptionAr, serviceForm.descriptionEn),
    });
    setSaved(true);
    window.setTimeout(() => setSaved(false), 2400);
  };

  return (
    <div className="space-y-6">
      <form onSubmit={saveContent} className="border border-white/10 bg-coal">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 px-5 py-4">
          <span className="text-[0.55rem] font-semibold uppercase tracking-[0.16em] text-gold">
            {c.heroContent}
          </span>
          <Link
            href="/"
            target="_blank"
            className="inline-flex items-center gap-1.5 text-[0.52rem] uppercase tracking-[0.12em] text-ivory/35 transition-colors hover:text-gold"
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
          <p className="mb-4 text-[0.55rem] font-semibold uppercase tracking-[0.16em] text-gold/80">
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
            <label className="flex items-end gap-2 pb-2 text-[0.68rem] text-ivory/55">
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
          <span className="text-[0.58rem] text-ivory/30">{saved ? c.saved : ""}</span>
          <button
            type="submit"
            className="inline-flex h-9 items-center gap-2 bg-gold px-4 text-[0.56rem] font-semibold uppercase tracking-[0.12em] text-obsidian transition-colors hover:bg-gold-light"
          >
            {saved ? <Check className="h-3.5 w-3.5" /> : <Save className="h-3.5 w-3.5" />}
            {c.saveContent}
          </button>
        </div>
      </form>

      <form onSubmit={saveService} className="border border-white/10 bg-coal">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 px-5 py-4">
          <span className="text-[0.55rem] font-semibold uppercase tracking-[0.16em] text-gold">
            {c.serviceCards}
          </span>
          <select
            value={serviceSlug}
            onChange={(event) => selectService(event.target.value)}
            className="h-8 border border-white/12 bg-coal px-2 text-[0.6rem] text-ivory/60 outline-none focus:border-gold/50"
          >
            {services.map((service) => (
              <option key={service.slug} value={service.slug}>
                {l(content.serviceOverrides[service.slug]?.title ?? service.title)}
              </option>
            ))}
          </select>
        </div>
        <div className="grid gap-4 p-5 sm:grid-cols-2">
          <Field label={c.serviceTitle} htmlFor="service-title-ar">
            <TextInput
              id="service-title-ar"
              value={serviceForm.titleAr}
              onChange={(event) => setServiceForm({ ...serviceForm, titleAr: event.target.value })}
              dir="rtl"
            />
          </Field>
          <Field label={c.serviceTitle} htmlFor="service-title-en">
            <TextInput
              id="service-title-en"
              value={serviceForm.titleEn}
              onChange={(event) => setServiceForm({ ...serviceForm, titleEn: event.target.value })}
            />
          </Field>
          <Field label={c.serviceTagline} htmlFor="service-tagline-ar">
            <TextInput
              id="service-tagline-ar"
              value={serviceForm.taglineAr}
              onChange={(event) => setServiceForm({ ...serviceForm, taglineAr: event.target.value })}
              dir="rtl"
            />
          </Field>
          <Field label={c.serviceTagline} htmlFor="service-tagline-en">
            <TextInput
              id="service-tagline-en"
              value={serviceForm.taglineEn}
              onChange={(event) => setServiceForm({ ...serviceForm, taglineEn: event.target.value })}
            />
          </Field>
          <Field label={c.serviceDescription} htmlFor="service-description-ar">
            <Textarea
              id="service-description-ar"
              rows={4}
              value={serviceForm.descriptionAr}
              onChange={(event) =>
                setServiceForm({ ...serviceForm, descriptionAr: event.target.value })
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
                setServiceForm({ ...serviceForm, descriptionEn: event.target.value })
              }
            />
          </Field>
        </div>
        <div className="flex justify-end border-t border-white/10 p-4">
          <button
            type="submit"
            className="inline-flex h-9 items-center gap-2 border border-gold/40 px-4 text-[0.56rem] font-semibold uppercase tracking-[0.12em] text-gold transition-colors hover:bg-gold hover:text-obsidian"
          >
            <Save className="h-3.5 w-3.5" />
            {c.saveService}
          </button>
        </div>
      </form>
    </div>
  );
}

function MediaSection({
  projects,
  onReset,
}: {
  projects: WorkspaceProject[];
  onReset: () => void;
}) {
  const { locale, l } = useI18n();
  const c = copy[locale];
  const { updateProject } = useWorkspace();

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-3 border border-white/10 bg-coal p-5 sm:flex-row sm:items-center">
        <div>
          <h2 className="font-display text-2xl text-ivory">{c.mediaTitle}</h2>
          <p className="mt-1 max-w-2xl text-[0.62rem] leading-relaxed text-ivory/35">
            {c.mediaText}
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            if (window.confirm(c.resetConfirm)) onReset();
          }}
          className="inline-flex h-9 shrink-0 items-center gap-2 border border-red-400/25 px-4 text-[0.54rem] font-semibold uppercase tracking-[0.12em] text-red-300/70 transition-colors hover:border-red-400/60 hover:text-red-300"
        >
          <RefreshCcw className="h-3.5 w-3.5" />
          {c.reset}
        </button>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {projects.map((project) => (
          <div key={project.slug} className="border border-white/10 bg-coal p-4">
            <div className="flex items-center justify-between gap-3">
              <span className="truncate text-[0.68rem] text-ivory/70">{l(project.title)}</span>
              <span className="text-[0.5rem] uppercase tracking-[0.12em] text-ivory/30">
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
                  <span className="absolute inset-x-0 bottom-0 bg-obsidian/75 px-1 py-0.5 text-[0.42rem] uppercase tracking-[0.08em] text-ivory/60">
                    {c.artLabels[variant]}
                  </span>
                </button>
              ))}
            </div>
            <p className="mt-3 text-[0.52rem] text-ivory/30">
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
          <p className="mt-1 text-[0.6rem] leading-relaxed text-ivory/35">{c.messagesText}</p>
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
                  <span className="block truncate text-[0.66rem] text-ivory/70">
                    {l(project.title)}
                  </span>
                  <span className="text-[0.5rem] text-ivory/30">{l(project.location)}</span>
                </span>
                <span
                  className={cn(
                    "tabular flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-[0.5rem]",
                    count ? "bg-gold text-obsidian" : "bg-white/10 text-ivory/30",
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
          <span className="text-[0.55rem] font-semibold uppercase tracking-[0.16em] text-gold">
            {c.messagesTitle}
          </span>
          <span className="text-[0.52rem] text-ivory/30">
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
                <span className="flex items-center gap-1.5 text-[0.48rem] uppercase tracking-[0.12em] text-ivory/30">
                  {message.author === "manager" ? c.manager : c.client}
                  <span className="text-ivory/20">{dateFormat.format(new Date(message.at))}</span>
                </span>
                <p
                  className={cn(
                    "max-w-[90%] px-3 py-2 text-[0.68rem] leading-relaxed",
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
            <p className="py-10 text-center text-[0.62rem] text-ivory/30">{c.noMessages}</p>
          )}
        </div>
        <form onSubmit={submit} className="border-t border-white/10 p-4">
          <p className="mb-2 text-[0.5rem] uppercase tracking-[0.14em] text-ivory/30">{c.reply}</p>
          <div className="flex gap-2">
            <input
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              placeholder={c.replyPlaceholder}
              className="h-10 min-w-0 flex-1 border border-white/12 bg-transparent px-3 text-[0.66rem] text-ivory outline-none placeholder:text-ivory/25 focus:border-gold/50"
            />
            <button
              type="submit"
              className="flex h-10 items-center gap-2 bg-gold px-4 text-[0.54rem] font-semibold uppercase tracking-[0.12em] text-obsidian transition-colors hover:bg-gold-light"
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

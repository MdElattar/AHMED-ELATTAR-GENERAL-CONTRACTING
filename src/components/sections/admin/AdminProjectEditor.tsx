"use client";

import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  AlertCircle,
  Check,
  ChevronDown,
  Loader2,
  RotateCcw,
  Save,
} from "lucide-react";
import { toast } from "sonner";
import { useI18n } from "@/components/providers/I18nProvider";
import type { WorkspaceProject } from "@/components/providers/WorkspaceProvider";
import { ImageUpload, type ImageUploadValue } from "@/components/ui/ImageUpload";
import { ProjectImage } from "@/components/ui/ProjectImage";
import { Button } from "@/components/ui/admin";
import {
  DatePicker,
  Field,
  Input,
  NumberInput,
  SegmentedControl,
  Select,
  Slider,
  Switch,
} from "@/components/ui/admin/form";
import { ConfirmDialog, Drawer, Modal } from "@/components/ui/admin/overlay";
import type { ProjectCategory, ProjectStatus } from "@/data/projects";
import { L } from "@/lib/dictionary";
import { cn } from "@/lib/utils";
import { budgetHealthCopy, formatSAR, getBudgetHealth } from "@/lib/project-metrics";

const copy = {
  ar: {
    add: "إضافة مشروع",
    edit: "تعديل المشروع",
    addDescription: "أدخل بيانات المشروع ثم احفظه. الحقول المميزة بنجمة مطلوبة.",
    editDescription: "حدّث بيانات المشروع. تُحفظ التغييرات في قاعدة البيانات مباشرة.",
    save: "حفظ المشروع",
    saving: "جارٍ الحفظ…",
    saved: "تم الحفظ",
    cancel: "إلغاء",
    close: "إغلاق",
    identity: "هوية المشروع",
    location: "الموقع",
    client: "العميل",
    financials: "المالية",
    schedule: "الجدول الزمني",
    media: "الوسائط",
    visibility: "الظهور",
    titleAr: "اسم المشروع (عربي)",
    titleEn: "اسم المشروع (إنجليزي)",
    category: "الفئة",
    status: "الحالة",
    year: "سنة التسليم",
    city: "المدينة",
    districtAr: "الحي (عربي)",
    districtEn: "الحي (إنجليزي)",
    clientAr: "العميل (عربي)",
    clientEn: "العميل (إنجليزي)",
    contact: "جهة الاتصال",
    contactHint: "رقم أو بريد اختياري لمسؤول المشروع.",
    contractValue: "قيمة العقد",
    budget: "الميزانية (التكلفة المخططة)",
    spent: "المصروف حتى تاريخه",
    financialHint: "القيم معروضة بالريال السعودي مع فواصل الآلاف.",
    margin: "هامش متوقع",
    health: "صحة الميزانية",
    startDate: "تاريخ البدء",
    endDate: "تاريخ الانتهاء",
    progress: "نسبة الإنجاز",
    progressHint: "اسحب أو اكتب رقماً بين 0 و100.",
    images: "صور المشروع",
    imagesHint: "الصورة الأولى هي الغلاف. اسحب لإعادة الترتيب.",
    published: "إظهار على الموقع العام",
    publishedHint: "عند الإيقاف يبقى المشروع محفوظاً في لوحة الإدارة فقط.",
    required: "هذا الحقل مطلوب.",
    invalidYear: "أدخل سنة صحيحة.",
    invalidNumber: "أدخل رقماً صالحاً.",
    invalidDate: "أدخل تاريخاً صالحاً.",
    draftReady: "يوجد مسودة محفوظة لهذا المشروع.",
    restore: "استعادة المسودة",
    dismiss: "تجاهل",
    discardTitle: "تجاهل التغييرات؟",
    discardBody: "لديك تغييرات غير محفوظة. إذا أغلقت الآن ستفقدها.",
    discard: "تجاهل والإغلاق",
    keepEditing: "متابعة التحرير",
    savedToast: "تم حفظ المشروع",
    view: "عرض",
    categories: {
      commercial: "تجاري",
      residential: "سكني",
      infrastructure: "بنية تحتية",
      industrial: "صناعي",
    },
    statuses: {
      completed: "مكتمل",
      ongoing: "جارٍ",
      upcoming: "قادم",
    },
    healthLabels: {
      no_data: "لا توجد بيانات",
      on_track: "في المسار",
      watch: "تحت المراقبة",
      over: "المصروف أسرع من الإنجاز",
      saved: "ضمن الميزانية",
      overrun: "تجاوز الميزانية",
    },
    cities: {
      Riyadh: "الرياض",
      Jeddah: "جدة",
      Dammam: "الدمام",
      Makkah: "مكة المكرمة",
      Madinah: "المدينة المنورة",
      NEOM: "نيوم",
      AlUla: "العلا",
      Abha: "أبها",
      Khobar: "الخبر",
      Taif: "الطائف",
      Tabuk: "تبوك",
      Yanbu: "ينبع",
      Jubail: "الجبيل",
      Qiddiya: "القدية",
      Diriyah: "الدرعية",
    },
  },
  en: {
    add: "Add project",
    edit: "Edit project",
    addDescription: "Fill in the project details and save. Fields marked with an asterisk are required.",
    editDescription: "Update the project record. Changes are persisted immediately.",
    save: "Save project",
    saving: "Saving…",
    saved: "Saved",
    cancel: "Cancel",
    close: "Close",
    identity: "Project identity",
    location: "Location",
    client: "Client",
    financials: "Financials",
    schedule: "Schedule",
    media: "Media",
    visibility: "Visibility",
    titleAr: "Project name (Arabic)",
    titleEn: "Project name (English)",
    category: "Category",
    status: "Status",
    year: "Delivery year",
    city: "City",
    districtAr: "District (Arabic)",
    districtEn: "District (English)",
    clientAr: "Client (Arabic)",
    clientEn: "Client (English)",
    contact: "Contact",
    contactHint: "Optional phone or email for the project contact.",
    contractValue: "Contract value",
    budget: "Budget (planned cost)",
    spent: "Spent to date",
    financialHint: "Values are shown in SAR with thousand separators.",
    margin: "Projected margin",
    health: "Budget health",
    startDate: "Start date",
    endDate: "End date",
    progress: "Progress",
    progressHint: "Drag or type a number between 0 and 100.",
    images: "Project images",
    imagesHint: "The first image is the cover. Drag to reorder.",
    published: "Show on public website",
    publishedHint: "When off, the project stays in the admin workspace only.",
    required: "This field is required.",
    invalidYear: "Enter a valid year.",
    invalidNumber: "Enter a valid number.",
    invalidDate: "Enter a valid date.",
    draftReady: "A saved draft is available for this project.",
    restore: "Restore draft",
    dismiss: "Dismiss",
    discardTitle: "Discard changes?",
    discardBody: "You have unsaved changes. Closing now will lose them.",
    discard: "Discard and close",
    keepEditing: "Keep editing",
    savedToast: "Project saved",
    view: "View",
    categories: {
      commercial: "Commercial",
      residential: "Residential",
      infrastructure: "Infrastructure",
      industrial: "Industrial",
    },
    statuses: {
      completed: "Completed",
      ongoing: "Ongoing",
      upcoming: "Upcoming",
    },
    healthLabels: {
      no_data: "No data",
      on_track: "On track",
      watch: "Watch",
      over: "Spending ahead of progress",
      saved: "Within budget",
      overrun: "Over budget",
    },
    cities: {
      Riyadh: "Riyadh",
      Jeddah: "Jeddah",
      Dammam: "Dammam",
      Makkah: "Makkah",
      Madinah: "Madinah",
      NEOM: "NEOM",
      AlUla: "AlUla",
      Abha: "Abha",
      Khobar: "Khobar",
      Taif: "Taif",
      Tabuk: "Tabuk",
      Yanbu: "Yanbu",
      Jubail: "Jubail",
      Qiddiya: "Qiddiya",
      Diriyah: "Diriyah",
    },
  },
} as const;

const CITY_VALUES = Object.keys(copy.en.cities) as Array<keyof typeof copy.en.cities>;

const formSchema = (c: (typeof copy)["ar"] | (typeof copy)["en"]) =>
  z.object({
    titleAr: z.string().trim().min(1, c.required),
    titleEn: z.string().trim().min(1, c.required),
    category: z.enum(["commercial", "residential", "infrastructure", "industrial"]),
    status: z.enum(["completed", "ongoing", "upcoming"]),
    year: z
      .string()
      .trim()
      .refine((value) => !value || /^\d{4}$/.test(value), c.invalidYear),
    city: z.string(),
    districtAr: z.string(),
    districtEn: z.string(),
    clientAr: z.string(),
    clientEn: z.string(),
    contact: z.string(),
    contractValue: z.number().min(0, c.invalidNumber),
    budget: z.number().min(0, c.invalidNumber),
    spent: z.number().min(0, c.invalidNumber),
    startDate: z
      .string()
      .refine((value) => !value || !Number.isNaN(Date.parse(value)), c.invalidDate),
    endDate: z
      .string()
      .refine((value) => !value || !Number.isNaN(Date.parse(value)), c.invalidDate),
    progress: z.number().min(0, c.invalidNumber).max(100, c.invalidNumber),
    coverUrl: z.string(),
    thumbUrl: z.string(),
    blurDataURL: z.string(),
    gallery: z.array(z.string()),
    published: z.boolean(),
    featured: z.boolean(),
  });

type FormValues = z.infer<ReturnType<typeof formSchema>>;

function initialValues(project: WorkspaceProject | null): FormValues {
  return {
    titleAr: project?.title.ar ?? "",
    titleEn: project?.title.en ?? "",
    category: project?.category ?? "commercial",
    status: project?.status ?? "ongoing",
    year: project?.year ?? String(new Date().getFullYear()),
    city: project?.city ?? "",
    districtAr: project?.districtAr ?? project?.district ?? "",
    districtEn: project?.districtEn ?? project?.district ?? "",
    clientAr: project?.client.ar ?? "",
    clientEn: project?.client.en ?? "",
    contact: project?.contact ?? "",
    contractValue: project?.contractValue ?? 500,
    budget: project?.budget ?? 500,
    spent: project?.spent ?? 100,
    startDate: project?.startDate ?? "",
    endDate: project?.endDate ?? "",
    progress: project?.progress ?? 20,
    coverUrl: project?.coverUrl ?? "",
    thumbUrl: project?.thumbUrl ?? "",
    blurDataURL: project?.blurDataURL ?? "",
    gallery: project?.gallery.length ? project.gallery : project?.coverUrl ? [project.coverUrl] : [],
    published: project?.published !== false,
    featured: Boolean(project?.featured),
  };
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function cityLabel(city: string, locale: "ar" | "en") {
  const map = copy[locale].cities as Record<string, string>;
  return map[city] ?? city;
}

function SectionCard({
  id,
  title,
  open,
  onToggle,
  children,
}: {
  id: string;
  title: string;
  open: boolean;
  onToggle: (id: string) => void;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-white/[.07] bg-white/[.025]">
      <button
        type="button"
        onClick={() => onToggle(id)}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-3 rounded-2xl px-4 py-3.5 text-start md:pointer-events-none md:px-5"
      >
        <h3 className="text-[15px] font-semibold text-[var(--admin-text,#F1EEE8)]">{title}</h3>
        <ChevronDown
          className={cn(
            "h-4 w-4 shrink-0 text-white/35 transition-transform md:hidden",
            open && "rotate-180",
          )}
          aria-hidden="true"
        />
      </button>
      <div className={cn("px-4 pb-4 md:block md:px-5 md:pb-5", !open && "hidden")}>
        {children}
      </div>
    </section>
  );
}

function ProjectForm({
  project,
  existingSlugs,
  onSaved,
  onClose,
  onDirtyChange,
  formId,
}: {
  project: WorkspaceProject | null;
  existingSlugs: string[];
  onSaved: (project: WorkspaceProject) => void;
  onClose: () => void;
  onDirtyChange: (dirty: boolean) => void;
  formId: string;
}) {
  const { locale } = useI18n();
  const c = copy[locale];
  const schema = useMemo(() => formSchema(c), [c]);
  const draftKey = `alattar:project-draft:${project?.slug ?? "new"}`;
  const [draft, setDraft] = useState<{ values: FormValues; savedAt: number } | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    identity: true,
    location: false,
    client: false,
    financials: false,
    schedule: false,
    media: false,
    visibility: false,
  });
  const closeTimer = useRef<number | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    getValues,
    reset,
    setFocus,
    formState: { errors, isDirty },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: initialValues(project),
    mode: "onBlur",
  });

  // React Compiler cannot memoize react-hook-form's watch() safely, but this
  // form relies on live values for its financial and progress previews.
  // eslint-disable-next-line react-hooks/incompatible-library
  const values = watch();
  const progress = values.progress ?? 0;
  const metrics = useMemo(
    () => ({
      id: project?.slug ?? "preview",
      nameEn: values.titleEn || "Preview",
      nameAr: values.titleAr || undefined,
      city: values.city,
      category: values.category,
      status: values.status,
      progress,
      value: values.contractValue,
      budget: values.budget,
      spent: values.spent,
      profit: values.contractValue - values.budget,
    }),
    [
      progress,
      project?.slug,
      values.budget,
      values.category,
      values.city,
      values.contractValue,
      values.spent,
      values.status,
      values.titleAr,
      values.titleEn,
    ],
  );
  const health = getBudgetHealth(metrics);
  const margin = values.contractValue - values.budget;

  useEffect(() => {
    onDirtyChange(isDirty);
  }, [isDirty, onDirtyChange]);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(draftKey);
      if (!raw) return;
      const parsed = JSON.parse(raw) as { values?: FormValues; savedAt?: number };
      if (parsed?.values && typeof parsed.savedAt === "number") {
        setDraft({ values: parsed.values, savedAt: parsed.savedAt });
      }
    } catch {
      // Ignore corrupt drafts.
    }
  }, [draftKey]);

  useEffect(() => {
    if (!isDirty) return;
    const timer = window.setInterval(() => {
      try {
        window.localStorage.setItem(
          draftKey,
          JSON.stringify({ values: getValues(), savedAt: Date.now() }),
        );
      } catch {
        // Storage can be unavailable in private windows.
      }
    }, 2000);
    return () => window.clearInterval(timer);
  }, [draftKey, getValues, isDirty]);

  useEffect(() => {
    return () => {
      if (closeTimer.current) window.clearTimeout(closeTimer.current);
    };
  }, []);

  const onInvalid = (formErrors: typeof errors) => {
    const first = Object.keys(formErrors)[0];
    if (!first) return;
    const element = document.getElementById(`project-field-${first}`);
    element?.scrollIntoView({ behavior: "smooth", block: "center" });
    window.setTimeout(() => element?.focus(), 120);
    setFocus(first as keyof FormValues);
  };

  const onSubmit = async (data: FormValues) => {
    setSaving(true);
    setSaved(false);
    await new Promise((resolve) => window.setTimeout(resolve, 420));

    const baseSlug = slugify(data.titleEn) || `project-${Date.now().toString(36)}`;
    let slug = project?.slug ?? baseSlug;
    if (!project && existingSlugs.includes(slug)) {
      slug = `${baseSlug}-${Date.now().toString(36).slice(-4)}`;
    }

    const gallery = data.gallery.length
      ? data.gallery
      : data.coverUrl
        ? [data.coverUrl]
        : [];
    const coverUrl = data.coverUrl || gallery[0] || undefined;
    const art = project?.art ?? "tower";
    const artGallery = project?.artGallery.length ? project.artGallery : [art];
    const city = data.city.trim();
    const district = data.districtEn.trim() || data.districtAr.trim();
    const locationEn =
      [city, data.districtEn].filter(Boolean).join(" — ") || project?.location.en || "";
    const locationAr =
      [city ? cityLabel(city, "ar") : "", data.districtAr].filter(Boolean).join(" — ") ||
      project?.location.ar ||
      "";

    const next: WorkspaceProject = {
      slug,
      title: L(data.titleAr, data.titleEn),
      category: data.category as ProjectCategory,
      status: data.status as ProjectStatus,
      location: L(locationAr, locationEn),
      city,
      district,
      ...(data.districtAr.trim() ? { districtAr: data.districtAr.trim() } : {}),
      ...(data.districtEn.trim() ? { districtEn: data.districtEn.trim() } : {}),
      year: data.year.trim(),
      client: L(data.clientAr, data.clientEn),
      ...(data.contact.trim() ? { contact: data.contact.trim() } : {}),
      area: project?.area ?? L("", ""),
      value:
        project?.value ??
        L(
          formatSAR(data.contractValue, "ar"),
          formatSAR(data.contractValue, "en"),
        ),
      summary: project?.summary ?? L("", ""),
      description: project?.description ?? L("", ""),
      scope: project?.scope ?? [],
      highlights: project?.highlights ?? [],
      art,
      artGallery,
      featured: data.featured,
      published: data.published,
      ...(project?.archivedAt ? { archivedAt: project.archivedAt } : {}),
      coverUrl,
      ...(data.thumbUrl ? { thumbUrl: data.thumbUrl } : {}),
      ...(data.blurDataURL ? { blurDataURL: data.blurDataURL } : {}),
      gallery,
      updatedAt: new Date().toISOString(),
      progress: Math.max(0, Math.min(100, Number(data.progress) || 0)),
      budget: Math.max(0, Number(data.budget) || 0),
      spent: Math.max(0, Number(data.spent) || 0),
      profit: Math.max(0, Number(data.contractValue) - Number(data.budget)),
      contractValue: Math.max(0, Number(data.contractValue) || 0),
      ...(data.startDate ? { startDate: data.startDate } : {}),
      ...(data.endDate ? { endDate: data.endDate } : {}),
      milestones: project?.milestones ?? [],
      documents: project?.documents ?? [],
      invoices: project?.invoices ?? [],
      phase: project?.phase ?? L("التخطيط", "Planning"),
      manager: project?.manager ?? L("فريق المشاريع", "Project team"),
      lastUpdate: project?.lastUpdate ?? L("", ""),
      nextMilestone: project?.nextMilestone ?? L("", ""),
    };

    try {
      window.localStorage.removeItem(draftKey);
    } catch {
      // Ignore.
    }
    setDraft(null);
    onDirtyChange(false);
    onSaved(next);
    setSaved(true);
    setSaving(false);

    toast.success(c.savedToast, {
      action: {
        label: c.view,
        onClick: () => window.open(`/projects/${encodeURIComponent(next.slug)}`, "_blank", "noopener,noreferrer"),
      },
    });

    closeTimer.current = window.setTimeout(onClose, 650);
  };

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
        event.preventDefault();
        void handleSubmit(onSubmit, onInvalid)();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  });

  const toggleSection = (id: string) => {
    setOpenSections((current) => ({ ...current, [id]: !current[id] }));
  };

  const setNumber = (key: keyof FormValues, value: number) => {
    setValue(key, value, { shouldDirty: true, shouldValidate: true });
  };

  const mediaValue: ImageUploadValue = {
    gallery: values.gallery ?? [],
    coverUrl: values.coverUrl || undefined,
    thumbUrl: values.thumbUrl || undefined,
    blurDataURL: values.blurDataURL || undefined,
  };

  const activeCity = values.city;
  const cityOptions = useMemo(() => {
    const map = copy[locale].cities as Record<string, string>;
    const options: Array<{ value: string; label: string }> = CITY_VALUES.map((value) => ({
      value,
      label: map[value] ?? value,
    }));
    if (activeCity && !options.some((option) => option.value === activeCity)) {
      options.unshift({ value: activeCity, label: activeCity });
    }
    return options;
  }, [activeCity, locale]);

  return (
    <form
      id={formId}
      noValidate
      onSubmit={handleSubmit(onSubmit, onInvalid)}
      className="flex min-h-0 flex-1 flex-col"
    >
      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto overscroll-contain px-4 py-4 [scrollbar-width:thin] sm:px-6 sm:py-5">
        {draft ? (
          <div className="flex flex-wrap items-center gap-3 rounded-xl border border-[#E2B04A]/25 bg-[#E2B04A]/[.06] px-4 py-3 text-[13px] text-[#F3C86A]">
            <RotateCcw className="h-4 w-4 shrink-0" aria-hidden="true" />
            <p className="min-w-0 flex-1">{c.draftReady}</p>
            <button
              type="button"
              onClick={() => {
                reset(draft.values);
                onDirtyChange(true);
                setDraft(null);
              }}
              className="rounded-lg bg-[#E2B04A]/15 px-3 py-1.5 font-semibold text-[#F3C86A]"
            >
              {c.restore}
            </button>
            <button
              type="button"
              onClick={() => {
                setDraft(null);
                try {
                  window.localStorage.removeItem(draftKey);
                } catch {
                  // Ignore.
                }
              }}
              className="rounded-lg px-2 py-1.5 text-white/45 hover:text-white/75"
            >
              {c.dismiss}
            </button>
          </div>
        ) : null}

        <SectionCard id="identity" title={c.identity} open={openSections.identity} onToggle={toggleSection}>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={c.titleAr} htmlFor="project-field-titleAr" required error={errors.titleAr?.message}>
              <Input
                id="project-field-titleAr"
                dir="rtl"
                autoComplete="off"
                aria-invalid={Boolean(errors.titleAr)}
                {...register("titleAr")}
              />
            </Field>
            <Field label={c.titleEn} htmlFor="project-field-titleEn" required error={errors.titleEn?.message}>
              <Input
                id="project-field-titleEn"
                dir="ltr"
                autoComplete="off"
                aria-invalid={Boolean(errors.titleEn)}
                {...register("titleEn")}
              />
            </Field>
            <Field label={c.category} htmlFor="project-field-category" error={errors.category?.message}>
              <Select
                id="project-field-category"
                value={values.category}
                onValueChange={(value) => setValue("category", value as FormValues["category"], { shouldDirty: true, shouldValidate: true })}
                options={(Object.keys(c.categories) as ProjectCategory[]).map((value) => ({
                  value,
                  label: c.categories[value],
                }))}
              />
            </Field>
            <Field label={c.year} htmlFor="project-field-year" error={errors.year?.message}>
              <Input
                id="project-field-year"
                inputMode="numeric"
                placeholder="2026"
                aria-invalid={Boolean(errors.year)}
                {...register("year")}
              />
            </Field>
            <Field label={c.status} htmlFor="project-field-status" error={errors.status?.message} className="sm:col-span-2">
              <SegmentedControl
                label={c.status}
                value={values.status}
                onValueChange={(value) => setValue("status", value, { shouldDirty: true, shouldValidate: true })}
                options={(Object.keys(c.statuses) as ProjectStatus[]).map((value) => ({
                  value,
                  label: c.statuses[value],
                }))}
              />
            </Field>
          </div>
        </SectionCard>

        <SectionCard id="location" title={c.location} open={openSections.location} onToggle={toggleSection}>
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label={c.city} htmlFor="project-field-city" error={errors.city?.message}>
              <Select
                id="project-field-city"
                value={values.city}
                onValueChange={(value) => setValue("city", value, { shouldDirty: true, shouldValidate: true })}
                options={cityOptions}
                placeholder={locale === "ar" ? "اختر المدينة" : "Select a city"}
              />
            </Field>
            <Field label={c.districtAr} htmlFor="project-field-districtAr" error={errors.districtAr?.message}>
              <Input
                id="project-field-districtAr"
                dir="rtl"
                aria-invalid={Boolean(errors.districtAr)}
                {...register("districtAr")}
              />
            </Field>
            <Field label={c.districtEn} htmlFor="project-field-districtEn" error={errors.districtEn?.message}>
              <Input
                id="project-field-districtEn"
                dir="ltr"
                aria-invalid={Boolean(errors.districtEn)}
                {...register("districtEn")}
              />
            </Field>
          </div>
          <p className="mt-3 text-[13px] leading-relaxed text-[var(--admin-muted,#A6A9B4)]">
            {locale === "ar"
              ? "يُستخدم اسم المدينة والحي لبناء عنوان المشروع في الموقع العام."
              : "The city and district are composed into the public project location."}
          </p>
        </SectionCard>

        <SectionCard id="client" title={c.client} open={openSections.client} onToggle={toggleSection}>
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label={c.clientAr} htmlFor="project-field-clientAr" error={errors.clientAr?.message}>
              <Input
                id="project-field-clientAr"
                dir="rtl"
                aria-invalid={Boolean(errors.clientAr)}
                {...register("clientAr")}
              />
            </Field>
            <Field label={c.clientEn} htmlFor="project-field-clientEn" error={errors.clientEn?.message}>
              <Input
                id="project-field-clientEn"
                dir="ltr"
                aria-invalid={Boolean(errors.clientEn)}
                {...register("clientEn")}
              />
            </Field>
            <Field label={c.contact} htmlFor="project-field-contact" hint={c.contactHint} error={errors.contact?.message}>
              <Input
                id="project-field-contact"
                inputMode="tel"
                aria-invalid={Boolean(errors.contact)}
                {...register("contact")}
              />
            </Field>
          </div>
        </SectionCard>

        <SectionCard id="financials" title={c.financials} open={openSections.financials} onToggle={toggleSection}>
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label={c.contractValue} htmlFor="project-field-contractValue" error={errors.contractValue?.message}>
              <NumberInput
                id="project-field-contractValue"
                currency
                value={values.contractValue}
                onValueChange={(value) => setNumber("contractValue", value)}
              />
            </Field>
            <Field label={c.budget} htmlFor="project-field-budget" error={errors.budget?.message}>
              <NumberInput
                id="project-field-budget"
                currency
                value={values.budget}
                onValueChange={(value) => setNumber("budget", value)}
              />
            </Field>
            <Field label={c.spent} htmlFor="project-field-spent" error={errors.spent?.message}>
              <NumberInput
                id="project-field-spent"
                currency
                value={values.spent}
                onValueChange={(value) => setNumber("spent", value)}
              />
            </Field>
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <span
              title={budgetHealthCopy(health, locale).tooltip}
              className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border border-[#E2B04A]/25 bg-[#E2B04A]/10 px-3 py-1.5 text-[13px] font-medium text-[#F3C86A]"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-[#F3C86A]" aria-hidden="true" />
              {c.health}: {budgetHealthCopy(health, locale).short}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[.03] px-3 py-1.5 text-[13px] text-white/65">
              {c.margin}: <strong className="font-semibold tabular-nums text-white/85">{formatSAR(margin, locale)}</strong>
            </span>
          </div>
          <p className="mt-2 text-[13px] leading-relaxed text-[var(--admin-muted,#A6A9B4)]">{c.financialHint}</p>
        </SectionCard>

        <SectionCard id="schedule" title={c.schedule} open={openSections.schedule} onToggle={toggleSection}>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={c.startDate} htmlFor="project-field-startDate" error={errors.startDate?.message}>
              <DatePicker id="project-field-startDate" aria-invalid={Boolean(errors.startDate)} {...register("startDate")} />
            </Field>
            <Field label={c.endDate} htmlFor="project-field-endDate" error={errors.endDate?.message}>
              <DatePicker id="project-field-endDate" aria-invalid={Boolean(errors.endDate)} {...register("endDate")} />
            </Field>
          </div>
          <div className="mt-4">
            <Field label={c.progress} htmlFor="project-field-progress" hint={c.progressHint} error={errors.progress?.message}>
              <div className="flex items-center gap-4">
                <Slider
                  value={progress}
                  onValueChange={(value) => setNumber("progress", value)}
                  label={c.progress}
                  className="flex-1"
                />
                <Input
                  id="project-field-progress"
                  type="number"
                  min={0}
                  max={100}
                  value={progress}
                  onChange={(event) => setNumber("progress", Number(event.target.value))}
                  className="w-24 text-center tabular-nums"
                  aria-invalid={Boolean(errors.progress)}
                />
                <span className="text-[14px] text-white/45">%</span>
              </div>
            </Field>
          </div>
        </SectionCard>

        <SectionCard id="media" title={c.media} open={openSections.media} onToggle={toggleSection}>
          <div className="mb-4 flex items-center gap-3">
            <ProjectImage
              project={{
                title: L(values.titleAr, values.titleEn || values.titleAr || "Preview"),
                category: values.category,
                art: project?.art ?? "tower",
                coverUrl: values.coverUrl || undefined,
                thumbUrl: values.thumbUrl || undefined,
                blurDataURL: values.blurDataURL || undefined,
              }}
              variant="thumb"
              sizes="64px"
              className="h-12 w-16 shrink-0 rounded-xl border border-white/10"
            />
            <div>
              <p className="text-[14px] font-medium text-[var(--admin-text,#F1EEE8)]">{c.images}</p>
              <p className="mt-0.5 text-[13px] text-[var(--admin-muted,#A6A9B4)]">{c.imagesHint}</p>
            </div>
          </div>
          <ImageUpload
            value={mediaValue}
            titleAr={values.titleAr}
            titleEn={values.titleEn}
            category={values.category}
            art={project?.art ?? "tower"}
            onChange={(next) => {
              setValue("gallery", next.gallery, { shouldDirty: true });
              setValue("coverUrl", next.coverUrl ?? "", { shouldDirty: true });
              setValue("thumbUrl", next.thumbUrl ?? "", { shouldDirty: true });
              setValue("blurDataURL", next.blurDataURL ?? "", { shouldDirty: true });
            }}
          />
          {galleryLength(values.gallery) === 0 ? (
            <div className="mt-3 flex items-start gap-2 rounded-xl border border-white/10 bg-white/[.03] px-3.5 py-3 text-[13px] text-white/50">
              <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              {locale === "ar"
                ? "لا توجد صور بعد. سيستخدم الموقع الغلاف التجاري الافتراضي حتى ترفع صورة."
                : "No images yet. The public site will use the branded category fallback until you upload one."}
            </div>
          ) : null}
        </SectionCard>

        <SectionCard id="visibility" title={c.visibility} open={openSections.visibility} onToggle={toggleSection}>
          <Switch
            id="project-field-published"
            checked={values.published}
            onCheckedChange={(checked) => setValue("published", checked, { shouldDirty: true })}
            label={c.published}
            description={c.publishedHint}
          />
        </SectionCard>
      </div>

      <div className="shrink-0 border-t border-white/[.08] bg-[#101218]/85 px-4 py-4 backdrop-blur sm:px-6">
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button variant="ghost" onClick={onClose} disabled={saving} className="sm:min-w-[104px]">
            {c.cancel}
          </Button>
          <Button type="submit" variant="primary" disabled={saving} className="sm:min-w-[152px]">
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : saved ? (
              <Check className="h-4 w-4" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            {saving ? c.saving : saved ? c.saved : c.save}
          </Button>
        </div>
      </div>
    </form>
  );
}

function galleryLength(value: string[] | undefined) {
  return Array.isArray(value) ? value.length : 0;
}

export function AdminProjectEditor({
  project,
  existingSlugs,
  onClose,
  onSave,
}: {
  project: WorkspaceProject | null;
  existingSlugs: string[];
  onClose: () => void;
  onSave: (project: WorkspaceProject) => void;
}) {
  const { locale } = useI18n();
  const c = copy[locale];
  const [dirty, setDirty] = useState(false);
  const [discardOpen, setDiscardOpen] = useState(false);
  const formId = useId().replace(/[:]/g, "");

  const requestClose = useCallback(() => {
    if (dirty) {
      setDiscardOpen(true);
      return;
    }
    onClose();
  }, [dirty, onClose]);

  const content = (
    <ProjectForm
      project={project}
      existingSlugs={existingSlugs}
      onSaved={onSave}
      onClose={onClose}
      onDirtyChange={setDirty}
      formId={formId}
    />
  );

  const discard = (
    <ConfirmDialog
      open={discardOpen}
      onOpenChange={setDiscardOpen}
      title={c.discardTitle}
      description={c.discardBody}
      confirmLabel={c.discard}
      cancelLabel={c.keepEditing}
      destructive
      onConfirm={() => {
        setDiscardOpen(false);
        onClose();
      }}
    />
  );

  if (project) {
    return (
      <>
        <Drawer
          open
          onOpenChange={(open) => {
            if (!open) requestClose();
          }}
          title={c.edit}
          description={c.editDescription}
          closeLabel={c.close}
          bodyClassName="flex min-h-0 flex-1 flex-col overflow-hidden p-0"
        >
          {content}
        </Drawer>
        {discard}
      </>
    );
  }

  return (
    <>
      <Modal
        open
        onOpenChange={(open) => {
          if (!open) requestClose();
        }}
        title={c.add}
        description={c.addDescription}
        closeLabel={c.close}
        bodyClassName="flex min-h-0 flex-1 flex-col overflow-hidden p-0"
      >
        {content}
      </Modal>
      {discard}
    </>
  );
}

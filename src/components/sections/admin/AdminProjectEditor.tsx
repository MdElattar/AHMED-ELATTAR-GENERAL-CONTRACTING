"use client";

import { useMemo, useState } from "react";
import { X } from "lucide-react";
import { useI18n } from "@/components/providers/I18nProvider";
import type { WorkspaceProject } from "@/components/providers/WorkspaceProvider";
import { Field, Select, TextInput, Textarea } from "@/components/ui/Field";
import type { ArtVariant, ProjectCategory, ProjectStatus } from "@/data/projects";
import { L } from "@/lib/dictionary";
import { cn } from "@/lib/utils";

const copy = {
  ar: {
    add: "إضافة مشروع",
    edit: "تعديل المشروع",
    close: "إغلاق",
    save: "حفظ المشروع",
    cancel: "إلغاء",
    identity: "هوية المشروع",
    titleAr: "الاسم (عربي)",
    titleEn: "الاسم (إنجليزي)",
    category: "الفئة",
    status: "الحالة",
    progress: "نسبة الإنجاز",
    year: "السنة",
    art: "نمط الغلاف",
    gallery: "معرض الصور",
    featured: "إبراز في الصفحة الرئيسية",
    location: "الموقع",
    locationAr: "الموقع (عربي)",
    locationEn: "الموقع (إنجليزي)",
    client: "العميل",
    clientAr: "العميل (عربي)",
    clientEn: "العميل (إنجليزي)",
    area: "المساحة",
    areaAr: "المساحة (عربي)",
    areaEn: "المساحة (إنجليزي)",
    value: "قيمة العقد",
    valueAr: "القيمة (عربي)",
    valueEn: "القيمة (إنجليزي)",
    summary: "الوصف المختصر",
    summaryAr: "الوصف المختصر (عربي)",
    summaryEn: "الوصف المختصر (إنجليزي)",
    description: "التفاصيل الهندسية",
    descriptionAr: "التفاصيل الهندسية (عربي)",
    descriptionEn: "التفاصيل الهندسية (إنجليزي)",
    financials: "المالية",
    budget: "الميزانية (مليون ر.س)",
    spent: "المنفق (مليون ر.س)",
    profit: "صافي الربح (مليون ر.س)",
    contractValue: "قيمة العقد (مليون ر.س)",
    required: "هذا الحقل مطلوب.",
    categories: {
      commercial: "تجاري",
      residential: "سكني",
      infrastructure: "بنية تحتية",
      industrial: "صناعي",
    },
    statuses: {
      completed: "مكتمل",
      ongoing: "قيد التنفيذ",
      upcoming: "قادم",
    },
    arts: {
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
    add: "Add project",
    edit: "Edit project",
    close: "Close",
    save: "Save project",
    cancel: "Cancel",
    identity: "Project identity",
    titleAr: "Title (Arabic)",
    titleEn: "Title (English)",
    category: "Category",
    status: "Status",
    progress: "Progress",
    year: "Year",
    art: "Cover art",
    gallery: "Gallery",
    featured: "Feature on homepage",
    location: "Location",
    locationAr: "Location (Arabic)",
    locationEn: "Location (English)",
    client: "Client",
    clientAr: "Client (Arabic)",
    clientEn: "Client (English)",
    area: "Area",
    areaAr: "Area (Arabic)",
    areaEn: "Area (English)",
    value: "Contract value",
    valueAr: "Value (Arabic)",
    valueEn: "Value (English)",
    summary: "Short summary",
    summaryAr: "Summary (Arabic)",
    summaryEn: "Summary (English)",
    description: "Engineering details",
    descriptionAr: "Details (Arabic)",
    descriptionEn: "Details (English)",
    financials: "Financials",
    budget: "Budget (SAR million)",
    spent: "Spent (SAR million)",
    profit: "Net profit (SAR million)",
    contractValue: "Contract value (SAR million)",
    required: "This field is required.",
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
    arts: {
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

type FormState = {
  titleAr: string;
  titleEn: string;
  category: ProjectCategory;
  status: ProjectStatus;
  progress: number;
  year: string;
  locationAr: string;
  locationEn: string;
  clientAr: string;
  clientEn: string;
  areaAr: string;
  areaEn: string;
  valueAr: string;
  valueEn: string;
  summaryAr: string;
  summaryEn: string;
  descriptionAr: string;
  descriptionEn: string;
  budget: number;
  spent: number;
  profit: number;
  contractValue: number;
  featured: boolean;
  art: ArtVariant;
  gallery: ArtVariant[];
};

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function initialForm(project: WorkspaceProject | null): FormState {
  if (!project) {
    return {
      titleAr: "",
      titleEn: "",
      category: "commercial",
      status: "ongoing",
      progress: 20,
      year: "2026",
      locationAr: "",
      locationEn: "",
      clientAr: "",
      clientEn: "",
      areaAr: "",
      areaEn: "",
      valueAr: "",
      valueEn: "",
      summaryAr: "",
      summaryEn: "",
      descriptionAr: "",
      descriptionEn: "",
      budget: 500,
      spent: 100,
      profit: 80,
      contractValue: 500,
      featured: false,
      art: "tower",
      gallery: ["tower"],
    };
  }
  return {
    titleAr: project.title.ar,
    titleEn: project.title.en,
    category: project.category,
    status: project.status,
    progress: project.progress,
    year: project.year,
    locationAr: project.location.ar,
    locationEn: project.location.en,
    clientAr: project.client.ar,
    clientEn: project.client.en,
    areaAr: project.area.ar,
    areaEn: project.area.en,
    valueAr: project.value.ar,
    valueEn: project.value.en,
    summaryAr: project.summary.ar,
    summaryEn: project.summary.en,
    descriptionAr: project.description.ar,
    descriptionEn: project.description.en,
    budget: project.budget,
    spent: project.spent,
    profit: project.profit,
    contractValue: project.contractValue,
    featured: Boolean(project.featured),
    art: project.art,
    gallery: project.gallery.length ? project.gallery : [project.art],
  };
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
  const [form, setForm] = useState<FormState>(() => initialForm(project));
  const [error, setError] = useState("");

  const title = useMemo(() => (project ? c.edit : c.add), [c.add, c.edit, project]);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const toggleGallery = (variant: ArtVariant) => {
    setForm((current) => ({
      ...current,
      gallery: current.gallery.includes(variant)
        ? current.gallery.filter((item) => item !== variant)
        : [...current.gallery, variant],
    }));
  };

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!form.titleAr.trim() || !form.titleEn.trim()) {
      setError(c.required);
      return;
    }
    const baseSlug = slugify(form.titleEn) || `project-${Date.now().toString(36)}`;
    let slug = project?.slug ?? baseSlug;
    if (!project && existingSlugs.includes(slug)) {
      slug = `${baseSlug}-${Date.now().toString(36).slice(-4)}`;
    }
    const gallery = form.gallery.length ? form.gallery : [form.art];
    const next: WorkspaceProject = {
      slug,
      title: L(form.titleAr, form.titleEn),
      category: form.category,
      status: form.status,
      location: L(form.locationAr, form.locationEn),
      year: form.year,
      client: L(form.clientAr, form.clientEn),
      area: L(form.areaAr, form.areaEn),
      value: L(form.valueAr, form.valueEn),
      summary: L(form.summaryAr, form.summaryEn),
      description: L(form.descriptionAr, form.descriptionEn),
      scope: project?.scope ?? [
        L("إدارة المشروع والتنسيق", "Project management and coordination"),
      ],
      highlights: project?.highlights ?? [],
      art: form.art,
      featured: form.featured,
      progress: Math.max(0, Math.min(100, Number(form.progress) || 0)),
      budget: Math.max(0, Number(form.budget) || 0),
      spent: Math.max(0, Number(form.spent) || 0),
      profit: Math.max(0, Number(form.profit) || 0),
      contractValue: Math.max(0, Number(form.contractValue) || 0),
      updatedAt: new Date().toISOString().slice(0, 10),
      gallery,
    };
    onSave(next);
  };

  return (
    <div className="fixed inset-0 z-[220] flex items-start justify-center overflow-y-auto bg-obsidian/80 p-3 backdrop-blur-md sm:p-6">
      <form
        onSubmit={submit}
        className="relative my-4 w-full max-w-4xl border border-white/12 bg-coal text-ivory shadow-[0_40px_120px_-30px_rgba(0,0,0,0.9)]"
      >
        <div className="sticky top-0 z-10 flex items-center justify-between gap-4 border-b border-white/10 bg-coal/95 px-5 py-4 backdrop-blur sm:px-7">
          <div>
            <span className="text-[0.52rem] uppercase tracking-[0.18em] text-gold">Admin</span>
            <h2 className="mt-1 font-display text-2xl leading-none text-ivory">{title}</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center border border-white/12 text-ivory/50 transition-colors hover:border-gold/50 hover:text-gold"
            aria-label={c.close}
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-7 p-5 sm:p-7">
          <div>
            <p className="mb-4 text-[0.55rem] font-semibold uppercase tracking-[0.16em] text-gold/80">
              {c.identity}
            </p>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label={c.titleAr} htmlFor="admin-title-ar" required>
                <TextInput
                  id="admin-title-ar"
                  value={form.titleAr}
                  onChange={(event) => set("titleAr", event.target.value)}
                  dir="rtl"
                />
              </Field>
              <Field label={c.titleEn} htmlFor="admin-title-en" required>
                <TextInput
                  id="admin-title-en"
                  value={form.titleEn}
                  onChange={(event) => set("titleEn", event.target.value)}
                />
              </Field>
              <Field label={c.category} htmlFor="admin-category">
                <Select
                  id="admin-category"
                  value={form.category}
                  onChange={(event) => set("category", event.target.value as ProjectCategory)}
                  options={(Object.keys(c.categories) as ProjectCategory[]).map((key) => ({
                    value: key,
                    label: c.categories[key],
                  }))}
                />
              </Field>
              <Field label={c.status} htmlFor="admin-status">
                <Select
                  id="admin-status"
                  value={form.status}
                  onChange={(event) => set("status", event.target.value as ProjectStatus)}
                  options={(Object.keys(c.statuses) as ProjectStatus[]).map((key) => ({
                    value: key,
                    label: c.statuses[key],
                  }))}
                />
              </Field>
              <Field label={c.progress} htmlFor="admin-progress">
                <div className="flex items-center gap-3">
                  <input
                    id="admin-progress"
                    type="range"
                    min={0}
                    max={100}
                    value={form.progress}
                    onChange={(event) => set("progress", Number(event.target.value))}
                    className="h-1.5 flex-1 cursor-pointer appearance-none rounded-full bg-white/10 accent-gold"
                  />
                  <span className="tabular w-10 text-end text-sm text-ivory/70">
                    {form.progress}%
                  </span>
                </div>
              </Field>
              <Field label={c.year} htmlFor="admin-year">
                <TextInput
                  id="admin-year"
                  value={form.year}
                  onChange={(event) => set("year", event.target.value)}
                />
              </Field>
            </div>
          </div>

          <div>
            <p className="mb-4 text-[0.55rem] font-semibold uppercase tracking-[0.16em] text-gold/80">
              {c.location} · {c.client} · {c.area} · {c.value}
            </p>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label={c.locationAr} htmlFor="admin-location-ar">
                <TextInput
                  id="admin-location-ar"
                  value={form.locationAr}
                  onChange={(event) => set("locationAr", event.target.value)}
                  dir="rtl"
                />
              </Field>
              <Field label={c.locationEn} htmlFor="admin-location-en">
                <TextInput
                  id="admin-location-en"
                  value={form.locationEn}
                  onChange={(event) => set("locationEn", event.target.value)}
                />
              </Field>
              <Field label={c.clientAr} htmlFor="admin-client-ar">
                <TextInput
                  id="admin-client-ar"
                  value={form.clientAr}
                  onChange={(event) => set("clientAr", event.target.value)}
                  dir="rtl"
                />
              </Field>
              <Field label={c.clientEn} htmlFor="admin-client-en">
                <TextInput
                  id="admin-client-en"
                  value={form.clientEn}
                  onChange={(event) => set("clientEn", event.target.value)}
                />
              </Field>
              <Field label={c.areaAr} htmlFor="admin-area-ar">
                <TextInput
                  id="admin-area-ar"
                  value={form.areaAr}
                  onChange={(event) => set("areaAr", event.target.value)}
                  dir="rtl"
                />
              </Field>
              <Field label={c.areaEn} htmlFor="admin-area-en">
                <TextInput
                  id="admin-area-en"
                  value={form.areaEn}
                  onChange={(event) => set("areaEn", event.target.value)}
                />
              </Field>
              <Field label={c.valueAr} htmlFor="admin-value-ar">
                <TextInput
                  id="admin-value-ar"
                  value={form.valueAr}
                  onChange={(event) => set("valueAr", event.target.value)}
                  dir="rtl"
                />
              </Field>
              <Field label={c.valueEn} htmlFor="admin-value-en">
                <TextInput
                  id="admin-value-en"
                  value={form.valueEn}
                  onChange={(event) => set("valueEn", event.target.value)}
                />
              </Field>
            </div>
          </div>

          <div>
            <p className="mb-4 text-[0.55rem] font-semibold uppercase tracking-[0.16em] text-gold/80">
              {c.summary} · {c.description}
            </p>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label={c.summaryAr} htmlFor="admin-summary-ar">
                <Textarea
                  id="admin-summary-ar"
                  rows={3}
                  value={form.summaryAr}
                  onChange={(event) => set("summaryAr", event.target.value)}
                  dir="rtl"
                />
              </Field>
              <Field label={c.summaryEn} htmlFor="admin-summary-en">
                <Textarea
                  id="admin-summary-en"
                  rows={3}
                  value={form.summaryEn}
                  onChange={(event) => set("summaryEn", event.target.value)}
                />
              </Field>
              <Field label={c.descriptionAr} htmlFor="admin-description-ar">
                <Textarea
                  id="admin-description-ar"
                  rows={5}
                  value={form.descriptionAr}
                  onChange={(event) => set("descriptionAr", event.target.value)}
                  dir="rtl"
                />
              </Field>
              <Field label={c.descriptionEn} htmlFor="admin-description-en">
                <Textarea
                  id="admin-description-en"
                  rows={5}
                  value={form.descriptionEn}
                  onChange={(event) => set("descriptionEn", event.target.value)}
                />
              </Field>
            </div>
          </div>

          <div>
            <p className="mb-4 text-[0.55rem] font-semibold uppercase tracking-[0.16em] text-gold/80">
              {c.financials}
            </p>
            <div className="grid gap-4 sm:grid-cols-4">
              {[
                { label: c.budget, key: "budget" as const },
                { label: c.spent, key: "spent" as const },
                { label: c.profit, key: "profit" as const },
                { label: c.contractValue, key: "contractValue" as const },
              ].map((item) => (
                <Field key={item.key} label={item.label} htmlFor={`admin-${item.key}`}>
                  <TextInput
                    id={`admin-${item.key}`}
                    type="number"
                    min={0}
                    step={1}
                    value={form[item.key]}
                    onChange={(event) => set(item.key, Number(event.target.value))}
                  />
                </Field>
              ))}
            </div>
          </div>

          <div>
            <p className="mb-4 text-[0.55rem] font-semibold uppercase tracking-[0.16em] text-gold/80">
              {c.art} · {c.gallery}
            </p>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {artVariants.map((variant) => (
                <button
                  key={variant}
                  type="button"
                  onClick={() => toggleGallery(variant)}
                  className={cn(
                    "border px-3 py-2 text-[0.6rem] font-medium uppercase tracking-[0.1em] transition-colors",
                    form.gallery.includes(variant)
                      ? "border-gold bg-gold/15 text-gold"
                      : "border-white/10 text-ivory/40 hover:border-gold/40 hover:text-ivory/70",
                  )}
                >
                  {c.arts[variant]}
                </button>
              ))}
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-4">
              <label className="flex items-center gap-2 text-[0.68rem] text-ivory/60">
                <input
                  type="checkbox"
                  checked={form.featured}
                  onChange={(event) => set("featured", event.target.checked)}
                  className="h-3.5 w-3.5 accent-gold"
                />
                {c.featured}
              </label>
              <label className="flex items-center gap-2 text-[0.68rem] text-ivory/60">
                {c.art}
                <select
                  value={form.art}
                  onChange={(event) => set("art", event.target.value as ArtVariant)}
                  className="field h-8 w-36 py-0 text-[0.65rem]"
                >
                  {artVariants.map((variant) => (
                    <option key={variant} value={variant}>
                      {c.arts[variant]}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </div>

          {error ? (
            <p className="border border-red-400/30 bg-red-400/10 px-3 py-2 text-[0.68rem] text-red-300">
              {error}
            </p>
          ) : null}
        </div>

        <div className="sticky bottom-0 flex flex-wrap items-center justify-end gap-3 border-t border-white/10 bg-coal/95 px-5 py-4 backdrop-blur sm:px-7">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-10 items-center border border-white/12 px-4 text-[0.6rem] font-semibold uppercase tracking-[0.14em] text-ivory/50 transition-colors hover:border-white/30 hover:text-ivory"
          >
            {c.cancel}
          </button>
          <button
            type="submit"
            className="inline-flex h-10 items-center bg-gold px-5 text-[0.6rem] font-semibold uppercase tracking-[0.14em] text-obsidian transition-colors hover:bg-gold-light"
          >
            {c.save}
          </button>
        </div>
      </form>
    </div>
  );
}

"use client";

import { useEffect, useRef, useState, type DragEvent } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  FileText,
  ShieldCheck,
  Upload,
  X,
} from "lucide-react";
import { useI18n } from "@/components/providers/I18nProvider";
import { Field, Select, Textarea, TextInput } from "@/components/ui/Field";
import { services } from "@/data/services";
import { isPlainObject } from "@/lib/security/validation";
import { cn } from "@/lib/utils";

type FormState = {
  name: string;
  company: string;
  email: string;
  phone: string;
  service: string;
  projectType: string;
  budget: string;
  location: string;
  timeline: string;
  message: string;
};

const initialForm: FormState = {
  name: "",
  company: "",
  email: "",
  phone: "",
  service: "",
  projectType: "",
  budget: "",
  location: "",
  timeline: "",
  message: "",
};

const MAX_FILE_SIZE = 25 * 1024 * 1024;

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function BidForm() {
  const { t, l, isRTL, locale } = useI18n();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<FormState>(initialForm);
  const [files, setFiles] = useState<File[]>([]);
  const [dragging, setDragging] = useState(false);
  const [consent, setConsent] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [reference, setReference] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const successRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const requested = new URLSearchParams(window.location.search).get("service");
    if (requested && services.some((service) => service.slug === requested)) {
      // Hydration-safe: the query string is only read after mount.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setForm((current) => ({ ...current, service: requested }));
    }
  }, []);

  const update = (key: keyof FormState, value: string) => {
    setForm((current) => ({ ...current, [key]: value }));
    setErrors((current) => {
      if (!current[key]) return current;
      const next = { ...current };
      delete next[key];
      return next;
    });
  };

  const serviceOptions = services.map((service) => ({
    value: service.slug,
    label: l(service.title),
  }));

  const projectTypeOptions = (
    isRTL
      ? ["مبنى تجاري", "مجمع سكني", "بنية تحتية", "منشأة صناعية", "تصميم معماري", "أخرى"]
      : ["Commercial building", "Residential community", "Infrastructure", "Industrial facility", "Architectural design", "Other"]
  ).map((value) => ({ value, label: value }));

  const budgetOptions = t.contactPage.form.budgets.map((value) => ({ value, label: value }));
  const timelineOptions = t.contactPage.form.timelines.map((value) => ({ value, label: value }));

  const validateStep = (target: number) => {
    const next: Record<string, string> = {};

    if (target === 0) {
      if (!form.name.trim()) next.name = t.contactPage.form.requiredError;
      if (!form.email.trim()) {
        next.email = t.contactPage.form.requiredError;
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
        next.email = t.contactPage.form.emailError;
      }
      if (!form.phone.trim()) next.phone = t.contactPage.form.requiredError;
    }

    if (target === 1) {
      if (!form.service) next.service = t.contactPage.form.requiredError;
      if (!form.projectType) next.projectType = t.contactPage.form.requiredError;
      if (!form.location.trim()) next.location = t.contactPage.form.requiredError;
      if (!form.message.trim()) next.message = t.contactPage.form.requiredError;
    }

    if (target === 2) {
      if (!consent) next.consent = t.contactPage.form.consentError;
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const goNext = () => {
    if (validateStep(step)) setStep((current) => Math.min(current + 1, 2));
  };

  const goBack = () => {
    setErrors({});
    setStep((current) => Math.max(current - 1, 0));
  };

  const addFiles = (incoming: FileList | null) => {
    if (!incoming) return;
    const valid = Array.from(incoming).filter((file) => file.size <= MAX_FILE_SIZE);
    setFiles((current) => {
      const merged = [...current];
      valid.forEach((file) => {
        if (!merged.some((item) => item.name === file.name && item.size === file.size)) {
          merged.push(file);
        }
      });
      return merged;
    });
  };

  const onDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragging(false);
    addFiles(event.dataTransfer.files);
  };

  const submit = async () => {
    if (!validateStep(2)) return;

    setSubmitting(true);
    setSubmitError("");

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          consent,
          files: files.map((file) => ({
            name: file.name,
            size: file.size,
            type: file.type,
          })),
        }),
      });

      const data: unknown = await response.json().catch(() => null);
      const code =
        isPlainObject(data) && typeof data.reference === "string" ? data.reference : null;

      if (!response.ok || !code) throw new Error("submit_failed");

      setReference(code);
      window.setTimeout(
        () => successRef.current?.scrollIntoView({ behavior: "smooth", block: "center" }),
        80,
      );
    } catch {
      setSubmitError(
        locale === "ar"
          ? "تعذر إرسال الطلب. تحقق من الاتصال وحاول مرة أخرى."
          : "Could not send the request. Check your connection and try again.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const reset = () => {
    setForm(initialForm);
    setFiles([]);
    setConsent(false);
    setErrors({});
    setSubmitError("");
    setReference(null);
    setStep(0);
  };

  const NextIcon = isRTL ? ArrowLeft : ArrowRight;
  const BackIcon = isRTL ? ArrowRight : ArrowLeft;

  if (reference) {
    return (
      <div
        ref={successRef}
        className="relative flex min-h-[560px] flex-col items-center justify-center border border-ink/10 bg-paper/50 p-8 text-center sm:p-12"
      >
        <span className="flex h-16 w-16 items-center justify-center rounded-full border border-gold-dark/40 bg-ivory text-gold-dark">
          <Check className="h-7 w-7" />
        </span>
        <h3 className="display-title mt-7 text-[clamp(2rem,3.4vw,3rem)] text-ink">
          {t.contactPage.form.successTitle}
        </h3>
        <p className="mt-4 max-w-md text-[0.9rem] leading-relaxed text-ink/55">
          {t.contactPage.form.successText}
        </p>
        <div className="mt-8 border border-ink/12 bg-ivory px-8 py-5">
          <span className="text-[0.55rem] uppercase tracking-[0.18em] text-ink/40">
            {t.contactPage.form.reference}
          </span>
          <p className="mt-2 tabular font-display text-2xl text-gold-dark">{reference}</p>
        </div>
        <button
          type="button"
          onClick={reset}
          className="mt-8 text-[0.62rem] font-semibold uppercase tracking-[0.16em] text-ink/50 underline-offset-4 transition-colors hover:text-gold-dark hover:underline"
        >
          {t.contactPage.form.again}
        </button>
      </div>
    );
  }

  return (
    <form
      className="border border-ink/10 bg-ivory"
      onSubmit={(event) => {
        event.preventDefault();
        if (step < 2) {
          goNext();
        } else {
          submit();
        }
      }}
      noValidate
    >
      <div className="border-b border-ink/10 p-6 sm:p-8">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <h2 className="font-display text-2xl text-ink sm:text-3xl">
              {t.contactPage.form.title}
            </h2>
            <p className="mt-2 max-w-lg text-[0.78rem] leading-relaxed text-ink/45">
              {t.contactPage.form.subtitle}
            </p>
          </div>
          <span className="shrink-0 text-[0.58rem] uppercase tracking-[0.16em] text-ink/40">
            {t.contactPage.form.stepOf}{" "}
            <span className="tabular text-gold-dark">{step + 1}</span> / 3
          </span>
        </div>

        <div className="mt-6 grid grid-cols-3 gap-2">
          {t.contactPage.form.steps.map((label, index) => (
            <div key={label} className="flex flex-col gap-2">
              <span
                className={cn(
                  "h-0.5 w-full transition-colors duration-500",
                  index <= step ? "bg-gold-dark" : "bg-ink/10",
                )}
              />
              <span
                className={cn(
                  "text-[0.55rem] uppercase tracking-[0.12em] transition-colors",
                  index === step ? "text-ink/70" : "text-ink/30",
                )}
              >
                {label}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="p-6 sm:p-8">
        {step === 0 ? (
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label={t.contactPage.form.name} htmlFor="bid-name" required error={errors.name} tone="light">
              <TextInput
                id="bid-name"
                tone="light"
                value={form.name}
                onChange={(event) => update("name", event.target.value)}
                placeholder={t.contactPage.form.namePlaceholder}
                autoComplete="name"
              />
            </Field>
            <Field label={t.contactPage.form.company} htmlFor="bid-company" tone="light">
              <TextInput
                id="bid-company"
                tone="light"
                value={form.company}
                onChange={(event) => update("company", event.target.value)}
                placeholder={t.contactPage.form.companyPlaceholder}
                autoComplete="organization"
              />
            </Field>
            <Field label={t.contactPage.form.email} htmlFor="bid-email" required error={errors.email} tone="light">
              <TextInput
                id="bid-email"
                tone="light"
                type="email"
                dir="ltr"
                className="text-start"
                value={form.email}
                onChange={(event) => update("email", event.target.value)}
                placeholder={t.contactPage.form.emailPlaceholder}
                autoComplete="email"
              />
            </Field>
            <Field label={t.contactPage.form.phone} htmlFor="bid-phone" required error={errors.phone} tone="light">
              <TextInput
                id="bid-phone"
                tone="light"
                type="tel"
                dir="ltr"
                className="text-start"
                value={form.phone}
                onChange={(event) => update("phone", event.target.value)}
                placeholder={t.contactPage.form.phonePlaceholder}
                autoComplete="tel"
              />
            </Field>
          </div>
        ) : null}

        {step === 1 ? (
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label={t.contactPage.form.service} htmlFor="bid-service" required error={errors.service} tone="light">
              <Select
                id="bid-service"
                tone="light"
                value={form.service}
                onChange={(event) => update("service", event.target.value)}
                placeholder={t.contactPage.form.servicePlaceholder}
                options={serviceOptions}
              />
            </Field>
            <Field label={t.contactPage.form.projectType} htmlFor="bid-type" required error={errors.projectType} tone="light">
              <Select
                id="bid-type"
                tone="light"
                value={form.projectType}
                onChange={(event) => update("projectType", event.target.value)}
                placeholder={t.contactPage.form.projectTypePlaceholder}
                options={projectTypeOptions}
              />
            </Field>
            <Field label={t.contactPage.form.budget} htmlFor="bid-budget" tone="light">
              <Select
                id="bid-budget"
                tone="light"
                value={form.budget}
                onChange={(event) => update("budget", event.target.value)}
                placeholder={t.contactPage.form.budgetPlaceholder}
                options={budgetOptions}
              />
            </Field>
            <Field label={t.contactPage.form.timeline} htmlFor="bid-timeline" tone="light">
              <Select
                id="bid-timeline"
                tone="light"
                value={form.timeline}
                onChange={(event) => update("timeline", event.target.value)}
                placeholder={t.contactPage.form.timelinePlaceholder}
                options={timelineOptions}
              />
            </Field>
            <Field label={t.contactPage.form.location} htmlFor="bid-location" required error={errors.location} tone="light">
              <TextInput
                id="bid-location"
                tone="light"
                value={form.location}
                onChange={(event) => update("location", event.target.value)}
                placeholder={t.contactPage.form.locationPlaceholder}
              />
            </Field>
            <Field
              label={t.contactPage.form.message}
              htmlFor="bid-message"
              required
              error={errors.message}
              tone="light"
              className="sm:col-span-2"
            >
              <Textarea
                id="bid-message"
                tone="light"
                rows={5}
                value={form.message}
                onChange={(event) => update("message", event.target.value)}
                placeholder={t.contactPage.form.messagePlaceholder}
              />
            </Field>
          </div>
        ) : null}

        {step === 2 ? (
          <div className="flex flex-col gap-6">
            <div>
              <span className="text-[0.65rem] font-medium uppercase tracking-[0.18em] text-ink/55">
                {t.contactPage.form.files}
              </span>
              <div
                onDragOver={(event) => {
                  event.preventDefault();
                  setDragging(true);
                }}
                onDragLeave={() => setDragging(false)}
                onDrop={onDrop}
                className={cn(
                  "mt-2 flex flex-col items-center justify-center gap-3 border border-dashed px-6 py-10 text-center transition-colors",
                  dragging ? "border-gold-dark bg-gold/5" : "border-ink/20 bg-paper/30",
                )}
              >
                <span className="flex h-11 w-11 items-center justify-center rounded-full border border-ink/15 text-gold-dark">
                  <Upload className="h-4 w-4" />
                </span>
                <button
                  type="button"
                  onClick={() => inputRef.current?.click()}
                  className="text-[0.8rem] font-medium text-ink/70 transition-colors hover:text-gold-dark"
                >
                  {t.contactPage.form.filesHint}
                </button>
                <p className="text-[0.62rem] text-ink/35">{t.contactPage.form.filesTypes}</p>
                <input
                  ref={inputRef}
                  type="file"
                  multiple
                  accept=".pdf,.dwg,.jpg,.jpeg,.png"
                  className="sr-only"
                  onChange={(event) => {
                    addFiles(event.target.files);
                    event.target.value = "";
                  }}
                />
              </div>
            </div>

            {files.length ? (
              <ul className="divide-y divide-ink/10 border border-ink/10">
                {files.map((file, index) => (
                  <li key={`${file.name}-${index}`} className="flex items-center gap-3 px-4 py-3">
                    <FileText className="h-4 w-4 shrink-0 text-gold-dark" />
                    <span className="min-w-0 flex-1 truncate text-[0.75rem] text-ink/65">
                      {file.name}
                    </span>
                    <span className="tabular shrink-0 text-[0.6rem] text-ink/35">
                      {formatBytes(file.size)}
                    </span>
                    <button
                      type="button"
                      onClick={() => setFiles((current) => current.filter((_, item) => item !== index))}
                      aria-label={t.contactPage.form.remove}
                      className="flex h-6 w-6 shrink-0 items-center justify-center text-ink/35 transition-colors hover:text-[#a3543f]"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </li>
                ))}
              </ul>
            ) : null}

            <div className="border border-ink/10 bg-paper/40 p-4">
              <p className="flex items-center gap-2 text-[0.68rem] font-medium uppercase tracking-[0.12em] text-ink/55">
                <ShieldCheck className="h-4 w-4 text-gold-dark" />
                {t.footer.privacy}
              </p>
              <label className="mt-3 flex cursor-pointer items-start gap-3 text-[0.78rem] leading-relaxed text-ink/60">
                <input
                  type="checkbox"
                  checked={consent}
                  onChange={(event) => {
                    setConsent(event.target.checked);
                    setErrors((current) => {
                      const next = { ...current };
                      delete next.consent;
                      return next;
                    });
                  }}
                  className="mt-0.5 h-4 w-4 shrink-0 accent-[#8f6f34]"
                />
                {t.contactPage.form.consent}
              </label>
              {errors.consent ? (
                <p className="mt-2 text-[0.68rem] text-[#a3543f]" role="alert">
                  {errors.consent}
                </p>
              ) : null}
            </div>

            {submitError ? (
              <p
                className="border border-[#a3543f]/25 bg-[#a3543f]/5 px-4 py-3 text-[0.72rem] text-[#a3543f]"
                role="alert"
              >
                {submitError}
              </p>
            ) : null}
          </div>
        ) : null}

        <div className="mt-8 flex items-center justify-between gap-4 border-t border-ink/10 pt-6">
          <button
            type="button"
            onClick={goBack}
            disabled={step === 0}
            className="inline-flex items-center gap-2 text-[0.62rem] font-semibold uppercase tracking-[0.14em] text-ink/45 transition-colors hover:text-ink disabled:pointer-events-none disabled:opacity-30"
          >
            <BackIcon className="h-3.5 w-3.5" />
            {t.contactPage.form.back}
          </button>

          {step < 2 ? (
            <button
              type="button"
              onClick={goNext}
              className="group inline-flex h-11 items-center justify-center gap-2 bg-ink px-6 text-[0.62rem] font-semibold uppercase tracking-[0.14em] text-ivory transition-colors hover:bg-gold-dark"
            >
              {t.contactPage.form.next}
              <NextIcon className="h-3.5 w-3.5" />
            </button>
          ) : (
            <button
              type="submit"
              disabled={submitting}
              className="btn-shine inline-flex h-11 items-center justify-center gap-2 bg-gold px-6 text-[0.62rem] font-semibold uppercase tracking-[0.14em] text-obsidian transition-colors hover:bg-gold-light disabled:cursor-wait disabled:opacity-70"
            >
              {submitting ? t.contactPage.form.submitting : t.contactPage.form.submit}
              {submitting ? null : <Check className="h-3.5 w-3.5" />}
            </button>
          )}
        </div>
      </div>
    </form>
  );
}

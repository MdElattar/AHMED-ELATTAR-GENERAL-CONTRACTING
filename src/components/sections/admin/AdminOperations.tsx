"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Activity,
  AlertCircle,
  BellRing,
  CalendarDays,
  Check,
  Clock,
  FileSignature,
  Flag,
  Loader2,
  Mail,
  Phone,
  Plus,
  RefreshCcw,
  Send,
  ShieldCheck,
  Trash2,
  UserRound,
  X,
} from "lucide-react";
import { useI18n } from "@/components/providers/I18nProvider";
import { useWorkspace } from "@/components/providers/WorkspaceProvider";
import type { PortalMilestone } from "@/data/portal";
import { L } from "@/lib/dictionary";
import { cn } from "@/lib/utils";

type InquiryStatus = "new" | "read" | "won" | "lost";

type Inquiry = {
  id: string;
  kind: "contact" | "newsletter";
  name?: string;
  email: string;
  phone?: string;
  company?: string;
  service?: string;
  projectType?: string;
  location?: string;
  message?: string;
  reference?: string;
  status: InquiryStatus;
  createdAt: string;
  updatedAt: string;
};

type AuditEntry = {
  id: string;
  actor: string;
  action: string;
  entity: string;
  entityId?: string;
  ip?: string;
  createdAt: string;
};

type ConsultationStatus = "requested" | "confirmed" | "completed" | "cancelled";

type ConsultationRecord = {
  id: string;
  reference: string;
  name: string;
  email: string;
  phone: string;
  company?: string;
  topic: string;
  date: string;
  slot: string;
  mode: "boardroom" | "video" | "site";
  notes?: string;
  status: ConsultationStatus;
  createdAt: string;
};

type SignoffRecord = {
  id: string;
  projectSlug: string;
  email: string;
  signerName: string;
  contractHash: string;
  signedAt: string;
  milestones: { titleEn: string; verifiedAt: string; verifiedBy: string }[];
};

type NotificationConfig = {
  email: { configured: boolean; recipient: string };
  whatsapp: { configured: boolean; transport: "webhook" | "meta" | "none" };
};

const copy = {
  ar: {
    inquiriesTitle: "صندوق الاستفسارات",
    inquiriesText:
      "كل طلب وارد من الموقع أو البوابة — راجع التفاصيل وحدّث حالة المتابعة.",
    auditTitle: "سجل النشاط",
    auditText: "تتبّع كل إجراء إداري وحساس على المنصة بالترتيب الزمني.",
    refresh: "تحديث",
    loading: "جارٍ التحميل...",
    emptyInquiries: "لا توجد استفسارات بعد.",
    emptyAudit: "لا يوجد نشاط مسجّل بعد.",
    retry: "إعادة المحاولة",
    error: "تعذّر تحميل البيانات. حاول مرة أخرى.",
    newsletter: "نشرة بريدية",
    contact: "طلب تواصل",
    new: "جديد",
    read: "مقروء",
    won: "مكسوب",
    lost: "مفقود",
    mark: "تحديث الحالة",
    updated: "تم التحديث.",
    actor: "المستخدم",
    action: "الإجراء",
    entity: "الكيان",
    when: "الوقت",
    consultationsTitle: "الاستشارات التنفيذية",
    consultationsText: "طلبات مجلس الإدارة والاجتماعات المرئية والزيارات الميدانية.",
    contractsTitle: "العقود والتوقيعات",
    contractsText: "التوقيعات الرقمية وبصمات العقود المعتمدة من العملاء.",
    notificationsTitle: "تنبيهات الإدارة",
    notificationsText: "تحقق من قنوات البريد وواتساب وأرسل اختباراً حياً.",
    emptyConsultations: "لا توجد استشارات بعد.",
    emptyContracts: "لا توجد عقود موقعة بعد.",
    requested: "مطلوب",
    confirmed: "مؤكد",
    completed: "مكتمل",
    cancelled: "ملغى",
    confirm: "تأكيد",
    boardroom: "مجلس الإدارة",
    video: "مرئي",
    site: "زيارة موقع",
    emailChannel: "البريد الإلكتروني",
    whatsappChannel: "واتساب",
    configured: "مهيأ",
    notConfigured: "غير مهيأ",
    recipient: "المستلم",
    transport: "القناة",
    sendTest: "إرسال اختبار",
    sendingTest: "جارٍ الإرسال…",
    testSent: "تم إرسال الاختبار.",
    testFailed: "تعذّر إرسال الاختبار.",
    signedBy: "وقّع بواسطة",
    digest: "بصمة العقد",
    verifiedMilestones: "مراحل موثقة",
    noVerifiedMilestones: "لا توجد مراحل موثقة.",
    milestonesTitle: "متابعة المراحل",
    milestonesText:
      "حدّث حالة كل مرحلة — تظهر التغييرات فوراً في بوابة العميل وفي الصفحة الرئيسية.",
    selectProject: "اختر المشروع",
    noMilestones: "لا توجد مراحل لهذا المشروع.",
    complete: "مكتملة",
    current: "جارٍ",
    upcoming: "قادمة",
    milestoneHint: "اضغط على الحالة لتحديث المرحلة.",
    addMilestone: "إضافة مرحلة",
    newMilestone: "مرحلة جديدة",
    titleAr: "الاسم (عربي)",
    titleEn: "الاسم (إنجليزي)",
    dateAr: "التاريخ (عربي)",
    dateEn: "التاريخ (إنجليزي)",
    saveMilestone: "حفظ المرحلة",
    cancel: "إلغاء",
    remove: "حذف المرحلة",
    titleRequired: "أدخل اسم المرحلة بالعربية أو الإنجليزية.",
  },
  en: {
    inquiriesTitle: "Inquiry inbox",
    inquiriesText:
      "Every request from the site or portal — review details and move it through the pipeline.",
    auditTitle: "Audit trail",
    auditText: "Chronological record of every administrative and sensitive action.",
    refresh: "Refresh",
    loading: "Loading...",
    emptyInquiries: "No inquiries yet.",
    emptyAudit: "No recorded activity yet.",
    retry: "Retry",
    error: "Could not load data. Please try again.",
    newsletter: "Newsletter",
    contact: "Contact request",
    new: "New",
    read: "Read",
    won: "Won",
    lost: "Lost",
    mark: "Update status",
    updated: "Updated.",
    actor: "Actor",
    action: "Action",
    entity: "Entity",
    when: "When",
    consultationsTitle: "Executive consultations",
    consultationsText: "Boardroom, video, and site visit requests from the public scheduler.",
    contractsTitle: "Contracts & signatures",
    contractsText: "Digital sign-offs and the contract digests accepted by clients.",
    notificationsTitle: "Admin alerts",
    notificationsText: "Check email and WhatsApp channels and send a live test.",
    emptyConsultations: "No consultations yet.",
    emptyContracts: "No signed contracts yet.",
    requested: "Requested",
    confirmed: "Confirmed",
    completed: "Completed",
    cancelled: "Cancelled",
    confirm: "Confirm",
    boardroom: "Boardroom",
    video: "Video",
    site: "Site visit",
    emailChannel: "Email",
    whatsappChannel: "WhatsApp",
    configured: "Configured",
    notConfigured: "Not configured",
    recipient: "Recipient",
    transport: "Transport",
    sendTest: "Send test",
    sendingTest: "Sending…",
    testSent: "Test dispatched.",
    testFailed: "The test could not be dispatched.",
    signedBy: "Signed by",
    digest: "Contract digest",
    verifiedMilestones: "Verified milestones",
    noVerifiedMilestones: "No verified milestones.",
    milestonesTitle: "Milestone tracking",
    milestonesText:
      "Move each milestone through its status — changes appear instantly in the client portal and on the homepage.",
    selectProject: "Select project",
    noMilestones: "No milestones for this project.",
    complete: "Complete",
    current: "Current",
    upcoming: "Upcoming",
    milestoneHint: "Tap a status to update the milestone.",
    addMilestone: "Add milestone",
    newMilestone: "New milestone",
    titleAr: "Title (Arabic)",
    titleEn: "Title (English)",
    dateAr: "Date (Arabic)",
    dateEn: "Date (English)",
    saveMilestone: "Save milestone",
    cancel: "Cancel",
    remove: "Remove milestone",
    titleRequired: "Enter the milestone title in Arabic or English.",
  },
};

const statusOrder: InquiryStatus[] = ["new", "read", "won", "lost"];

const statusStyles: Record<InquiryStatus, string> = {
  new: "bg-gold text-obsidian",
  read: "bg-white/12 text-ivory/70",
  won: "bg-emerald-400/15 text-emerald-300",
  lost: "bg-red-400/12 text-red-300",
};

function useRemoteList<T>(endpoint: string, key: string) {
  const [items, setItems] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const load = useCallback(async () => {
    try {
      const response = await fetch(endpoint, {
        cache: "no-store",
        credentials: "same-origin",
      });
      if (!response.ok) throw new Error("request_failed");
      const data = (await response.json()) as Record<string, unknown>;
      setItems(Array.isArray(data[key]) ? (data[key] as T[]) : []);
      setError(false);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [endpoint, key]);

  const reload = useCallback(async () => {
    setLoading(true);
    await load();
  }, [load]);

  useEffect(() => {
    // Fetch on mount and whenever the endpoint changes; state settles after the request.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [load]);

  return { items, loading, error, reload };
}

function StateBlock({
  loading,
  error,
  empty,
  emptyText,
  errorText,
  retry,
  loadingText,
  onRetry,
}: {
  loading: boolean;
  error: boolean;
  empty: boolean;
  emptyText: string;
  errorText: string;
  retry: string;
  loadingText: string;
  onRetry: () => void;
}) {
  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 py-14 text-[0.62rem] text-ivory/35">
        <Loader2 className="h-4 w-4 animate-spin" />
        {loadingText}
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center gap-3 py-14 text-center">
        <AlertCircle className="h-5 w-5 text-red-300/70" />
        <p className="text-[0.62rem] text-ivory/40">{errorText}</p>
        <button
          type="button"
          onClick={onRetry}
          className="inline-flex h-9 items-center gap-2 border border-white/12 px-4 text-[0.54rem] font-semibold uppercase tracking-[0.12em] text-ivory/60 transition-colors hover:border-gold/40 hover:text-gold"
        >
          <RefreshCcw className="h-3.5 w-3.5" />
          {retry}
        </button>
      </div>
    );
  }

  if (empty) {
    return <p className="py-14 text-center text-[0.62rem] text-ivory/30">{emptyText}</p>;
  }

  return null;
}

export function InquiriesPanel() {
  const { locale } = useI18n();
  const c = copy[locale];
  const { items, loading, error, reload } = useRemoteList<Inquiry>(
    "/api/admin/inquiries",
    "inquiries",
  );
  const [pending, setPending] = useState<string | null>(null);
  const [notice, setNotice] = useState("");

  const dateFormat = new Intl.DateTimeFormat(locale === "ar" ? "ar-SA" : "en-GB", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });

  const updateStatus = async (inquiry: Inquiry, status: InquiryStatus) => {
    if (inquiry.status === status || pending) return;
    setPending(inquiry.id);
    setNotice("");
    try {
      const response = await fetch("/api/admin/inquiries", {
        method: "PATCH",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: inquiry.id, status }),
      });
      if (!response.ok) throw new Error("request_failed");
      await reload();
      setNotice(c.updated);
      window.setTimeout(() => setNotice(""), 2400);
    } catch {
      setNotice(c.error);
    } finally {
      setPending(null);
    }
  };

  return (
    <div className="border border-white/10 bg-coal">
      <div className="flex flex-col justify-between gap-3 border-b border-white/10 px-5 py-4 sm:flex-row sm:items-center">
        <div>
          <h2 className="font-display text-2xl text-ivory">{c.inquiriesTitle}</h2>
          <p className="mt-1 text-[0.6rem] leading-relaxed text-ivory/35">{c.inquiriesText}</p>
        </div>
        <button
          type="button"
          onClick={() => void reload()}
          className="inline-flex h-9 w-fit items-center gap-2 border border-white/12 px-3.5 text-[0.54rem] font-semibold uppercase tracking-[0.12em] text-ivory/50 transition-colors hover:border-gold/40 hover:text-gold"
        >
          <RefreshCcw className={cn("h-3.5 w-3.5", loading && "animate-spin")} />
          {c.refresh}
        </button>
      </div>

      {notice ? (
        <p className="border-b border-white/8 bg-gold/10 px-5 py-2 text-[0.58rem] text-gold">
          {notice}
        </p>
      ) : null}

      <StateBlock
        loading={loading && !items.length}
        error={error && !items.length}
        empty={!items.length}
        emptyText={c.emptyInquiries}
        errorText={c.error}
        retry={c.retry}
        loadingText={c.loading}
        onRetry={() => void reload()}
      />

      {items.length ? (
        <ul className="divide-y divide-white/6">
          {items.map((inquiry) => (
            <li key={inquiry.id} className="px-5 py-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={cn(
                        "px-2 py-0.5 text-[0.48rem] font-semibold uppercase tracking-[0.12em]",
                        statusStyles[inquiry.status],
                      )}
                    >
                      {c[inquiry.status]}
                    </span>
                    <span className="text-[0.5rem] uppercase tracking-[0.14em] text-ivory/30">
                      {inquiry.kind === "newsletter" ? c.newsletter : c.contact}
                    </span>
                    {inquiry.reference ? (
                      <span className="tabular text-[0.5rem] text-ivory/25">
                        {inquiry.reference}
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-2 flex items-center gap-2 text-[0.72rem] text-ivory/80">
                    <UserRound className="h-3.5 w-3.5 text-gold/60" />
                    {inquiry.name || inquiry.email}
                  </p>
                  <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-[0.56rem] text-ivory/35">
                    <span className="inline-flex items-center gap-1.5">
                      <Mail className="h-3 w-3" />
                      {inquiry.email}
                    </span>
                    {inquiry.phone ? (
                      <span className="inline-flex items-center gap-1.5" dir="ltr">
                        <Phone className="h-3 w-3" />
                        {inquiry.phone}
                      </span>
                    ) : null}
                    {inquiry.company ? <span>{inquiry.company}</span> : null}
                    {inquiry.location ? <span>{inquiry.location}</span> : null}
                    {inquiry.service ? <span>{inquiry.service}</span> : null}
                  </div>
                </div>
                <span className="tabular shrink-0 text-[0.52rem] text-ivory/25">
                  {dateFormat.format(new Date(inquiry.createdAt))}
                </span>
              </div>

              {inquiry.message ? (
                <p className="mt-3 border-s-2 border-gold/30 bg-white/[0.03] px-3 py-2 text-[0.62rem] leading-relaxed text-ivory/55">
                  {inquiry.message}
                </p>
              ) : null}

              <div className="mt-3 flex flex-wrap items-center gap-1.5">
                <span className="me-1 text-[0.48rem] uppercase tracking-[0.14em] text-ivory/25">
                  {c.mark}
                </span>
                {statusOrder.map((status) => (
                  <button
                    key={status}
                    type="button"
                    disabled={pending !== null}
                    onClick={() => void updateStatus(inquiry, status)}
                    className={cn(
                      "h-7 px-2.5 text-[0.5rem] font-semibold uppercase tracking-[0.1em] transition-colors disabled:opacity-40",
                      inquiry.status === status
                        ? statusStyles[status]
                        : "border border-white/10 text-ivory/40 hover:border-gold/40 hover:text-gold",
                    )}
                  >
                    {c[status]}
                  </button>
                ))}
              </div>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

export function AuditPanel() {
  const { locale } = useI18n();
  const c = copy[locale];
  const { items, loading, error, reload } = useRemoteList<AuditEntry>(
    "/api/admin/audit",
    "entries",
  );

  const dateFormat = new Intl.DateTimeFormat(locale === "ar" ? "ar-SA" : "en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
  });

  return (
    <div className="border border-white/10 bg-coal">
      <div className="flex flex-col justify-between gap-3 border-b border-white/10 px-5 py-4 sm:flex-row sm:items-center">
        <div>
          <h2 className="flex items-center gap-2 font-display text-2xl text-ivory">
            <Activity className="h-4 w-4 text-gold" />
            {c.auditTitle}
          </h2>
          <p className="mt-1 text-[0.6rem] leading-relaxed text-ivory/35">{c.auditText}</p>
        </div>
        <button
          type="button"
          onClick={() => void reload()}
          className="inline-flex h-9 w-fit items-center gap-2 border border-white/12 px-3.5 text-[0.54rem] font-semibold uppercase tracking-[0.12em] text-ivory/50 transition-colors hover:border-gold/40 hover:text-gold"
        >
          <RefreshCcw className={cn("h-3.5 w-3.5", loading && "animate-spin")} />
          {c.refresh}
        </button>
      </div>

      <StateBlock
        loading={loading && !items.length}
        error={error && !items.length}
        empty={!items.length}
        emptyText={c.emptyAudit}
        errorText={c.error}
        retry={c.retry}
        loadingText={c.loading}
        onRetry={() => void reload()}
      />

      {items.length ? (
        <ul className="divide-y divide-white/6">
          {items.map((entry) => (
            <li
              key={entry.id}
              className="flex flex-wrap items-center justify-between gap-3 px-5 py-3"
            >
              <div className="flex min-w-0 items-center gap-3">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-gold/20 bg-gold/5">
                  <Activity className="h-3 w-3 text-gold/70" />
                </span>
                <div className="min-w-0">
                  <p className="truncate text-[0.66rem] text-ivory/75">
                    <span className="text-gold/80">{entry.actor}</span>{" "}
                    <span className="text-ivory/45">{entry.action}</span>
                  </p>
                  <p className="truncate text-[0.52rem] text-ivory/30">
                    {entry.entity}
                    {entry.entityId ? ` · ${entry.entityId}` : ""}
                    {entry.ip ? ` · ${entry.ip}` : ""}
                  </p>
                </div>
              </div>
              <span className="tabular shrink-0 text-[0.52rem] text-ivory/25">
                {dateFormat.format(new Date(entry.createdAt))}
              </span>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}


const consultationStatusStyles: Record<ConsultationStatus, string> = {
  requested: "bg-gold/15 text-gold",
  confirmed: "bg-emerald-400/12 text-emerald-300",
  completed: "bg-white/10 text-ivory/60",
  cancelled: "bg-red-400/10 text-red-300",
};

export function ConsultationsPanel() {
  const { locale } = useI18n();
  const c = copy[locale];
  const { items, loading, error, reload } = useRemoteList<ConsultationRecord>(
    "/api/admin/consultations",
    "consultations",
  );
  const [pending, setPending] = useState<string | null>(null);
  const [notice, setNotice] = useState("");

  const dateFormat = new Intl.DateTimeFormat(locale === "ar" ? "ar-SA" : "en-GB", {
    weekday: "short",
    day: "2-digit",
    month: "short",
  });

  const update = async (record: ConsultationRecord, status: ConsultationStatus) => {
    if (pending) return;
    setPending(record.id);
    setNotice("");
    try {
      const response = await fetch("/api/admin/consultations", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ id: record.id, status }),
      });
      if (!response.ok) throw new Error("update_failed");
      setNotice(c.updated);
      await reload();
    } catch {
      setNotice(c.error);
    } finally {
      setPending(null);
    }
  };

  return (
    <div className="border border-white/10 bg-coal">
      <div className="flex flex-col justify-between gap-3 border-b border-white/10 px-5 py-4 sm:flex-row sm:items-center">
        <div>
          <h2 className="flex items-center gap-2 font-display text-2xl text-ivory">
            <CalendarDays className="h-4 w-4 text-gold" />
            {c.consultationsTitle}
          </h2>
          <p className="mt-1 text-[0.6rem] leading-relaxed text-ivory/35">{c.consultationsText}</p>
        </div>
        <button
          type="button"
          onClick={() => void reload()}
          className="inline-flex h-9 w-fit items-center gap-2 border border-white/12 px-3.5 text-[0.54rem] font-semibold uppercase tracking-[0.12em] text-ivory/50 transition-colors hover:border-gold/40 hover:text-gold"
        >
          <RefreshCcw className={cn("h-3.5 w-3.5", loading && "animate-spin")} />
          {c.refresh}
        </button>
      </div>

      <StateBlock
        loading={loading && !items.length}
        error={error && !items.length}
        empty={!items.length}
        emptyText={c.emptyConsultations}
        errorText={c.error}
        retry={c.retry}
        loadingText={c.loading}
        onRetry={() => void reload()}
      />

      {items.length ? (
        <ul className="divide-y divide-white/6">
          {items.map((record) => (
            <li key={record.id} className="px-5 py-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-[0.58rem] text-gold">{record.reference}</span>
                    <span
                      className={cn(
                        "px-2 py-0.5 text-[0.46rem] font-semibold uppercase tracking-[0.12em]",
                        consultationStatusStyles[record.status],
                      )}
                    >
                      {c[record.status]}
                    </span>
                    <span className="text-[0.5rem] uppercase tracking-[0.12em] text-ivory/30">
                      {c[record.mode]}
                    </span>
                  </div>
                  <p className="mt-1.5 text-[0.72rem] text-ivory/80">
                    {record.name}
                    {record.company ? ` · ${record.company}` : ""}
                  </p>
                  <p className="mt-1 flex flex-wrap items-center gap-3 text-[0.55rem] text-ivory/35">
                    <span className="flex items-center gap-1">
                      <CalendarDays className="h-3 w-3" />
                      {dateFormat.format(new Date(`${record.date}T12:00:00.000Z`))} · {record.slot}
                    </span>
                    <span className="flex items-center gap-1">
                      <Mail className="h-3 w-3" />
                      {record.email}
                    </span>
                    <span className="flex items-center gap-1">
                      <Phone className="h-3 w-3" />
                      {record.phone}
                    </span>
                  </p>
                  <p className="mt-2 max-w-2xl text-[0.62rem] leading-relaxed text-ivory/45">
                    {record.topic}
                    {record.notes ? ` — ${record.notes}` : ""}
                  </p>
                </div>
                <div className="flex shrink-0 flex-wrap gap-1.5">
                  {record.status === "requested" ? (
                    <button
                      type="button"
                      disabled={Boolean(pending)}
                      onClick={() => void update(record, "confirmed")}
                      className="inline-flex h-8 items-center gap-1.5 border border-emerald-400/25 px-2.5 text-[0.5rem] font-semibold uppercase tracking-[0.1em] text-emerald-300 transition-colors hover:bg-emerald-400/10 disabled:opacity-50"
                    >
                      <Check className="h-3 w-3" />
                      {c.confirm}
                    </button>
                  ) : null}
                  {record.status === "confirmed" ? (
                    <button
                      type="button"
                      disabled={Boolean(pending)}
                      onClick={() => void update(record, "completed")}
                      className="inline-flex h-8 items-center gap-1.5 border border-gold/25 px-2.5 text-[0.5rem] font-semibold uppercase tracking-[0.1em] text-gold transition-colors hover:bg-gold/10 disabled:opacity-50"
                    >
                      <Check className="h-3 w-3" />
                      {c.complete}
                    </button>
                  ) : null}
                  {record.status === "requested" || record.status === "confirmed" ? (
                    <button
                      type="button"
                      disabled={Boolean(pending)}
                      onClick={() => void update(record, "cancelled")}
                      className="inline-flex h-8 items-center gap-1.5 border border-red-400/20 px-2.5 text-[0.5rem] font-semibold uppercase tracking-[0.1em] text-red-300 transition-colors hover:bg-red-400/10 disabled:opacity-50"
                    >
                      <X className="h-3 w-3" />
                      {c.cancel}
                    </button>
                  ) : null}
                </div>
              </div>
            </li>
          ))}
        </ul>
      ) : null}

      {notice ? (
        <p className="border-t border-white/8 px-5 py-3 text-[0.6rem] text-gold">{notice}</p>
      ) : null}
    </div>
  );
}

export function ContractsPanel() {
  const { locale } = useI18n();
  const c = copy[locale];
  const { items, loading, error, reload } = useRemoteList<SignoffRecord>(
    "/api/admin/contracts",
    "signoffs",
  );

  const dateFormat = new Intl.DateTimeFormat(locale === "ar" ? "ar-SA" : "en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
  });

  return (
    <div className="border border-white/10 bg-coal">
      <div className="flex flex-col justify-between gap-3 border-b border-white/10 px-5 py-4 sm:flex-row sm:items-center">
        <div>
          <h2 className="flex items-center gap-2 font-display text-2xl text-ivory">
            <FileSignature className="h-4 w-4 text-gold" />
            {c.contractsTitle}
          </h2>
          <p className="mt-1 text-[0.6rem] leading-relaxed text-ivory/35">{c.contractsText}</p>
        </div>
        <button
          type="button"
          onClick={() => void reload()}
          className="inline-flex h-9 w-fit items-center gap-2 border border-white/12 px-3.5 text-[0.54rem] font-semibold uppercase tracking-[0.12em] text-ivory/50 transition-colors hover:border-gold/40 hover:text-gold"
        >
          <RefreshCcw className={cn("h-3.5 w-3.5", loading && "animate-spin")} />
          {c.refresh}
        </button>
      </div>

      <StateBlock
        loading={loading && !items.length}
        error={error && !items.length}
        empty={!items.length}
        emptyText={c.emptyContracts}
        errorText={c.error}
        retry={c.retry}
        loadingText={c.loading}
        onRetry={() => void reload()}
      />

      {items.length ? (
        <ul className="divide-y divide-white/6">
          {items.map((record) => (
            <li key={record.id} className="px-5 py-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="flex items-center gap-2 text-[0.72rem] text-ivory/80">
                    <ShieldCheck className="h-3.5 w-3.5 text-gold" />
                    {record.projectSlug}
                  </p>
                  <p className="mt-1 text-[0.58rem] text-ivory/40">
                    {c.signedBy}: {record.signerName} · {record.email}
                  </p>
                  <p className="mt-1 font-mono text-[0.5rem] text-ivory/25">
                    {c.digest}: {record.contractHash.slice(0, 24)}…
                  </p>
                  <p className="mt-1.5 text-[0.54rem] text-ivory/35">
                    {c.verifiedMilestones}: {record.milestones.length}
                    {record.milestones.length
                      ? ` · ${record.milestones.map((item) => item.titleEn).join(" · ")}`
                      : ` · ${c.noVerifiedMilestones}`}
                  </p>
                </div>
                <span className="tabular shrink-0 text-[0.52rem] text-ivory/25">
                  {dateFormat.format(new Date(record.signedAt))}
                </span>
              </div>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

export function NotificationsPanel() {
  const { locale } = useI18n();
  const c = copy[locale];
  const [config, setConfig] = useState<NotificationConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");

  const load = useCallback(async () => {
    try {
      const response = await fetch("/api/admin/notifications", {
        cache: "no-store",
        credentials: "same-origin",
      });
      if (!response.ok) throw new Error("request_failed");
      const payload = (await response.json()) as { config?: NotificationConfig };
      setConfig(payload.config ?? null);
      setError(false);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [load]);

  const test = async () => {
    setBusy(true);
    setNotice("");
    try {
      const response = await fetch("/api/admin/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ channel: "all", message: "Live dispatch test from the admin control center." }),
      });
      if (!response.ok) throw new Error("request_failed");
      const payload = (await response.json()) as {
        result?: { email: string; whatsapp: string };
      };
      const states = payload.result
        ? `${c.emailChannel}: ${payload.result.email} · ${c.whatsappChannel}: ${payload.result.whatsapp}`
        : "";
      setNotice(`${c.testSent} ${states}`.trim());
    } catch {
      setNotice(c.testFailed);
    } finally {
      setBusy(false);
    }
  };

  const channels = [
    {
      key: "email" as const,
      icon: Mail,
      label: c.emailChannel,
      configured: config?.email.configured ?? false,
      detail: config?.email.recipient || "—",
    },
    {
      key: "whatsapp" as const,
      icon: BellRing,
      label: c.whatsappChannel,
      configured: config?.whatsapp.configured ?? false,
      detail: config?.whatsapp.transport ?? "none",
    },
  ];

  return (
    <div className="border border-white/10 bg-coal">
      <div className="flex flex-col justify-between gap-3 border-b border-white/10 px-5 py-4 sm:flex-row sm:items-center">
        <div>
          <h2 className="flex items-center gap-2 font-display text-2xl text-ivory">
            <BellRing className="h-4 w-4 text-gold" />
            {c.notificationsTitle}
          </h2>
          <p className="mt-1 text-[0.6rem] leading-relaxed text-ivory/35">{c.notificationsText}</p>
        </div>
        <button
          type="button"
          onClick={() => void test()}
          disabled={busy}
          className="inline-flex h-9 w-fit items-center gap-2 border border-gold/30 bg-gold/5 px-3.5 text-[0.54rem] font-semibold uppercase tracking-[0.12em] text-gold transition-colors hover:bg-gold/10 disabled:opacity-50"
        >
          {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
          {busy ? c.sendingTest : c.sendTest}
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center gap-2 py-14 text-[0.62rem] text-ivory/35">
          <Loader2 className="h-4 w-4 animate-spin" />
          {c.loading}
        </div>
      ) : error ? (
        <div className="flex flex-col items-center gap-3 py-14 text-center">
          <AlertCircle className="h-5 w-5 text-red-300/70" />
          <p className="text-[0.62rem] text-ivory/40">{c.error}</p>
          <button
            type="button"
            onClick={() => void load()}
            className="inline-flex h-9 items-center gap-2 border border-white/12 px-4 text-[0.54rem] font-semibold uppercase tracking-[0.12em] text-ivory/60 transition-colors hover:border-gold/40 hover:text-gold"
          >
            <RefreshCcw className="h-3.5 w-3.5" />
            {c.retry}
          </button>
        </div>
      ) : (
        <div className="grid gap-px bg-white/10 sm:grid-cols-2">
          {channels.map(({ key, icon: Icon, label, configured, detail }) => (
            <div key={key} className="bg-obsidian p-5">
              <div className="flex items-center justify-between gap-3">
                <span className="flex items-center gap-2 text-[0.66rem] text-ivory/70">
                  <Icon className="h-4 w-4 text-gold" />
                  {label}
                </span>
                <span
                  className={cn(
                    "px-2 py-0.5 text-[0.46rem] font-semibold uppercase tracking-[0.12em]",
                    configured
                      ? "bg-emerald-400/12 text-emerald-300"
                      : "bg-white/8 text-ivory/35",
                  )}
                >
                  {configured ? c.configured : c.notConfigured}
                </span>
              </div>
              <p className="mt-3 text-[0.52rem] uppercase tracking-[0.12em] text-ivory/30">
                {key === "email" ? c.recipient : c.transport}
              </p>
              <p className="mt-1 truncate text-[0.64rem] text-ivory/55">{detail}</p>
            </div>
          ))}
        </div>
      )}

      {notice ? (
        <p className="border-t border-white/8 px-5 py-3 text-[0.6rem] text-gold">{notice}</p>
      ) : null}
    </div>
  );
}

const milestoneStatuses: PortalMilestone["status"][] = ["complete", "current", "upcoming"];

const emptyMilestoneDraft = { titleAr: "", titleEn: "", dateAr: "", dateEn: "" };

export function MilestonesPanel() {
  const { locale, l } = useI18n();
  const c = copy[locale];
  const { projects, updateProject } = useWorkspace();
  const [selectedSlug, setSelectedSlug] = useState(projects[0]?.slug ?? "");
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState(emptyMilestoneDraft);
  const [formError, setFormError] = useState("");

  const active =
    projects.find((project) => project.slug === selectedSlug) ?? projects[0];

  const selectProject = (slug: string) => {
    setSelectedSlug(slug);
    setAdding(false);
    setDraft(emptyMilestoneDraft);
    setFormError("");
  };

  const setStatus = (index: number, status: PortalMilestone["status"]) => {
    if (!active) return;
    const milestones = active.milestones.map((milestone, milestoneIndex) =>
      milestoneIndex === index ? { ...milestone, status } : milestone,
    );
    updateProject(active.slug, { milestones });
  };

  const addMilestone = () => {
    if (!active) return;
    const titleAr = draft.titleAr.trim();
    const titleEn = draft.titleEn.trim();
    if (!titleAr && !titleEn) {
      setFormError(c.titleRequired);
      return;
    }

    const milestones: PortalMilestone[] = [
      ...active.milestones,
      {
        title: L(titleAr || titleEn, titleEn || titleAr),
        date: L(draft.dateAr.trim(), draft.dateEn.trim()),
        status: "upcoming",
      },
    ];

    updateProject(active.slug, { milestones });
    setDraft(emptyMilestoneDraft);
    setFormError("");
    setAdding(false);
  };

  const removeMilestone = (index: number) => {
    if (!active) return;
    updateProject(active.slug, {
      milestones: active.milestones.filter((_, milestoneIndex) => milestoneIndex !== index),
    });
  };

  return (
    <div className="border border-white/10 bg-coal">
      <div className="flex flex-col justify-between gap-3 border-b border-white/10 px-5 py-4 sm:flex-row sm:items-center">
        <div>
          <h2 className="flex items-center gap-2 font-display text-2xl text-ivory">
            <Flag className="h-4 w-4 text-gold" />
            {c.milestonesTitle}
          </h2>
          <p className="mt-1 text-[0.6rem] leading-relaxed text-ivory/35">{c.milestonesText}</p>
        </div>
        <div className="flex flex-wrap items-end gap-2">
          <label className="block">
            <span className="sr-only">{c.selectProject}</span>
            <select
              value={active?.slug ?? ""}
              onChange={(event) => selectProject(event.target.value)}
              className="h-9 w-full min-w-44 border border-white/12 bg-coal px-3 text-[0.62rem] text-ivory outline-none focus:border-gold/50 sm:w-auto"
            >
              {projects.map((project) => (
                <option key={project.slug} value={project.slug}>
                  {l(project.title)}
                </option>
              ))}
            </select>
          </label>
          <button
            type="button"
            disabled={!active || adding}
            onClick={() => {
              setAdding(true);
              setFormError("");
            }}
            className="inline-flex h-9 items-center gap-1.5 border border-gold/40 px-3.5 text-[0.54rem] font-semibold uppercase tracking-[0.12em] text-gold transition-colors hover:bg-gold hover:text-obsidian disabled:opacity-40"
          >
            <Plus className="h-3.5 w-3.5" />
            {c.addMilestone}
          </button>
        </div>
      </div>

      {adding ? (
        <form
          onSubmit={(event) => {
            event.preventDefault();
            addMilestone();
          }}
          className="border-b border-white/10 bg-obsidian/40 px-5 py-4"
        >
          <p className="text-[0.52rem] font-semibold uppercase tracking-[0.16em] text-gold">
            {c.newMilestone}
          </p>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            <input
              value={draft.titleAr}
              onChange={(event) => setDraft((current) => ({ ...current, titleAr: event.target.value }))}
              placeholder={c.titleAr}
              dir="rtl"
              className="h-9 w-full border border-white/12 bg-transparent px-3 text-[0.64rem] text-ivory outline-none placeholder:text-ivory/25 focus:border-gold/50"
            />
            <input
              value={draft.titleEn}
              onChange={(event) => setDraft((current) => ({ ...current, titleEn: event.target.value }))}
              placeholder={c.titleEn}
              dir="ltr"
              className="h-9 w-full border border-white/12 bg-transparent px-3 text-[0.64rem] text-ivory outline-none placeholder:text-ivory/25 focus:border-gold/50"
            />
            <input
              value={draft.dateAr}
              onChange={(event) => setDraft((current) => ({ ...current, dateAr: event.target.value }))}
              placeholder={c.dateAr}
              dir="rtl"
              className="h-9 w-full border border-white/12 bg-transparent px-3 text-[0.64rem] text-ivory outline-none placeholder:text-ivory/25 focus:border-gold/50"
            />
            <input
              value={draft.dateEn}
              onChange={(event) => setDraft((current) => ({ ...current, dateEn: event.target.value }))}
              placeholder={c.dateEn}
              dir="ltr"
              className="h-9 w-full border border-white/12 bg-transparent px-3 text-[0.64rem] text-ivory outline-none placeholder:text-ivory/25 focus:border-gold/50"
            />
          </div>
          {formError ? (
            <p className="mt-2 text-[0.56rem] text-red-300">{formError}</p>
          ) : null}
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="submit"
              className="inline-flex h-8 items-center gap-1.5 bg-gold px-3.5 text-[0.52rem] font-semibold uppercase tracking-[0.12em] text-obsidian transition-colors hover:bg-gold-light"
            >
              <Check className="h-3 w-3" />
              {c.saveMilestone}
            </button>
            <button
              type="button"
              onClick={() => {
                setAdding(false);
                setDraft(emptyMilestoneDraft);
                setFormError("");
              }}
              className="inline-flex h-8 items-center border border-white/12 px-3.5 text-[0.52rem] font-semibold uppercase tracking-[0.12em] text-ivory/50 transition-colors hover:border-gold/40 hover:text-gold"
            >
              {c.cancel}
            </button>
          </div>
        </form>
      ) : null}

      {active?.milestones.length ? (
        <ol className="divide-y divide-white/6">
          {active.milestones.map((milestone, index) => (
            <li key={`${milestone.title.en}-${index}`} className="px-5 py-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex min-w-0 items-start gap-3">
                  <span
                    className={cn(
                      "mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border",
                      milestone.status === "complete"
                        ? "border-gold bg-gold text-obsidian"
                        : milestone.status === "current"
                          ? "border-gold text-gold"
                          : "border-white/15 text-ivory/30",
                    )}
                  >
                    {milestone.status === "complete" ? (
                      <Check className="h-3 w-3" />
                    ) : milestone.status === "current" ? (
                      <Clock className="h-3 w-3" />
                    ) : (
                      <span className="h-1 w-1 rounded-full bg-current" />
                    )}
                  </span>
                  <div className="min-w-0">
                    <p className="text-[0.72rem] leading-snug text-ivory/80">
                      {l(milestone.title)}
                    </p>
                    <span className="text-[0.55rem] text-ivory/30">
                      {l(milestone.date)}
                    </span>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-1.5">
                  {milestoneStatuses.map((status) => (
                    <button
                      key={status}
                      type="button"
                      onClick={() => setStatus(index, status)}
                      className={cn(
                        "h-7 px-2.5 text-[0.5rem] font-semibold uppercase tracking-[0.1em] transition-colors",
                        milestone.status === status
                          ? "bg-gold text-obsidian"
                          : "border border-white/10 text-ivory/40 hover:border-gold/40 hover:text-gold",
                      )}
                    >
                      {c[status]}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => removeMilestone(index)}
                    aria-label={`${c.remove} — ${l(milestone.title)}`}
                    className="flex h-7 w-7 items-center justify-center border border-white/10 text-ivory/35 transition-colors hover:border-red-400/50 hover:text-red-300"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ol>
      ) : (
        <p className="py-14 text-center text-[0.62rem] text-ivory/30">{c.noMilestones}</p>
      )}

      <p className="border-t border-white/8 px-5 py-3 text-[0.52rem] text-ivory/25">
        {c.milestoneHint}
      </p>
    </div>
  );
}

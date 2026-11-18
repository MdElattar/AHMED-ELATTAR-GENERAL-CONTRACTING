"use client";

import { useMemo, useState } from "react";
import { BadgeCheck, Mail, Save, UserRound } from "lucide-react";
import { useAuth, type PortalUser } from "@/components/providers/AuthProvider";
import { useI18n } from "@/components/providers/I18nProvider";
import { Card, PageHeader } from "@/components/ui/admin";
import { Field, Input, Select } from "@/components/ui/admin/form";
import { Modal } from "@/components/ui/admin/overlay";
import { Button } from "@/components/ui/admin";
import { useToast } from "@/components/ui/Toast";

const honorifics = [
  { value: "Eng.", ar: "م.", label: { ar: "المهندس", en: "Engineer" } },
  { value: "Dr.", ar: "د.", label: { ar: "الدكتور", en: "Doctor" } },
  { value: "Arch.", ar: "م.", label: { ar: "المعماري", en: "Architect" } },
  { value: "Mr.", ar: "السيد", label: { ar: "السيد", en: "Mr." } },
  { value: "Ms.", ar: "السيدة", label: { ar: "السيدة", en: "Ms." } },
  { value: "Prof.", ar: "أ.د.", label: { ar: "الأستاذ الدكتور", en: "Professor" } },
] as const;

const copy = {
  ar: {
    profile: "الملف الشخصي",
    profileText: "هذه البيانات تظهر في التحية والشريط الجانبي. الاسم المختصر أفضل من المسمى الوظيفي.",
    displayName: "الاسم المعروض",
    arabicName: "الاسم بالعربية",
    honorific: "اللقب",
    noHonorific: "بدون لقب",
    company: "الشركة",
    phone: "الهاتف",
    email: "البريد الإلكتروني",
    account: "رقم الحساب",
    save: "حفظ الملف الشخصي",
    saving: "جارٍ الحفظ…",
    saved: "تم تحديث الملف الشخصي.",
    failed: "تعذر حفظ الملف الشخصي. حاول مرة أخرى.",
    promptTitle: "كيف نناديك؟",
    promptText: "سنستخدم هذا الاسم واللقب في التحية ولوحة التحكم. يمكنك تغييرهما لاحقاً من الملف الشخصي.",
    later: "لاحقاً",
    continue: "حفظ ومتابعة",
    privacy: "البريد الإلكتروني ورقم الحساب غير قابلين للتعديل من هنا.",
  },
  en: {
    profile: "Profile",
    profileText: "These details power the greeting and sidebar. A short display name works better than a job title.",
    displayName: "Display name",
    arabicName: "Arabic name",
    honorific: "Honorific",
    noHonorific: "No honorific",
    company: "Company",
    phone: "Phone",
    email: "Email",
    account: "Account ID",
    save: "Save profile",
    saving: "Saving…",
    saved: "Profile updated.",
    failed: "Could not save your profile. Try again.",
    promptTitle: "How should we address you?",
    promptText: "We will use this name and honorific in the greeting and dashboard. You can change it later in Profile.",
    later: "Later",
    continue: "Save and continue",
    privacy: "Email and account ID cannot be changed here.",
  },
} as const;

function honorificPair(value: string) {
  return honorifics.find((item) => item.value === value);
}

function honorificValue(user: PortalUser | null) {
  if (!user) return "";
  const exact = honorifics.find(
    (item) => item.value === user.honorific || item.ar === user.honorificAr,
  );
  return exact?.value ?? user.honorific ?? "";
}

function promptKey(email: string) {
  return `alattar-profile-prompt:${email || "admin"}`;
}

export function needsProfilePrompt(user: PortalUser | null) {
  if (!user) return false;
  return (
    !user.honorific ||
    !user.nameAr ||
    user.name.trim().toLowerCase() === "platform administrator"
  );
}

export function AdminProfilePrompt() {
  const { user, updateProfile } = useAuth();
  const { locale } = useI18n();
  const { toast } = useToast();
  const c = copy[locale];
  const [visible, setVisible] = useState(() => {
    if (!user || !needsProfilePrompt(user)) return false;
    try {
      return !window.localStorage.getItem(promptKey(user.email));
    } catch {
      return true;
    }
  });
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState(
    user?.name === "Platform Administrator" ? "" : user?.name ?? "",
  );
  const [nameAr, setNameAr] = useState(user?.nameAr ?? "");
  const [honorific, setHonorific] = useState(honorificValue(user));

  const dismiss = () => {
    if (user) {
      try {
        window.localStorage.setItem(promptKey(user.email), "1");
      } catch {
        // Ignore storage failures.
      }
    }
    setVisible(false);
  };

  const save = async () => {
    if (!name.trim()) return;
    setSaving(true);
    const pair = honorificPair(honorific);
    try {
      await updateProfile({
        name: name.trim(),
        nameAr: nameAr.trim(),
        honorific,
        honorificAr: pair?.ar ?? user?.honorificAr ?? "",
      });
      toast(c.saved, "success");
      dismiss();
    } catch {
      toast(c.failed, "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={visible}
      onOpenChange={(next) => {
        if (!next) dismiss();
      }}
      title={c.promptTitle}
      description={c.promptText}
      closeLabel={locale === "ar" ? "إغلاق" : "Close"}
      size="sm"
      footer={
        <>
          <Button variant="ghost" onClick={dismiss} disabled={saving}>
            {c.later}
          </Button>
          <Button variant="primary" onClick={() => void save()} disabled={saving || name.trim().length < 2}>
            {saving ? c.saving : c.continue}
          </Button>
        </>
      }
    >
      <div className="grid gap-4">
        <Field label={c.displayName} htmlFor="profile-prompt-name" required>
          <Input
            id="profile-prompt-name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            autoComplete="name"
          />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={c.honorific} htmlFor="profile-prompt-honorific">
            <Select
              id="profile-prompt-honorific"
              value={honorific}
              onValueChange={setHonorific}
              options={[
                { value: "", label: c.noHonorific },
                ...honorifics.map((item) => ({
                  value: item.value,
                  label: locale === "ar" ? `${item.ar} · ${item.label.ar}` : item.value,
                })),
              ]}
            />
          </Field>
          <Field label={c.arabicName} htmlFor="profile-prompt-name-ar">
            <Input
              id="profile-prompt-name-ar"
              value={nameAr}
              onChange={(event) => setNameAr(event.target.value)}
              dir="rtl"
              autoComplete="name"
            />
          </Field>
        </div>
      </div>
    </Modal>
  );
}

export function AdminProfile() {
  const { user, updateProfile } = useAuth();
  const { locale } = useI18n();
  const { toast } = useToast();
  const c = copy[locale];
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(() => ({
    name: user?.name ?? "",
    nameAr: user?.nameAr ?? "",
    honorific: honorificValue(user),
    company: user?.company ?? "",
    phone: user?.phone ?? "",
  }));

  const hasChanges = useMemo(() => {
    if (!user) return false;
    return (
      form.name !== user.name ||
      form.nameAr !== (user.nameAr ?? "") ||
      form.honorific !== honorificValue(user) ||
      form.company !== user.company ||
      form.phone !== (user.phone ?? "")
    );
  }, [form, user]);

  const save = async () => {
    if (!user || !form.name.trim()) return;
    setSaving(true);
    const pair = honorificPair(form.honorific);
    try {
      await updateProfile({
        name: form.name.trim(),
        nameAr: form.nameAr.trim(),
        honorific: form.honorific,
        honorificAr: pair?.ar ?? user.honorificAr ?? "",
        company: form.company.trim(),
        phone: form.phone.trim(),
      });
      toast(c.saved, "success");
    } catch {
      toast(c.failed, "error");
    } finally {
      setSaving(false);
    }
  };

  if (!user) return null;

  return (
    <div className="space-y-6">
      <PageHeader
        title={c.profile}
        description={c.profileText}
        actions={
          <Button variant="primary" onClick={() => void save()} disabled={saving || !hasChanges}>
            <Save className="h-4 w-4" />
            {saving ? c.saving : c.save}
          </Button>
        }
      />

      <div className="grid gap-5 lg:grid-cols-[1.4fr_0.8fr]">
        <Card className="p-5 sm:p-6">
          <form
            className="grid gap-5"
            onSubmit={(event) => {
              event.preventDefault();
              void save();
            }}
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label={c.displayName} htmlFor="profile-name" required>
                <Input
                  id="profile-name"
                  value={form.name}
                  onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                  autoComplete="name"
                />
              </Field>
              <Field label={c.arabicName} htmlFor="profile-name-ar">
                <Input
                  id="profile-name-ar"
                  value={form.nameAr}
                  onChange={(event) => setForm((current) => ({ ...current, nameAr: event.target.value }))}
                  dir="rtl"
                  autoComplete="name"
                />
              </Field>
              <Field label={c.honorific} htmlFor="profile-honorific">
                <Select
                  id="profile-honorific"
                  value={form.honorific}
                  onValueChange={(value) =>
                    setForm((current) => ({ ...current, honorific: value }))
                  }
                  options={[
                    { value: "", label: c.noHonorific },
                    ...honorifics.map((item) => ({
                      value: item.value,
                      label: locale === "ar" ? `${item.ar} · ${item.label.ar}` : item.value,
                    })),
                  ]}
                />
              </Field>
              <Field label={c.phone} htmlFor="profile-phone">
                <Input
                  id="profile-phone"
                  value={form.phone}
                  onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))}
                  autoComplete="tel"
                  inputMode="tel"
                  dir="ltr"
                />
              </Field>
            </div>
            <Field label={c.company} htmlFor="profile-company">
              <Input
                id="profile-company"
                value={form.company}
                onChange={(event) => setForm((current) => ({ ...current, company: event.target.value }))}
                autoComplete="organization"
              />
            </Field>
            <div className="flex justify-end">
              <Button type="submit" variant="primary" disabled={saving || !hasChanges}>
                <Save className="h-4 w-4" />
                {saving ? c.saving : c.save}
              </Button>
            </div>
          </form>
        </Card>

        <Card className="h-fit p-5 sm:p-6">
          <div className="flex items-center gap-3">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-accent-fill text-[16px] font-extrabold text-accent-fg">
              {(form.name || user.email).slice(0, 2).toUpperCase()}
            </span>
            <div className="min-w-0">
              <p className="truncate text-[16px] font-semibold text-fg">
                {form.honorific ? `${form.honorific} ` : ""}
                {form.name || "—"}
              </p>
              <p className="truncate text-[13px] text-muted">
                {user.primaryAdmin ? (locale === "ar" ? "المسؤول الرئيسي" : "Primary admin") : user.role}
              </p>
            </div>
          </div>
          <dl className="mt-5 space-y-3 border-t border-line pt-4 text-[13px]">
            <div className="flex items-center justify-between gap-3">
              <dt className="flex items-center gap-2 text-muted">
                <Mail className="h-4 w-4" />{c.email}
              </dt>
              <dd className="truncate text-fg">{user.email}</dd>
            </div>
            <div className="flex items-center justify-between gap-3">
              <dt className="flex items-center gap-2 text-muted">
                <BadgeCheck className="h-4 w-4" />{c.account}
              </dt>
              <dd className="truncate font-mono text-[12px] text-fg">{user.accountId}</dd>
            </div>
            <div className="flex items-center justify-between gap-3">
              <dt className="flex items-center gap-2 text-muted">
                <UserRound className="h-4 w-4" />
                {locale === "ar" ? "الاسم بالعربية" : "Arabic name"}
              </dt>
              <dd className="truncate text-fg" dir="rtl">{form.nameAr || "—"}</dd>
            </div>
          </dl>
          <p className="mt-4 text-[12px] leading-relaxed text-muted">{c.privacy}</p>
        </Card>
      </div>
    </div>
  );
}

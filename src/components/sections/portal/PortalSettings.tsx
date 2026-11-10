"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowUpRight,
  Bell,
  Check,
  Globe2,
  KeyRound,
  Save,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import { useAuth } from "@/components/providers/AuthProvider";
import { useI18n } from "@/components/providers/I18nProvider";
import { PortalShell } from "@/components/sections/portal/PortalShell";
import { Field, TextInput } from "@/components/ui/Field";
import { Reveal } from "@/components/ui/Reveal";
import { cn } from "@/lib/utils";

const copy = {
  ar: {
    title: "إعدادات الحساب",
    description: "حدّث بياناتك، تفضيلات التواصل، اللغة، وأمان الحساب.",
    profile: "الملف الشخصي",
    name: "الاسم الكامل",
    email: "البريد الإلكتروني",
    company: "الشركة / الجهة",
    phone: "رقم الهاتف",
    accountId: "رقم الحساب",
    save: "حفظ التغييرات",
    saved: "تم حفظ التغييرات.",
    preferences: "تفضيلات التواصل",
    emailUpdates: "تحديثات المشروع بالبريد",
    smsUpdates: "تنبيهات عاجلة عبر SMS",
    weeklyReport: "تقرير أسبوعي مختصر",
    language: "اللغة",
    languageText: "اختر لغة الواجهة والمراسلات.",
    switchLanguage: "تبديل اللغة",
    security: "الأمان",
    currentPassword: "كلمة المرور الحالية",
    newPassword: "كلمة المرور الجديدة",
    confirmPassword: "تأكيد كلمة المرور",
    updatePassword: "تحديث كلمة المرور",
    passwordUpdated: "تم تحديث كلمة المرور (وضع تجريبي).",
    passwordMismatch: "كلمتا المرور غير متطابقتين.",
    passwordShort: "يجب أن تكون كلمة المرور ٨ أحرف على الأقل.",
    demoNotice: "هذه بوابة تجريبية. لا تُخزَّن كلمات المرور فعلياً.",
    admin: "لوحة الإدارة",
    adminText: "لديك صلاحية إدارية على مساحة العرض التجريبية.",
  },
  en: {
    title: "Account settings",
    description: "Update your details, communication preferences, language, and account security.",
    profile: "Profile",
    name: "Full name",
    email: "Email address",
    company: "Company / Entity",
    phone: "Phone number",
    accountId: "Account ID",
    save: "Save changes",
    saved: "Changes saved.",
    preferences: "Communication preferences",
    emailUpdates: "Project updates by email",
    smsUpdates: "Urgent SMS alerts",
    weeklyReport: "Weekly summary report",
    language: "Language",
    languageText: "Choose the interface and correspondence language.",
    switchLanguage: "Switch language",
    security: "Security",
    currentPassword: "Current password",
    newPassword: "New password",
    confirmPassword: "Confirm password",
    updatePassword: "Update password",
    passwordUpdated: "Password updated (demo mode).",
    passwordMismatch: "Passwords do not match.",
    passwordShort: "Password must be at least 8 characters.",
    demoNotice: "This is a demo portal. Passwords are not stored for real.",
    admin: "Admin panel",
    adminText: "You have administrative access to the demo workspace.",
  },
};

const PREFERENCES_KEY = "ahmed-elattar-portal-preferences";

export function PortalSettings() {
  const { locale, toggleLocale } = useI18n();
  const { user, updateProfile } = useAuth();
  const c = copy[locale];
  const [name, setName] = useState(user?.name ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [company, setCompany] = useState(user?.company ?? "");
  const [phone, setPhone] = useState(user?.phone ?? "");
  const [saved, setSaved] = useState(false);
  const [emailUpdates, setEmailUpdates] = useState(true);
  const [smsUpdates, setSmsUpdates] = useState(false);
  const [weeklyReport, setWeeklyReport] = useState(true);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordMessage, setPasswordMessage] = useState("");
  const [passwordError, setPasswordError] = useState("");

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(PREFERENCES_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as {
        emailUpdates?: boolean;
        smsUpdates?: boolean;
        weeklyReport?: boolean;
      };
      if (typeof parsed.emailUpdates === "boolean") setEmailUpdates(parsed.emailUpdates);
      if (typeof parsed.smsUpdates === "boolean") setSmsUpdates(parsed.smsUpdates);
      if (typeof parsed.weeklyReport === "boolean") setWeeklyReport(parsed.weeklyReport);
    } catch {
      // Ignore malformed preferences.
    }
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  const saveProfile = (event: React.FormEvent) => {
    event.preventDefault();
    updateProfile({ name, email, company, phone });
    try {
      window.localStorage.setItem(
        PREFERENCES_KEY,
        JSON.stringify({ emailUpdates, smsUpdates, weeklyReport }),
      );
    } catch {
      // Ignore storage failures.
    }
    setSaved(true);
    window.setTimeout(() => setSaved(false), 2600);
  };

  const updatePassword = (event: React.FormEvent) => {
    event.preventDefault();
    setPasswordMessage("");
    setPasswordError("");
    if (newPassword.length < 8) {
      setPasswordError(c.passwordShort);
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError(c.passwordMismatch);
      return;
    }
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setPasswordMessage(c.passwordUpdated);
    window.setTimeout(() => setPasswordMessage(""), 3200);
  };

  const isAdmin = user?.role === "admin" || user?.email === "demo@alattar.sa";

  return (
    <PortalShell title={c.title} description={c.description}>
      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <Reveal>
          <form onSubmit={saveProfile} className="border border-ink/10 bg-ivory">
            <div className="flex items-center justify-between gap-3 border-b border-ink/10 px-6 py-4">
              <span className="flex items-center gap-2 text-[0.55rem] font-semibold uppercase tracking-[0.16em] text-gold-dark">
                <UserRound className="h-4 w-4" />
                {c.profile}
              </span>
              <span className="tabular text-[0.55rem] uppercase tracking-[0.14em] text-ink/30">
                {c.accountId} · {user?.accountId}
              </span>
            </div>

            <div className="grid gap-5 p-6 sm:grid-cols-2">
              <Field label={c.name} htmlFor="settings-name" tone="light" className="sm:col-span-2">
                <TextInput
                  id="settings-name"
                  tone="light"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  required
                />
              </Field>
              <Field label={c.email} htmlFor="settings-email" tone="light">
                <TextInput
                  id="settings-email"
                  tone="light"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                />
              </Field>
              <Field label={c.phone} htmlFor="settings-phone" tone="light">
                <TextInput
                  id="settings-phone"
                  tone="light"
                  value={phone}
                  onChange={(event) => setPhone(event.target.value)}
                />
              </Field>
              <Field label={c.company} htmlFor="settings-company" tone="light" className="sm:col-span-2">
                <TextInput
                  id="settings-company"
                  tone="light"
                  value={company}
                  onChange={(event) => setCompany(event.target.value)}
                />
              </Field>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-ink/10 p-4">
              <span className="text-[0.58rem] text-ink/35">{c.demoNotice}</span>
              <button
                type="submit"
                className="inline-flex h-10 items-center gap-2 bg-gold-dark px-5 text-[0.6rem] font-semibold uppercase tracking-[0.14em] text-ivory transition-colors hover:bg-gold"
              >
                {saved ? <Check className="h-3.5 w-3.5" /> : <Save className="h-3.5 w-3.5" />}
                {saved ? c.saved : c.save}
              </button>
            </div>
          </form>
        </Reveal>

        <div className="flex flex-col gap-6">
          <Reveal delay={80}>
            <div className="border border-ink/10 bg-ivory">
              <div className="flex items-center gap-2 border-b border-ink/10 px-6 py-4 text-[0.55rem] font-semibold uppercase tracking-[0.16em] text-gold-dark">
                <Bell className="h-4 w-4" />
                {c.preferences}
              </div>
              <div className="divide-y divide-ink/8">
                {[
                  { label: c.emailUpdates, value: emailUpdates, set: setEmailUpdates },
                  { label: c.smsUpdates, value: smsUpdates, set: setSmsUpdates },
                  { label: c.weeklyReport, value: weeklyReport, set: setWeeklyReport },
                ].map((item) => (
                  <button
                    key={item.label}
                    type="button"
                    onClick={() => item.set(!item.value)}
                    className="flex w-full items-center justify-between gap-4 px-6 py-4 text-start"
                  >
                    <span className="text-[0.72rem] text-ink/65">{item.label}</span>
                    <span
                      className={cn(
                        "relative h-5 w-9 rounded-full transition-colors",
                        item.value ? "bg-gold-dark" : "bg-ink/15",
                      )}
                    >
                      <span
                        className={cn(
                          "absolute top-0.5 h-4 w-4 rounded-full bg-ivory transition-all",
                          item.value ? "start-4" : "start-0.5",
                        )}
                      />
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </Reveal>

          <Reveal delay={120}>
            <div className="border border-ink/10 bg-ivory p-6">
              <div className="flex items-center gap-2 text-[0.55rem] font-semibold uppercase tracking-[0.16em] text-gold-dark">
                <Globe2 className="h-4 w-4" />
                {c.language}
              </div>
              <p className="mt-3 text-[0.7rem] leading-relaxed text-ink/45">{c.languageText}</p>
              <div className="mt-4 flex items-center justify-between gap-3">
                <span className="text-[0.72rem] font-medium text-ink">
                  {locale === "ar" ? "العربية" : "English"}
                </span>
                <button
                  type="button"
                  onClick={toggleLocale}
                  className="inline-flex h-9 items-center gap-2 border border-ink/12 px-3 text-[0.58rem] font-semibold uppercase tracking-[0.12em] text-ink/55 transition-colors hover:border-gold-dark hover:text-gold-dark"
                >
                  {c.switchLanguage}
                  <Globe2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </Reveal>

          {isAdmin ? (
            <Reveal delay={160}>
              <Link
                href="/admin"
                className="group flex items-center justify-between gap-4 border border-gold-dark/25 bg-gold/[0.06] p-5 transition-colors hover:border-gold-dark/60"
              >
                <div>
                  <p className="flex items-center gap-2 text-[0.72rem] font-medium text-ink">
                    <ShieldCheck className="h-4 w-4 text-gold-dark" />
                    {c.admin}
                  </p>
                  <p className="mt-1 text-[0.62rem] text-ink/45">{c.adminText}</p>
                </div>
                <ArrowUpRight className="h-4 w-4 text-gold-dark transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
              </Link>
            </Reveal>
          ) : null}
        </div>
      </div>

      <Reveal delay={100}>
        <form onSubmit={updatePassword} className="mt-6 border border-ink/10 bg-ivory">
          <div className="flex items-center gap-2 border-b border-ink/10 px-6 py-4 text-[0.55rem] font-semibold uppercase tracking-[0.16em] text-gold-dark">
            <KeyRound className="h-4 w-4" />
            {c.security}
          </div>
          <div className="grid gap-5 p-6 sm:grid-cols-3">
            <Field label={c.currentPassword} htmlFor="settings-current" tone="light">
              <TextInput
                id="settings-current"
                tone="light"
                type="password"
                value={currentPassword}
                onChange={(event) => setCurrentPassword(event.target.value)}
                placeholder="••••••••"
              />
            </Field>
            <Field label={c.newPassword} htmlFor="settings-new" tone="light">
              <TextInput
                id="settings-new"
                tone="light"
                type="password"
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
                placeholder="••••••••"
              />
            </Field>
            <Field
              label={c.confirmPassword}
              htmlFor="settings-confirm"
              tone="light"
              error={passwordError || undefined}
            >
              <TextInput
                id="settings-confirm"
                tone="light"
                type="password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                placeholder="••••••••"
              />
            </Field>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-ink/10 p-4">
            <span className="text-[0.58rem] text-ink/35">{passwordMessage || c.demoNotice}</span>
            <button
              type="submit"
              className="inline-flex h-10 items-center gap-2 border border-ink/15 px-5 text-[0.6rem] font-semibold uppercase tracking-[0.14em] text-ink/60 transition-colors hover:border-gold-dark hover:text-gold-dark"
            >
              <KeyRound className="h-3.5 w-3.5" />
              {c.updatePassword}
            </button>
          </div>
        </form>
      </Reveal>
    </PortalShell>
  );
}

"use client";

import { useEffect, useRef, useState } from "react";
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
import { isAdminUser, useAuth } from "@/components/providers/AuthProvider";
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
    saving: "جارٍ الحفظ...",
    saved: "تم حفظ التغييرات.",
    saveError: "تعذر حفظ التغييرات. حاول مرة أخرى.",
    emailLocked: "لا يمكن تغيير البريد الإلكتروني من هنا. تواصل مع مدير حسابك.",
    preferences: "تفضيلات التواصل",
    emailUpdates: "تحديثات المشروع بالبريد",
    smsUpdates: "تنبيهات عاجلة عبر SMS",
    weeklyReport: "تقرير أسبوعي مختصر",
    preferencesNotice: "تُحفظ تفضيلات العرض على هذا الجهاز.",
    language: "اللغة",
    languageText: "اختر لغة الواجهة والمراسلات.",
    switchLanguage: "تبديل اللغة",
    security: "الأمان",
    currentPassword: "كلمة المرور الحالية",
    newPassword: "كلمة المرور الجديدة",
    confirmPassword: "تأكيد كلمة المرور",
    updatePassword: "تحديث كلمة المرور",
    updatingPassword: "جارٍ التحديث...",
    passwordUpdated: "تم تحديث كلمة المرور.",
    passwordError: "تعذر تحديث كلمة المرور. حاول مرة أخرى.",
    passwordCurrentRequired: "أدخل كلمة المرور الحالية.",
    passwordMismatch: "كلمتا المرور غير متطابقتين.",
    passwordShort: "استخدم ٨ أحرف على الأقل مع حرف ورقم.",
    passwordWrong: "كلمة المرور الحالية غير صحيحة.",
    passwordSame: "كلمة المرور الجديدة يجب أن تختلف عن الحالية.",
    rateLimited: "محاولات كثيرة. انتظر قليلاً ثم أعد المحاولة.",
    admin: "لوحة الإدارة",
    adminText: "لديك صلاحية إدارية على مساحة العمل.",
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
    saving: "Saving...",
    saved: "Changes saved.",
    saveError: "Could not save changes. Please try again.",
    emailLocked: "Email cannot be changed here. Contact your account manager.",
    preferences: "Communication preferences",
    emailUpdates: "Project updates by email",
    smsUpdates: "Urgent SMS alerts",
    weeklyReport: "Weekly summary report",
    preferencesNotice: "Display preferences are stored on this device.",
    language: "Language",
    languageText: "Choose the interface and correspondence language.",
    switchLanguage: "Switch language",
    security: "Security",
    currentPassword: "Current password",
    newPassword: "New password",
    confirmPassword: "Confirm password",
    updatePassword: "Update password",
    updatingPassword: "Updating...",
    passwordUpdated: "Password updated.",
    passwordError: "Could not update the password. Please try again.",
    passwordCurrentRequired: "Enter your current password.",
    passwordMismatch: "Passwords do not match.",
    passwordShort: "Use at least 8 characters with a letter and a number.",
    passwordWrong: "Current password is incorrect.",
    passwordSame: "The new password must differ from the current one.",
    rateLimited: "Too many attempts. Please wait and try again.",
    admin: "Admin panel",
    adminText: "You have administrative access to the workspace.",
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
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const savedTimer = useRef<number | null>(null);
  const passwordTimer = useRef<number | null>(null);
  const [emailUpdates, setEmailUpdates] = useState(true);
  const [smsUpdates, setSmsUpdates] = useState(false);
  const [weeklyReport, setWeeklyReport] = useState(true);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordMessage, setPasswordMessage] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [passwordSaving, setPasswordSaving] = useState(false);

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

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (!user) return;
    setName(user.name);
    setEmail(user.email);
    setCompany(user.company);
    setPhone(user.phone ?? "");
  }, [user]);
  /* eslint-enable react-hooks/set-state-in-effect */

  useEffect(() => {
    return () => {
      if (savedTimer.current) window.clearTimeout(savedTimer.current);
      if (passwordTimer.current) window.clearTimeout(passwordTimer.current);
    };
  }, []);

  const saveProfile = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setSaveError("");

    try {
      await updateProfile({ name, company, phone });
      try {
        window.localStorage.setItem(
          PREFERENCES_KEY,
          JSON.stringify({ emailUpdates, smsUpdates, weeklyReport }),
        );
      } catch {
        // Ignore storage failures.
      }
      setSaved(true);
      if (savedTimer.current) window.clearTimeout(savedTimer.current);
      savedTimer.current = window.setTimeout(() => {
        setSaved(false);
        savedTimer.current = null;
      }, 2600);
    } catch {
      setSaveError(c.saveError);
    } finally {
      setSaving(false);
    }
  };

  const updatePassword = async (event: React.FormEvent) => {
    event.preventDefault();
    setPasswordMessage("");
    setPasswordError("");

    if (!currentPassword) {
      setPasswordError(c.passwordCurrentRequired);
      return;
    }
    if (newPassword.length < 8) {
      setPasswordError(c.passwordShort);
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError(c.passwordMismatch);
      return;
    }

    setPasswordSaving(true);
    try {
      const response = await fetch("/api/auth/password", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = (await response.json().catch(() => null)) as
        | { error?: string }
        | null;

      if (!response.ok) {
        const code = data?.error;
        setPasswordError(
          code === "invalid_password"
            ? c.passwordWrong
            : code === "same_password"
              ? c.passwordSame
              : code === "weak_password"
                ? c.passwordShort
                : code === "rate_limited"
                  ? c.rateLimited
                  : c.passwordError,
        );
        return;
      }

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setPasswordMessage(c.passwordUpdated);
      if (passwordTimer.current) window.clearTimeout(passwordTimer.current);
      passwordTimer.current = window.setTimeout(() => {
        setPasswordMessage("");
        passwordTimer.current = null;
      }, 3200);
    } catch {
      setPasswordError(c.passwordError);
    } finally {
      setPasswordSaving(false);
    }
  };

  const isAdmin = isAdminUser(user);

  return (
    <PortalShell title={c.title} description={c.description}>
      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <Reveal>
          <form onSubmit={saveProfile} className="border border-white/10 bg-coal">
            <div className="flex items-center justify-between gap-3 border-b border-white/10 px-6 py-4">
              <span className="flex items-center gap-2 text-[0.55rem] font-semibold uppercase tracking-[0.16em] text-gold">
                <UserRound className="h-4 w-4" />
                {c.profile}
              </span>
              <span className="tabular text-[0.55rem] uppercase tracking-[0.14em] text-ivory/30">
                {c.accountId} · {user?.accountId}
              </span>
            </div>

            <div className="grid gap-5 p-6 sm:grid-cols-2">
              <Field label={c.name} htmlFor="settings-name" className="sm:col-span-2">
                <TextInput
                  id="settings-name"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  required
                />
              </Field>
              <Field label={c.email} htmlFor="settings-email">
                <TextInput
                  id="settings-email"
                  type="email"
                  value={email}
                  readOnly
                  aria-readonly="true"
                  title={c.emailLocked}
                  className="cursor-not-allowed bg-white/[0.03] text-ivory/45"
                  required
                />
              </Field>
              <Field label={c.phone} htmlFor="settings-phone">
                <TextInput
                  id="settings-phone"
                  value={phone}
                  onChange={(event) => setPhone(event.target.value)}
                />
              </Field>
              <Field label={c.company} htmlFor="settings-company" className="sm:col-span-2">
                <TextInput
                  id="settings-company"
                  value={company}
                  onChange={(event) => setCompany(event.target.value)}
                />
              </Field>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/10 p-4">
              <span
                role={saveError ? "alert" : "status"}
                aria-live="polite"
                className={cn("text-[0.58rem]", saveError ? "text-red-300" : "text-ivory/35")}
              >
                {saveError || (saved ? c.saved : c.preferencesNotice)}
              </span>
              <button
                type="submit"
                disabled={saving}
                className="inline-flex h-10 items-center gap-2 bg-gold px-5 text-[0.6rem] font-semibold uppercase tracking-[0.14em] text-obsidian transition-colors hover:bg-gold-light disabled:cursor-wait disabled:opacity-70"
              >
                {saved ? <Check className="h-3.5 w-3.5" /> : <Save className="h-3.5 w-3.5" />}
                {saving ? c.saving : saved ? c.saved : c.save}
              </button>
            </div>
          </form>
        </Reveal>

        <div className="flex flex-col gap-6">
          <Reveal delay={80}>
            <div className="border border-white/10 bg-coal">
              <div className="flex items-center gap-2 border-b border-white/10 px-6 py-4 text-[0.55rem] font-semibold uppercase tracking-[0.16em] text-gold">
                <Bell className="h-4 w-4" />
                {c.preferences}
              </div>
              <div className="divide-y divide-white/8">
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
                    <span className="text-[0.72rem] text-ivory/65">{item.label}</span>
                    <span
                      className={cn(
                        "relative h-5 w-9 rounded-full transition-colors",
                        item.value ? "bg-gold" : "bg-white/15",
                      )}
                    >
                      <span
                        className={cn(
                          "absolute top-0.5 h-4 w-4 rounded-full bg-obsidian transition-all",
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
            <div className="border border-white/10 bg-coal p-6">
              <div className="flex items-center gap-2 text-[0.55rem] font-semibold uppercase tracking-[0.16em] text-gold">
                <Globe2 className="h-4 w-4" />
                {c.language}
              </div>
              <p className="mt-3 text-[0.7rem] leading-relaxed text-ivory/45">{c.languageText}</p>
              <div className="mt-4 flex items-center justify-between gap-3">
                <span className="text-[0.72rem] font-medium text-ivory">
                  {locale === "ar" ? "العربية" : "English"}
                </span>
                <button
                  type="button"
                  onClick={toggleLocale}
                  className="inline-flex h-9 items-center gap-2 border border-white/12 px-3 text-[0.58rem] font-semibold uppercase tracking-[0.12em] text-ivory/55 transition-colors hover:border-gold/50 hover:text-gold"
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
                className="group flex items-center justify-between gap-4 border border-gold/25 bg-gold/[0.06] p-5 transition-colors hover:border-gold/60"
              >
                <div>
                  <p className="flex items-center gap-2 text-[0.72rem] font-medium text-ivory">
                    <ShieldCheck className="h-4 w-4 text-gold" />
                    {c.admin}
                  </p>
                  <p className="mt-1 text-[0.62rem] text-ivory/45">{c.adminText}</p>
                </div>
                <ArrowUpRight className="h-4 w-4 text-gold transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
              </Link>
            </Reveal>
          ) : null}
        </div>
      </div>

      <Reveal delay={100}>
        <form onSubmit={updatePassword} className="mt-6 border border-white/10 bg-coal">
          <div className="flex items-center gap-2 border-b border-white/10 px-6 py-4 text-[0.55rem] font-semibold uppercase tracking-[0.16em] text-gold">
            <KeyRound className="h-4 w-4" />
            {c.security}
          </div>
          <div className="grid gap-5 p-6 sm:grid-cols-3">
            <Field label={c.currentPassword} htmlFor="settings-current">
              <TextInput
                id="settings-current"
                type="password"
                value={currentPassword}
                onChange={(event) => setCurrentPassword(event.target.value)}
                autoComplete="current-password"
                placeholder="••••••••"
              />
            </Field>
            <Field label={c.newPassword} htmlFor="settings-new">
              <TextInput
                id="settings-new"
                type="password"
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
                autoComplete="new-password"
                placeholder="••••••••"
              />
            </Field>
            <Field
              label={c.confirmPassword}
              htmlFor="settings-confirm"
              error={passwordError || undefined}
            >
              <TextInput
                id="settings-confirm"
                type="password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                autoComplete="new-password"
                placeholder="••••••••"
              />
            </Field>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/10 p-4">
            <span
              role={passwordError ? "alert" : "status"}
              aria-live="polite"
              className={cn(
                "text-[0.58rem]",
                passwordError ? "text-red-300" : "text-ivory/35",
              )}
            >
              {passwordError || passwordMessage || c.preferencesNotice}
            </span>
            <button
              type="submit"
              disabled={passwordSaving}
              className="inline-flex h-10 items-center gap-2 border border-white/15 px-5 text-[0.6rem] font-semibold uppercase tracking-[0.14em] text-ivory/60 transition-colors hover:border-gold/50 hover:text-gold disabled:cursor-wait disabled:opacity-60"
            >
              <KeyRound className="h-3.5 w-3.5" />
              {passwordSaving ? c.updatingPassword : c.updatePassword}
            </button>
          </div>
        </form>
      </Reveal>
    </PortalShell>
  );
}

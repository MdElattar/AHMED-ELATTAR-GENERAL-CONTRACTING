"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowUpRight,
  Bell,
  Check,
  Fingerprint,
  Globe2,
  KeyRound,
  Loader2,
  Plus,
  Save,
  ShieldCheck,
  Trash2,
  UserRound,
} from "lucide-react";
import {
  AuthRequestError,
  isAdminUser,
  useAuth,
  type PortalPasskey,
} from "@/components/providers/AuthProvider";
import { useI18n } from "@/components/providers/I18nProvider";
import { BackupCodesPanel } from "@/components/auth/BackupCodesPanel";
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
    passkeys: "مفاتيح المرور والبصمة",
    passkeysText: "ادخل دون كلمة مرور باستخدام Face ID أو Touch ID أو مفتاح أمان. يمكنك تسجيل أكثر من جهاز.",
    addPasskey: "إضافة مفتاح مرور",
    addingPasskey: "جارٍ التسجيل...",
    noPasskeys: "لا توجد مفاتيح مرور مسجلة بعد.",
    passkeyAdded: "تم تسجيل مفتاح المرور بنجاح.",
    passkeyRemoved: "تم حذف مفتاح المرور.",
    passkeyError: "تعذر إكمال العملية. حاول مرة أخرى.",
    passkeyRemoveConfirm: "حذف مفتاح المرور هذا؟ لن تتمكن من استخدامه لتسجيل الدخول.",
    passkeyDevice: "جهاز موثوق",
    passkeyLastUsed: "آخر استخدام",
    passkeyNeverUsed: "لم يُستخدم بعد",
    passkeyCreated: "تاريخ التسجيل",
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
    passkeys: "Passkeys & biometrics",
    passkeysText: "Sign in without a password using Face ID, Touch ID, or a security key. You can register more than one device.",
    addPasskey: "Add passkey",
    addingPasskey: "Registering...",
    noPasskeys: "No passkeys registered yet.",
    passkeyAdded: "Passkey registered successfully.",
    passkeyRemoved: "Passkey removed.",
    passkeyError: "The operation could not be completed. Please try again.",
    passkeyRemoveConfirm: "Remove this passkey? You will no longer be able to use it to sign in.",
    passkeyDevice: "Trusted device",
    passkeyLastUsed: "Last used",
    passkeyNeverUsed: "Not used yet",
    passkeyCreated: "Registered",
  },
};

const PREFERENCES_KEY = "ahmed-elattar-portal-preferences";

export function PortalSettings() {
  const { locale, toggleLocale, t } = useI18n();
  const {
    user,
    updateProfile,
    listPasskeys,
    registerPasskey,
    renamePasskey,
    removePasskey,
    stepUp,
  } = useAuth();
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
  const [passkeys, setPasskeys] = useState<PortalPasskey[]>([]);
  const [passkeysLoading, setPasskeysLoading] = useState(true);
  const [passkeyBusy, setPasskeyBusy] = useState(false);
  const [passkeyMessage, setPasskeyMessage] = useState("");
  const [passkeyError, setPasskeyError] = useState("");
  const [hasBackupCodes, setHasBackupCodes] = useState(false);
  const [freshCodes, setFreshCodes] = useState<string[] | undefined>();
  const [deviceName, setDeviceName] = useState("");
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");

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
    if (!user?.email) return;
    let cancelled = false;

    listPasskeys()
      .then((result) => {
        if (!cancelled) {
          setPasskeys(result.passkeys);
          setHasBackupCodes(result.hasBackupCodes);
        }
      })
      .catch(() => {
        if (!cancelled) setPasskeyError(c.passkeyError);
      })
      .finally(() => {
        if (!cancelled) setPasskeysLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [c.passkeyError, listPasskeys, user?.email]);

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

  const refreshPasskeys = async () => {
    const result = await listPasskeys();
    setPasskeys(result.passkeys);
    setHasBackupCodes(result.hasBackupCodes);
  };

  const addPasskey = async () => {
    setPasskeyMessage("");
    setPasskeyError("");
    setPasskeyBusy(true);

    try {
      const result = await registerPasskey(
        deviceName.trim() || t.security.passkeyDevice,
      );
      setPasskeys((current) => [
        result.passkey,
        ...current.filter((item) => item.credentialId !== result.passkey.credentialId),
      ]);
      if (result.backupCodes?.length) setFreshCodes(result.backupCodes);
      setDeviceName("");
      setPasskeyMessage(t.security.passkeyAdded);
    } catch (error) {
      setPasskeyError(
        error instanceof AuthRequestError && error.code === "unavailable"
          ? t.security.enrollUnsupported
          : t.security.passkeyError,
      );
    } finally {
      setPasskeyBusy(false);
    }
  };

  const savePasskeyName = async (credentialId: string) => {
    const name = renameValue.trim();
    if (!name) return;
    setPasskeyMessage("");
    setPasskeyError("");
    setPasskeyBusy(true);
    try {
      await renamePasskey(credentialId, name);
      await refreshPasskeys();
      setRenamingId(null);
      setRenameValue("");
      setPasskeyMessage(t.security.passkeyRenamed);
    } catch {
      setPasskeyError(t.security.passkeyError);
    } finally {
      setPasskeyBusy(false);
    }
  };

  const deletePasskey = async (credentialId: string) => {
    if (!window.confirm(t.security.passkeyRemoveConfirm)) return;
    setPasskeyMessage("");
    setPasskeyError("");
    setPasskeyBusy(true);

    try {
      try {
        await removePasskey(credentialId);
      } catch (error) {
        if (error instanceof AuthRequestError && error.code === "step_up_required") {
          setPasskeyMessage(t.security.stepUpVerifying);
          await stepUp();
          await removePasskey(credentialId);
        } else {
          throw error;
        }
      }
      await refreshPasskeys();
      setPasskeyMessage(t.security.passkeyRemoved);
    } catch (error) {
      setPasskeyError(
        error instanceof AuthRequestError && error.code === "backup_codes_required"
          ? t.security.backupCodesRequired
          : t.security.passkeyError,
      );
    } finally {
      setPasskeyBusy(false);
    }
  };

  const formatPasskeyDate = (value: string) => {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return new Intl.DateTimeFormat(locale === "ar" ? "ar-SA" : "en-US", {
      dateStyle: "medium",
    }).format(date);
  };

  return (
    <PortalShell title={c.title} description={c.description}>
      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <Reveal>
          <form onSubmit={saveProfile} className="border border-line bg-surface">
            <div className="flex items-center justify-between gap-3 border-b border-line px-6 py-4">
              <span className="flex items-center gap-2 text-[0.55rem] font-semibold uppercase tracking-[0.16em] text-accent">
                <UserRound className="h-4 w-4" />
                {c.profile}
              </span>
              <span className="tabular text-[0.55rem] uppercase tracking-[0.14em] text-fg">
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
                  className="cursor-not-allowed bg-surface-2 text-fg"
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

            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line p-4">
              <span
                role={saveError ? "alert" : "status"}
                aria-live="polite"
                className={cn("text-[0.58rem]", saveError ? "text-danger" : "text-fg")}
              >
                {saveError || (saved ? c.saved : c.preferencesNotice)}
              </span>
              <button
                type="submit"
                disabled={saving}
                className="inline-flex h-10 items-center gap-2 bg-accent-fill px-5 text-[0.6rem] font-semibold uppercase tracking-[0.14em] text-accent-fg transition-colors hover:bg-accent-fill disabled:cursor-wait disabled:opacity-70"
              >
                {saved ? <Check className="h-3.5 w-3.5" /> : <Save className="h-3.5 w-3.5" />}
                {saving ? c.saving : saved ? c.saved : c.save}
              </button>
            </div>
          </form>
        </Reveal>

        <div className="flex flex-col gap-6">
          <Reveal delay={80}>
            <div className="border border-line bg-surface">
              <div className="flex items-center gap-2 border-b border-line px-6 py-4 text-[0.55rem] font-semibold uppercase tracking-[0.16em] text-accent">
                <Bell className="h-4 w-4" />
                {c.preferences}
              </div>
              <div className="divide-y divide-line">
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
                    <span className="text-[0.72rem] text-fg">{item.label}</span>
                    <span
                      className={cn(
                        "relative h-5 w-9 rounded-full transition-colors",
                        item.value ? "bg-accent-fill" : "bg-line",
                      )}
                    >
                      <span
                        className={cn(
                          "absolute top-0.5 h-4 w-4 rounded-full bg-bg transition-all",
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
            <div className="border border-line bg-surface p-6">
              <div className="flex items-center gap-2 text-[0.55rem] font-semibold uppercase tracking-[0.16em] text-accent">
                <Globe2 className="h-4 w-4" />
                {c.language}
              </div>
              <p className="mt-3 text-[0.7rem] leading-relaxed text-fg">{c.languageText}</p>
              <div className="mt-4 flex items-center justify-between gap-3">
                <span className="text-[0.72rem] font-medium text-fg">
                  {locale === "ar" ? "العربية" : "English"}
                </span>
                <button
                  type="button"
                  onClick={toggleLocale}
                  className="inline-flex h-9 items-center gap-2 border border-line px-3 text-[0.58rem] font-semibold uppercase tracking-[0.12em] text-fg transition-colors hover:border-accent/50 hover:text-accent"
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
                className="group flex items-center justify-between gap-4 border border-accent/25 bg-accent/[0.06] p-5 transition-colors hover:border-accent/60"
              >
                <div>
                  <p className="flex items-center gap-2 text-[0.72rem] font-medium text-fg">
                    <ShieldCheck className="h-4 w-4 text-accent" />
                    {c.admin}
                  </p>
                  <p className="mt-1 text-[0.62rem] text-fg">{c.adminText}</p>
                </div>
                <ArrowUpRight className="h-4 w-4 text-accent transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
              </Link>
            </Reveal>
          ) : null}
        </div>
      </div>

      <Reveal delay={100}>
        <form onSubmit={updatePassword} className="mt-6 border border-line bg-surface">
          <div className="flex items-center gap-2 border-b border-line px-6 py-4 text-[0.55rem] font-semibold uppercase tracking-[0.16em] text-accent">
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
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line p-4">
            <span
              role={passwordError ? "alert" : "status"}
              aria-live="polite"
              className={cn(
                "text-[0.58rem]",
                passwordError ? "text-danger" : "text-fg",
              )}
            >
              {passwordError || passwordMessage || c.preferencesNotice}
            </span>
            <button
              type="submit"
              disabled={passwordSaving}
              className="inline-flex h-10 items-center gap-2 border border-line px-5 text-[0.6rem] font-semibold uppercase tracking-[0.14em] text-fg transition-colors hover:border-accent/50 hover:text-accent disabled:cursor-wait disabled:opacity-60"
            >
              <KeyRound className="h-3.5 w-3.5" />
              {passwordSaving ? c.updatingPassword : c.updatePassword}
            </button>
          </div>
        </form>
      </Reveal>

      <Reveal delay={140}>
        <section className="mt-6 border border-line bg-surface" data-testid="passkey-settings">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-6 py-4">
            <div className="flex items-center gap-2 text-[0.55rem] font-semibold uppercase tracking-[0.16em] text-accent">
              <Fingerprint className="h-4 w-4" />
              {t.security.passkeysTitle}
            </div>
            <button
              type="button"
              onClick={addPasskey}
              disabled={passkeyBusy}
              data-testid="passkey-add"
              className="inline-flex min-h-11 items-center gap-2 border border-accent/35 bg-accent/[0.07] px-4 text-[0.6rem] font-semibold uppercase tracking-[0.14em] text-accent transition-colors hover:border-accent/60 hover:bg-accent/[0.12] disabled:cursor-wait disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
            >
              {passkeyBusy ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Plus className="h-3.5 w-3.5" />
              )}
              {passkeyBusy ? t.security.addingPasskey : t.security.addPasskey}
            </button>
          </div>

          <div className="p-6">
            <p className="max-w-2xl text-[0.72rem] leading-relaxed text-fg">
              {t.security.passkeysText}
            </p>

            <div className="mt-5 max-w-sm">
              <Field label={t.security.enrollDeviceLabel} htmlFor="settings-device-name">
                <TextInput
                  id="settings-device-name"
                  data-testid="passkey-device-name"
                  value={deviceName}
                  onChange={(event) => setDeviceName(event.target.value)}
                  placeholder={t.security.enrollDevicePlaceholder}
                  maxLength={80}
                  disabled={passkeyBusy}
                />
              </Field>
            </div>

            {passkeysLoading ? (
              <div className="mt-5 flex items-center gap-2 text-[0.65rem] text-fg" role="status">
                <Loader2 className="h-3.5 w-3.5 animate-spin text-accent" />
                {t.common.loading}
              </div>
            ) : passkeys.length === 0 ? (
              <div className="mt-5 flex items-center gap-3 border border-dashed border-line px-4 py-5 text-[0.68rem] text-fg">
                <Fingerprint className="h-5 w-5 text-fg" />
                {t.security.noPasskeys}
              </div>
            ) : (
              <ul className="mt-5 divide-y divide-line border border-line">
                {passkeys.map((passkey) => (
                  <li
                    key={passkey.credentialId}
                    className="flex flex-wrap items-center justify-between gap-4 px-4 py-4"
                    data-testid="passkey-item"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center border border-accent/20 bg-accent/[0.05] text-accent">
                        <Fingerprint className="h-4 w-4" />
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-[0.72rem] font-medium text-fg">
                          {passkey.deviceName ??
                            (passkey.deviceType === "multiDevice"
                              ? locale === "ar"
                                ? "مفتاح مرور متزامن"
                                : "Synced passkey"
                              : t.security.passkeyDevice)}
                          {typeof passkey.backedUp === "boolean" ? (
                            <span className="ms-2 text-[0.56rem] text-accent">
                              {passkey.backedUp ? t.security.backedUp : t.security.notBackedUp}
                            </span>
                          ) : null}
                        </p>
                        <p className="mt-1 text-[0.58rem] text-fg">
                          {t.security.passkeyCreated}: {formatPasskeyDate(passkey.createdAt)}
                          {" · "}
                          {t.security.passkeyLastUsed}:{" "}
                          {passkey.lastUsedAt
                            ? formatPasskeyDate(passkey.lastUsedAt)
                            : t.security.passkeyNeverUsed}
                        </p>
                        {renamingId === passkey.credentialId ? (
                          <div className="mt-3 flex flex-wrap items-center gap-2">
                            <TextInput
                              aria-label={t.security.renamePasskey}
                              value={renameValue}
                              onChange={(event) => setRenameValue(event.target.value)}
                              placeholder={t.security.renamePlaceholder}
                              maxLength={80}
                              data-testid="passkey-rename-input"
                            />
                            <button
                              type="button"
                              onClick={() => void savePasskeyName(passkey.credentialId)}
                              disabled={passkeyBusy || !renameValue.trim()}
                              className="inline-flex min-h-11 items-center border border-accent/40 px-3 text-[0.56rem] uppercase tracking-[0.12em] text-accent disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                              data-testid="passkey-rename-save"
                            >
                              {t.security.save}
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setRenamingId(null);
                                setRenameValue("");
                              }}
                              className="inline-flex min-h-11 items-center border border-line px-3 text-[0.56rem] uppercase tracking-[0.12em] text-fg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                            >
                              {t.security.cancel}
                            </button>
                          </div>
                        ) : null}
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setRenamingId(passkey.credentialId);
                          setRenameValue(passkey.deviceName ?? "");
                        }}
                        className="inline-flex min-h-11 items-center gap-1.5 border border-line px-3 text-[0.56rem] uppercase tracking-[0.12em] text-fg transition-colors hover:border-accent/40 hover:text-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                        data-testid="passkey-rename"
                      >
                        {t.security.rename}
                      </button>
                      <button
                        type="button"
                        onClick={() => deletePasskey(passkey.credentialId)}
                        disabled={passkeyBusy}
                        className="inline-flex min-h-11 items-center gap-1.5 border border-line px-3 text-[0.56rem] uppercase tracking-[0.12em] text-fg transition-colors hover:border-danger/35 hover:text-danger disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                        data-testid="passkey-remove"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        {t.security.remove}
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}

            <p
              role={passkeyError ? "alert" : "status"}
              aria-live="polite"
              className={cn(
                "mt-4 text-[0.6rem]",
                passkeyError ? "text-danger" : "text-fg",
              )}
            >
              {passkeyError || passkeyMessage || "\u00A0"}
            </p>
          </div>
        </section>
      </Reveal>

      <Reveal delay={180}>
        <div className="mt-6">
          <BackupCodesPanel
            codes={freshCodes}
            hasBackupCodes={hasBackupCodes}
            onCodesGenerated={(codes: string[]) => {
              setFreshCodes(codes);
              setHasBackupCodes(true);
            }}
          />
        </div>
      </Reveal>
    </PortalShell>
  );
}

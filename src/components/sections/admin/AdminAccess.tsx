"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import {
  AlertTriangle,
  Check,
  Crown,
  KeyRound,
  Loader2,
  LockKeyhole,
  MailCheck,
  RefreshCw,
  ShieldCheck,
  ShieldOff,
  UserPlus,
  Users,
} from "lucide-react";
import { useAuth } from "@/components/providers/AuthProvider";
import { useI18n } from "@/components/providers/I18nProvider";
import { Field, TextInput } from "@/components/ui/Field";
import { cn } from "@/lib/utils";

type DirectoryUser = {
  email: string;
  name: string;
  company: string;
  phone?: string;
  role: "client" | "admin";
  accountId: string;
  createdAt: string;
  lastLoginAt?: string;
};

type GrantMode = "promote" | "create";

type PendingGrant = {
  grantId: string;
  targetEmail: string;
  mode: GrantMode;
  expiresAt: string;
  devCode?: string;
};

const copy = {
  ar: {
    title: "تفويض الصلاحيات الإدارية",
    subtitle:
      "أنت المسؤول الرئيسي الوحيد المخوّل بمنح أو سحب الصلاحيات الإدارية. كل عملية تتطلب كلمة مرورك ورمز تحقق يُرسل إلى بريدك.",
    secureNote: "محمي بخطوتين: كلمة المرور + رمز البريد",
    onlyPrimary:
      "هذه الصفحة متاحة للمسؤول الرئيسي فقط. لا يمكن لبقية المدراء تعديل الصلاحيات.",
    admins: "المدراء الحاليون",
    clients: "الحسابات المسجلة",
    primary: "المسؤول الرئيسي",
    admin: "مدير",
    client: "عميل",
    promote: "ترقية حساب",
    create: "إنشاء مدير جديد",
    promoteHint: "امنح حساباً مسجلاً صلاحية إدارية دون تغيير كلمة مروره.",
    createHint: "أنشئ حساب مدير جديداً ببريد وكلمة مرور، ثم أكّد بالرمز.",
    email: "البريد الإلكتروني",
    name: "الاسم الكامل",
    company: "الشركة",
    phone: "الهاتف",
    newPassword: "كلمة مرور المدير الجديد",
    primaryPassword: "كلمة مرور المسؤول الرئيسي",
    primaryPasswordHint: "إعادة إدخال كلمة المرور مطلوبة لكل تفويض.",
    sendCode: "إرسال رمز التحقق",
    sendingCode: "جارٍ إرسال الرمز...",
    step: "الخطوة 2 من 2",
    otpTitle: "تأكيد التفويض",
    otpText: "أُرسل رمز مكوّن من 6 أرقام إلى بريد المسؤول الرئيسي. أدخله لتأكيد منح الصلاحية.",
    otpTarget: "الحساب المستهدف",
    otpCode: "رمز التحقق",
    confirm: "تأكيد ومنح الصلاحية",
    confirming: "جارٍ التأكيد...",
    cancel: "إلغاء",
    devCode: "رمز التطوير",
    devCodeHint: "لا يوجد مزود بريد في بيئة التطوير، لذا يظهر الرمز هنا.",
    revoke: "سحب الصلاحية",
    revokeConfirm: "سحب الصلاحية الإدارية من هذا الحساب؟ ستنتهي جلساته الإدارية فوراً.",
    reload: "تحديث",
    noClients: "لا توجد حسابات عملاء مسجلة بعد.",
    requestSuccess: "تم منح الصلاحية الإدارية بنجاح.",
    revokeSuccess: "تم سحب الصلاحية الإدارية فوراً.",
    loadError: "تعذر تحميل قائمة الحسابات.",
    requestError: "تعذر إرسال طلب التفويض.",
    confirmError: "رمز التحقق غير صحيح أو منتهي.",
    revokeError: "تعذر سحب الصلاحية.",
    invalidPassword: "كلمة مرور المسؤول الرئيسي غير صحيحة.",
    userNotFound: "لا يوجد حساب مسجل بهذا البريد.",
    alreadyAdmin: "هذا الحساب مدير بالفعل.",
    emailTaken: "هذا البريد مستخدم بالفعل.",
    rateLimited: "محاولات كثيرة. انتظر قليلاً ثم أعد المحاولة.",
    emailUnavailable: "خدمة البريد غير متاحة حالياً. لم يُمنح أي وصول.",
    lastLogin: "آخر دخول",
    never: "لم يدخل بعد",
    createdAt: "تاريخ الإنشاء",
    noAdmins: "لا يوجد مدراء إضافيون.",
    protected: "محمي — لا يمكن سحبه",
    accountId: "رقم الحساب",
  },
  en: {
    title: "Administrative delegation",
    subtitle:
      "You are the only primary administrator authorized to grant or revoke admin access. Every action requires your password and a verification code sent to your email.",
    secureNote: "Two-step protected: password + email code",
    onlyPrimary:
      "This screen is available to the primary administrator only. Other admins cannot change access.",
    admins: "Current administrators",
    clients: "Registered accounts",
    primary: "Primary administrator",
    admin: "Admin",
    client: "Client",
    promote: "Promote account",
    create: "Create new admin",
    promoteHint: "Grant admin access to an existing account without changing its password.",
    createHint: "Create a new admin account with an email and password, then confirm by code.",
    email: "Email address",
    name: "Full name",
    company: "Company",
    phone: "Phone",
    newPassword: "New admin password",
    primaryPassword: "Primary admin password",
    primaryPasswordHint: "Password re-entry is required for every delegation.",
    sendCode: "Send verification code",
    sendingCode: "Sending code...",
    step: "Step 2 of 2",
    otpTitle: "Confirm delegation",
    otpText:
      "A 6-digit code was sent to the primary administrator email. Enter it to confirm access.",
    otpTarget: "Target account",
    otpCode: "Verification code",
    confirm: "Confirm and grant access",
    confirming: "Confirming...",
    cancel: "Cancel",
    devCode: "Development code",
    devCodeHint: "No email provider is configured locally, so the code is shown here.",
    revoke: "Revoke access",
    revokeConfirm:
      "Revoke admin access from this account? Their admin session will end immediately.",
    reload: "Refresh",
    noClients: "No client accounts registered yet.",
    requestSuccess: "Administrative access granted.",
    revokeSuccess: "Administrative access revoked immediately.",
    loadError: "The account list could not be loaded.",
    requestError: "The delegation request could not be sent.",
    confirmError: "The verification code is invalid or expired.",
    revokeError: "Access could not be revoked.",
    invalidPassword: "The primary admin password is incorrect.",
    userNotFound: "No registered account matches this email.",
    alreadyAdmin: "This account is already an administrator.",
    emailTaken: "This email is already in use.",
    rateLimited: "Too many attempts. Please wait and try again.",
    emailUnavailable: "Email delivery is unavailable. No access was granted.",
    lastLogin: "Last sign-in",
    never: "Never signed in",
    createdAt: "Created",
    noAdmins: "No additional administrators.",
    protected: "Protected — cannot be revoked",
    accountId: "Account ID",
  },
} as const;

function formatDate(value: string | undefined, locale: "ar" | "en", fallback: string) {
  if (!value) return fallback;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return fallback;
  return new Intl.DateTimeFormat(locale === "ar" ? "ar-SA" : "en-US", {
    dateStyle: "medium",
  }).format(date);
}

export function AdminAccess() {
  const { locale } = useI18n();
  const { user } = useAuth();
  const c = copy[locale];
  const [users, setUsers] = useState<DirectoryUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [mode, setMode] = useState<GrantMode>("promote");
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [company, setCompany] = useState("");
  const [phone, setPhone] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [primaryPassword, setPrimaryPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [requestError, setRequestError] = useState("");
  const [pending, setPending] = useState<PendingGrant | null>(null);
  const [code, setCode] = useState("");
  const [confirming, setConfirming] = useState(false);
  const [confirmError, setConfirmError] = useState("");
  const [notice, setNotice] = useState("");
  const [noticeError, setNoticeError] = useState(false);
  const [busyEmail, setBusyEmail] = useState("");

  const primary = user?.primaryAdmin === true;

  const load = useCallback(async () => {
    if (!primary) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setLoadError("");

    try {
      const response = await fetch("/api/admin/access", {
        cache: "no-store",
        credentials: "same-origin",
      });
      const data: unknown = await response.json().catch(() => null);
      if (!response.ok || !data || typeof data !== "object") {
        throw new Error("load_failed");
      }
      const list = (data as { users?: unknown }).users;
      if (!Array.isArray(list)) throw new Error("load_failed");
      setUsers(
        list.filter((item): item is DirectoryUser => {
          if (!item || typeof item !== "object") return false;
          const record = item as Record<string, unknown>;
          return (
            typeof record.email === "string" &&
            typeof record.name === "string" &&
            (record.role === "admin" || record.role === "client")
          );
        }),
      );
    } catch {
      setLoadError(c.loadError);
    } finally {
      setLoading(false);
    }
  }, [c.loadError, primary]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [load]);

  const adminUsers = users.filter((item) => item.role === "admin");
  const clientUsers = users.filter((item) => item.role === "client");

  const requestGrant = async (event: FormEvent) => {
    event.preventDefault();
    setRequestError("");
    setNotice("");
    setSubmitting(true);

    try {
      const response = await fetch("/api/admin/access/request", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          primaryPassword,
          mode,
          email,
          name,
          company,
          phone,
          ...(mode === "create" ? { password: newPassword } : {}),
        }),
      });
      const data: unknown = await response.json().catch(() => null);
      const errorCode =
        data && typeof data === "object" && typeof (data as { error?: unknown }).error === "string"
          ? (data as { error: string }).error
          : "";

      if (!response.ok || !data || typeof data !== "object") {
        setRequestError(requestErrorCopy(errorCode, c));
        return;
      }

      const record = data as Record<string, unknown>;
      if (
        typeof record.grantId !== "string" ||
        typeof record.targetEmail !== "string" ||
        (record.mode !== "promote" && record.mode !== "create") ||
        typeof record.expiresAt !== "string"
      ) {
        setRequestError(c.requestError);
        return;
      }

      setPending({
        grantId: record.grantId,
        targetEmail: record.targetEmail,
        mode: record.mode,
        expiresAt: record.expiresAt,
        ...(typeof record.devCode === "string" ? { devCode: record.devCode } : {}),
      });
      setCode("");
      setPrimaryPassword("");
      setNewPassword("");
    } catch {
      setRequestError(c.requestError);
    } finally {
      setSubmitting(false);
    }
  };

  const confirmGrant = async (event: FormEvent) => {
    event.preventDefault();
    if (!pending) return;

    setConfirmError("");
    setConfirming(true);
    try {
      const response = await fetch("/api/admin/access/confirm", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ grantId: pending.grantId, code }),
      });
      const data: unknown = await response.json().catch(() => null);
      const errorCode =
        data && typeof data === "object" && typeof (data as { error?: unknown }).error === "string"
          ? (data as { error: string }).error
          : "";

      if (!response.ok) {
        setConfirmError(requestErrorCopy(errorCode || "invalid_code", c));
        return;
      }

      setPending(null);
      setCode("");
      setNewPassword("");
      setName("");
      setCompany("");
      setPhone("");
      setEmail("");
      setNoticeError(false);
      setNotice(c.requestSuccess);
      await load();
    } catch {
      setConfirmError(c.confirmError);
    } finally {
      setConfirming(false);
    }
  };

  const revoke = async (target: DirectoryUser) => {
    if (!window.confirm(c.revokeConfirm)) return;

    setBusyEmail(target.email);
    setNotice("");
    try {
      const response = await fetch("/api/admin/access/revoke", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: target.email }),
      });
      if (!response.ok) {
        setNoticeError(true);
        setNotice(c.revokeError);
        return;
      }

      setNoticeError(false);
      setNotice(c.revokeSuccess);
      await load();
    } catch {
      setNoticeError(true);
      setNotice(c.revokeError);
    } finally {
      setBusyEmail("");
    }
  };

  const startPromotion = (target: DirectoryUser) => {
    setMode("promote");
    setEmail(target.email);
    setName(target.name);
    setCompany(target.company);
    setPhone(target.phone ?? "");
    setPending(null);
    setNotice("");
    setRequestError("");
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  if (!primary) {
    return (
      <div className="flex items-start gap-3 border border-amber-500/20 bg-amber-500/[0.04] p-5">
        <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-gold" />
        <p className="text-[0.72rem] leading-relaxed text-ivory/65">{c.onlyPrimary}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header className="border border-white/10 bg-coal/70 p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-2 text-[0.52rem] font-semibold uppercase tracking-[0.18em] text-gold">
              <Crown className="h-3.5 w-3.5" />
              {c.primary}
            </span>
            <h2 className="mt-2 font-display text-2xl leading-tight text-ivory sm:text-3xl">
              {c.title}
            </h2>
            <p className="mt-2 text-[0.75rem] leading-relaxed text-ivory/60">{c.subtitle}</p>
          </div>
          <span className="inline-flex items-center gap-2 border border-gold/25 bg-gold/[0.05] px-3 py-2 text-[0.55rem] font-medium uppercase tracking-[0.12em] text-gold">
            <LockKeyhole className="h-3.5 w-3.5" />
            {c.secureNote}
          </span>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          <Stat icon={Users} label={c.clients} value={clientUsers.length} />
          <Stat icon={ShieldCheck} label={c.admins} value={adminUsers.length} />
          <Stat
            icon={MailCheck}
            label={c.step}
            value={pending ? "OTP" : "1 / 2"}
            text={pending ? pending.targetEmail : c.primaryPasswordHint}
          />
        </div>
      </header>

      {notice ? (
        <div
          role={noticeError ? "alert" : "status"}
          className={cn(
            "flex items-center gap-2 border px-4 py-3 text-[0.68rem]",
            noticeError
              ? "border-red-400/25 bg-red-400/[0.05] text-red-200"
              : "border-emerald-400/20 bg-emerald-400/[0.05] text-emerald-200",
          )}
        >
          {noticeError ? (
            <AlertTriangle className="h-4 w-4" />
          ) : (
            <Check className="h-4 w-4" />
          )}
          {notice}
        </div>
      ) : null}

      {pending ? (
        <form onSubmit={confirmGrant} className="border border-gold/25 bg-coal/70 p-5 sm:p-6">
          <div className="flex items-center gap-2 text-[0.56rem] font-semibold uppercase tracking-[0.16em] text-gold">
            <MailCheck className="h-4 w-4" />
            {c.step}
          </div>
          <h3 className="mt-3 font-display text-2xl text-ivory">{c.otpTitle}</h3>
          <p className="mt-2 max-w-2xl text-[0.72rem] leading-relaxed text-ivory/55">
            {c.otpText}
          </p>
          <div className="mt-4 flex flex-wrap gap-2 text-[0.62rem]">
            <span className="border border-white/10 px-3 py-1.5 text-ivory/50">
              {c.otpTarget}: <strong className="font-medium text-ivory/75">{pending.targetEmail}</strong>
            </span>
            <span className="border border-white/10 px-3 py-1.5 text-ivory/50">
              {pending.mode === "promote" ? c.promote : c.create}
            </span>
          </div>

          {pending.devCode ? (
            <div className="mt-4 border border-dashed border-gold/30 bg-gold/[0.04] px-4 py-3">
              <p className="text-[0.55rem] uppercase tracking-[0.14em] text-gold/70">{c.devCode}</p>
              <p className="mt-1 font-mono text-xl tracking-[0.35em] text-gold">{pending.devCode}</p>
              <p className="mt-1 text-[0.6rem] text-ivory/45">{c.devCodeHint}</p>
            </div>
          ) : null}

          <div className="mt-5 max-w-xs">
            <Field label={c.otpCode} htmlFor="admin-otp" required>
              <TextInput
                id="admin-otp"
                value={code}
                onChange={(event) =>
                  setCode(event.target.value.replace(/\D/g, "").slice(0, 6))
                }
                inputMode="numeric"
                autoComplete="one-time-code"
                placeholder="000000"
                className="text-center font-mono text-lg tracking-[0.35em]"
              />
            </Field>
          </div>

          {confirmError ? (
            <p role="alert" className="mt-3 text-[0.66rem] text-red-300">
              {confirmError}
            </p>
          ) : null}

          <div className="mt-5 flex flex-wrap gap-3">
            <button
              type="submit"
              disabled={confirming || code.length !== 6}
              className="inline-flex h-11 items-center gap-2 bg-gold px-5 text-[0.62rem] font-semibold uppercase tracking-[0.14em] text-obsidian transition-colors hover:bg-gold-light disabled:cursor-not-allowed disabled:opacity-50"
            >
              {confirming ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
              {confirming ? c.confirming : c.confirm}
            </button>
            <button
              type="button"
              onClick={() => {
                setPending(null);
                setCode("");
                setConfirmError("");
              }}
              className="inline-flex h-11 items-center border border-white/12 px-5 text-[0.62rem] font-semibold uppercase tracking-[0.14em] text-ivory/55 transition-colors hover:border-white/25 hover:text-ivory"
            >
              {c.cancel}
            </button>
          </div>
        </form>
      ) : (
        <form onSubmit={requestGrant} className="border border-white/10 bg-coal/70">
          <div className="flex flex-wrap gap-2 border-b border-white/10 p-3">
            <ModeButton
              active={mode === "promote"}
              icon={ShieldCheck}
              label={c.promote}
              onClick={() => {
                setMode("promote");
                setRequestError("");
              }}
            />
            <ModeButton
              active={mode === "create"}
              icon={UserPlus}
              label={c.create}
              onClick={() => {
                setMode("create");
                setRequestError("");
              }}
            />
          </div>

          <div className="p-5 sm:p-6">
            <p className="text-[0.72rem] leading-relaxed text-ivory/55">
              {mode === "promote" ? c.promoteHint : c.createHint}
            </p>

            <div className="mt-5 grid gap-5 sm:grid-cols-2">
              <Field label={c.email} htmlFor="delegation-email" required>
                <TextInput
                  id="delegation-email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  autoComplete="email"
                  placeholder="name@example.com"
                />
              </Field>

              {mode === "create" ? (
                <>
                  <Field label={c.name} htmlFor="delegation-name" required>
                    <TextInput
                      id="delegation-name"
                      value={name}
                      onChange={(event) => setName(event.target.value)}
                      autoComplete="name"
                    />
                  </Field>
                  <Field label={c.company} htmlFor="delegation-company">
                    <TextInput
                      id="delegation-company"
                      value={company}
                      onChange={(event) => setCompany(event.target.value)}
                      autoComplete="organization"
                    />
                  </Field>
                  <Field label={c.phone} htmlFor="delegation-phone">
                    <TextInput
                      id="delegation-phone"
                      type="tel"
                      value={phone}
                      onChange={(event) => setPhone(event.target.value)}
                      autoComplete="tel"
                    />
                  </Field>
                  <Field
                    label={c.newPassword}
                    htmlFor="delegation-password"
                    hint={locale === "ar" ? "8 أحرف على الأقل مع حرف ورقم." : "At least 8 characters with a letter and number."}
                    required
                  >
                    <TextInput
                      id="delegation-password"
                      type="password"
                      value={newPassword}
                      onChange={(event) => setNewPassword(event.target.value)}
                      autoComplete="new-password"
                    />
                  </Field>
                </>
              ) : null}

              <Field
                label={c.primaryPassword}
                htmlFor="delegation-primary-password"
                hint={c.primaryPasswordHint}
                required
              >
                <TextInput
                  id="delegation-primary-password"
                  type="password"
                  value={primaryPassword}
                  onChange={(event) => setPrimaryPassword(event.target.value)}
                  autoComplete="current-password"
                />
              </Field>
            </div>

            {requestError ? (
              <p role="alert" className="mt-4 flex items-center gap-2 text-[0.66rem] text-red-300">
                <AlertTriangle className="h-4 w-4" />
                {requestError}
              </p>
            ) : null}

            <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-4">
              <span className="inline-flex items-center gap-2 text-[0.58rem] text-ivory/40">
                <KeyRound className="h-3.5 w-3.5 text-gold/60" />
                {c.secureNote}
              </span>
              <button
                type="submit"
                disabled={submitting}
                className="inline-flex h-11 items-center gap-2 bg-gold px-5 text-[0.62rem] font-semibold uppercase tracking-[0.14em] text-obsidian transition-colors hover:bg-gold-light disabled:cursor-wait disabled:opacity-60"
              >
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <MailCheck className="h-4 w-4" />}
                {submitting ? c.sendingCode : c.sendCode}
              </button>
            </div>
          </div>
        </form>
      )}

      <section className="border border-white/10 bg-coal/70">
        <div className="flex items-center justify-between gap-3 border-b border-white/10 px-5 py-4">
          <div className="flex items-center gap-2 text-[0.56rem] font-semibold uppercase tracking-[0.16em] text-gold">
            <ShieldCheck className="h-4 w-4" />
            {c.admins}
          </div>
          <button
            type="button"
            onClick={() => void load()}
            disabled={loading}
            className="inline-flex h-10 items-center gap-1.5 border border-white/10 px-3 text-[0.56rem] uppercase tracking-[0.12em] text-ivory/50 transition-colors hover:border-gold/40 hover:text-gold disabled:opacity-50"
          >
            <RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin")} />
            {c.reload}
          </button>
        </div>

        {loadError ? (
          <p role="alert" className="px-5 py-6 text-[0.7rem] text-red-300">
            {loadError}
          </p>
        ) : loading ? (
          <div className="flex items-center gap-2 px-5 py-6 text-[0.68rem] text-ivory/45">
            <Loader2 className="h-4 w-4 animate-spin text-gold" />
            {c.reload}...
          </div>
        ) : adminUsers.length === 0 ? (
          <p className="px-5 py-6 text-[0.68rem] text-ivory/45">{c.noAdmins}</p>
        ) : (
          <ul className="divide-y divide-white/8">
            {adminUsers.map((admin) => {
              const isPrimary = admin.email === user?.email;
              return (
                <li
                  key={admin.email}
                  className="flex flex-wrap items-center justify-between gap-3 px-5 py-4"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center border border-gold/25 bg-gold/[0.06] text-gold">
                      {isPrimary ? <Crown className="h-4 w-4" /> : <ShieldCheck className="h-4 w-4" />}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-[0.75rem] font-medium text-ivory">
                        {admin.name}
                        {isPrimary ? (
                          <span className="ms-2 border border-gold/25 px-1.5 py-0.5 text-[0.48rem] uppercase tracking-[0.1em] text-gold">
                            {c.primary}
                          </span>
                        ) : null}
                      </p>
                      <p className="mt-1 truncate text-[0.6rem] text-ivory/50" dir="ltr">
                        {admin.email}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="hidden text-[0.56rem] text-ivory/38 sm:block">
                      {c.lastLogin}:{" "}
                      {formatDate(admin.lastLoginAt, locale, c.never)}
                    </span>
                    {isPrimary ? (
                      <span className="inline-flex items-center gap-1 text-[0.55rem] uppercase tracking-[0.1em] text-ivory/35">
                        <LockKeyhole className="h-3 w-3" />
                        {c.protected}
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => void revoke(admin)}
                        disabled={busyEmail === admin.email}
                        className="inline-flex h-10 items-center gap-1.5 border border-red-400/25 px-3 text-[0.55rem] uppercase tracking-[0.1em] text-red-300/80 transition-colors hover:border-red-400/50 hover:text-red-200 disabled:opacity-50"
                      >
                        {busyEmail === admin.email ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <ShieldOff className="h-3.5 w-3.5" />
                        )}
                        {c.revoke}
                      </button>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section className="border border-white/10 bg-coal/70">
        <div className="border-b border-white/10 px-5 py-4 text-[0.56rem] font-semibold uppercase tracking-[0.16em] text-gold">
          <span className="inline-flex items-center gap-2">
            <Users className="h-4 w-4" />
            {c.clients}
          </span>
        </div>

        {loading ? (
          <div className="flex items-center gap-2 px-5 py-6 text-[0.68rem] text-ivory/45">
            <Loader2 className="h-4 w-4 animate-spin text-gold" />
            {c.reload}...
          </div>
        ) : clientUsers.length === 0 ? (
          <p className="px-5 py-6 text-[0.68rem] text-ivory/45">{c.noClients}</p>
        ) : (
          <ul className="divide-y divide-white/8">
            {clientUsers.map((client) => (
              <li
                key={client.email}
                className="flex flex-wrap items-center justify-between gap-3 px-5 py-4"
              >
                <div className="min-w-0">
                  <p className="truncate text-[0.75rem] font-medium text-ivory">{client.name}</p>
                  <p className="mt-1 truncate text-[0.6rem] text-ivory/48" dir="ltr">
                    {client.email}
                    <span className="mx-2 text-ivory/15">·</span>
                    {client.company}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => startPromotion(client)}
                  className="inline-flex h-10 items-center gap-1.5 border border-gold/30 bg-gold/[0.04] px-3 text-[0.55rem] uppercase tracking-[0.1em] text-gold transition-colors hover:border-gold/55 hover:bg-gold/[0.09]"
                >
                  <UserPlus className="h-3.5 w-3.5" />
                  {c.promote}
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function Stat({
  icon: Icon,
  label,
  value,
  text,
}: {
  icon: typeof Users;
  label: string;
  value: number | string;
  text?: string;
}) {
  return (
    <div className="border border-white/10 bg-obsidian/40 px-4 py-3">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[0.52rem] uppercase tracking-[0.14em] text-ivory/45">{label}</span>
        <Icon className="h-4 w-4 text-gold/60" />
      </div>
      <p className="mt-2 font-display text-2xl leading-none text-ivory">{value}</p>
      {text ? <p className="mt-1 truncate text-[0.55rem] text-ivory/38">{text}</p> : null}
    </div>
  );
}

function ModeButton({
  active,
  icon: Icon,
  label,
  onClick,
}: {
  active: boolean;
  icon: typeof ShieldCheck;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "inline-flex h-10 items-center gap-2 border px-4 text-[0.6rem] font-semibold uppercase tracking-[0.12em] transition-colors",
        active
          ? "border-gold/45 bg-gold/[0.1] text-gold"
          : "border-white/10 text-ivory/50 hover:border-white/20 hover:text-ivory/70",
      )}
    >
      <Icon className="h-3.5 w-3.5" />
      {label}
    </button>
  );
}

function requestErrorCopy(
  code: string,
  c: (typeof copy)["ar"] | (typeof copy)["en"],
) {
  switch (code) {
    case "invalid_password":
      return c.invalidPassword;
    case "user_not_found":
      return c.userNotFound;
    case "already_admin":
      return c.alreadyAdmin;
    case "email_taken":
      return c.emailTaken;
    case "rate_limited":
      return c.rateLimited;
    case "email_unavailable":
      return c.emailUnavailable;
    case "invalid_code":
    case "expired_grant":
    case "invalid_grant":
      return c.confirmError;
    default:
      return c.requestError;
  }
}

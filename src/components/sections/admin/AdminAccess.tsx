"use client";

import {
  useCallback,
  useDeferredValue,
  useEffect,
  useState,
  type FormEvent,
} from "react";
import {
  AlertTriangle,
  Check,
  ChevronLeft,
  ChevronRight,
  Crown,
  KeyRound,
  Loader2,
  LockKeyhole,
  MailCheck,
  RefreshCw,
  Search,
  ShieldCheck,
  ShieldOff,
  Trash2,
  UserPlus,
  Users,
} from "lucide-react";
import { useAuth } from "@/components/providers/AuthProvider";
import { useI18n } from "@/components/providers/I18nProvider";
import { Field, TextInput } from "@/components/ui/Field";
import { Button } from "@/components/ui/admin";
import { ConfirmDialog, Modal } from "@/components/ui/admin/overlay";
import { cn } from "@/lib/utils";

type DirectoryUser = {
  email: string;
  name: string;
  company: string;
  phone?: string;
  role: "client" | "manager" | "admin";
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
    managers: "مدراء النظام",
    manager: "مدير نظام",
    search: "ابحث بالاسم أو البريد أو الشركة",
    allRoles: "كل الأدوار",
    roleFilter: "تصفية حسب الدور",
    hideTest: "إخفاء حسابات الاختبار",
    showTest: "عرض حسابات الاختبار",
    remove: "حذف الحساب",
    removeConfirm:
      "سيتم حذف هذا الحساب نهائياً وإبطال كل جلساته. ستبقى سجلات المشاريع والمراسلات، وسيُدوَّن الحذف في سجل التدقيق.",
    typeEmailToConfirm: "اكتب بريد الحساب للتأكيد",
    removeSuccess: "تم حذف الحساب وإبطال جلساته.",
    removeError: "تعذر حذف الحساب.",
    previous: "السابق",
    next: "التالي",
    pageOf: "صفحة",
    results: "حساب",
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
    managers: "System managers",
    manager: "System manager",
    search: "Search by name, email, or company",
    allRoles: "All roles",
    roleFilter: "Filter by role",
    hideTest: "Hide test accounts",
    showTest: "Show test accounts",
    remove: "Remove account",
    removeConfirm:
      "This permanently removes the account and invalidates its sessions. Project and inquiry records keep the historical email, and the removal is written to the audit log.",
    typeEmailToConfirm: "Type the account email to confirm",
    removeSuccess: "Account removed and sessions invalidated.",
    removeError: "The account could not be removed.",
    previous: "Previous",
    next: "Next",
    pageOf: "Page",
    results: "accounts",
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
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [counts, setCounts] = useState({ admins: 0, managers: 0, clients: 0 });
  const [roleFilter, setRoleFilter] = useState<"all" | DirectoryUser["role"]>("all");
  const [query, setQuery] = useState("");
  const [excludeTest, setExcludeTest] = useState(true);
  const deferredQuery = useDeferredValue(query);
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
  const [revokeTarget, setRevokeTarget] = useState<DirectoryUser | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<DirectoryUser | null>(null);
  const [deleteEmail, setDeleteEmail] = useState("");
  const [deletePassword, setDeletePassword] = useState("");

  const primary = user?.primaryAdmin === true;

  const load = useCallback(async () => {
    if (!primary) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setLoadError("");

    const params = new URLSearchParams({
      page: String(page),
      limit: "10",
      role: roleFilter,
      query: deferredQuery,
      excludeTest: excludeTest ? "1" : "0",
    });

    try {
      const response = await fetch(`/api/admin/access?${params.toString()}`, {
        cache: "no-store",
        credentials: "same-origin",
      });
      const data: unknown = await response.json().catch(() => null);
      if (!response.ok || !data || typeof data !== "object") {
        throw new Error("load_failed");
      }
      const record = data as Record<string, unknown>;
      const list = record.users;
      if (!Array.isArray(list)) throw new Error("load_failed");

      const number = (value: unknown, fallback: number) =>
        typeof value === "number" && Number.isFinite(value) ? value : fallback;
      const count = (value: unknown, fallback: number) => number(value, fallback);

      setUsers(
        list.filter((item): item is DirectoryUser => {
          if (!item || typeof item !== "object") return false;
          const user = item as Record<string, unknown>;
          return (
            typeof user.email === "string" &&
            typeof user.name === "string" &&
            typeof user.company === "string" &&
            typeof user.accountId === "string" &&
            typeof user.createdAt === "string" &&
            (user.role === "admin" || user.role === "manager" || user.role === "client")
          );
        }),
      );
      setPage(number(record.page, 1));
      setPages(Math.max(1, number(record.pages, 1)));
      setTotal(number(record.total, 0));
      setCounts({
        admins: count(record.admins, 0),
        managers: count(record.managers, 0),
        clients: count(record.clients, 0),
      });
    } catch {
      setLoadError(c.loadError);
    } finally {
      setLoading(false);
    }
  }, [c.loadError, deferredQuery, excludeTest, page, primary, roleFilter]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [load]);

  const adminUsers = users.filter((item) => item.role === "admin");
  const managerUsers = users.filter((item) => item.role === "manager");
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

  const removeAccount = async (target: DirectoryUser) => {
    setBusyEmail(target.email);
    setNotice("");
    try {
      const response = await fetch("/api/admin/access/remove", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: target.email,
          primaryPassword: deletePassword,
        }),
      });
      const data: unknown = await response.json().catch(() => null);
      const errorCode =
        data && typeof data === "object" && typeof (data as { error?: unknown }).error === "string"
          ? (data as { error: string }).error
          : "";

      if (!response.ok) {
        setNoticeError(true);
        setNotice(
          errorCode === "user_not_found" ? c.userNotFound : c.removeError,
        );
        return;
      }

      setDeleteTarget(null);
      setDeleteEmail("");
      setDeletePassword("");
      setNoticeError(false);
      setNotice(c.removeSuccess);
      await load();
    } catch {
      setNoticeError(true);
      setNotice(c.removeError);
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
      <div className="flex items-start gap-3 rounded-2xl border border-accent/25 bg-accent/[0.05] p-5">
        <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-accent" />
        <p className="text-[0.88rem] leading-relaxed text-fg">{c.onlyPrimary}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header className="rounded-[22px] border border-line bg-surface p-6 sm:p-7">
        <div className="flex flex-wrap items-start justify-between gap-5">
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-2 text-[0.68rem] font-semibold  text-accent">
              <Crown className="h-3.5 w-3.5" />
              {c.primary}
            </span>
            <h2 className="mt-3 text-[28px] font-bold leading-tight text-fg [font-family:var(--font-inter),var(--font-arabic),system-ui,sans-serif]">
              {c.title}
            </h2>
            <p className="mt-3 text-[0.92rem] leading-relaxed text-fg">{c.subtitle}</p>
          </div>
          <span className="inline-flex items-center gap-2 rounded-full border border-accent/25 bg-accent/[0.05] px-3.5 py-2.5 text-[0.7rem] font-medium  text-accent">
            <LockKeyhole className="h-3.5 w-3.5" />
            {c.secureNote}
          </span>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <Stat icon={Users} label={c.clients} value={counts.clients} />
          <Stat icon={ShieldCheck} label={c.admins} value={counts.admins} />
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
            "flex items-center gap-2 rounded-xl border px-4 py-3 text-[0.82rem]",
            noticeError
              ? "border-danger/25 bg-danger/[0.05] text-danger"
              : "border-success/20 bg-success/[0.05] text-success",
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
        <form onSubmit={confirmGrant} className="rounded-2xl border border-accent/25 bg-surface/70 p-5 sm:p-6">
          <div className="flex items-center gap-2 text-[0.7rem] font-semibold  text-accent">
            <MailCheck className="h-4 w-4" />
            {c.step}
          </div>
          <h3 className="mt-3 text-[28px] font-bold text-fg [font-family:var(--font-inter),var(--font-arabic),system-ui,sans-serif]">{c.otpTitle}</h3>
          <p className="mt-2 max-w-2xl text-[0.88rem] leading-relaxed text-fg">
            {c.otpText}
          </p>
          <div className="mt-4 flex flex-wrap gap-2 text-[0.76rem]">
            <span className="rounded-lg border border-line px-3 py-1.5 text-fg">
              {c.otpTarget}: <strong className="font-medium text-fg">{pending.targetEmail}</strong>
            </span>
            <span className="rounded-lg border border-line px-3 py-1.5 text-fg">
              {pending.mode === "promote" ? c.promote : c.create}
            </span>
          </div>

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
            <p role="alert" className="mt-3 text-[0.8rem] text-danger">
              {confirmError}
            </p>
          ) : null}

          <div className="mt-5 flex flex-wrap gap-3">
            <button
              type="submit"
              disabled={confirming || code.length !== 6}
              className="inline-flex h-11 items-center gap-2 rounded-[12px] bg-accent-fill px-5 text-[15px] font-bold text-accent-fg shadow-e1 transition-all hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50"
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
              className="inline-flex h-11 items-center rounded-xl border border-line px-5 text-[0.76rem] font-semibold  text-fg transition-colors hover:border-line hover:text-fg"
            >
              {c.cancel}
            </button>
          </div>
        </form>
      ) : (
        <form onSubmit={requestGrant} className="rounded-[22px] border border-line bg-surface">
          <div className="grid gap-2 border-b border-line p-3 sm:grid-cols-2">
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
            <p className="text-[0.88rem] leading-relaxed text-fg">
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
              <p role="alert" className="mt-4 flex items-center gap-2 text-[0.8rem] text-danger">
                <AlertTriangle className="h-4 w-4" />
                {requestError}
              </p>
            ) : null}

            <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4">
              <span className="inline-flex items-center gap-2 text-[0.72rem] text-fg">
                <KeyRound className="h-3.5 w-3.5 text-accent" />
                {c.secureNote}
              </span>
              <button
                type="submit"
                disabled={submitting}
                className="inline-flex h-11 items-center gap-2 rounded-[12px] bg-accent-fill px-5 text-[15px] font-bold text-accent-fg shadow-e1 transition-all hover:-translate-y-0.5 disabled:cursor-wait disabled:opacity-60"
              >
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <MailCheck className="h-4 w-4" />}
                {submitting ? c.sendingCode : c.sendCode}
              </button>
            </div>
          </div>
        </form>
      )}

      <div className="rounded-[22px] border border-line bg-surface p-5 sm:p-6">
        <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_auto_auto] md:items-center">
          <div className="relative">
            <Search
              className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-fg"
              aria-hidden="true"
            />
            <TextInput
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                setPage(1);
              }}
              placeholder={c.search}
              aria-label={c.search}
              className="ps-10"
            />
          </div>
          <select
            value={roleFilter}
            onChange={(event) => {
              setRoleFilter(event.target.value as typeof roleFilter);
              setPage(1);
            }}
            aria-label={c.roleFilter}
            className="h-11 rounded-[12px] border border-line bg-surface px-3 text-[0.78rem] text-fg"
          >
            <option value="all">{c.allRoles}</option>
            <option value="admin">{c.admin}</option>
            <option value="manager">{c.manager}</option>
            <option value="client">{c.client}</option>
          </select>
          <button
            type="button"
            aria-pressed={excludeTest}
            onClick={() => {
              setExcludeTest((value) => !value);
              setPage(1);
            }}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-[12px] border border-line px-4 text-[0.78rem] font-medium text-fg transition-colors hover:border-accent/40 hover:text-accent"
          >
            <Check className={cn("h-4 w-4", !excludeTest && "opacity-0")} aria-hidden="true" />
            {excludeTest ? c.hideTest : c.showTest}
          </button>
        </div>
      </div>

      <section className="rounded-[22px] border border-line bg-surface">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-6 py-5">
          <div className="flex items-center gap-2 text-[0.7rem] font-semibold  text-accent">
            <ShieldCheck className="h-4 w-4" />
            {c.admins}
          </div>
          <button
            type="button"
            onClick={() => void load()}
            disabled={loading}
            className="inline-flex h-10 items-center gap-1.5 rounded-xl border border-line px-3 text-[0.7rem]  text-fg transition-colors hover:border-accent/40 hover:text-accent disabled:opacity-50"
          >
            <RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin")} />
            {c.reload}
          </button>
        </div>

        {loadError ? (
          <p role="alert" className="px-6 py-7 text-[0.84rem] text-danger">
            {loadError}
          </p>
        ) : loading ? (
          <div className="flex items-center gap-2 px-6 py-7 text-[0.82rem] text-fg">
            <Loader2 className="h-4 w-4 animate-spin text-accent" />
            {c.reload}...
          </div>
        ) : adminUsers.length === 0 ? (
          <p className="px-6 py-7 text-[0.82rem] text-fg">{c.noAdmins}</p>
        ) : (
          <ul className="divide-y divide-line">
            {adminUsers.map((admin) => {
              const isPrimary = admin.email === user?.email;
              return (
                <li
                  key={admin.email}
                  className="flex flex-wrap items-center justify-between gap-3 px-6 py-5"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-accent/25 bg-accent/[0.06] text-accent">
                      {isPrimary ? <Crown className="h-4 w-4" /> : <ShieldCheck className="h-4 w-4" />}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-[0.92rem] font-medium text-fg">
                        {admin.name}
                        {isPrimary ? (
                          <span className="ms-2 rounded-full border border-accent/25 px-1.5 py-0.5 text-[0.64rem]  text-accent">
                            {c.primary}
                          </span>
                        ) : null}
                      </p>
                      <p className="mt-1 break-all text-[0.8rem] text-fg" dir="ltr">
                        {admin.email}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="hidden text-[0.7rem] text-fg sm:block">
                      {c.lastLogin}:{" "}
                      {formatDate(admin.lastLoginAt, locale, c.never)}
                    </span>
                    {isPrimary ? (
                      <span className="inline-flex items-center gap-1 text-[0.7rem]  text-fg">
                        <LockKeyhole className="h-3 w-3" />
                        {c.protected}
                      </span>
                    ) : (
                      <>
                        <button
                          type="button"
                          onClick={() => setRevokeTarget(admin)}
                          disabled={busyEmail === admin.email}
                          className="inline-flex h-10 items-center gap-1.5 rounded-xl border border-line px-3 text-[0.7rem]  text-fg transition-colors hover:border-danger/40 hover:text-danger disabled:opacity-50"
                        >
                          <ShieldOff className="h-3.5 w-3.5" />
                          {c.revoke}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setDeleteTarget(admin);
                            setDeleteEmail("");
                            setDeletePassword("");
                          }}
                          disabled={busyEmail === admin.email}
                          className="inline-flex h-10 items-center gap-1.5 rounded-xl border border-danger/25 px-3 text-[0.7rem]  text-danger transition-colors hover:border-danger/50 disabled:opacity-50"
                        >
                          {busyEmail === admin.email ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Trash2 className="h-3.5 w-3.5" />
                          )}
                          {c.remove}
                        </button>
                      </>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section className="rounded-[22px] border border-line bg-surface">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-6 py-5">
          <div className="flex items-center gap-2 text-[0.7rem] font-semibold  text-accent">
            <ShieldCheck className="h-4 w-4" />
            {c.managers}
          </div>
          <span className="text-[0.76rem] text-fg">{counts.managers}</span>
        </div>

        {loading ? (
          <div className="flex items-center gap-2 px-6 py-7 text-[0.82rem] text-fg">
            <Loader2 className="h-4 w-4 animate-spin text-accent" />
            {c.reload}...
          </div>
        ) : managerUsers.length === 0 ? (
          <p className="px-6 py-7 text-[0.82rem] text-fg">{c.noAdmins}</p>
        ) : (
          <ul className="divide-y divide-line">
            {managerUsers.map((manager) => (
              <li
                key={manager.email}
                className="flex flex-wrap items-center justify-between gap-3 px-6 py-5"
              >
                <div className="min-w-0">
                  <p className="truncate text-[0.92rem] font-medium text-fg">{manager.name}</p>
                  <p className="mt-1 break-all text-[0.8rem] text-fg" dir="ltr">
                    {manager.email}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setDeleteTarget(manager);
                    setDeleteEmail("");
                    setDeletePassword("");
                  }}
                  disabled={busyEmail === manager.email}
                  className="inline-flex h-10 items-center gap-1.5 rounded-xl border border-danger/25 px-3 text-[0.7rem]  text-danger transition-colors hover:border-danger/50 disabled:opacity-50"
                >
                  {busyEmail === manager.email ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Trash2 className="h-3.5 w-3.5" />
                  )}
                  {c.remove}
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-[22px] border border-line bg-surface">
        <div className="border-b border-line px-6 py-5 text-[0.7rem] font-semibold  text-accent">
          <span className="inline-flex items-center gap-2">
            <Users className="h-4 w-4" />
            {c.clients}
          </span>
        </div>

        {loading ? (
          <div className="flex items-center gap-2 px-6 py-7 text-[0.82rem] text-fg">
            <Loader2 className="h-4 w-4 animate-spin text-accent" />
            {c.reload}...
          </div>
        ) : clientUsers.length === 0 ? (
          <p className="px-6 py-7 text-[0.82rem] text-fg">{c.noClients}</p>
        ) : (
          <ul className="divide-y divide-line">
            {clientUsers.map((client) => (
              <li
                key={client.email}
                className="flex flex-wrap items-center justify-between gap-3 px-6 py-5"
              >
                <div className="min-w-0">
                  <p className="truncate text-[0.92rem] font-medium text-fg">{client.name}</p>
                  <p className="mt-1 break-all text-[0.8rem] text-fg" dir="ltr">
                    {client.email}
                    <span className="mx-2 text-fg">·</span>
                    {client.company}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => startPromotion(client)}
                    className="inline-flex h-10 items-center gap-1.5 rounded-xl border border-accent/30 bg-accent/[0.04] px-3 text-[0.7rem]  text-accent transition-colors hover:border-accent/55 hover:bg-accent/[0.09]"
                  >
                    <UserPlus className="h-3.5 w-3.5" />
                    {c.promote}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setDeleteTarget(client);
                      setDeleteEmail("");
                      setDeletePassword("");
                    }}
                    disabled={busyEmail === client.email}
                    className="inline-flex h-10 items-center gap-1.5 rounded-xl border border-danger/25 px-3 text-[0.7rem]  text-danger transition-colors hover:border-danger/50 disabled:opacity-50"
                  >
                    {busyEmail === client.email ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Trash2 className="h-3.5 w-3.5" />
                    )}
                    {c.remove}
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-[22px] border border-line bg-surface px-6 py-4">
        <p className="text-[0.76rem] text-fg">
          {total} {c.results} · {c.pageOf} {page} / {pages}
        </p>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setPage((value) => Math.max(1, value - 1))}
            disabled={page <= 1 || loading}
            className="inline-flex h-10 items-center gap-1.5 rounded-xl border border-line px-3 text-[0.72rem]  text-fg transition-colors hover:border-accent/40 disabled:opacity-50"
          >
            <ChevronLeft className="h-3.5 w-3.5 rtl:rotate-180" aria-hidden="true" />
            {c.previous}
          </button>
          <button
            type="button"
            onClick={() => setPage((value) => Math.min(pages, value + 1))}
            disabled={page >= pages || loading}
            className="inline-flex h-10 items-center gap-1.5 rounded-xl border border-line px-3 text-[0.72rem]  text-fg transition-colors hover:border-accent/40 disabled:opacity-50"
          >
            {c.next}
            <ChevronRight className="h-3.5 w-3.5 rtl:rotate-180" aria-hidden="true" />
          </button>
        </div>
      </div>

      <ConfirmDialog
        open={Boolean(revokeTarget)}
        onOpenChange={(open) => {
          if (!open) setRevokeTarget(null);
        }}
        title={c.revoke}
        description={c.revokeConfirm}
        confirmLabel={c.revoke}
        cancelLabel={c.cancel}
        destructive
        busy={Boolean(revokeTarget && busyEmail === revokeTarget.email)}
        onConfirm={async () => {
          if (!revokeTarget) return;
          await revoke(revokeTarget);
          setRevokeTarget(null);
        }}
      />

      <Modal
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => {
          if (!open) {
            setDeleteTarget(null);
            setDeleteEmail("");
            setDeletePassword("");
          }
        }}
        title={c.remove}
        description={deleteTarget?.email}
        size="sm"
        footer={
          <>
            <Button
              variant="ghost"
              onClick={() => {
                setDeleteTarget(null);
                setDeleteEmail("");
                setDeletePassword("");
              }}
              disabled={Boolean(deleteTarget && busyEmail === deleteTarget.email)}
            >
              {c.cancel}
            </Button>
            <Button
              variant="secondary"
              disabled={
                !deleteTarget ||
                deleteEmail.trim() !== deleteTarget.email ||
                deletePassword.length < 8 ||
                busyEmail === deleteTarget.email
              }
              className="border-danger/25 bg-danger/10 text-danger hover:border-danger/45 hover:bg-danger/15"
              onClick={() => {
                if (deleteTarget) void removeAccount(deleteTarget);
              }}
            >
              {busyEmail === deleteTarget?.email ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
              {c.remove}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <p role="alert" className="text-[13px] leading-relaxed text-danger">
            {c.removeConfirm}
          </p>
          <Field label={c.typeEmailToConfirm} htmlFor="remove-account-email" required>
            <TextInput
              id="remove-account-email"
              value={deleteEmail}
              onChange={(event) => setDeleteEmail(event.target.value)}
              autoComplete="off"
              dir="ltr"
            />
          </Field>
          <Field
            label={c.primaryPassword}
            htmlFor="remove-account-password"
            hint={c.primaryPasswordHint}
            required
          >
            <TextInput
              id="remove-account-password"
              type="password"
              value={deletePassword}
              onChange={(event) => setDeletePassword(event.target.value)}
              autoComplete="current-password"
            />
          </Field>
        </div>
      </Modal>
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
    <div className="min-w-0 rounded-2xl border border-line bg-bg/40 px-6 py-5">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[0.72rem]  text-fg">{label}</span>
        <Icon className="h-4 w-4 shrink-0 text-accent" />
      </div>
      <p className="mt-2.5 text-[28px] font-bold leading-none text-fg [font-family:var(--font-inter),var(--font-arabic),system-ui,sans-serif]">{value}</p>
      {text ? (
        <p className="mt-2 break-words text-[0.76rem] leading-relaxed text-fg">{text}</p>
      ) : null}
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
        "inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl border px-4 text-[0.74rem] font-semibold  transition-colors",
        active
          ? "border-accent/45 bg-accent/[0.1] text-accent"
          : "border-line text-fg hover:border-line hover:text-fg",
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

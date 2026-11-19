"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Check, Eye, EyeOff, Fingerprint, ShieldCheck } from "lucide-react";
import {
  AuthRequestError,
  defaultPathForRole,
  resolveRedirectTarget,
  safeNextParam,
  useAuth,
} from "@/components/providers/AuthProvider";
import { useI18n } from "@/components/providers/I18nProvider";
import { Field, TextInput } from "@/components/ui/Field";
import { BrandLogo } from "@/components/ui/BrandLogo";
import { isEmail } from "@/lib/security/validation";
import type { Dictionary } from "@/lib/dictionary";

type AuthMode = "sign-in" | "sign-up";
type AuthStatus = "idle" | "pending" | "redirecting" | "error";

type AuthPageProps = {
  mode: AuthMode;
};

/** Reads the raw `next` value; the provider performs the origin/role checks. */
function requestedNext() {
  if (typeof window === "undefined") return undefined;
  return safeNextParam(new URLSearchParams(window.location.search).get("next"));
}

function authErrorMessage(error: unknown, t: Dictionary, fallback: string) {
  if (error instanceof AuthRequestError) {
    switch (error.code) {
      case "unavailable":
        return t.auth.unavailable;
      case "rate_limited":
        return t.auth.rateLimited;
      case "cancelled":
        return t.auth.passkeyCancelled;
      case "step_up_required":
        return t.security.stepUpRequired;
      case "backup_codes_required":
        return t.security.backupCodesRequired;
      default:
        return fallback;
    }
  }
  return fallback;
}

export function AuthPage({ mode }: AuthPageProps) {
  const { t, isRTL } = useI18n();
  const {
    signIn,
    signInWithPasskey,
    signUp,
    user,
    ready,
    webAuthnSupported,
    webAuthnChecked,
    conditionalMediationAvailable,
  } = useAuth();
  const router = useRouter();

  const [name, setName] = useState("");
  const [company, setCompany] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [remember, setRemember] = useState(true);
  const [terms, setTerms] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [status, setStatus] = useState<AuthStatus>("idle");
  const [passkeyPending, setPasskeyPending] = useState(false);
  const [error, setError] = useState("");
  const formRef = useRef<HTMLFormElement>(null);
  const conditionalStarted = useRef(false);
  const lastAction = useRef<"password" | "passkey">("password");

  const isSignIn = mode === "sign-in";

  useEffect(() => {
    if (!ready || !user?.sessionVerified) return;
    router.replace(resolveRedirectTarget(defaultPathForRole(user.role), user));
  }, [ready, user, router]);

  // Conditional mediation is best-effort: it never blocks the password form.
  useEffect(() => {
    if (!isSignIn || !ready || !webAuthnChecked) return;
    if (!webAuthnSupported || !conditionalMediationAvailable) return;
    if (conditionalStarted.current) return;
    conditionalStarted.current = true;

    void (async () => {
      try {
        const result = await signInWithPasskey(
          undefined,
          remember,
          requestedNext(),
          true,
        );
        setStatus("redirecting");
        router.replace(result.redirectTo);
      } catch {
        // The user can still use the passkey button or the password form.
      }
    })();
  }, [
    isSignIn,
    ready,
    webAuthnChecked,
    webAuthnSupported,
    conditionalMediationAvailable,
    remember,
    signInWithPasskey,
    router,
  ]);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    setStatus("idle");

    if (!isEmail(email.trim())) {
      setError(t.contactPage.form.emailError);
      setStatus("error");
      return;
    }
    if (password.length < 8) {
      setError(t.auth.shortPassword);
      setStatus("error");
      return;
    }
    if (!isSignIn) {
      if (!name.trim()) {
        setError(t.contactPage.form.requiredError);
        setStatus("error");
        return;
      }
      if (password !== confirm) {
        setError(t.auth.mismatch);
        setStatus("error");
        return;
      }
      if (!terms) {
        setError(t.auth.termsError);
        setStatus("error");
        return;
      }
    }

    lastAction.current = "password";
    setStatus("pending");
    try {
      const result = isSignIn
        ? await signIn(email.trim(), password, remember, requestedNext())
        : await signUp({ name: name.trim(), email: email.trim(), company, phone, password });
      setStatus("redirecting");
      router.replace(result.redirectTo);
    } catch (error) {
      setError(authErrorMessage(error, t, t.auth.signInFailed));
      setStatus("error");
    }
  };

  const passkeySignIn = async () => {
    setError("");
    setStatus("idle");
    lastAction.current = "passkey";
    setPasskeyPending(true);
    try {
      const result = await signInWithPasskey(
        email.trim() || undefined,
        remember,
        requestedNext(),
      );
      setStatus("redirecting");
      router.replace(result.redirectTo);
    } catch (error) {
      setError(authErrorMessage(error, t, t.auth.passkeyFailed));
      setStatus("error");
    } finally {
      setPasskeyPending(false);
    }
  };

  const retry = () => {
    if (status !== "error") return;
    if (lastAction.current === "passkey") {
      void passkeySignIn();
      return;
    }
    formRef.current?.requestSubmit();
  };

  const BackIcon = isRTL ? ArrowRight : ArrowLeft;
  const ForwardIcon = isRTL ? ArrowLeft : ArrowRight;
  const pending = status === "pending" || status === "redirecting";

  return (
    <section className="relative min-h-[100svh] overflow-hidden bg-bg pt-20 text-fg">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_20%_0%,rgb(var(--accent-rgb)/0.08),transparent_55%)]" />
      <div className="blueprint-grid pointer-events-none absolute inset-0 opacity-[0.18]" />

      <div className="relative grid min-h-[calc(100svh-5rem)] lg:grid-cols-[0.95fr_1.05fr]">
        <aside className="relative hidden overflow-hidden border-e border-line bg-surface/60 p-10 lg:flex lg:flex-col lg:justify-between xl:p-14">
          <div className="pointer-events-none absolute -start-20 bottom-10 h-[420px] w-[420px] rounded-full bg-accent/[0.07] blur-[130px]" />

          <div className="relative">
            <BrandLogo tone="light" />
            <span className="mt-5 inline-flex items-center gap-2 border border-line px-3 py-1.5 text-[0.52rem] uppercase tracking-[0.18em] text-accent">
              <ShieldCheck className="h-3 w-3" />
              {t.portal.eyebrow}
            </span>
          </div>

          <div className="relative my-16">
            <span className="eyebrow">{t.portal.eyebrow}</span>
            <h2 className="display-title mt-6 max-w-md text-[clamp(2.4rem,4vw,3.8rem)] text-fg">
              {t.auth.asideTitle}
            </h2>
            <p className="mt-5 max-w-sm text-[0.9rem] leading-[1.9] text-fg">
              {t.auth.asideText}
            </p>
            <ul className="mt-8 space-y-3">
              {t.auth.asidePoints.map((point) => (
                <li key={point} className="flex items-center gap-3 text-[0.78rem] text-fg">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full border border-accent/40 text-accent">
                    <Check className="h-3 w-3" />
                  </span>
                  {point}
                </li>
              ))}
            </ul>
          </div>

          <Link
            href="/"
            className="relative inline-flex items-center gap-2 text-[0.6rem] uppercase tracking-[0.18em] text-fg transition-colors hover:text-accent"
          >
            <BackIcon className="h-3.5 w-3.5" />
            {t.auth.backHome}
          </Link>
        </aside>

        <div className="relative flex items-center justify-center px-5 py-16 sm:px-10 lg:py-20">
          <div className="relative w-full max-w-md">
            <div className="flex items-center justify-between gap-4 lg:hidden">
              <BrandLogo tone="light" />
              <Link
                href="/"
                className="inline-flex items-center gap-1.5 text-[0.58rem] uppercase tracking-[0.16em] text-fg transition-colors hover:text-accent"
              >
                <BackIcon className="h-3.5 w-3.5" />
                {t.auth.backHome}
              </Link>
            </div>

            <span className="mt-10 block text-[0.58rem] uppercase tracking-[0.2em] text-accent lg:mt-0">
              {t.portal.eyebrow}
            </span>
            <h1 className="display-title mt-4 text-[clamp(2.2rem,4vw,3.4rem)] text-fg">
              {isSignIn ? t.auth.signInTitle : t.auth.signUpTitle}
            </h1>
            <p className="mt-3 text-[0.82rem] leading-relaxed text-fg">
              {isSignIn ? t.auth.signInSubtitle : t.auth.signUpSubtitle}
            </p>

            {pending ? (
              <p
                role="status"
                aria-live="polite"
                data-testid="auth-pending"
                className="guard-inline-status mt-5"
              >
                <span className="guard-spinner" aria-hidden="true" />
                {t.auth.signingInRedirect}
              </p>
            ) : null}

            <form
              ref={formRef}
              onSubmit={submit}
              className="mt-8 flex flex-col gap-5"
              noValidate
            >
              {!isSignIn ? (
                <div className="grid gap-5 sm:grid-cols-2">
                  <Field label={t.auth.name} htmlFor="auth-name" required>
                    <TextInput
                      id="auth-name"
                      value={name}
                      onChange={(event) => setName(event.target.value)}
                      autoComplete="name"
                    />
                  </Field>
                  <Field label={t.auth.company} htmlFor="auth-company">
                    <TextInput
                      id="auth-company"
                      value={company}
                      onChange={(event) => setCompany(event.target.value)}
                      autoComplete="organization"
                    />
                  </Field>
                </div>
              ) : null}

              <Field label={t.auth.email} htmlFor="auth-email" required>
                <TextInput
                  id="auth-email"
                  data-testid="auth-email"
                  type="email"
                  dir="ltr"
                  className="text-start"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  autoComplete={isSignIn ? "username webauthn" : "email"}
                  placeholder="name@company.com"
                />
              </Field>

              {!isSignIn ? (
                <Field label={t.auth.phone} htmlFor="auth-phone">
                  <TextInput
                    id="auth-phone"
                    type="tel"
                    dir="ltr"
                    className="text-start"
                    value={phone}
                    onChange={(event) => setPhone(event.target.value)}
                    autoComplete="tel"
                  />
                </Field>
              ) : null}

              <Field label={t.auth.password} htmlFor="auth-password" required>
                <div className="relative">
                  <TextInput
                    id="auth-password"
                    data-testid="auth-password"
                    type={showPassword ? "text" : "password"}
                    dir="ltr"
                    className="pe-11 text-start"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    autoComplete={isSignIn ? "current-password" : "new-password"}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((current) => !current)}
                    aria-label={showPassword ? t.auth.hidePassword : t.auth.showPassword}
                    className="absolute end-3 top-1/2 flex min-h-11 min-w-11 -translate-y-1/2 items-center justify-center text-fg transition-colors hover:text-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </Field>

              {!isSignIn ? (
                <Field label={t.auth.confirmPassword} htmlFor="auth-confirm" required>
                  <TextInput
                    id="auth-confirm"
                    type={showPassword ? "text" : "password"}
                    dir="ltr"
                    className="text-start"
                    value={confirm}
                    onChange={(event) => setConfirm(event.target.value)}
                    autoComplete="new-password"
                  />
                </Field>
              ) : null}

              {isSignIn ? (
                <div className="flex items-center justify-between gap-4">
                  <label className="flex min-h-11 cursor-pointer items-center gap-2 text-[0.72rem] text-fg">
                    <input
                      type="checkbox"
                      checked={remember}
                      onChange={(event) => setRemember(event.target.checked)}
                      className="h-4 w-4 accent-accent"
                    />
                    {t.auth.remember}
                  </label>
                  <Link
                    href="/forgot-password"
                    className="text-[0.68rem] text-fg underline-offset-4 transition-colors hover:text-accent hover:underline"
                  >
                    {t.auth.forgot}
                  </Link>
                </div>
              ) : (
                <label className="flex cursor-pointer items-start gap-2.5 text-[0.72rem] leading-relaxed text-fg">
                  <input
                    type="checkbox"
                    checked={terms}
                    onChange={(event) => setTerms(event.target.checked)}
                    className="mt-0.5 h-4 w-4 shrink-0 accent-accent"
                  />
                  {t.auth.terms}
                </label>
              )}

              {error ? (
                <div
                  className="border border-danger/25 bg-danger/[0.06] px-4 py-3"
                  role="alert"
                  data-testid="auth-error"
                >
                  <p className="text-[0.72rem] text-danger">{error}</p>
                  <button
                    type="button"
                    onClick={retry}
                    data-testid="auth-retry"
                    className="mt-3 inline-flex min-h-11 items-center gap-2 border border-danger/40 px-4 text-[0.62rem] font-semibold uppercase tracking-[0.14em] text-danger transition-colors hover:border-danger/70 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                  >
                    {t.auth.retry}
                  </button>
                </div>
              ) : null}

              <button
                type="submit"
                data-testid="auth-submit"
                disabled={pending}
                className="btn-shine mt-1 inline-flex min-h-12 items-center justify-center gap-2.5 bg-accent-fill px-6 text-[0.65rem] font-semibold uppercase tracking-[0.16em] text-accent-fg transition-colors hover:bg-accent-fill disabled:cursor-wait disabled:opacity-70 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
              >
                {status === "pending"
                  ? isSignIn
                    ? t.auth.signingIn
                    : t.auth.signingUp
                  : passkeyPending
                    ? t.auth.signingInWithPasskey
                    : isSignIn
                      ? t.auth.signIn
                      : t.auth.signUp}
                {pending ? null : <ForwardIcon className="h-3.5 w-3.5" />}
              </button>
            </form>

            {isSignIn ? (
              <div className="mt-5">
                <div className="flex items-center gap-3 text-[0.52rem] uppercase tracking-[0.18em] text-fg">
                  <span className="h-px flex-1 bg-line" />
                  {t.auth.or}
                  <span className="h-px flex-1 bg-line" />
                </div>
                <button
                  type="button"
                  data-testid="passkey-sign-in"
                  onClick={passkeySignIn}
                  disabled={passkeyPending || pending || (webAuthnChecked && !webAuthnSupported)}
                  className="mt-4 inline-flex min-h-12 w-full items-center justify-center gap-2.5 border border-accent/30 bg-accent/[0.06] px-6 text-[0.65rem] font-semibold uppercase tracking-[0.16em] text-accent transition-colors hover:border-accent/60 hover:bg-accent/[0.1] disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                >
                  <Fingerprint className="h-4 w-4" />
                  {passkeyPending ? t.auth.verifyingPasskey : t.auth.passkeySignIn}
                </button>
                {webAuthnChecked && !webAuthnSupported ? (
                  <p
                    role="status"
                    data-testid="webauthn-unsupported"
                    className="mt-3 text-center text-[0.62rem] leading-relaxed text-accent"
                  >
                    {t.auth.webAuthnUnsupported} {t.auth.webAuthnHint}
                  </p>
                ) : (
                  <p className="mt-3 text-center text-[0.6rem] leading-relaxed text-fg">
                    {conditionalMediationAvailable
                      ? t.auth.conditionalHint
                      : t.security.passkeysText}
                  </p>
                )}
              </div>
            ) : null}

            <p className="mt-7 text-center text-[0.75rem] text-fg">
              {isSignIn ? t.auth.noAccount : t.auth.haveAccount}{" "}
              <Link
                href={isSignIn ? "/sign-up" : "/sign-in"}
                className="font-semibold text-accent underline-offset-4 hover:underline"
              >
                {isSignIn ? t.auth.createAccount : t.auth.signInLink}
              </Link>
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

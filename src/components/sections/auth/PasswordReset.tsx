"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  MailCheck,
  ShieldCheck,
} from "lucide-react";
import { useI18n } from "@/components/providers/I18nProvider";
import { Field, TextInput } from "@/components/ui/Field";

type ResetMode = "request" | "reset";
type Step = "email" | "code" | "password" | "done";

type PasswordResetProps = {
  mode: ResetMode;
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function PasswordReset({ mode }: PasswordResetProps) {
  const { t, isRTL, locale } = useI18n();
  const router = useRouter();

  const [step, setStep] = useState<Step>(mode === "reset" ? "password" : "email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState("");
  const [devCode, setDevCode] = useState("");

  const BackIcon = isRTL ? ArrowRight : ArrowLeft;
  const ForwardIcon = isRTL ? ArrowLeft : ArrowRight;

  const requestCode = async () => {
    const response = await fetch("/api/auth/forgot-password", {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: email.trim().toLowerCase(), locale }),
    });
    const data = (await response.json().catch(() => ({}))) as {
      devCode?: unknown;
      error?: unknown;
    };

    if (!response.ok) {
      setError(
        response.status === 429 ? t.auth.otpRateLimited : t.auth.otpEmailUnavailable,
      );
      return false;
    }

    setDevCode(typeof data.devCode === "string" ? data.devCode : "");
    return true;
  };

  const submitEmail = async (event: FormEvent) => {
    event.preventDefault();
    setError("");

    if (!EMAIL_PATTERN.test(email.trim())) {
      setError(t.contactPage.form.emailError);
      return;
    }

    setLoading(true);
    try {
      if (await requestCode()) {
        setCode("");
        setStep("code");
      }
    } catch {
      setError(t.auth.otpEmailUnavailable);
    } finally {
      setLoading(false);
    }
  };

  const resend = async () => {
    setError("");
    setResending(true);
    try {
      if (await requestCode()) setCode("");
    } catch {
      setError(t.auth.otpEmailUnavailable);
    } finally {
      setResending(false);
    }
  };

  const submitCode = async (event: FormEvent) => {
    event.preventDefault();
    setError("");

    const normalized = code.replace(/\D/g, "");
    if (normalized.length !== 6) {
      setError(t.auth.otpInvalid);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/auth/verify-otp", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase(), code: normalized }),
      });
      const data = (await response.json().catch(() => ({}))) as { error?: unknown };

      if (!response.ok) {
        if (response.status === 410) setError(t.auth.otpExpired);
        else if (response.status === 429) setError(t.auth.otpTooMany);
        else setError(t.auth.otpInvalid);
        return;
      }

      void data;
      router.push("/reset-password");
    } catch {
      setError(t.auth.otpInvalid);
    } finally {
      setLoading(false);
    }
  };

  const submitPassword = async (event: FormEvent) => {
    event.preventDefault();
    setError("");

    if (password.length < 8) {
      setError(t.auth.shortPassword);
      return;
    }
    if (password !== confirm) {
      setError(t.auth.mismatch);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      if (!response.ok) {
        setError(
          response.status === 401 ? t.auth.resetLinkInvalid : t.auth.otpEmailUnavailable,
        );
        return;
      }

      setStep("done");
    } catch {
      setError(t.auth.otpEmailUnavailable);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="relative min-h-[100svh] overflow-hidden bg-obsidian pt-20 text-ivory">
      <div className="grid min-h-[calc(100svh-5rem)] lg:grid-cols-[0.95fr_1.05fr]">
        <aside className="relative hidden overflow-hidden border-e border-white/10 bg-coal/60 p-10 text-ivory lg:flex lg:flex-col lg:justify-between xl:p-14">
          <div className="blueprint-grid pointer-events-none absolute inset-0 opacity-40" />
          <div className="pointer-events-none absolute -start-20 bottom-10 h-[420px] w-[420px] rounded-full bg-gold/[0.07] blur-[130px]" />

          <div className="relative">
            <span className="inline-flex items-center gap-2 border border-white/10 px-3 py-1.5 text-[0.52rem] uppercase tracking-[0.18em] text-gold/80">
              <ShieldCheck className="h-3 w-3" />
              {locale === "ar" ? "استعادة آمنة" : "Secure recovery"}
            </span>
          </div>

          <div className="relative my-16">
            <span className="eyebrow">{t.portal.eyebrow}</span>
            <h2 className="display-title mt-6 max-w-md text-[clamp(2.4rem,4vw,3.8rem)] text-ivory">
              {t.auth.asideTitle}
            </h2>
            <p className="mt-5 max-w-sm text-[0.9rem] leading-[1.9] text-ivory/50">
              {t.auth.asideText}
            </p>
            <ul className="mt-8 space-y-3">
              {t.auth.asidePoints.map((point) => (
                <li key={point} className="flex items-center gap-3 text-[0.78rem] text-ivory/60">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full border border-gold/40 text-gold">
                    <Check className="h-3 w-3" />
                  </span>
                  {point}
                </li>
              ))}
            </ul>
          </div>

          <Link
            href="/"
            className="relative inline-flex items-center gap-2 text-[0.6rem] uppercase tracking-[0.18em] text-ivory/40 transition-colors hover:text-gold"
          >
            <BackIcon className="h-3.5 w-3.5" />
            {t.auth.backHome}
          </Link>
        </aside>

        <div className="relative flex items-center justify-center px-5 py-16 sm:px-10 lg:py-20">
          <div className="blueprint-grid pointer-events-none absolute inset-0 opacity-[0.18]" />
          <div className="relative w-full max-w-md">
            <div className="flex items-center justify-between gap-4 lg:hidden">
              <span className="text-[0.55rem] uppercase tracking-[0.18em] text-gold/70">
                {t.portal.eyebrow}
              </span>
              <Link
                href="/"
                className="inline-flex items-center gap-1.5 text-[0.58rem] uppercase tracking-[0.16em] text-ivory/40 transition-colors hover:text-gold"
              >
                <BackIcon className="h-3 w-3" />
                {t.auth.backHome}
              </Link>
            </div>

            <span className="mt-10 block text-[0.58rem] uppercase tracking-[0.2em] text-gold lg:mt-0">
              {t.portal.eyebrow}
            </span>

            {step === "code" ? (
              <div className="mt-6">
                <span className="flex h-14 w-14 items-center justify-center rounded-full border border-gold/30 bg-gold/[0.06] text-gold">
                  <MailCheck className="h-6 w-6" />
                </span>
                <h1 className="display-title mt-7 text-[clamp(2.2rem,4vw,3.4rem)] text-ivory">
                  {t.auth.otpSentTitle}
                </h1>
                <p className="mt-4 text-[0.85rem] leading-relaxed text-ivory/55">
                  {t.auth.otpSentText}{" "}
                  <span className="font-semibold text-ivory" dir="ltr">
                    {email}
                  </span>
                  .
                </p>

                {devCode ? (
                  <div className="mt-5 border border-gold/25 bg-gold/[0.05] px-4 py-3">
                    <p className="text-[0.6rem] uppercase tracking-[0.16em] text-gold">
                      {t.auth.otpDevHint}
                    </p>
                    <button
                      type="button"
                      onClick={() => setCode(devCode)}
                      className="mt-1 font-mono text-lg tracking-[0.35em] text-ivory transition-colors hover:text-gold"
                    >
                      {devCode}
                    </button>
                  </div>
                ) : null}

                <form onSubmit={submitCode} className="mt-7 flex flex-col gap-5" noValidate>
                  <Field label={t.auth.otpCode} htmlFor="reset-code" required >
                    <TextInput
                      id="reset-code"

                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={6}
                      autoComplete="one-time-code"
                      dir="ltr"
                      value={code}
                      onChange={(event) =>
                        setCode(event.target.value.replace(/\D/g, "").slice(0, 6))
                      }
                      className="text-center font-mono text-xl tracking-[0.5em]"
                      placeholder="000000"
                    />
                  </Field>

                  {error ? (
                    <p
                      className="border border-red-400/25 bg-red-400/[0.06] px-4 py-3 text-[0.72rem] text-red-300"
                      role="alert"
                    >
                      {error}
                    </p>
                  ) : null}

                  <button
                    type="submit"
                    disabled={loading || code.length !== 6}
                    className="btn-shine inline-flex h-12 items-center justify-center gap-2.5 bg-gold px-6 text-[0.65rem] font-semibold uppercase tracking-[0.16em] text-obsidian transition-colors hover:bg-gold-light disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        {t.auth.otpVerifying}
                      </>
                    ) : (
                      <>
                        {t.auth.otpVerify}
                        <ForwardIcon className="h-3.5 w-3.5" />
                      </>
                    )}
                  </button>
                </form>

                <div className="mt-6 flex flex-wrap items-center justify-between gap-3 text-[0.72rem]">
                  <button
                    type="button"
                    onClick={resend}
                    disabled={resending}
                    className="inline-flex items-center gap-2 text-ivory/45 transition-colors hover:text-gold disabled:opacity-50"
                  >
                    {resending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
                    {resending ? t.auth.otpResending : t.auth.otpResend}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setStep("email");
                      setError("");
                      setDevCode("");
                      setCode("");
                    }}
                    className="text-ivory/45 transition-colors hover:text-gold"
                  >
                    {t.auth.otpChangeEmail}
                  </button>
                </div>
              </div>
            ) : step === "done" ? (
              <div className="mt-6">
                <span className="flex h-14 w-14 items-center justify-center rounded-full border border-gold/30 bg-gold/[0.06] text-gold">
                  <ShieldCheck className="h-6 w-6" />
                </span>
                <h1 className="display-title mt-7 text-[clamp(2.2rem,4vw,3.4rem)] text-ivory">
                  {t.auth.resetSuccessTitle}
                </h1>
                <p className="mt-4 text-[0.85rem] leading-relaxed text-ivory/55">
                  {t.auth.resetSuccessText}
                </p>
                <Link
                  href="/sign-in"
                  className="btn-shine mt-8 inline-flex h-12 w-full items-center justify-center gap-2.5 bg-gold px-6 text-[0.65rem] font-semibold uppercase tracking-[0.16em] text-obsidian transition-colors hover:bg-gold-light"
                >
                  {t.auth.backToSignIn}
                  <ForwardIcon className="h-3.5 w-3.5" />
                </Link>
              </div>
            ) : (
              <>
                <h1 className="display-title mt-4 text-[clamp(2.2rem,4vw,3.4rem)] text-ivory">
                  {step === "email" ? t.auth.forgotTitle : t.auth.resetTitle}
                </h1>
                <p className="mt-3 text-[0.82rem] leading-relaxed text-ivory/50">
                  {step === "email" ? t.auth.forgotSubtitle : t.auth.resetSubtitle}
                </p>

                {step === "email" ? (
                  <form onSubmit={submitEmail} className="mt-8 flex flex-col gap-5" noValidate>
                    <Field label={t.auth.email} htmlFor="reset-email" required >
                      <TextInput
                        id="reset-email"

                        type="email"
                        dir="ltr"
                        className="text-start"
                        value={email}
                        onChange={(event) => setEmail(event.target.value)}
                        autoComplete="email"
                        placeholder="name@company.com"
                      />
                    </Field>

                    {error ? (
                      <p
                        className="border border-red-400/25 bg-red-400/[0.06] px-4 py-3 text-[0.72rem] text-red-300"
                        role="alert"
                      >
                        {error}
                      </p>
                    ) : null}

                    <button
                      type="submit"
                      disabled={loading}
                      className="btn-shine mt-1 inline-flex h-12 items-center justify-center gap-2.5 bg-gold px-6 text-[0.65rem] font-semibold uppercase tracking-[0.16em] text-obsidian transition-colors hover:bg-gold-light disabled:cursor-wait disabled:opacity-70"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          {t.auth.sendingReset}
                        </>
                      ) : (
                        <>
                          {t.auth.sendReset}
                          <ForwardIcon className="h-3.5 w-3.5" />
                        </>
                      )}
                    </button>
                  </form>
                ) : (
                  <form
                    onSubmit={submitPassword}
                    className="mt-8 flex flex-col gap-5"
                    noValidate
                  >
                    <Field
                      label={t.auth.newPassword}
                      htmlFor="reset-password"
                      required

                      hint={t.auth.shortPassword}
                    >
                      <div className="relative">
                        <TextInput
                          id="reset-password"

                          type={showPassword ? "text" : "password"}
                          dir="ltr"
                          className="pe-11 text-start"
                          value={password}
                          onChange={(event) => setPassword(event.target.value)}
                          autoComplete="new-password"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword((current) => !current)}
                          aria-label={showPassword ? "Hide password" : "Show password"}
                          className="absolute end-3 top-1/2 -translate-y-1/2 text-ivory/35 transition-colors hover:text-ivory/70"
                        >
                          {showPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </Field>

                    <Field
                      label={t.auth.confirmPassword}
                      htmlFor="reset-confirm"
                      required

                    >
                      <TextInput
                        id="reset-confirm"

                        type={showPassword ? "text" : "password"}
                        dir="ltr"
                        className="text-start"
                        value={confirm}
                        onChange={(event) => setConfirm(event.target.value)}
                        autoComplete="new-password"
                      />
                    </Field>

                    {error ? (
                      <div
                        className="border border-red-400/25 bg-red-400/[0.06] px-4 py-3 text-[0.72rem] text-red-300"
                        role="alert"
                      >
                        <p>{error}</p>
                        {error === t.auth.resetLinkInvalid ? (
                          <Link
                            href="/forgot-password"
                            className="mt-2 inline-flex items-center gap-1.5 font-semibold underline underline-offset-4"
                          >
                            <KeyRound className="h-3 w-3" />
                            {t.auth.resetStartOver}
                          </Link>
                        ) : null}
                      </div>
                    ) : null}

                    <button
                      type="submit"
                      disabled={loading}
                      className="btn-shine mt-1 inline-flex h-12 items-center justify-center gap-2.5 bg-gold px-6 text-[0.65rem] font-semibold uppercase tracking-[0.16em] text-obsidian transition-colors hover:bg-gold-light disabled:cursor-wait disabled:opacity-70"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          {t.auth.resetting}
                        </>
                      ) : (
                        <>
                          {t.auth.resetPassword}
                          <ForwardIcon className="h-3.5 w-3.5" />
                        </>
                      )}
                    </button>
                  </form>
                )}

                <Link
                  href="/sign-in"
                  className="mt-6 flex items-center justify-center gap-2 text-[0.72rem] text-ivory/45 transition-colors hover:text-gold"
                >
                  <BackIcon className="h-3.5 w-3.5" />
                  {t.auth.backToSignIn}
                </Link>
              </>
            )}

            {step === "email" ? (
              <p className="mt-4 text-center text-[0.72rem] text-ivory/45">
                {t.auth.haveAccount}{" "}
                <Link
                  href="/sign-in"
                  className="font-semibold text-gold underline-offset-4 hover:underline"
                >
                  {t.auth.signInLink}
                </Link>
              </p>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}

"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Eye,
  EyeOff,
  MailCheck,
  ShieldCheck,
} from "lucide-react";
import { useI18n } from "@/components/providers/I18nProvider";
import { Field, TextInput } from "@/components/ui/Field";
import { Logo } from "@/components/ui/Logo";

type ResetMode = "request" | "reset";

type PasswordResetProps = {
  mode: ResetMode;
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function PasswordReset({ mode }: PasswordResetProps) {
  const { t, isRTL } = useI18n();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);
  const [done, setDone] = useState(false);

  const isRequest = mode === "request";
  const BackIcon = isRTL ? ArrowRight : ArrowLeft;
  const ForwardIcon = isRTL ? ArrowLeft : ArrowRight;

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError("");

    if (isRequest) {
      if (!EMAIL_PATTERN.test(email.trim())) {
        setError(t.contactPage.form.emailError);
        return;
      }
    } else {
      if (password.length < 8) {
        setError(t.auth.shortPassword);
        return;
      }
      if (password !== confirm) {
        setError(t.auth.mismatch);
        return;
      }
    }

    setLoading(true);
    try {
      await new Promise((resolve) => window.setTimeout(resolve, 900));
      if (isRequest) {
        setSent(true);
      } else {
        setDone(true);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="relative min-h-[100svh] overflow-hidden bg-ivory pt-20 text-ink">
      <div className="grid min-h-[calc(100svh-5rem)] lg:grid-cols-[0.95fr_1.05fr]">
        <aside className="relative hidden overflow-hidden bg-obsidian p-10 text-ivory lg:flex lg:flex-col lg:justify-between xl:p-14">
          <div className="blueprint-grid pointer-events-none absolute inset-0 opacity-40" />
          <div className="pointer-events-none absolute -start-20 bottom-10 h-[420px] w-[420px] rounded-full bg-gold/[0.07] blur-[130px]" />

          <div className="relative">
            <Logo />
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
          <div className="pointer-events-none absolute inset-0 opacity-[0.35] [background-image:linear-gradient(rgba(10,11,14,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(10,11,14,0.03)_1px,transparent_1px)] [background-size:80px_80px]" />
          <div className="relative w-full max-w-md">
            <div className="flex items-center justify-between gap-4 lg:hidden">
              <Logo tone="dark" />
              <Link
                href="/"
                className="inline-flex items-center gap-1.5 text-[0.58rem] uppercase tracking-[0.16em] text-ink/40"
              >
                <BackIcon className="h-3 w-3" />
                {t.auth.backHome}
              </Link>
            </div>

            <span className="mt-10 block text-[0.58rem] uppercase tracking-[0.2em] text-gold-dark lg:mt-0">
              {t.portal.eyebrow}
            </span>

            {isRequest && sent ? (
              <div className="mt-6">
                <span className="flex h-14 w-14 items-center justify-center rounded-full border border-gold-dark/30 bg-gold-dark/[0.06] text-gold-dark">
                  <MailCheck className="h-6 w-6" />
                </span>
                <h1 className="display-title mt-7 text-[clamp(2.2rem,4vw,3.4rem)] text-ink">
                  {t.auth.resetSentTitle}
                </h1>
                <p className="mt-4 text-[0.85rem] leading-relaxed text-ink/55">
                  {t.auth.resetSentText}{" "}
                  <span className="font-semibold text-ink" dir="ltr">
                    {email}
                  </span>
                  .
                </p>
                <p className="mt-3 text-[0.72rem] leading-relaxed text-ink/40">
                  {t.auth.resetSentNote}
                </p>
                <Link
                  href="/reset-password?token=demo"
                  className="btn-shine mt-8 inline-flex h-12 w-full items-center justify-center gap-2.5 bg-ink px-6 text-[0.65rem] font-semibold uppercase tracking-[0.16em] text-ivory transition-colors hover:bg-gold-dark"
                >
                  {t.auth.openResetDemo}
                  <ForwardIcon className="h-3.5 w-3.5" />
                </Link>
                <Link
                  href="/sign-in"
                  className="mt-5 flex items-center justify-center gap-2 text-[0.72rem] text-ink/45 transition-colors hover:text-gold-dark"
                >
                  <BackIcon className="h-3.5 w-3.5" />
                  {t.auth.backToSignIn}
                </Link>
              </div>
            ) : !isRequest && done ? (
              <div className="mt-6">
                <span className="flex h-14 w-14 items-center justify-center rounded-full border border-gold-dark/30 bg-gold-dark/[0.06] text-gold-dark">
                  <ShieldCheck className="h-6 w-6" />
                </span>
                <h1 className="display-title mt-7 text-[clamp(2.2rem,4vw,3.4rem)] text-ink">
                  {t.auth.resetSuccessTitle}
                </h1>
                <p className="mt-4 text-[0.85rem] leading-relaxed text-ink/55">
                  {t.auth.resetSuccessText}
                </p>
                <Link
                  href="/sign-in"
                  className="btn-shine mt-8 inline-flex h-12 w-full items-center justify-center gap-2.5 bg-ink px-6 text-[0.65rem] font-semibold uppercase tracking-[0.16em] text-ivory transition-colors hover:bg-gold-dark"
                >
                  {t.auth.backToSignIn}
                  <ForwardIcon className="h-3.5 w-3.5" />
                </Link>
              </div>
            ) : (
              <>
                <h1 className="display-title mt-4 text-[clamp(2.2rem,4vw,3.4rem)] text-ink">
                  {isRequest ? t.auth.forgotTitle : t.auth.resetTitle}
                </h1>
                <p className="mt-3 text-[0.82rem] leading-relaxed text-ink/50">
                  {isRequest ? t.auth.forgotSubtitle : t.auth.resetSubtitle}
                </p>

                <form onSubmit={submit} className="mt-8 flex flex-col gap-5" noValidate>
                  {isRequest ? (
                    <Field label={t.auth.email} htmlFor="reset-email" required tone="light">
                      <TextInput
                        id="reset-email"
                        tone="light"
                        type="email"
                        dir="ltr"
                        className="text-start"
                        value={email}
                        onChange={(event) => setEmail(event.target.value)}
                        autoComplete="email"
                        placeholder="name@company.com"
                      />
                    </Field>
                  ) : (
                    <>
                      <Field
                        label={t.auth.newPassword}
                        htmlFor="reset-password"
                        required
                        tone="light"
                        hint={t.auth.shortPassword}
                      >
                        <div className="relative">
                          <TextInput
                            id="reset-password"
                            tone="light"
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
                            className="absolute end-3 top-1/2 -translate-y-1/2 text-ink/35 transition-colors hover:text-ink/70"
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
                        tone="light"
                      >
                        <TextInput
                          id="reset-confirm"
                          tone="light"
                          type={showPassword ? "text" : "password"}
                          dir="ltr"
                          className="text-start"
                          value={confirm}
                          onChange={(event) => setConfirm(event.target.value)}
                          autoComplete="new-password"
                        />
                      </Field>
                    </>
                  )}

                  {error ? (
                    <p
                      className="border border-[#a3543f]/25 bg-[#a3543f]/5 px-4 py-3 text-[0.72rem] text-[#a3543f]"
                      role="alert"
                    >
                      {error}
                    </p>
                  ) : null}

                  <button
                    type="submit"
                    disabled={loading}
                    className="btn-shine mt-1 inline-flex h-12 items-center justify-center gap-2.5 bg-ink px-6 text-[0.65rem] font-semibold uppercase tracking-[0.16em] text-ivory transition-colors hover:bg-gold-dark disabled:cursor-wait disabled:opacity-70"
                  >
                    {loading
                      ? isRequest
                        ? t.auth.sendingReset
                        : t.auth.resetting
                      : isRequest
                        ? t.auth.sendReset
                        : t.auth.resetPassword}
                    {loading ? null : <ForwardIcon className="h-3.5 w-3.5" />}
                  </button>
                </form>

                {!isRequest ? (
                  <Link
                    href="/sign-in"
                    className="mt-6 flex items-center justify-center gap-2 text-[0.72rem] text-ink/45 transition-colors hover:text-gold-dark"
                  >
                    <BackIcon className="h-3.5 w-3.5" />
                    {t.auth.backToSignIn}
                  </Link>
                ) : null}
              </>
            )}

            {!sent && !done ? (
              <p className="mt-7 text-center text-[0.62rem] leading-relaxed text-ink/35">
                {t.auth.demoHint}
              </p>
            ) : null}

            {isRequest && !sent ? (
              <p className="mt-4 text-center text-[0.72rem] text-ink/45">
                {t.auth.haveAccount}{" "}
                <Link
                  href="/sign-in"
                  className="font-semibold text-gold-dark underline-offset-4 hover:underline"
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

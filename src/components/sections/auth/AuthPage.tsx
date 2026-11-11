"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, ArrowUpRight, Check, Eye, EyeOff } from "lucide-react";
import { AuthRequestError, useAuth } from "@/components/providers/AuthProvider";
import { useI18n } from "@/components/providers/I18nProvider";
import { Field, TextInput } from "@/components/ui/Field";
import { Logo } from "@/components/ui/Logo";
import { isSafeInternalPath } from "@/lib/security/validation";
import { cn } from "@/lib/utils";

type AuthMode = "sign-in" | "sign-up";

type AuthPageProps = {
  mode: AuthMode;
};

function nextPath() {
  if (typeof window === "undefined") return "/portal";
  const requested = new URLSearchParams(window.location.search).get("next");
  return typeof requested === "string" && isSafeInternalPath(requested)
    ? requested
    : "/portal";
}

function authErrorMessage(error: unknown, locale: string, fallback: string) {
  if (error instanceof AuthRequestError) {
    if (error.code === "unavailable") {
      return locale === "ar"
        ? "خدمة الدخول غير مهيأة مؤقتاً. حاول لاحقاً أو تواصل معنا."
        : "Sign-in is temporarily unavailable. Please try again later.";
    }
    if (error.code === "rate_limited") {
      return locale === "ar"
        ? "محاولات كثيرة. انتظر قليلاً ثم أعد المحاولة."
        : "Too many attempts. Please wait a moment and try again.";
    }
  }
  return fallback;
}

export function AuthPage({ mode }: AuthPageProps) {
  const { t, isRTL, locale } = useI18n();
  const { signIn, signUp, user, ready } = useAuth();
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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const isSignIn = mode === "sign-in";

  useEffect(() => {
    if (ready && user?.sessionVerified) router.replace(nextPath());
  }, [ready, user, router]);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError("");

    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError(t.contactPage.form.emailError);
      return;
    }
    if (password.length < 8) {
      setError(t.auth.shortPassword);
      return;
    }
    if (!isSignIn) {
      if (!name.trim()) {
        setError(t.contactPage.form.requiredError);
        return;
      }
      if (password !== confirm) {
        setError(t.auth.mismatch);
        return;
      }
      if (!terms) {
        setError(t.auth.termsError);
        return;
      }
    }

    setLoading(true);
    try {
      if (isSignIn) {
        await signIn(email, password, remember);
      } else {
        await signUp({ name, email, company, phone, password });
      }
      router.push(nextPath());
    } catch (error) {
      setError(authErrorMessage(error, locale, t.auth.invalid));
    } finally {
      setLoading(false);
    }
  };

  const enterDemo = async () => {
    setEmail("demo@alattar.sa");
    setPassword("demo1234");
    setError("");
    setLoading(true);
    try {
      await signIn("demo@alattar.sa", "demo1234", true);
      router.push(nextPath());
    } catch (error) {
      setError(authErrorMessage(error, locale, t.auth.invalid));
    } finally {
      setLoading(false);
    }
  };

  const BackIcon = isRTL ? ArrowRight : ArrowLeft;
  const ForwardIcon = isRTL ? ArrowLeft : ArrowRight;

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
            <h1 className="display-title mt-4 text-[clamp(2.2rem,4vw,3.4rem)] text-ink">
              {isSignIn ? t.auth.signInTitle : t.auth.signUpTitle}
            </h1>
            <p className="mt-3 text-[0.82rem] leading-relaxed text-ink/50">
              {isSignIn ? t.auth.signInSubtitle : t.auth.signUpSubtitle}
            </p>

            <form onSubmit={submit} className="mt-8 flex flex-col gap-5" noValidate>
              {!isSignIn ? (
                <div className="grid gap-5 sm:grid-cols-2">
                  <Field label={t.auth.name} htmlFor="auth-name" required tone="light">
                    <TextInput
                      id="auth-name"
                      tone="light"
                      value={name}
                      onChange={(event) => setName(event.target.value)}
                      autoComplete="name"
                    />
                  </Field>
                  <Field label={t.auth.company} htmlFor="auth-company" tone="light">
                    <TextInput
                      id="auth-company"
                      tone="light"
                      value={company}
                      onChange={(event) => setCompany(event.target.value)}
                      autoComplete="organization"
                    />
                  </Field>
                </div>
              ) : null}

              <Field label={t.auth.email} htmlFor="auth-email" required tone="light">
                <TextInput
                  id="auth-email"
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

              {!isSignIn ? (
                <Field label={t.auth.phone} htmlFor="auth-phone" tone="light">
                  <TextInput
                    id="auth-phone"
                    tone="light"
                    type="tel"
                    dir="ltr"
                    className="text-start"
                    value={phone}
                    onChange={(event) => setPhone(event.target.value)}
                    autoComplete="tel"
                  />
                </Field>
              ) : null}

              <Field label={t.auth.password} htmlFor="auth-password" required tone="light">
                <div className="relative">
                  <TextInput
                    id="auth-password"
                    tone="light"
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
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    className="absolute end-3 top-1/2 -translate-y-1/2 text-ink/35 transition-colors hover:text-ink/70"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </Field>

              {!isSignIn ? (
                <Field label={t.auth.confirmPassword} htmlFor="auth-confirm" required tone="light">
                  <TextInput
                    id="auth-confirm"
                    tone="light"
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
                  <label className="flex cursor-pointer items-center gap-2 text-[0.72rem] text-ink/55">
                    <input
                      type="checkbox"
                      checked={remember}
                      onChange={(event) => setRemember(event.target.checked)}
                      className="h-3.5 w-3.5 accent-[#8f6f34]"
                    />
                    {t.auth.remember}
                  </label>
                  <Link
                    href="/forgot-password"
                    className="text-[0.68rem] text-ink/40 underline-offset-4 transition-colors hover:text-gold-dark hover:underline"
                  >
                    {t.auth.forgot}
                  </Link>
                </div>
              ) : (
                <label className="flex cursor-pointer items-start gap-2.5 text-[0.72rem] leading-relaxed text-ink/55">
                  <input
                    type="checkbox"
                    checked={terms}
                    onChange={(event) => setTerms(event.target.checked)}
                    className="mt-0.5 h-3.5 w-3.5 shrink-0 accent-[#8f6f34]"
                  />
                  {t.auth.terms}
                </label>
              )}

              {error ? (
                <p className="border border-[#a3543f]/25 bg-[#a3543f]/5 px-4 py-3 text-[0.72rem] text-[#a3543f]" role="alert">
                  {error}
                </p>
              ) : null}

              <button
                type="submit"
                disabled={loading}
                className="btn-shine mt-1 inline-flex h-12 items-center justify-center gap-2.5 bg-ink px-6 text-[0.65rem] font-semibold uppercase tracking-[0.16em] text-ivory transition-colors hover:bg-gold-dark disabled:cursor-wait disabled:opacity-70"
              >
                {loading
                  ? isSignIn
                    ? t.auth.signingIn
                    : t.auth.signingUp
                  : isSignIn
                    ? t.auth.signIn
                    : t.auth.signUp}
                {loading ? null : <ForwardIcon className="h-3.5 w-3.5" />}
              </button>
            </form>

            <div className="mt-5 flex flex-col gap-3">
              <button
                type="button"
                onClick={enterDemo}
                disabled={loading}
                className="inline-flex h-11 items-center justify-center gap-2 border border-ink/15 text-[0.62rem] font-semibold uppercase tracking-[0.14em] text-ink/55 transition-colors hover:border-gold-dark hover:text-gold-dark disabled:opacity-50"
              >
                {t.auth.demo}
                <ArrowUpRight className={cn("h-3.5 w-3.5", isRTL && "-scale-x-100")} />
              </button>
              <p className="text-center text-[0.62rem] text-ink/35">{t.auth.demoHint}</p>
            </div>

            <p className="mt-7 text-center text-[0.75rem] text-ink/45">
              {isSignIn ? t.auth.noAccount : t.auth.haveAccount}{" "}
              <Link
                href={isSignIn ? "/sign-up" : "/sign-in"}
                className="font-semibold text-gold-dark underline-offset-4 hover:underline"
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

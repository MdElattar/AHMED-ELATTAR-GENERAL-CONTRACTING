"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowUp, ArrowUpRight } from "lucide-react";
import { useI18n } from "@/components/providers/I18nProvider";
import { useSmoothScroll } from "@/components/providers/SmoothScroll";
import { Logo } from "@/components/ui/Logo";
import { cn } from "@/lib/utils";

const CURRENT_YEAR = new Date().getFullYear();

const companyLinks = [
  { href: "/about", key: "about" as const },
  { href: "/projects", key: "projects" as const },
  { href: "/services", key: "services" as const },
  { href: "/contact", key: "contact" as const },
  { href: "/sign-in", key: "portal" as const },
];

const socialLinks = [
  {
    label: "LinkedIn",
    href: "#",
    icon: (
      <>
        <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-4 0v7h-4v-7a6 6 0 0 1 6-6Z" />
        <rect width="4" height="12" x="2" y="9" />
        <circle cx="4" cy="4" r="2" />
      </>
    ),
  },
  {
    label: "Instagram",
    href: "#",
    icon: (
      <>
        <rect width="20" height="20" x="2" y="2" rx="5" />
        <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37Z" />
        <path d="M17.5 6.5h.01" />
      </>
    ),
  },
  {
    label: "YouTube",
    href: "#",
    icon: (
      <>
        <path d="M2.5 17a24.1 24.1 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.6 49.6 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24.1 24.1 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.6 49.6 0 0 1-16.2 0A2 2 0 0 1 2.5 17" />
        <path d="m10 15 5-3-5-3Z" />
      </>
    ),
  },
];

const expertiseLinks = [
  { href: "/services#general-contracting", ar: "المقاولات العامة", en: "General Contracting" },
  { href: "/services#heavy-equipment", ar: "تأجير المعدات الثقيلة", en: "Heavy Equipment Rental" },
  { href: "/services#civil-engineering", ar: "الهندسة المدنية", en: "Civil Engineering" },
  { href: "/services#architectural-design", ar: "التصميم المعماري", en: "Architectural Design" },
];

export function Footer() {
  const { t, locale, isRTL } = useI18n();
  const { scrollTo } = useSmoothScroll();
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);

  return (
    <footer className="relative overflow-hidden border-t border-white/10 bg-ink">
      <div className="blueprint-grid pointer-events-none absolute inset-0 opacity-30" />
      <div className="pointer-events-none absolute -top-40 end-0 h-[520px] w-[520px] rounded-full bg-gold/5 blur-[140px]" />

      <div className="container-lux relative">
        <div className="grid gap-14 border-b border-white/10 py-16 lg:grid-cols-[1.4fr_1fr] lg:py-20">
          <div>
            <p className="eyebrow">{t.footer.newsletter}</p>
            <h2 className="display-title mt-6 max-w-xl text-[clamp(2.1rem,4vw,3.8rem)] text-ivory">
              {t.footer.tagline}
            </h2>
            <p className="mt-5 max-w-md text-sm leading-relaxed text-ivory/45">
              {t.footer.newsletterText}
            </p>
            <form
              className="mt-8 flex max-w-md items-end gap-3"
              onSubmit={(event) => {
                event.preventDefault();
                if (!email.trim()) return;
                setSubscribed(true);
                setEmail("");
              }}
            >
              <label className="flex-1">
                <span className="sr-only">{t.footer.placeholder}</span>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder={t.footer.placeholder}
                  className="field"
                />
              </label>
              <button
                type="submit"
                className="flex h-12 shrink-0 items-center gap-2 bg-gold px-5 text-[0.65rem] font-semibold uppercase tracking-[0.16em] text-obsidian transition-colors hover:bg-gold-light"
              >
                {t.footer.subscribe}
                <ArrowUpRight className={cn("h-3.5 w-3.5", isRTL && "-scale-x-100")} />
              </button>
            </form>
            {subscribed ? (
              <p className="mt-3 text-xs text-gold">{t.footer.subscribed}</p>
            ) : null}
          </div>

          <div className="grid grid-cols-2 gap-8 sm:grid-cols-3 lg:justify-items-end">
            <div>
              <h3 className="text-[0.62rem] font-medium uppercase tracking-[0.22em] text-ivory/35">
                {t.footer.company}
              </h3>
              <ul className="mt-5 space-y-3">
                {companyLinks.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-ivory/60 transition-colors hover:text-gold"
                    >
                      {t.nav[link.key]}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="text-[0.62rem] font-medium uppercase tracking-[0.22em] text-ivory/35">
                {t.footer.expertise}
              </h3>
              <ul className="mt-5 space-y-3">
                {expertiseLinks.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-ivory/60 transition-colors hover:text-gold"
                    >
                      {locale === "ar" ? link.ar : link.en}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div className="col-span-2 sm:col-span-1">
              <h3 className="text-[0.62rem] font-medium uppercase tracking-[0.22em] text-ivory/35">
                {t.footer.contact}
              </h3>
              <ul className="mt-5 space-y-3 text-sm text-ivory/60">
                <li className="leading-relaxed">{t.contactPage.address}</li>
                <li>
                  <a href="tel:+966114821987" className="tabular hover:text-gold" dir="ltr">
                    +966 11 482 1987
                  </a>
                </li>
                <li>
                  <a href="mailto:projects@alattar.sa" className="hover:text-gold">
                    projects@alattar.sa
                  </a>
                </li>
              </ul>
              <div className="mt-6 flex items-center gap-2">
                {socialLinks.map(({ label, href, icon }) => (
                  <a
                    key={label}
                    href={href}
                    aria-label={label}
                    className="flex h-9 w-9 items-center justify-center border border-white/12 text-ivory/45 transition-colors hover:border-gold/50 hover:text-gold"
                  >
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="h-3.5 w-3.5"
                      aria-hidden="true"
                    >
                      {icon}
                    </svg>
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-6 border-b border-white/10 py-8 sm:grid-cols-3">
          {[
            { city: t.footer.riyadh, detail: t.contactPage.offices[0].detail },
            { city: t.footer.jeddah, detail: t.contactPage.offices[1].detail },
            { city: t.footer.dubai, detail: t.contactPage.offices[2].detail },
          ].map((office) => (
            <div key={office.city} className="flex flex-col gap-1.5">
              <span className="text-[0.62rem] font-medium uppercase tracking-[0.2em] text-gold/80">
                {office.city}
              </span>
              <span className="text-xs leading-relaxed text-ivory/35">{office.detail}</span>
            </div>
          ))}
        </div>

        <div className="relative flex flex-col gap-6 py-10">
          <div className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
            <Logo />
            <div className="flex flex-wrap items-center gap-5 text-[0.65rem] text-ivory/35">
              <span>{t.footer.license}</span>
              <Link href="#" className="hover:text-gold">
                {t.footer.privacy}
              </Link>
              <Link href="#" className="hover:text-gold">
                {t.footer.terms}
              </Link>
              <button
                type="button"
                onClick={() => scrollTo(0)}
                className="flex items-center gap-1.5 uppercase tracking-[0.14em] hover:text-gold"
              >
                {t.footer.backToTop}
                <ArrowUp className="h-3 w-3" />
              </button>
            </div>
          </div>
          <div className="flex flex-col items-start justify-between gap-4 text-[0.62rem] text-ivory/25 sm:flex-row sm:items-center">
            <span>
              © {CURRENT_YEAR} Ahmed Elattar General Contracting Co. {t.footer.rights}
            </span>
            <a
              href="https://mohamedelattar.com"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Developed by Mohamed Elattar"
              className="group inline-flex items-center gap-1.5 text-ivory/35 transition-colors hover:text-gold"
            >
              <span className="text-ivory/20 transition-colors group-hover:text-gold/50">
                Developed by
              </span>{" "}
              <span className="font-medium tracking-[0.04em] text-ivory/55 transition-colors group-hover:text-gold">
                Mohamed Elattar
              </span>
              <ArrowUpRight className="h-3 w-3 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
            </a>
            <span className="hidden sm:block">Riyadh · Jeddah · Dubai</span>
          </div>
        </div>

        <div
          aria-hidden="true"
          className="pointer-events-none select-none overflow-hidden border-t border-white/5"
        >
          <div className="text-outline -mb-[0.14em] whitespace-nowrap text-center text-[clamp(3rem,10vw,10rem)] font-semibold uppercase leading-none tracking-[0.04em] opacity-40">
            AHMED ELATTAR
          </div>
        </div>
      </div>
    </footer>
  );
}

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowUpRight, Globe2, Menu, UserRound, X } from "lucide-react";
import { useI18n } from "@/components/providers/I18nProvider";
import { useSmoothScroll } from "@/components/providers/SmoothScroll";
import { ProfileMenu } from "@/components/layout/ProfileMenu";
import { Logo } from "@/components/ui/Logo";
import { cn } from "@/lib/utils";

const links = [  { href: "/", key: "home" as const },
  { href: "/projects", key: "projects" as const },
  { href: "/services", key: "services" as const },
  { href: "/about", key: "about" as const },
  { href: "/contact", key: "contact" as const },
];

export function Navbar() {
  const pathname = usePathname();
  const { t, toggleLocale, isRTL } = useI18n();
  const { stop, start, scrollTo } = useSmoothScroll();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    let frame = 0;
    const onScroll = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => setScrolled(window.scrollY > 24));
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  useEffect(() => {
    if (open) {
      stop();
    } else {
      start();
    }
    return () => start();
  }, [open, start, stop]);

  const solid = scrolled || open;
  const lightPage = [
    "/sign-in",
    "/sign-up",
    "/forgot-password",
    "/reset-password",
  ].some((path) => pathname === path || pathname.startsWith(`${path}/`));
  // Auth screens use an ivory canvas. Keep the navigation dark-on-light there,
  // and flip back to the dark glass treatment while the mobile overlay is open.
  const lightNav = lightPage && !open;

  return (
    <>
      <header
        className={cn(
          "fixed inset-x-0 top-0 z-[70] border-b transition-all duration-500",
          solid
            ? lightNav
              ? "border-ink/10 bg-ivory/90 shadow-[0_20px_60px_-34px_rgba(10,11,14,0.35)] backdrop-blur-xl"
              : "glass border-white/10 shadow-[0_20px_60px_-30px_rgba(0,0,0,0.8)]"
            : "border-transparent bg-transparent",
        )}
      >
        <div className="container-lux flex h-[84px] items-center justify-between gap-5">
          <Link
            href="/"
            aria-label="Ahmed Elattar — Home"
            className="relative z-10 shrink-0"
            onClick={() => setOpen(false)}
          >
            <Logo tone={lightNav ? "dark" : "light"} />
          </Link>

          <nav className="hidden items-center gap-1 lg:flex" aria-label="Primary">
            {links.map((link) => {
              const active =
                link.href === "/" ? pathname === "/" : pathname.startsWith(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "group relative px-4 py-2 text-[0.68rem] font-medium uppercase tracking-[0.18em] transition-colors duration-300",
                    lightNav
                      ? active
                        ? "text-gold-dark"
                        : "text-ink/55 hover:text-ink"
                      : active
                        ? "text-gold"
                        : "text-ivory/65 hover:text-ivory",
                  )}
                >
                  {t.nav[link.key]}
                  <span
                    className={cn(
                      "absolute inset-x-4 -bottom-0.5 h-px origin-left transition-transform duration-500",
                      lightNav ? "bg-gold-dark" : "bg-gold",
                      active ? "scale-x-100" : "scale-x-0 group-hover:scale-x-100",
                    )}
                  />
                </Link>
              );
            })}
          </nav>

          <div className="hidden items-center gap-3 lg:flex">
            <button
              type="button"
              onClick={toggleLocale}
              aria-label={t.nav.languageLabel}
              className={cn(
                "flex h-10 items-center gap-2 border px-3 text-[0.65rem] font-medium uppercase tracking-[0.16em] transition-colors",
                lightNav
                  ? "border-ink/15 text-ink/55 hover:border-gold-dark/60 hover:text-gold-dark"
                  : "border-white/15 text-ivory/65 hover:border-gold/50 hover:text-gold",
              )}
            >
              <Globe2 className="h-3.5 w-3.5" />
              {t.nav.language}
            </button>
            <ProfileMenu tone={lightNav ? "light" : "dark"} />
            <Link
              href="/contact"
              className="btn-shine group flex h-11 items-center gap-2 bg-gold px-5 text-[0.65rem] font-semibold uppercase tracking-[0.16em] text-obsidian transition-colors hover:bg-gold-light"
            >
              {t.nav.cta}
              <ArrowUpRight
                className={cn(
                  "h-3.5 w-3.5 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5",
                  isRTL && "-scale-x-100",
                )}
              />
            </Link>
          </div>

          <div className="flex items-center gap-2 lg:hidden">
            <button
              type="button"
              onClick={toggleLocale}
              aria-label={t.nav.languageLabel}
              className={cn(
                "flex h-10 items-center gap-1.5 border px-2.5 text-[0.6rem] font-medium uppercase tracking-[0.12em]",
                lightNav ? "border-ink/15 text-ink/65" : "border-white/15 text-ivory/70",
              )}
            >
              <Globe2 className="h-3.5 w-3.5" />
              {t.nav.language}
            </button>
            <ProfileMenu
              tone={lightNav ? "light" : "dark"}
              compact
              onNavigate={() => setOpen(false)}
            />
            <button
              type="button"
              onClick={() => setOpen((value) => !value)}
              aria-label={open ? t.nav.close : t.nav.menu}
              aria-expanded={open}
              className={cn(
                "flex h-10 w-10 items-center justify-center border",
                lightNav ? "border-ink/15 text-ink" : "border-white/15 text-ivory",
              )}
            >
              {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </button>
          </div>
        </div>
      </header>

      <AnimatePresence>
        {open ? (
          <motion.div
            className="fixed inset-0 z-[60] flex flex-col bg-obsidian/97 pt-[84px] lg:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35 }}
          >
            <div className="blueprint-grid pointer-events-none absolute inset-0 opacity-40" />
            <nav
              className="container-lux relative flex flex-1 flex-col justify-center gap-1 py-8"
              aria-label="Mobile"
            >
              {links.map((link, index) => (
                <motion.div
                  key={link.href}
                  initial={{ opacity: 0, y: 18 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.08 + index * 0.06, duration: 0.5 }}
                >
                  <Link
                    href={link.href}
                    onClick={() => setOpen(false)}
                    className="group flex items-center justify-between border-b border-white/8 py-5"
                  >
                    <span className="flex items-baseline gap-4">
                      <span className="text-[0.6rem] tabular text-gold/60">
                        0{index + 1}
                      </span>
                      <span className="display-title text-[clamp(1.9rem,8vw,3rem)] text-ivory transition-colors group-hover:text-gold">
                        {t.nav[link.key]}
                      </span>
                    </span>
                    <ArrowUpRight className="h-5 w-5 text-ivory/30 transition-colors group-hover:text-gold" />
                  </Link>
                </motion.div>
              ))}

              <motion.div
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.42, duration: 0.5 }}
                className="mt-8 flex flex-col gap-3"
              >
                <Link
                  href="/sign-in"
                  onClick={() => setOpen(false)}
                  className="flex h-12 items-center justify-center gap-2 border border-white/20 text-[0.7rem] uppercase tracking-[0.16em] text-ivory"
                >
                  <UserRound className="h-4 w-4" />
                  {t.nav.portal}
                </Link>
                <Link
                  href="/contact"
                  onClick={() => setOpen(false)}
                  className="flex h-12 items-center justify-center gap-2 bg-gold text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-obsidian"
                >
                  {t.nav.cta}
                  <ArrowUpRight className="h-4 w-4" />
                </Link>
              </motion.div>
            </nav>

            <div className="container-lux relative flex items-center justify-between border-t border-white/10 py-5 text-[0.65rem] text-ivory/40">
              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  scrollTo(0);
                }}
                className="uppercase tracking-[0.16em] hover:text-gold"
              >
                {t.common.location}
              </button>
              <a href="tel:+966114821987" className="tabular hover:text-gold">
                +966 11 482 1987
              </a>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  );
}

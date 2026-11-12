"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowUpRight,
  Globe2,
  LayoutDashboard,
  Menu,
  ShieldCheck,
  UserRound,
  X,
} from "lucide-react";
import { isAdminUser, useAuth } from "@/components/providers/AuthProvider";
import { useI18n } from "@/components/providers/I18nProvider";
import { useSmoothScroll } from "@/components/providers/SmoothScroll";
import { ProfileMenu } from "@/components/layout/ProfileMenu";
import { Logo } from "@/components/ui/Logo";
import { acquireScrollLock, releaseScrollLock } from "@/lib/scroll/lock";
import { cn } from "@/lib/utils";

const primaryLinks = [
  { href: "/", key: "home" as const },
  { href: "/projects", key: "projects" as const },
  { href: "/services", key: "services" as const },
  { href: "/about", key: "about" as const },
  { href: "/consultation", key: "consultation" as const },
  { href: "/contact", key: "contact" as const },
];

export function Navbar() {
  const pathname = usePathname();
  const { t, toggleLocale, isRTL } = useI18n();
  const { user } = useAuth();
  const { stop, start, scrollToTop } = useSmoothScroll();
  const [open, setOpen] = useState(false);
  const pendingScrollTop = useRef(false);

  useEffect(() => {
    // Close the drawer on navigation (including browser back/forward) so the
    // scroll lock is always released with the menu.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!open) return;
    acquireScrollLock(stop);
    return () => releaseScrollLock(start);
  }, [open, start, stop]);

  useEffect(() => {
    if (open || !pendingScrollTop.current) return;
    pendingScrollTop.current = false;
    scrollToTop();
  }, [open, scrollToTop]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  const handleNavigation = (
    event: React.MouseEvent<HTMLAnchorElement>,
    href: string,
  ) => {
    if (pathname === href) {
      event.preventDefault();
      if (open) {
        // The drawer's cleanup releases the lock before this effect animates.
        pendingScrollTop.current = true;
        setOpen(false);
      } else {
        scrollToTop();
      }
      return;
    }
    setOpen(false);
  };

  const accountLinks = [
    { href: "/portal", label: t.nav.portal, icon: LayoutDashboard },
    ...(isAdminUser(user)
      ? [{ href: "/admin", label: t.nav.admin, icon: ShieldCheck }]
      : []),
  ];

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-[90] border-b border-white/10 bg-black/90 backdrop-blur-md">
        <div className="container-lux flex h-[76px] items-center justify-between gap-4">
          <Link
            href="/"
            aria-label="Ahmed Elattar — Home"
            className="relative z-10 shrink-0"
            onClick={(event) => handleNavigation(event, "/")}
          >
            <Logo tone="light" priority />
          </Link>

          <nav className="hidden items-center gap-0.5 xl:flex" aria-label="Primary">
            {primaryLinks.map((link) => {
              const active = isActive(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={(event) => handleNavigation(event, link.href)}
                  className={cn(
                    "group relative inline-flex min-h-11 items-center px-3.5 py-2.5 text-[0.66rem] font-medium uppercase tracking-[0.17em] transition-colors duration-300",
                    active ? "text-gold" : "text-ivory/60 hover:text-ivory",
                  )}
                >
                  {t.nav[link.key]}
                  <span
                    className={cn(
                      "absolute inset-x-3.5 bottom-0.5 h-px origin-left bg-gold transition-transform duration-500",
                      active ? "scale-x-100" : "scale-x-0 group-hover:scale-x-100",
                    )}
                  />
                </Link>
              );
            })}
            <span className="mx-2 h-4 w-px bg-white/12" aria-hidden="true" />
            {accountLinks.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                onClick={(event) => handleNavigation(event, href)}
                className={cn(
                  "group relative flex min-h-11 items-center gap-1.5 px-3 py-2.5 text-[0.66rem] font-medium uppercase tracking-[0.17em] transition-colors duration-300",
                  isActive(href) ? "text-gold" : "text-ivory/60 hover:text-ivory",
                )}
              >
                <Icon className="h-3.5 w-3.5 text-gold/80" />
                {label}
              </Link>
            ))}
          </nav>

          <div className="hidden items-center gap-2.5 xl:flex">
            <button
              type="button"
              onClick={toggleLocale}
              aria-label={t.nav.languageLabel}
              className="flex h-11 items-center gap-2 border border-white/12 px-3 text-[0.62rem] font-medium uppercase tracking-[0.16em] text-ivory/60 transition-colors hover:border-gold/45 hover:text-gold"
            >
              <Globe2 className="h-3.5 w-3.5" />
              {t.nav.language}
            </button>
            <ProfileMenu tone="dark" />
            <Link
              href="/consultation"
              onClick={(event) => handleNavigation(event, "/consultation")}
              className="btn-shine group flex h-11 items-center gap-2 bg-gold px-5 text-[0.63rem] font-semibold uppercase tracking-[0.16em] text-obsidian transition-colors hover:bg-gold-light"
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

          <div className="flex items-center gap-2 xl:hidden">
            <ProfileMenu tone="dark" compact onNavigate={() => setOpen(false)} />
            <button
              type="button"
              onClick={() => setOpen((value) => !value)}
              aria-label={open ? t.nav.close : t.nav.menu}
              aria-expanded={open}
              aria-controls="mobile-navigation"
              className="flex h-11 w-11 items-center justify-center border border-white/12 text-ivory transition-colors hover:border-gold/45 hover:text-gold"
            >
              {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-gold/30 to-transparent"
        />
      </header>

      <AnimatePresence>
        {open ? (
          <>
            <motion.button
              type="button"
              aria-label={t.nav.close}
              onClick={() => setOpen(false)}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="fixed inset-0 z-[80] cursor-default bg-obsidian/70 backdrop-blur-sm xl:hidden"
            />
            <motion.aside
              id="mobile-navigation"
              initial={{ x: isRTL ? "-100%" : "100%" }}
              animate={{ x: 0 }}
              exit={{ x: isRTL ? "-100%" : "100%" }}
              transition={{ duration: 0.42, ease: [0.16, 1, 0.3, 1] }}
              className="fixed bottom-0 end-0 top-[76px] z-[85] flex w-[min(88vw,420px)] flex-col overflow-y-auto overscroll-contain border-s border-white/10 bg-obsidian/97 backdrop-blur-2xl xl:hidden"
            >
              <div className="blueprint-grid pointer-events-none absolute inset-0 opacity-25" />
              <div className="pointer-events-none absolute -end-16 top-10 h-64 w-64 rounded-full bg-gold/[0.06] blur-[100px]" />

              <nav className="relative flex flex-1 flex-col px-6 py-6" aria-label="Mobile">
                <p className="text-[0.55rem] font-semibold uppercase tracking-[0.24em] text-gold/70">
                  {t.sections.inline.navbarNavigation}
                </p>

                <div className="mt-3 flex flex-col">
                  {primaryLinks.map((link, index) => {
                    const active = isActive(link.href);
                    return (
                      <motion.div
                        key={link.href}
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.03 + index * 0.035, duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                      >
                        <Link
                          href={link.href}
                          onClick={(event) => handleNavigation(event, link.href)}
                          className={cn(
                            "group flex min-h-[56px] items-center justify-between gap-4 border-b border-white/[0.07] transition-colors",
                            active ? "text-gold" : "text-ivory hover:text-gold",
                          )}
                        >
                          <span className="flex items-baseline gap-4">
                            <span className="tabular text-[0.55rem] text-gold/45">
                              0{index + 1}
                            </span>
                            <span className="text-[1.05rem] font-medium tracking-wide">
                              {t.nav[link.key]}
                            </span>
                          </span>
                          <ArrowUpRight
                            className={cn(
                              "h-4 w-4 shrink-0 text-ivory/35 transition-all group-hover:text-gold",
                              isRTL && "-scale-x-100",
                            )}
                          />
                        </Link>
                      </motion.div>
                    );
                  })}
                </div>

                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.24, duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                  className="mt-6 flex flex-col gap-2"
                >
                  {accountLinks.map(({ href, label, icon: Icon }) => (
                    <Link
                      key={href}
                      href={href}
                      onClick={(event) => handleNavigation(event, href)}
                      className="flex min-h-[48px] items-center gap-3 border border-white/12 px-4 text-[0.68rem] font-medium uppercase tracking-[0.16em] text-ivory/75 transition-colors hover:border-gold/45 hover:text-gold"
                    >
                      <Icon className="h-4 w-4 text-gold" />
                      {label}
                    </Link>
                  ))}
                  {!user ? (
                    <Link
                      href="/sign-in"
                      onClick={(event) => handleNavigation(event, "/sign-in")}
                      className="flex min-h-[48px] items-center gap-3 border border-white/12 px-4 text-[0.68rem] font-medium uppercase tracking-[0.16em] text-ivory/75 transition-colors hover:border-gold/45 hover:text-gold"
                    >
                      <UserRound className="h-4 w-4 text-gold" />
                      {t.nav.signIn}
                    </Link>
                  ) : null}
                  <Link
                    href="/consultation"
                    onClick={(event) => handleNavigation(event, "/consultation")}
                    className="mt-1 flex min-h-[50px] items-center justify-center gap-2 bg-gold px-5 text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-obsidian transition-colors hover:bg-gold-light"
                  >
                    {t.nav.cta}
                    <ArrowUpRight className={cn("h-4 w-4", isRTL && "-scale-x-100")} />
                  </Link>
                </motion.div>
              </nav>

              <div className="relative border-t border-white/10 px-6 py-5">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-[0.55rem] uppercase tracking-[0.18em] text-ivory/40">
                      {t.sections.inline.navbarLocations}
                    </p>
                    <a
                      href="tel:+966114821987"
                      dir="ltr"
                      className="mt-2 block tabular text-[0.78rem] text-ivory/65 transition-colors hover:text-gold"
                    >
                      +966 11 482 1987
                    </a>
                  </div>
                  <button
                    type="button"
                    onClick={toggleLocale}
                    aria-label={t.nav.languageLabel}
                    className="flex h-11 shrink-0 items-center gap-2 border border-white/12 px-3 text-[0.62rem] font-medium uppercase tracking-[0.14em] text-ivory/65 transition-colors hover:border-gold/45 hover:text-gold"
                  >
                    <Globe2 className="h-3.5 w-3.5" />
                    {t.nav.language}
                  </button>
                </div>
              </div>
            </motion.aside>
          </>
        ) : null}
      </AnimatePresence>
    </>
  );
}

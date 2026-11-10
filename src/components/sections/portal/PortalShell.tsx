"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  ArrowUpRight,
  FolderKanban,
  LayoutDashboard,
  LogOut,
  Settings,
  ShieldCheck,
  Wallet,
} from "lucide-react";
import { isAdminUser, useAuth } from "@/components/providers/AuthProvider";
import { useI18n } from "@/components/providers/I18nProvider";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/portal", key: "dashboard" as const, icon: LayoutDashboard },
  { href: "/portal/projects", key: "portalProjects" as const, icon: FolderKanban },
  { href: "/portal/financials", key: "financials" as const, icon: Wallet },
  { href: "/portal/settings", key: "settings" as const, icon: Settings },
];

export function PortalShell({
  children,
  title,
  description,
}: {
  children: ReactNode;
  title: string;
  description: string;
}) {
  const { t, isRTL } = useI18n();
  const { user, ready, signOut } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  if (!ready) {
    return (
      <section className="flex min-h-[70svh] items-center justify-center bg-obsidian pt-24">
        <span className="h-8 w-8 animate-spin rounded-full border border-white/15 border-t-gold" />
      </section>
    );
  }

  if (!user || !user.sessionVerified) {
    return (
      <section className="relative flex min-h-[100svh] items-center overflow-hidden bg-obsidian pt-24">
        <div className="blueprint-grid pointer-events-none absolute inset-0 opacity-40" />
        <div className="pointer-events-none absolute start-1/3 top-1/3 h-[420px] w-[420px] rounded-full bg-gold/[0.06] blur-[140px]" />
        <div className="container-lux relative">
          <div className="mx-auto flex max-w-lg flex-col items-center text-center">
            <span className="eyebrow">{t.portal.eyebrow}</span>
            <h1 className="display-title mt-6 text-[clamp(2.6rem,5vw,4.4rem)] text-ivory">
              {t.portal.noAccessTitle}
            </h1>
            <p className="mt-5 max-w-md text-[0.9rem] leading-[1.9] text-ivory/50">
              {t.portal.noAccessText}
            </p>
            <Link
              href="/sign-in"
              className="btn-shine mt-9 inline-flex h-12 items-center gap-2.5 bg-gold px-7 text-[0.66rem] font-semibold uppercase tracking-[0.16em] text-obsidian transition-colors hover:bg-gold-light"
            >
              {t.portal.signIn}
              <ArrowUpRight className={cn("h-4 w-4", isRTL && "-scale-x-100")} />
            </Link>
            <p className="mt-6 text-[0.62rem] text-ivory/30">{t.auth.demoHint}</p>
          </div>
        </div>
      </section>
    );
  }

  const isAdmin = isAdminUser(user);

  return (
    <>
      <section className="relative overflow-hidden bg-obsidian pb-10 pt-32 sm:pt-40">
        <div className="blueprint-grid pointer-events-none absolute inset-0 opacity-40" />
        <div className="pointer-events-none absolute -end-20 top-10 select-none text-[14rem] font-semibold leading-none tracking-tighter text-white/[0.02] sm:text-[20rem]">
          PORTAL
        </div>
        <div className="container-lux relative">
          <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-start">
            <div>
              <span className="eyebrow">{t.portal.eyebrow}</span>
              <h1 className="display-title mt-5 text-[clamp(2.4rem,5vw,4.6rem)] text-ivory">
                {title}
              </h1>
              <p className="mt-3 max-w-2xl text-[0.85rem] leading-relaxed text-ivory/45">
                {description}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span className="hidden text-end sm:block">
                <span className="block text-[0.62rem] text-ivory/55">{user.name}</span>
                <span className="mt-0.5 block tabular text-[0.55rem] uppercase tracking-[0.14em] text-gold/70">
                  {user.accountId}
                </span>
              </span>
              <button
                type="button"
                onClick={() => {
                  void signOut().finally(() => router.push("/"));
                }}
                className="inline-flex h-10 items-center gap-2 border border-white/15 px-4 text-[0.58rem] font-semibold uppercase tracking-[0.14em] text-ivory/55 transition-colors hover:border-gold/50 hover:text-gold"
              >
                <LogOut className="h-3.5 w-3.5" />
                {t.nav.signOut}
              </button>
            </div>
          </div>

          <nav className="mt-9 flex flex-wrap gap-2 border-t border-white/10 pt-5" aria-label={t.nav.account}>
            {navItems.map(({ href, key, icon: Icon }) => {
              const active = pathname === href;
              return (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    "inline-flex h-9 items-center gap-2 border px-3.5 text-[0.58rem] font-semibold uppercase tracking-[0.14em] transition-colors",
                    active
                      ? "border-gold bg-gold text-obsidian"
                      : "border-white/12 text-ivory/50 hover:border-gold/40 hover:text-gold",
                  )}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {t.nav[key]}
                </Link>
              );
            })}
            {isAdmin ? (
              <Link
                href="/admin"
                className="inline-flex h-9 items-center gap-2 border border-white/12 px-3.5 text-[0.58rem] font-semibold uppercase tracking-[0.14em] text-ivory/50 transition-colors hover:border-gold/40 hover:text-gold"
              >
                <ShieldCheck className="h-3.5 w-3.5" />
                {t.nav.admin}
              </Link>
            ) : null}
          </nav>
        </div>
      </section>
      <section className="grain relative min-h-[60svh] overflow-hidden bg-ivory text-ink">
        <div className="pointer-events-none absolute inset-0 opacity-[0.35] [background-image:linear-gradient(rgba(10,11,14,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(10,11,14,0.035)_1px,transparent_1px)] [background-size:90px_90px]" />
        <div className="container-lux relative pb-20 pt-10">{children}</div>
      </section>
    </>
  );
}

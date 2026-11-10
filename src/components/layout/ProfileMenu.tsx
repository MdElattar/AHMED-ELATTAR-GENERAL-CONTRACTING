"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import {
  ChevronDown,
  FolderKanban,
  LayoutDashboard,
  LogOut,
  Settings,
  ShieldCheck,
  UserRound,
  Wallet,
} from "lucide-react";
import { isAdminUser, useAuth } from "@/components/providers/AuthProvider";
import { useI18n } from "@/components/providers/I18nProvider";
import { cn } from "@/lib/utils";

type ProfileMenuProps = {
  tone?: "light" | "dark";
  compact?: boolean;
  onNavigate?: () => void;
};

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
}

export function ProfileMenu({ tone = "dark", compact = false, onNavigate }: ProfileMenuProps) {
  const { t, isRTL } = useI18n();
  const { user, signOut } = useAuth();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const light = tone === "light";

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const links = [
    { href: "/portal", label: t.nav.dashboard, icon: LayoutDashboard },
    { href: "/portal/projects", label: t.nav.portalProjects, icon: FolderKanban },
    { href: "/portal/financials", label: t.nav.financials, icon: Wallet },
    { href: "/portal/settings", label: t.nav.settings, icon: Settings },
    ...(isAdminUser(user)
      ? [{ href: "/admin", label: t.nav.admin, icon: ShieldCheck }]
      : []),
  ];

  const close = () => {
    setOpen(false);
    onNavigate?.();
  };

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-label={t.nav.account}
        aria-haspopup="menu"
        aria-expanded={open}
        className={cn(
          "group flex items-center gap-2 border transition-colors",
          compact ? "h-10 w-10 justify-center" : "h-10 px-2.5",
          light
            ? "border-ink/15 text-ink hover:border-gold-dark/60"
            : "border-white/15 text-ivory hover:border-gold/50",
          open && (light ? "border-gold-dark/60" : "border-gold/60"),
        )}
      >
        <span
          className={cn(
            "flex h-6 w-6 items-center justify-center rounded-full text-[0.58rem] font-semibold tracking-wide",
            light ? "bg-ink text-ivory" : "bg-gold text-obsidian",
          )}
        >
          {user ? initials(user.name) : <UserRound className="h-3.5 w-3.5" />}
        </span>
        {!compact ? (
          <>
            <span className="max-w-[7.5rem] truncate text-[0.62rem] font-medium uppercase tracking-[0.14em]">
              {user ? user.name.split(" ")[0] : t.nav.signIn}
            </span>
            <ChevronDown
              className={cn(
                "h-3 w-3 transition-transform duration-300",
                open && "rotate-180",
                isRTL && "scale-x-[-1]",
              )}
            />
          </>
        ) : null}
      </button>

      <AnimatePresence>
        {open ? (
          <motion.div
            role="menu"
            initial={{ opacity: 0, y: -8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className={cn(
              "absolute top-[calc(100%+0.65rem)] z-[95] w-72 overflow-hidden border shadow-[0_28px_80px_-24px_rgba(0,0,0,0.55)] backdrop-blur-2xl",
              isRTL ? "start-0" : "end-0",
              light ? "border-ink/10 bg-ivory/97 text-ink" : "border-white/12 bg-obsidian/96 text-ivory",
            )}
          >
            <div className={cn("border-b px-4 py-4", light ? "border-ink/10" : "border-white/10")}>
              <p className="text-[0.55rem] font-semibold uppercase tracking-[0.18em] text-gold">
                {user ? t.nav.account : t.nav.guest}
              </p>
              <p className="mt-2 truncate text-sm font-semibold">
                {user ? user.name : t.nav.portal}
              </p>
              <p className={cn("mt-0.5 truncate text-[0.68rem]", light ? "text-ink/45" : "text-ivory/40")}>
                {user ? user.email : t.nav.signIn}
              </p>
            </div>

            <div className="p-2">
              {links.map(({ href, label, icon: Icon }) => (
                <Link
                  key={href}
                  href={href}
                  role="menuitem"
                  onClick={close}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 text-[0.7rem] font-medium transition-colors",
                    light ? "text-ink/65 hover:bg-ink/5 hover:text-ink" : "text-ivory/65 hover:bg-white/6 hover:text-ivory",
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0 text-gold" />
                  <span className="flex-1">{label}</span>
                </Link>
              ))}
            </div>

            <div className={cn("border-t p-2", light ? "border-ink/10" : "border-white/10")}>
              {user ? (
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    signOut();
                    close();
                  }}
                  className={cn(
                    "flex w-full items-center gap-3 px-3 py-2.5 text-start text-[0.7rem] font-medium transition-colors",
                    light ? "text-ink/55 hover:bg-ink/5 hover:text-ink" : "text-ivory/55 hover:bg-white/6 hover:text-ivory",
                  )}
                >
                  <LogOut className="h-4 w-4 text-gold" />
                  {t.nav.signOut}
                </button>
              ) : (
                <Link
                  href="/sign-in"
                  role="menuitem"
                  onClick={close}
                  className="flex items-center justify-center gap-2 bg-gold px-3 py-2.5 text-[0.66rem] font-semibold uppercase tracking-[0.14em] text-obsidian"
                >
                  <UserRound className="h-3.5 w-3.5" />
                  {t.nav.signIn}
                </Link>
              )}
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

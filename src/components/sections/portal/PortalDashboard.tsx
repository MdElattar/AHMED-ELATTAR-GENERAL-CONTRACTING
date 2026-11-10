"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowUpRight,
  Check,
  Clock,
  Download,
  FileText,
  FolderKanban,
  LogOut,
  MapPin,
  Receipt,
  Settings,
  Wallet,
} from "lucide-react";
import { useAuth } from "@/components/providers/AuthProvider";
import { useI18n } from "@/components/providers/I18nProvider";
import { Reveal } from "@/components/ui/Reveal";
import { portalProjects } from "@/data/portal";
import { cn } from "@/lib/utils";

type Tab = "overview" | "documents" | "invoices";

export function PortalDashboard() {
  const { t, l, isRTL } = useI18n();
  const { user, ready, signOut } = useAuth();
  const router = useRouter();
  const [activeSlug, setActiveSlug] = useState(portalProjects[0].slug);
  const [tab, setTab] = useState<Tab>("overview");

  const project = useMemo(
    () => portalProjects.find((item) => item.slug === activeSlug) ?? portalProjects[0],
    [activeSlug],
  );

  if (!ready) {
    return (
      <section className="flex min-h-[70svh] items-center justify-center bg-obsidian pt-24">
        <span className="h-8 w-8 animate-spin rounded-full border border-white/15 border-t-gold" />
      </section>
    );
  }

  if (!user) {
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

  const tabs: { id: Tab; label: string }[] = [
    { id: "overview", label: t.portal.overview },
    { id: "documents", label: t.portal.documents },
    { id: "invoices", label: t.portal.invoices },
  ];

  return (
    <>
      <section className="relative overflow-hidden bg-obsidian pb-12 pt-32 sm:pt-40">
        <div className="blueprint-grid pointer-events-none absolute inset-0 opacity-40" />
        <div className="pointer-events-none absolute -end-20 top-10 select-none text-[14rem] font-semibold leading-none tracking-tighter text-white/[0.02] sm:text-[20rem]">
          PORTAL
        </div>

        <div className="container-lux relative">
          <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-start">
            <div>
              <Reveal>
                <span className="eyebrow">{t.portal.eyebrow}</span>
              </Reveal>
              <Reveal delay={70}>
                <h1 className="display-title mt-5 text-[clamp(2.4rem,5vw,4.6rem)] text-ivory">
                  {t.portal.welcome}، <span className="gold-text">{user.name}</span>
                </h1>
              </Reveal>
              <Reveal delay={130}>
                <p className="mt-3 text-[0.85rem] leading-relaxed text-ivory/45">{t.portal.subtitle}</p>
              </Reveal>
            </div>

            <Reveal delay={150}>
              <div className="flex items-center gap-3">
                <span className="hidden text-end sm:block">
                  <span className="block text-[0.62rem] text-ivory/55">{user.company}</span>
                  <span className="mt-0.5 block tabular text-[0.55rem] uppercase tracking-[0.14em] text-gold/70">
                    {user.accountId}
                  </span>
                </span>
                <button
                  type="button"
                  onClick={() => {
                    signOut();
                    router.push("/");
                  }}
                  className="inline-flex h-10 items-center gap-2 border border-white/15 px-4 text-[0.58rem] font-semibold uppercase tracking-[0.14em] text-ivory/55 transition-colors hover:border-gold/50 hover:text-gold"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  {t.portal.signOut}
                </button>
              </div>
            </Reveal>
          </div>

          <div className="mt-10 grid grid-cols-2 gap-px border border-white/10 bg-white/10 lg:grid-cols-4">
            {[
              { label: t.portal.activeProjects, value: `${portalProjects.length}` },
              { label: t.portal.totalValue, value: "SAR 3.55B" },
              { label: t.portal.nextMilestone, value: l(project.nextMilestone) },
              { label: t.portal.onTime, value: "98%" },
            ].map((stat) => (
              <div key={stat.label} className="bg-obsidian px-5 py-5">
                <span className="text-[0.5rem] uppercase tracking-[0.16em] text-ivory/30">
                  {stat.label}
                </span>
                <p className="mt-2 text-[0.82rem] leading-snug text-ivory/80">{stat.value}</p>
              </div>
            ))}
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            <Link
              href="/portal/projects"
              className="inline-flex h-9 items-center gap-2 border border-white/12 px-3.5 text-[0.56rem] font-semibold uppercase tracking-[0.12em] text-ivory/50 transition-colors hover:border-gold/40 hover:text-gold"
            >
              <FolderKanban className="h-3.5 w-3.5" />
              {t.nav.portalProjects}
            </Link>
            <Link
              href="/portal/financials"
              className="inline-flex h-9 items-center gap-2 border border-white/12 px-3.5 text-[0.56rem] font-semibold uppercase tracking-[0.12em] text-ivory/50 transition-colors hover:border-gold/40 hover:text-gold"
            >
              <Wallet className="h-3.5 w-3.5" />
              {t.nav.financials}
            </Link>
            <Link
              href="/portal/settings"
              className="inline-flex h-9 items-center gap-2 border border-white/12 px-3.5 text-[0.56rem] font-semibold uppercase tracking-[0.12em] text-ivory/50 transition-colors hover:border-gold/40 hover:text-gold"
            >
              <Settings className="h-3.5 w-3.5" />
              {t.nav.settings}
            </Link>
            {user.role === "admin" || user.email === "demo@alattar.sa" ? (
              <Link
                href="/admin"
                className="inline-flex h-9 items-center gap-2 border border-gold/30 px-3.5 text-[0.56rem] font-semibold uppercase tracking-[0.12em] text-gold transition-colors hover:bg-gold hover:text-obsidian"
              >
                {t.nav.admin}
                <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
            ) : null}
          </div>
        </div>
      </section>

      <section className="grain relative min-h-[60svh] overflow-hidden bg-ivory text-ink">
        <div className="pointer-events-none absolute inset-0 opacity-[0.35] [background-image:linear-gradient(rgba(10,11,14,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(10,11,14,0.035)_1px,transparent_1px)] [background-size:90px_90px]" />
        <div className="container-lux relative pb-20 pt-10">
          <div className="grid gap-2 sm:grid-cols-3">
            {portalProjects.map((item) => (
              <button
                key={item.slug}
                type="button"
                onClick={() => {
                  setActiveSlug(item.slug);
                  setTab("overview");
                }}
                className={cn(
                  "flex flex-col gap-2 border p-4 text-start transition-colors",
                  item.slug === project.slug
                    ? "border-ink bg-ink text-ivory"
                    : "border-ink/12 bg-ivory text-ink hover:border-ink/30",
                )}
              >
                <span className="flex items-center justify-between gap-3">
                  <span className="truncate text-[0.78rem] font-medium">{l(item.name)}</span>
                  <span
                    className={cn(
                      "tabular shrink-0 text-[0.6rem]",
                      item.slug === project.slug ? "text-gold" : "text-gold-dark",
                    )}
                  >
                    {item.progress}%
                  </span>
                </span>
                <span
                  className={cn(
                    "text-[0.55rem] uppercase tracking-[0.12em]",
                    item.slug === project.slug ? "text-ivory/40" : "text-ink/35",
                  )}
                >
                  {l(item.location)}
                </span>
              </button>
            ))}
          </div>

          <div className="mt-6 grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
            <div className="border border-ink/10 bg-ivory">
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-ink/10 px-6 py-5">
                <div>
                  <span className="text-[0.52rem] uppercase tracking-[0.16em] text-ink/35">
                    {t.portal.project}
                  </span>
                  <h2 className="mt-1 font-display text-2xl leading-tight text-ink">
                    {l(project.name)}
                  </h2>
                  <p className="mt-1 flex items-center gap-1.5 text-[0.62rem] text-ink/40">
                    <MapPin className="h-3 w-3 text-gold-dark" />
                    {l(project.location)}
                  </p>
                </div>
                <span className="border border-gold-dark/30 px-3 py-1 text-[0.55rem] uppercase tracking-[0.14em] text-gold-dark">
                  {t.projectsPage.status[project.status]}
                </span>
              </div>

              <div className="p-6">
                <div className="flex items-end justify-between gap-4">
                  <span className="text-[0.55rem] uppercase tracking-[0.16em] text-ink/40">
                    {t.portal.progress}
                  </span>
                  <span className="tabular font-display text-3xl leading-none text-ink">
                    {project.progress}%
                  </span>
                </div>
                <div className="mt-3 h-1.5 w-full overflow-hidden bg-ink/10">
                  <div
                    className="h-full bg-gold-dark transition-all duration-700"
                    style={{ width: `${project.progress}%` }}
                  />
                </div>

                <dl className="mt-7 grid grid-cols-2 gap-x-6 gap-y-5 border-t border-ink/10 pt-6">
                  {[
                    { label: t.portal.phase, value: l(project.phase) },
                    { label: t.portal.value, value: l(project.value) },
                    { label: t.portal.siteManager, value: l(project.manager) },
                    { label: t.portal.lastUpdate, value: l(project.lastUpdate) },
                  ].map((fact) => (
                    <div key={fact.label}>
                      <dt className="text-[0.5rem] uppercase tracking-[0.14em] text-ink/35">
                        {fact.label}
                      </dt>
                      <dd className="mt-1 text-[0.76rem] leading-snug text-ink/70">{fact.value}</dd>
                    </div>
                  ))}
                </dl>
              </div>

              <div className="flex gap-1 border-t border-ink/10 p-2">
                {tabs.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setTab(item.id)}
                    className={cn(
                      "flex-1 px-3 py-2.5 text-[0.58rem] font-semibold uppercase tracking-[0.12em] transition-colors",
                      tab === item.id
                        ? "bg-ink text-ivory"
                        : "text-ink/40 hover:text-ink/70",
                    )}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-6">
              {tab === "overview" ? (
                <div className="border border-ink/10 bg-ivory">
                  <div className="border-b border-ink/10 px-6 py-4">
                    <span className="text-[0.55rem] font-semibold uppercase tracking-[0.16em] text-gold-dark">
                      {t.portal.milestones}
                    </span>
                  </div>
                  <ol className="divide-y divide-ink/8">
                    {project.milestones.map((milestone) => (
                      <li key={milestone.title.en} className="flex items-start gap-3 px-6 py-3.5">
                        <span
                          className={cn(
                            "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border",
                            milestone.status === "complete"
                              ? "border-gold-dark bg-gold-dark text-ivory"
                              : milestone.status === "current"
                                ? "border-gold-dark text-gold-dark"
                                : "border-ink/15 text-ink/25",
                          )}
                        >
                          {milestone.status === "complete" ? (
                            <Check className="h-2.5 w-2.5" />
                          ) : milestone.status === "current" ? (
                            <Clock className="h-2.5 w-2.5" />
                          ) : (
                            <span className="h-1 w-1 rounded-full bg-current" />
                          )}
                        </span>
                        <div className="min-w-0">
                          <p
                            className={cn(
                              "text-[0.75rem] leading-snug",
                              milestone.status === "upcoming" ? "text-ink/40" : "text-ink/75",
                            )}
                          >
                            {l(milestone.title)}
                          </p>
                          <span className="text-[0.58rem] text-ink/35">{l(milestone.date)}</span>
                        </div>
                      </li>
                    ))}
                  </ol>
                </div>
              ) : null}

              {tab === "documents" ? (
                <div className="border border-ink/10 bg-ivory">
                  <div className="border-b border-ink/10 px-6 py-4">
                    <span className="text-[0.55rem] font-semibold uppercase tracking-[0.16em] text-gold-dark">
                      {t.portal.documents}
                    </span>
                  </div>
                  <ul className="divide-y divide-ink/8">
                    {project.documents.map((doc) => (
                      <li key={doc.name.en} className="flex items-center gap-3 px-6 py-4">
                        <FileText className="h-4 w-4 shrink-0 text-gold-dark" />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-[0.75rem] text-ink/75">{l(doc.name)}</p>
                          <span className="text-[0.56rem] text-ink/35">
                            {t.portal.documentTypes[doc.type]} · {doc.size} · {doc.date}
                          </span>
                        </div>
                        <button
                          type="button"
                          className="flex h-8 w-8 shrink-0 items-center justify-center border border-ink/12 text-ink/45 transition-colors hover:border-gold-dark hover:text-gold-dark"
                          aria-label={t.portal.download}
                        >
                          <Download className="h-3.5 w-3.5" />
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}

              {tab === "invoices" ? (
                <div className="border border-ink/10 bg-ivory">
                  <div className="border-b border-ink/10 px-6 py-4">
                    <span className="text-[0.55rem] font-semibold uppercase tracking-[0.16em] text-gold-dark">
                      {t.portal.invoices}
                    </span>
                  </div>
                  <ul className="divide-y divide-ink/8">
                    {project.invoices.map((invoice) => (
                      <li key={invoice.number} className="flex items-center gap-3 px-6 py-4">
                        <Receipt className="h-4 w-4 shrink-0 text-gold-dark" />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-[0.75rem] text-ink/75">{l(invoice.title)}</p>
                          <span className="tabular text-[0.56rem] text-ink/35">
                            {invoice.number} · {invoice.date}
                          </span>
                        </div>
                        <div className="shrink-0 text-end">
                          <p className="tabular text-[0.68rem] text-ink/70">{invoice.amount}</p>
                          <span
                            className={cn(
                              "text-[0.52rem] uppercase tracking-[0.1em]",
                              invoice.status === "paid"
                                ? "text-[#4f7a5b]"
                                : invoice.status === "due"
                                  ? "text-gold-dark"
                                  : "text-ink/35",
                            )}
                          >
                            {t.portal.invoiceStatus[invoice.status]}
                          </span>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}

              <div className="border border-ink/10 bg-paper/50">
                <div className="border-b border-ink/10 px-6 py-4">
                  <span className="text-[0.55rem] font-semibold uppercase tracking-[0.16em] text-gold-dark">
                    {t.portal.updates}
                  </span>
                </div>
                <ul className="divide-y divide-ink/8">
                  {t.portal.updatesList.map((update) => (
                    <li key={update.title} className="px-6 py-4">
                      <span className="text-[0.55rem] uppercase tracking-[0.12em] text-gold-dark">
                        {update.date}
                      </span>
                      <p className="mt-1 text-[0.75rem] font-medium leading-snug text-ink/75">
                        {update.title}
                      </p>
                      <p className="mt-1 text-[0.66rem] leading-relaxed text-ink/40">{update.text}</p>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          <div className="mt-8 flex flex-col items-start justify-between gap-3 border-t border-ink/10 pt-5 text-[0.6rem] text-ink/35 sm:flex-row sm:items-center">
            <span>{t.portal.demoNotice}</span>
            <Link
              href="/contact"
              className="inline-flex items-center gap-1.5 font-semibold uppercase tracking-[0.12em] transition-colors hover:text-gold-dark"
            >
              {t.cta.primary}
              <ArrowUpRight className={cn("h-3 w-3", isRTL && "-scale-x-100")} />
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}

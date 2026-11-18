"use client";

import { useState } from "react";
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
  UserRound,
  Wallet,
} from "lucide-react";
import { isAdminUser, useAuth } from "@/components/providers/AuthProvider";
import { useI18n } from "@/components/providers/I18nProvider";
import { useWorkspace } from "@/components/providers/WorkspaceProvider";
import { Reveal } from "@/components/ui/Reveal";
import type { PortalDocument } from "@/data/portal";
import { cn } from "@/lib/utils";

type Tab = "overview" | "documents" | "invoices";

function downloadRecord(doc: PortalDocument, projectName: string) {
  const content = [
    "AHMED ELATTAR GENERAL CONTRACTING CO.",
    "PROJECT DOCUMENT RECORD",
    "",
    `Project: ${projectName}`,
    `Document: ${doc.name.en}`,
    `Type: ${doc.type}`,
    `Date: ${doc.date}`,
    `Size: ${doc.size}`,
    "",
    "This export summarises the document record held in the client portal.",
    "For the controlled issued copy, contact your project manager.",
  ].join("\n");
  const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `${doc.name.en.replace(/\s+/g, "-").toLowerCase()}.txt`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

export function PortalDashboard() {
  const { t, l, isRTL, locale } = useI18n();
  const { user, ready, signOut } = useAuth();
  const { projects } = useWorkspace();
  const router = useRouter();
  const [selectedSlug, setSelectedSlug] = useState("");
  const [tab, setTab] = useState<Tab>("overview");

  const activeSlug = projects.some((item) => item.slug === selectedSlug)
    ? selectedSlug
    : (projects[0]?.slug ?? "");
  const project = projects.find((item) => item.slug === activeSlug) ?? projects[0] ?? null;

  if (!ready) {
    return (
      <section className="flex min-h-[70svh] items-center justify-center bg-bg pt-24">
        <span className="h-8 w-8 animate-spin rounded-full border border-line border-t-accent" />
      </section>
    );
  }

  if (!user) {
    return (
      <section className="relative flex min-h-[100svh] items-center overflow-hidden bg-bg pt-24">
        <div className="blueprint-grid pointer-events-none absolute inset-0 opacity-40" />
        <div className="pointer-events-none absolute start-1/3 top-1/3 h-[420px] w-[420px] rounded-full bg-accent/[0.06] blur-[140px]" />
        <div className="container-lux relative">
          <div className="mx-auto flex max-w-lg flex-col items-center text-center">
            <span className="eyebrow">{t.portal.eyebrow}</span>
            <h1 className="display-title mt-6 text-[clamp(2.6rem,5vw,4.4rem)] text-fg">
              {t.portal.noAccessTitle}
            </h1>
            <p className="mt-5 max-w-md text-[0.9rem] leading-[1.9] text-fg">
              {t.portal.noAccessText}
            </p>
            <Link
              href="/sign-in"
              className="btn-shine mt-9 inline-flex h-12 items-center gap-2.5 bg-accent-fill px-7 text-[0.66rem] font-semibold uppercase tracking-[0.16em] text-accent-fg transition-colors hover:bg-accent-fill"
            >
              {t.portal.signIn}
              <ArrowUpRight className={cn("h-4 w-4", isRTL && "-scale-x-100")} />
            </Link>
            <p className="mt-6 text-[0.62rem] text-fg">{t.auth.secureNote}</p>
          </div>
        </div>
      </section>
    );
  }

  if (!project) {
    return (
      <section className="relative flex min-h-[100svh] items-center overflow-hidden bg-bg pt-24">
        <div className="blueprint-grid pointer-events-none absolute inset-0 opacity-40" />
        <div className="container-lux relative">
          <div className="mx-auto flex max-w-lg flex-col items-center text-center">
            <span className="eyebrow">{t.portal.eyebrow}</span>
            <h1 className="display-title mt-6 text-[clamp(2.4rem,5vw,4.2rem)] text-fg">
              {locale === "ar" ? "لا يوجد مشروع بعد." : "No project yet."}
            </h1>
            <p className="mt-5 max-w-md text-[0.9rem] leading-[1.9] text-fg">
              {locale === "ar"
                ? "سيظهر مشروعك هنا بمجرد إسناده من فريق المشاريع."
                : "Your project will appear here as soon as it is assigned by our project team."}
            </p>
            <Link
              href="/contact"
              className="btn-shine mt-9 inline-flex h-12 items-center gap-2.5 border border-accent/40 px-7 text-[0.66rem] font-semibold uppercase tracking-[0.16em] text-accent transition-colors hover:bg-accent-fill hover:text-accent-fg"
            >
              {t.cta.primary}
              <ArrowUpRight className="h-4 w-4" />
            </Link>
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

  const totalValue = projects.reduce((sum, item) => sum + item.contractValue, 0);
  const totalValueLabel =
    locale === "ar"
      ? `${(totalValue / 1000).toFixed(2)} مليار ر.س`
      : `SAR ${(totalValue / 1000).toFixed(2)}B`;
  const completedMilestones = project.milestones.filter(
    (milestone) => milestone.status === "complete",
  ).length;
  const milestoneRate = project.milestones.length
    ? Math.round((completedMilestones / project.milestones.length) * 100)
    : 0;
  const nextMilestone =
    project.milestones.find((milestone) => milestone.status !== "complete")?.title ??
    project.nextMilestone;

  return (
    <>
      <section className="relative overflow-hidden bg-bg pb-12 pt-32 sm:pt-40">
        <div className="blueprint-grid pointer-events-none absolute inset-0 opacity-40" />
        <div className="pointer-events-none absolute -end-20 top-10 select-none text-[14rem] font-semibold leading-none tracking-tighter text-fg/[0.02] sm:text-[20rem]">
          PORTAL
        </div>

        <div className="container-lux relative">
          <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-start">
            <div>
              <Reveal>
                <span className="eyebrow">{t.portal.eyebrow}</span>
              </Reveal>
              <Reveal delay={70}>
                <h1 className="display-title mt-5 text-[clamp(2.4rem,5vw,4.6rem)] text-fg">
                  {t.portal.welcome}، <span className="gold-text">{user.name}</span>
                </h1>
              </Reveal>
              <Reveal delay={130}>
                <p className="mt-3 text-[0.85rem] leading-relaxed text-fg">
                  {t.portal.subtitle}
                </p>
              </Reveal>
            </div>

            <Reveal delay={150}>
              <div className="flex items-center gap-3">
                <span className="hidden text-end sm:block">
                  <span className="block text-[0.62rem] text-fg">{user.company}</span>
                  <span className="mt-0.5 block tabular text-[0.55rem] uppercase tracking-[0.14em] text-accent">
                    {user.accountId}
                  </span>
                </span>
                <button
                  type="button"
                  onClick={() => {
                    signOut();
                    router.push("/");
                  }}
                  className="inline-flex h-10 items-center gap-2 border border-line px-4 text-[0.58rem] font-semibold uppercase tracking-[0.14em] text-fg transition-colors hover:border-accent/50 hover:text-accent"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  {t.portal.signOut}
                </button>
              </div>
            </Reveal>
          </div>

          <div className="mt-10 grid grid-cols-2 gap-px border border-line bg-line lg:grid-cols-4">
            {[
              { label: t.portal.activeProjects, value: `${projects.length}` },
              { label: t.portal.totalValue, value: totalValueLabel },
              { label: t.portal.nextMilestone, value: l(nextMilestone) },
              {
                label: locale === "ar" ? "المراحل المكتملة" : "Milestones complete",
                value: `${milestoneRate}%`,
              },
            ].map((stat) => (
              <div key={stat.label} className="bg-bg px-5 py-5">
                <span className="text-[0.5rem] uppercase tracking-[0.16em] text-fg">
                  {stat.label}
                </span>
                <p className="mt-2 text-[0.82rem] leading-snug text-fg">{stat.value}</p>
              </div>
            ))}
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            <Link
              href="/portal/projects"
              className="inline-flex h-9 items-center gap-2 border border-line px-3.5 text-[0.56rem] font-semibold uppercase tracking-[0.12em] text-fg transition-colors hover:border-accent/40 hover:text-accent"
            >
              <FolderKanban className="h-3.5 w-3.5" />
              {t.nav.portalProjects}
            </Link>
            <Link
              href="/portal/financials"
              className="inline-flex h-9 items-center gap-2 border border-line px-3.5 text-[0.56rem] font-semibold uppercase tracking-[0.12em] text-fg transition-colors hover:border-accent/40 hover:text-accent"
            >
              <Wallet className="h-3.5 w-3.5" />
              {t.nav.financials}
            </Link>
            <Link
              href="/portal/settings"
              className="inline-flex h-9 items-center gap-2 border border-line px-3.5 text-[0.56rem] font-semibold uppercase tracking-[0.12em] text-fg transition-colors hover:border-accent/40 hover:text-accent"
            >
              <Settings className="h-3.5 w-3.5" />
              {t.nav.settings}
            </Link>
            {isAdminUser(user) ? (
              <Link
                href="/admin"
                className="inline-flex h-9 items-center gap-2 border border-accent/30 px-3.5 text-[0.56rem] font-semibold uppercase tracking-[0.12em] text-accent transition-colors hover:bg-accent-fill hover:text-accent-fg"
              >
                {t.nav.admin}
                <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
            ) : null}
          </div>
        </div>
      </section>

      <section className="relative min-h-[60svh] overflow-hidden border-t border-line bg-bg">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_80%_0%,rgb(var(--accent-rgb)/0.05),transparent_55%)]" />
        <div className="container-lux relative pb-20 pt-10">
          <div className="grid gap-2 sm:grid-cols-3">
            {projects.map((item) => (
              <button
                key={item.slug}
                type="button"
                onClick={() => {
                  setSelectedSlug(item.slug);
                  setTab("overview");
                }}
                className={cn(
                  "flex flex-col gap-2 border p-4 text-start transition-colors",
                  item.slug === project.slug
                    ? "border-accent/40 bg-accent/[0.08] text-fg"
                    : "border-line bg-surface text-fg hover:border-line",
                )}
              >
                <span className="flex items-center justify-between gap-3">
                  <span className="truncate text-[0.78rem] font-medium">{l(item.title)}</span>
                  <span
                    className={cn(
                      "tabular shrink-0 text-[0.6rem]",
                      item.slug === project.slug ? "text-accent" : "text-accent",
                    )}
                  >
                    {item.progress}%
                  </span>
                </span>
                <span
                  className={cn(
                    "text-[0.55rem] uppercase tracking-[0.12em]",
                    item.slug === project.slug ? "text-fg" : "text-fg",
                  )}
                >
                  {l(item.location)}
                </span>
              </button>
            ))}
          </div>

          <div className="mt-6 grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
            <div className="border border-line bg-surface">
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-line px-6 py-5">
                <div>
                  <span className="text-[0.52rem] uppercase tracking-[0.16em] text-fg">
                    {t.portal.project}
                  </span>
                  <h2 className="mt-1 font-display text-2xl leading-tight text-fg">
                    {l(project.title)}
                  </h2>
                  <p className="mt-1 flex items-center gap-1.5 text-[0.62rem] text-fg">
                    <MapPin className="h-3 w-3 text-accent" />
                    {l(project.location)}
                  </p>
                </div>
                <span className="border border-accent/30 px-3 py-1 text-[0.55rem] uppercase tracking-[0.14em] text-accent">
                  {t.projectsPage.status[project.status]}
                </span>
              </div>

              <div className="p-6">
                <div className="flex items-end justify-between gap-4">
                  <span className="text-[0.55rem] uppercase tracking-[0.16em] text-fg">
                    {t.portal.progress}
                  </span>
                  <span className="tabular font-display text-3xl leading-none text-fg">
                    {project.progress}%
                  </span>
                </div>
                <div className="mt-3 h-1.5 w-full overflow-hidden bg-line">
                  <div
                    className="h-full bg-accent-fill transition-all duration-700"
                    style={{ width: `${project.progress}%` }}
                  />
                </div>

                <dl className="mt-7 grid grid-cols-2 gap-x-6 gap-y-5 border-t border-line pt-6">
                  {[
                    { label: t.portal.phase, value: l(project.phase) },
                    { label: t.portal.value, value: l(project.value) },
                    { label: t.portal.siteManager, value: l(project.manager) },
                    { label: t.portal.lastUpdate, value: l(project.lastUpdate) },
                  ].map((fact) => (
                    <div key={fact.label}>
                      <dt className="text-[0.5rem] uppercase tracking-[0.14em] text-fg">
                        {fact.label}
                      </dt>
                      <dd className="mt-1 text-[0.76rem] leading-snug text-fg">
                        {fact.value}
                      </dd>
                    </div>
                  ))}
                </dl>
              </div>

              <div className="flex gap-1 border-t border-line p-2">
                {tabs.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setTab(item.id)}
                    className={cn(
                      "flex-1 px-3 py-2.5 text-[0.58rem] font-semibold uppercase tracking-[0.12em] transition-colors",
                      tab === item.id
                        ? "bg-accent-fill text-accent-fg"
                        : "text-fg hover:text-fg",
                    )}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-6">
              {tab === "overview" ? (
                <div className="border border-line bg-surface">
                  <div className="border-b border-line px-6 py-4">
                    <span className="text-[0.55rem] font-semibold uppercase tracking-[0.16em] text-accent">
                      {t.portal.milestones}
                    </span>
                  </div>
                  <ol className="divide-y divide-line">
                    {project.milestones.map((milestone) => (
                      <li key={milestone.title.en} className="flex items-start gap-3 px-6 py-3.5">
                        <span
                          className={cn(
                            "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border",
                            milestone.status === "complete"
                              ? "border-accent bg-accent-fill text-accent-fg"
                              : milestone.status === "current"
                                ? "border-accent text-accent"
                                : "border-line text-fg",
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
                              milestone.status === "upcoming" ? "text-fg" : "text-fg",
                            )}
                          >
                            {l(milestone.title)}
                          </p>
                          <span className="text-[0.58rem] text-fg">
                            {l(milestone.date)}
                          </span>
                        </div>
                      </li>
                    ))}
                    {project.milestones.length === 0 ? (
                      <li className="px-6 py-6 text-center text-[0.68rem] text-fg">
                        {locale === "ar" ? "لا توجد مراحل مجدولة بعد." : "No milestones yet."}
                      </li>
                    ) : null}
                  </ol>
                </div>
              ) : null}

              {tab === "documents" ? (
                <div className="border border-line bg-surface">
                  <div className="border-b border-line px-6 py-4">
                    <span className="text-[0.55rem] font-semibold uppercase tracking-[0.16em] text-accent">
                      {t.portal.documents}
                    </span>
                  </div>
                  <ul className="divide-y divide-line">
                    {project.documents.map((doc) => (
                      <li key={doc.name.en} className="flex items-center gap-3 px-6 py-4">
                        <FileText className="h-4 w-4 shrink-0 text-accent" />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-[0.75rem] text-fg">{l(doc.name)}</p>
                          <span className="text-[0.56rem] text-fg">
                            {t.portal.documentTypes[doc.type]} · {doc.size} · {doc.date}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => downloadRecord(doc, l(project.title))}
                          className="flex h-8 w-8 shrink-0 items-center justify-center border border-line text-fg transition-colors hover:border-accent hover:text-accent"
                          aria-label={t.portal.download}
                        >
                          <Download className="h-3.5 w-3.5" />
                        </button>
                      </li>
                    ))}
                    {project.documents.length === 0 ? (
                      <li className="px-6 py-6 text-center text-[0.68rem] text-fg">
                        {locale === "ar" ? "لا توجد مستندات بعد." : "No documents yet."}
                      </li>
                    ) : null}
                  </ul>
                </div>
              ) : null}

              {tab === "invoices" ? (
                <div className="border border-line bg-surface">
                  <div className="border-b border-line px-6 py-4">
                    <span className="text-[0.55rem] font-semibold uppercase tracking-[0.16em] text-accent">
                      {t.portal.invoices}
                    </span>
                  </div>
                  <ul className="divide-y divide-line">
                    {project.invoices.map((invoice) => (
                      <li key={invoice.number} className="flex items-center gap-3 px-6 py-4">
                        <Receipt className="h-4 w-4 shrink-0 text-accent" />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-[0.75rem] text-fg">
                            {l(invoice.title)}
                          </p>
                          <span className="tabular text-[0.56rem] text-fg">
                            {invoice.number} · {invoice.date}
                          </span>
                        </div>
                        <div className="shrink-0 text-end">
                          <p className="tabular text-[0.68rem] text-fg">{invoice.amount}</p>
                          <span
                            className={cn(
                              "text-[0.52rem] uppercase tracking-[0.1em]",
                              invoice.status === "paid"
                                ? "text-success"
                                : invoice.status === "due"
                                  ? "text-accent"
                                  : "text-fg",
                            )}
                          >
                            {t.portal.invoiceStatus[invoice.status]}
                          </span>
                        </div>
                      </li>
                    ))}
                    {project.invoices.length === 0 ? (
                      <li className="px-6 py-6 text-center text-[0.68rem] text-fg">
                        {locale === "ar" ? "لا توجد فواتير بعد." : "No invoices yet."}
                      </li>
                    ) : null}
                  </ul>
                </div>
              ) : null}

              <div className="flex items-center justify-between gap-3 border border-line bg-surface-2 px-5 py-4">
                <div className="flex items-center gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-accent-fill text-accent-fg">
                    <UserRound className="h-4 w-4" />
                  </span>
                  <div>
                    <p className="text-[0.72rem] font-medium text-fg">{l(project.manager)}</p>
                    <p className="text-[0.55rem] uppercase tracking-[0.12em] text-fg">
                      {t.portal.siteManager}
                    </p>
                  </div>
                </div>
                <Link
                  href="/portal/projects"
                  className="flex h-8 w-8 items-center justify-center border border-line text-fg transition-colors hover:border-accent hover:text-accent"
                  aria-label={t.nav.portalProjects}
                >
                  <ArrowUpRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          </div>

          <div className="mt-8 flex flex-col items-start justify-between gap-3 border-t border-line pt-5 text-[0.6rem] text-fg sm:flex-row sm:items-center">
            <span>{t.auth.secureNote}</span>
            <Link
              href="/contact"
              className="inline-flex items-center gap-1.5 font-semibold uppercase tracking-[0.12em] transition-colors hover:text-accent"
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

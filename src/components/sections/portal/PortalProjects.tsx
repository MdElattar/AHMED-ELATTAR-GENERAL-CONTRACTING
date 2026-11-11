"use client";

import { useMemo, useState } from "react";
import {
  ArrowUpRight,
  CalendarDays,
  Check,
  Clock,
  Download,
  FileText,
  MessageSquare,
  Send,
  UserRound,
} from "lucide-react";
import { useI18n } from "@/components/providers/I18nProvider";
import { useWorkspace } from "@/components/providers/WorkspaceProvider";
import { PortalShell } from "@/components/sections/portal/PortalShell";
import { SiteCamera } from "@/components/sections/portal/SiteCamera";
import { ProjectArt } from "@/components/ui/ProjectArt";
import { Reveal } from "@/components/ui/Reveal";
import { portalProjects, type PortalDocument } from "@/data/portal";
import { cn } from "@/lib/utils";

const copy = {
  ar: {
    title: "متابعة المشاريع",
    description:
      "تقدم لحظي، كاميرا موقع، مخططات قابلة للتنزيل، وتواصل مباشر مع مدير المشروع — كل شيء في مكان واحد.",
    select: "اختر المشروع",
    progress: "نسبة الإنجاز",
    phase: "المرحلة الحالية",
    value: "قيمة العقد",
    manager: "مدير المشروع",
    lastUpdate: "آخر تحديث",
    next: "المحطة القادمة",
    timeline: "المسار الزمني",
    camera: "كاميرا الموقع",
    blueprints: "المخططات والمستندات",
    download: "تنزيل",
    messages: "التواصل مع مدير المشروع",
    messagePlaceholder: "اكتب رسالتك إلى مدير المشروع...",
    send: "إرسال",
    noMessages: "لا توجد رسائل بعد. ابدأ الحوار.",
    client: "أنت",
    managerRole: "مدير المشروع",
    gallery: "معرض الموقع",
    completed: "مكتمل",
    current: "جارٍ",
    upcoming: "قادم",
    docTypes: {
      contract: "عقد",
      drawing: "مخطط",
      report: "تقرير",
      certificate: "شهادة",
    },
  },
  en: {
    title: "Project tracking",
    description:
      "Live progress, a site camera, downloadable drawings, and direct messaging with your project manager — all in one place.",
    select: "Select project",
    progress: "Progress",
    phase: "Current phase",
    value: "Contract value",
    manager: "Project manager",
    lastUpdate: "Last update",
    next: "Next milestone",
    timeline: "Timeline",
    camera: "Site camera",
    blueprints: "Drawings & documents",
    download: "Download",
    messages: "Message your project manager",
    messagePlaceholder: "Write a message to your project manager...",
    send: "Send",
    noMessages: "No messages yet. Start the conversation.",
    client: "You",
    managerRole: "Project manager",
    gallery: "Site gallery",
    completed: "Complete",
    current: "Current",
    upcoming: "Upcoming",
    docTypes: {
      contract: "Contract",
      drawing: "Drawing",
      report: "Report",
      certificate: "Certificate",
    },
  },
};

function downloadDocument(doc: PortalDocument, projectName: string) {
  const content = [
    "AHMED ELATTAR GENERAL CONTRACTING CO.",
    "PROJECT DOCUMENT — DEMO EXPORT",
    "",
    `Project: ${projectName}`,
    `Document: ${doc.name.en}`,
    `Type: ${doc.type}`,
    `Date: ${doc.date}`,
    `Size: ${doc.size}`,
    "",
    "This is a demo export from the client portal.",
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

export function PortalProjects() {
  const { l, locale } = useI18n();
  const { projects, messages, addMessage } = useWorkspace();
  const c = copy[locale];
  const [activeSlug, setActiveSlug] = useState(portalProjects[0].slug);
  const [draft, setDraft] = useState("");

  const portalProject =
    portalProjects.find((item) => item.slug === activeSlug) ?? portalProjects[0];
  const project = projects.find((item) => item.slug === activeSlug);
  const progress = project?.progress ?? portalProject.progress;
  const milestones = project?.milestones.length ? project.milestones : portalProject.milestones;
  const nextMilestone =
    milestones.find((milestone) => milestone.status !== "complete")?.title ??
    portalProject.nextMilestone;
  const projectMessages = useMemo(
    () => messages.filter((message) => message.projectSlug === activeSlug),
    [activeSlug, messages],
  );

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!draft.trim()) return;
    addMessage(activeSlug, draft);
    setDraft("");
  };

  const dateFormat = new Intl.DateTimeFormat(locale === "ar" ? "ar-SA" : "en-GB", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <PortalShell title={c.title} description={c.description}>
      <div className="flex flex-col gap-2 sm:flex-row">
        {portalProjects.map((item) => {
          const itemProgress =
            projects.find((projectItem) => projectItem.slug === item.slug)?.progress ??
            item.progress;
          return (
            <button
              key={item.slug}
              type="button"
              onClick={() => setActiveSlug(item.slug)}
              className={cn(
                "flex flex-1 flex-col gap-2 border p-4 text-start transition-colors",
                item.slug === activeSlug
                  ? "border-ink bg-ink text-ivory"
                  : "border-ink/12 bg-ivory text-ink hover:border-ink/30",
              )}
            >
              <span className="flex items-center justify-between gap-3">
                <span className="truncate text-[0.76rem] font-medium">{l(item.name)}</span>
                <span
                  className={cn(
                    "tabular shrink-0 text-[0.6rem]",
                    item.slug === activeSlug ? "text-gold" : "text-gold-dark",
                  )}
                >
                  {itemProgress}%
                </span>
              </span>
              <span
                className={cn(
                  "text-[0.54rem] uppercase tracking-[0.12em]",
                  item.slug === activeSlug ? "text-ivory/40" : "text-ink/35",
                )}
              >
                {l(item.location)}
              </span>
            </button>
          );
        })}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="flex flex-col gap-6">
          <Reveal>
            <div className="border border-ink/10 bg-ivory">
              <div className="flex flex-wrap items-start justify-between gap-4 border-b border-ink/10 px-6 py-5">
                <div>
                  <span className="text-[0.52rem] uppercase tracking-[0.16em] text-ink/35">
                    {c.select}
                  </span>
                  <h2 className="mt-1 font-display text-2xl leading-tight text-ink">
                    {l(project?.title ?? portalProject.name)}
                  </h2>
                  <p className="mt-1 text-[0.62rem] text-ink/40">
                    {l(project?.location ?? portalProject.location)}
                  </p>
                </div>
                <span className="border border-gold-dark/30 px-3 py-1 text-[0.55rem] uppercase tracking-[0.14em] text-gold-dark">
                  {tStatus(portalProject.status, c)}
                </span>
              </div>

              <div className="grid gap-5 p-6 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <div className="flex items-end justify-between gap-4">
                    <span className="text-[0.55rem] uppercase tracking-[0.16em] text-ink/40">
                      {c.progress}
                    </span>
                    <span className="tabular font-display text-3xl leading-none text-ink">
                      {progress}%
                    </span>
                  </div>
                  <div className="mt-3 h-1.5 w-full overflow-hidden bg-ink/10">
                    <div
                      className="h-full bg-gold-dark transition-all duration-700"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
                {[
                  { label: c.phase, value: l(portalProject.phase) },
                  { label: c.value, value: l(project?.value ?? portalProject.value) },
                  { label: c.manager, value: l(portalProject.manager) },
                  { label: c.lastUpdate, value: l(portalProject.lastUpdate) },
                  { label: c.next, value: l(nextMilestone) },
                ].map((fact) => (
                  <div key={fact.label}>
                    <p className="text-[0.5rem] uppercase tracking-[0.14em] text-ink/35">
                      {fact.label}
                    </p>
                    <p className="mt-1 text-[0.76rem] leading-snug text-ink/70">{fact.value}</p>
                  </div>
                ))}
              </div>

              {project?.gallery?.length ? (
                <div className="border-t border-ink/10 p-4">
                  <p className="mb-3 text-[0.5rem] uppercase tracking-[0.14em] text-ink/35">
                    {c.gallery}
                  </p>
                  <div className="grid grid-cols-3 gap-2">
                    {project.gallery.slice(0, 3).map((variant, index) => (
                      <div key={`${variant}-${index}`} className="relative aspect-[4/3] overflow-hidden border border-ink/10">
                        <ProjectArt variant={variant} className="h-full w-full" />
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          </Reveal>

          <Reveal delay={80}>
            <SiteCamera
              title={l(project?.title ?? portalProject.name)}
              location={l(project?.location ?? portalProject.location)}
              progress={progress}
              art={project?.art ?? "tower"}
            />
          </Reveal>
        </div>

        <div className="flex flex-col gap-6">
          <Reveal delay={100}>
            <div className="border border-ink/10 bg-ivory">
              <div className="flex items-center justify-between gap-3 border-b border-ink/10 px-6 py-4">
                <span className="text-[0.55rem] font-semibold uppercase tracking-[0.16em] text-gold-dark">
                  {c.timeline}
                </span>
                <CalendarDays className="h-4 w-4 text-gold-dark/60" />
              </div>
              <ol className="divide-y divide-ink/8">
                {milestones.map((milestone) => (
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
          </Reveal>

          <Reveal delay={140}>
            <div className="border border-ink/10 bg-ivory">
              <div className="flex items-center justify-between gap-3 border-b border-ink/10 px-6 py-4">
                <span className="text-[0.55rem] font-semibold uppercase tracking-[0.16em] text-gold-dark">
                  {c.blueprints}
                </span>
                <FileText className="h-4 w-4 text-gold-dark/60" />
              </div>
              <ul className="divide-y divide-ink/8">
                {portalProject.documents.map((doc) => (
                  <li key={doc.name.en} className="flex items-center gap-3 px-6 py-4">
                    <FileText className="h-4 w-4 shrink-0 text-gold-dark" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[0.74rem] text-ink/75">{l(doc.name)}</p>
                      <span className="text-[0.55rem] text-ink/35">
                        {c.docTypes[doc.type]} · {doc.size} · {doc.date}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => downloadDocument(doc, l(project?.title ?? portalProject.name))}
                      className="flex h-8 w-8 shrink-0 items-center justify-center border border-ink/12 text-ink/45 transition-colors hover:border-gold-dark hover:text-gold-dark"
                      aria-label={`${c.download} ${l(doc.name)}`}
                    >
                      <Download className="h-3.5 w-3.5" />
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>

          <Reveal delay={180}>
            <div className="border border-ink/10 bg-ivory">
              <div className="flex items-center justify-between gap-3 border-b border-ink/10 px-6 py-4">
                <span className="text-[0.55rem] font-semibold uppercase tracking-[0.16em] text-gold-dark">
                  {c.messages}
                </span>
                <MessageSquare className="h-4 w-4 text-gold-dark/60" />
              </div>

              <div className="max-h-64 space-y-3 overflow-y-auto p-5">
                {projectMessages.length ? (
                  projectMessages.map((message) => (
                    <div
                      key={message.id}
                      className={cn(
                        "flex flex-col gap-1",
                        message.author === "client" ? "items-end" : "items-start",
                      )}
                    >
                      <span className="flex items-center gap-1.5 text-[0.5rem] uppercase tracking-[0.12em] text-ink/35">
                        {message.author === "client" ? (
                          <UserRound className="h-3 w-3" />
                        ) : (
                          <MessageSquare className="h-3 w-3 text-gold-dark" />
                        )}
                        {message.author === "client" ? c.client : c.managerRole}
                        <span className="text-ink/25">{dateFormat.format(new Date(message.at))}</span>
                      </span>
                      <p
                        className={cn(
                          "max-w-[90%] px-3 py-2 text-[0.7rem] leading-relaxed",
                          message.author === "client"
                            ? "bg-ink text-ivory"
                            : "border border-ink/10 bg-paper/60 text-ink/70",
                        )}
                      >
                        {message.text}
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="py-6 text-center text-[0.68rem] text-ink/35">{c.noMessages}</p>
                )}
              </div>

              <form onSubmit={submit} className="flex gap-2 border-t border-ink/10 p-3">
                <input
                  value={draft}
                  onChange={(event) => setDraft(event.target.value)}
                  placeholder={c.messagePlaceholder}
                  className="h-10 min-w-0 flex-1 border border-ink/12 bg-transparent px-3 text-[0.7rem] text-ink outline-none placeholder:text-ink/30 focus:border-gold-dark/60"
                />
                <button
                  type="submit"
                  className="flex h-10 w-10 shrink-0 items-center justify-center bg-gold-dark text-ivory transition-colors hover:bg-gold"
                  aria-label={c.send}
                >
                  <Send className="h-3.5 w-3.5" />
                </button>
              </form>
            </div>
          </Reveal>

          <Reveal delay={220}>
            <div className="flex items-center justify-between gap-3 border border-ink/10 bg-paper/40 px-5 py-4">
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-ink text-ivory">
                  <UserRound className="h-4 w-4" />
                </span>
                <div>
                  <p className="text-[0.72rem] font-medium text-ink">{l(portalProject.manager)}</p>
                  <p className="text-[0.55rem] uppercase tracking-[0.12em] text-ink/35">
                    {c.managerRole}
                  </p>
                </div>
              </div>
              <ArrowUpRight className="h-4 w-4 text-gold-dark" />
            </div>
          </Reveal>
        </div>
      </div>
    </PortalShell>
  );
}

function tStatus(status: string, copyValue: (typeof copy)["ar" | "en"]) {
  if (status === "completed") return copyValue.completed;
  if (status === "ongoing") return copyValue.current;
  return copyValue.upcoming;
}

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
import { PortalContract } from "@/components/sections/portal/PortalContract";
import { PortalShell } from "@/components/sections/portal/PortalShell";
import { SiteCamera } from "@/components/sections/portal/SiteCamera";
import { ProjectArt } from "@/components/ui/ProjectArt";
import { Reveal } from "@/components/ui/Reveal";
import type { PortalDocument } from "@/data/portal";
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
    noMilestones: "لا توجد مراحل مجدولة بعد.",
    client: "أنت",
    managerRole: "مدير المشروع",
    gallery: "معرض الموقع",
    completed: "مكتمل",
    current: "جارٍ",
    upcoming: "قادم",
    empty: "لم يُسند إليك مشروع بعد. سيتواصل معك مدير المشروع عند بدء التنفيذ.",
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
    noMilestones: "No milestones are scheduled yet.",
    client: "You",
    managerRole: "Project manager",
    gallery: "Site gallery",
    completed: "Complete",
    current: "Current",
    upcoming: "Upcoming",
    empty: "No project is assigned to you yet. Your project manager will be in touch when work begins.",
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

export function PortalProjects() {
  const { l, locale } = useI18n();
  const { projects, messages, addMessage } = useWorkspace();
  const c = copy[locale];
  const [selectedSlug, setSelectedSlug] = useState("");
  const [draft, setDraft] = useState("");

  const activeSlug = projects.some((item) => item.slug === selectedSlug)
    ? selectedSlug
    : (projects[0]?.slug ?? "");
  const project = projects.find((item) => item.slug === activeSlug) ?? projects[0] ?? null;
  const projectMessages = useMemo(
    () => messages.filter((message) => message.projectSlug === activeSlug),
    [activeSlug, messages],
  );

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!draft.trim() || !activeSlug) return;
    addMessage(activeSlug, draft);
    setDraft("");
  };

  const dateFormat = new Intl.DateTimeFormat(locale === "ar" ? "ar-SA" : "en-GB", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });

  if (!project) {
    return (
      <PortalShell title={c.title} description={c.description}>
        <div className="border border-white/10 bg-coal px-6 py-16 text-center">
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-gold/30 text-gold">
            <CalendarDays className="h-5 w-5" />
          </span>
          <p className="mx-auto mt-5 max-w-md text-[0.8rem] leading-relaxed text-ivory/45">
            {c.empty}
          </p>
        </div>
      </PortalShell>
    );
  }

  const nextMilestone =
    project.milestones.find((milestone) => milestone.status !== "complete")?.title ??
    project.nextMilestone;

  return (
    <PortalShell title={c.title} description={c.description}>
      <div className="flex flex-col gap-2 sm:flex-row">
        {projects.map((item) => (
          <button
            key={item.slug}
            type="button"
            onClick={() => setSelectedSlug(item.slug)}
            className={cn(
              "flex flex-1 flex-col gap-2 border p-4 text-start transition-colors",
              item.slug === activeSlug
                ? "border-gold/40 bg-gold/[0.08] text-ivory"
                : "border-white/10 bg-coal text-ivory/70 hover:border-white/25",
            )}
          >
            <span className="flex items-center justify-between gap-3">
              <span className="truncate text-[0.76rem] font-medium">{l(item.title)}</span>
              <span
                className={cn(
                  "tabular shrink-0 text-[0.6rem]",
                  item.slug === activeSlug ? "text-gold" : "text-gold/70",
                )}
              >
                {item.progress}%
              </span>
            </span>
            <span
              className={cn(
                "text-[0.54rem] uppercase tracking-[0.12em]",
                item.slug === activeSlug ? "text-ivory/40" : "text-ivory/30",
              )}
            >
              {l(item.location)}
            </span>
          </button>
        ))}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="flex flex-col gap-6">
          <Reveal>
            <div className="border border-white/10 bg-coal">
              <div className="flex flex-wrap items-start justify-between gap-4 border-b border-white/10 px-6 py-5">
                <div>
                  <span className="text-[0.52rem] uppercase tracking-[0.16em] text-ivory/35">
                    {c.select}
                  </span>
                  <h2 className="mt-1 font-display text-2xl leading-tight text-ivory">
                    {l(project.title)}
                  </h2>
                  <p className="mt-1 text-[0.62rem] text-ivory/40">{l(project.location)}</p>
                </div>
                <span className="border border-gold/30 px-3 py-1 text-[0.55rem] uppercase tracking-[0.14em] text-gold">
                  {tStatus(project.status, c)}
                </span>
              </div>

              <div className="grid gap-5 p-6 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <div className="flex items-end justify-between gap-4">
                    <span className="text-[0.55rem] uppercase tracking-[0.16em] text-ivory/40">
                      {c.progress}
                    </span>
                    <span className="tabular font-display text-3xl leading-none text-ivory">
                      {project.progress}%
                    </span>
                  </div>
                  <div className="mt-3 h-1.5 w-full overflow-hidden bg-white/10">
                    <div
                      className="h-full bg-gold transition-all duration-700"
                      style={{ width: `${project.progress}%` }}
                    />
                  </div>
                </div>
                {[
                  { label: c.phase, value: l(project.phase) },
                  { label: c.value, value: l(project.value) },
                  { label: c.manager, value: l(project.manager) },
                  { label: c.lastUpdate, value: l(project.lastUpdate) },
                  { label: c.next, value: l(nextMilestone) },
                ].map((fact) => (
                  <div key={fact.label}>
                    <p className="text-[0.5rem] uppercase tracking-[0.14em] text-ivory/35">
                      {fact.label}
                    </p>
                    <p className="mt-1 text-[0.76rem] leading-snug text-ivory/70">{fact.value}</p>
                  </div>
                ))}
              </div>

              {project.gallery.length ? (
                <div className="border-t border-white/10 p-4">
                  <p className="mb-3 text-[0.5rem] uppercase tracking-[0.14em] text-ivory/35">
                    {c.gallery}
                  </p>
                  <div className="grid grid-cols-3 gap-2">
                    {project.gallery.slice(0, 3).map((variant, index) => (
                      <div
                        key={`${variant}-${index}`}
                        className="relative aspect-[4/3] overflow-hidden border border-white/10"
                      >
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
              title={l(project.title)}
              location={l(project.location)}
              progress={project.progress}
              art={project.art}
            />
          </Reveal>
        </div>

        <div className="flex flex-col gap-6">
          <Reveal delay={100}>
            <div className="border border-white/10 bg-coal">
              <div className="flex items-center justify-between gap-3 border-b border-white/10 px-6 py-4">
                <span className="text-[0.55rem] font-semibold uppercase tracking-[0.16em] text-gold">
                  {c.timeline}
                </span>
                <CalendarDays className="h-4 w-4 text-gold/60" />
              </div>
              <ol className="divide-y divide-white/8">
                {project.milestones.length ? (
                  project.milestones.map((milestone) => (
                    <li key={milestone.title.en} className="flex items-start gap-3 px-6 py-3.5">
                      <span
                        className={cn(
                          "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border",
                          milestone.status === "complete"
                            ? "border-gold bg-gold text-obsidian"
                            : milestone.status === "current"
                              ? "border-gold text-gold"
                              : "border-white/15 text-ivory/25",
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
                            milestone.status === "upcoming" ? "text-ivory/40" : "text-ivory/75",
                          )}
                        >
                          {l(milestone.title)}
                        </p>
                        <span className="text-[0.58rem] text-ivory/35">{l(milestone.date)}</span>
                      </div>
                    </li>
                  ))
                ) : (
                  <li className="px-6 py-6 text-center text-[0.68rem] text-ivory/35">
                    {c.noMilestones}
                  </li>
                )}
              </ol>
            </div>
          </Reveal>

          <Reveal delay={120}>
            <PortalContract project={project} />
          </Reveal>

          <Reveal delay={140}>
            <div className="border border-white/10 bg-coal">
              <div className="flex items-center justify-between gap-3 border-b border-white/10 px-6 py-4">
                <span className="text-[0.55rem] font-semibold uppercase tracking-[0.16em] text-gold">
                  {c.blueprints}
                </span>
                <FileText className="h-4 w-4 text-gold/60" />
              </div>
              <ul className="divide-y divide-white/8">
                {project.documents.map((doc) => (
                  <li key={doc.name.en} className="flex items-center gap-3 px-6 py-4">
                    <FileText className="h-4 w-4 shrink-0 text-gold" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[0.74rem] text-ivory/75">{l(doc.name)}</p>
                      <span className="text-[0.55rem] text-ivory/35">
                        {c.docTypes[doc.type]} · {doc.size} · {doc.date}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => downloadDocument(doc, l(project.title))}
                      className="flex h-8 w-8 shrink-0 items-center justify-center border border-white/12 text-ivory/45 transition-colors hover:border-gold hover:text-gold"
                      aria-label={`${c.download} ${l(doc.name)}`}
                    >
                      <Download className="h-3.5 w-3.5" />
                    </button>
                  </li>
                ))}
                {project.documents.length === 0 ? (
                  <li className="px-6 py-6 text-center text-[0.68rem] text-ivory/35">
                    {locale === "ar" ? "لا توجد مستندات بعد." : "No documents yet."}
                  </li>
                ) : null}
              </ul>
            </div>
          </Reveal>

          <Reveal delay={180}>
            <div className="border border-white/10 bg-coal">
              <div className="flex items-center justify-between gap-3 border-b border-white/10 px-6 py-4">
                <span className="text-[0.55rem] font-semibold uppercase tracking-[0.16em] text-gold">
                  {c.messages}
                </span>
                <MessageSquare className="h-4 w-4 text-gold/60" />
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
                      <span className="flex items-center gap-1.5 text-[0.5rem] uppercase tracking-[0.12em] text-ivory/35">
                        {message.author === "client" ? (
                          <UserRound className="h-3 w-3" />
                        ) : (
                          <MessageSquare className="h-3 w-3 text-gold" />
                        )}
                        {message.author === "client" ? c.client : c.managerRole}
                        <span className="text-ivory/25">
                          {dateFormat.format(new Date(message.at))}
                        </span>
                      </span>
                      <p
                        className={cn(
                          "max-w-[90%] px-3 py-2 text-[0.7rem] leading-relaxed",
                          message.author === "client"
                            ? "bg-gold text-obsidian"
                            : "border border-white/10 bg-white/[0.04] text-ivory/70",
                        )}
                      >
                        {message.text}
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="py-6 text-center text-[0.68rem] text-ivory/35">{c.noMessages}</p>
                )}
              </div>

              <form onSubmit={submit} className="flex gap-2 border-t border-white/10 p-3">
                <input
                  value={draft}
                  onChange={(event) => setDraft(event.target.value)}
                  placeholder={c.messagePlaceholder}
                  className="h-10 min-w-0 flex-1 border border-white/12 bg-transparent px-3 text-[0.7rem] text-ivory outline-none placeholder:text-ivory/30 focus:border-gold/60"
                />
                <button
                  type="submit"
                  className="flex h-10 w-10 shrink-0 items-center justify-center bg-gold text-obsidian transition-colors hover:bg-gold-light"
                  aria-label={c.send}
                >
                  <Send className="h-3.5 w-3.5" />
                </button>
              </form>
            </div>
          </Reveal>

          <Reveal delay={220}>
            <div className="flex items-center justify-between gap-3 border border-white/10 bg-white/[0.03] px-5 py-4">
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gold text-obsidian">
                  <UserRound className="h-4 w-4" />
                </span>
                <div>
                  <p className="text-[0.72rem] font-medium text-ivory">{l(project.manager)}</p>
                  <p className="text-[0.55rem] uppercase tracking-[0.12em] text-ivory/35">
                    {c.managerRole}
                  </p>
                </div>
              </div>
              <ArrowUpRight className="h-4 w-4 text-gold" />
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

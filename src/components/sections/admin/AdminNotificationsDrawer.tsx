"use client";

import { useEffect, useMemo, useState } from "react";
import {
  BellRing,
  CheckCheck,
  FileSignature,
  Flag,
  Inbox,
  Loader2,
  TriangleAlert,
} from "lucide-react";
import type { WorkspaceProject } from "@/components/providers/WorkspaceProvider";
import { useI18n } from "@/components/providers/I18nProvider";
import { Drawer } from "@/components/ui/admin/overlay";
import { Button, StatusPill } from "@/components/ui/admin";
import {
  buildAlerts,
  formatSAR,
  projectName,
  toMetricsProject,
} from "@/lib/project-metrics";

type InquiryRecord = {
  id: string;
  name?: string;
  email: string;
  reference?: string;
  status: string;
  createdAt: string;
};

type Notice = {
  id: string;
  group: "alerts" | "inquiries" | "milestones";
  title: string;
  body: string;
  tone: "danger" | "warning" | "info" | "neutral";
  icon: typeof TriangleAlert;
  action: () => void;
};

const readKey = "alattar-admin-notifications-read";

function formatDate(value: string | undefined, locale: "ar" | "en") {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat(locale === "ar" ? "ar-SA" : "en-GB", {
    dateStyle: "medium",
  }).format(date);
}

export function AdminNotificationsDrawer({
  open,
  onOpenChange,
  projects,
  onNavigate,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projects: WorkspaceProject[];
  onNavigate: (section: "inquiries" | "contracts" | "milestones" | "projects") => void;
}) {
  const { locale, l } = useI18n();
  const isAr = locale === "ar";
  const [inquiries, setInquiries] = useState<InquiryRecord[] | null>(null);
  const [read, setRead] = useState<Set<string>>(() => {
    try {
      const stored = window.localStorage.getItem(readKey);
      const parsed = stored ? (JSON.parse(stored) as unknown) : [];
      return new Set(Array.isArray(parsed) ? parsed.filter((id): id is string => typeof id === "string") : []);
    } catch {
      return new Set();
    }
  });

  useEffect(() => {
    if (!open) return;
    const controller = new AbortController();
    const load = async () => {
      try {
        const response = await fetch("/api/admin/inquiries", {
          cache: "no-store",
          credentials: "same-origin",
          signal: controller.signal,
        });
        if (!response.ok) throw new Error("request_failed");
        const data = (await response.json().catch(() => null)) as
          | { inquiries?: InquiryRecord[] }
          | null;
        setInquiries(Array.isArray(data?.inquiries) ? data.inquiries : []);
      } catch (error) {
        if ((error as Error).name !== "AbortError") setInquiries([]);
      }
    };
    void load();
    return () => controller.abort();
  }, [open]);

  const notices = useMemo<Notice[]>(() => {
    const metrics = projects.map(toMetricsProject);
    const byId = new Map(metrics.map((project) => [project.id, project]));
    const items: Notice[] = [];

    for (const alert of buildAlerts(metrics)) {
      const project = byId.get(alert.projectId);
      if (!project) continue;
      const name = projectName(project, locale);
      if (alert.type === "overrun") {
        items.push({
          id: `alert:${alert.id}`,
          group: "alerts",
          title: isAr ? "تجاوز الميزانية" : "Budget overrun",
          body: isAr
            ? `${name} تجاوز الميزانية بمقدار ${formatSAR(alert.params.amount ?? 0, locale)}.`
            : `${name} finished ${formatSAR(alert.params.amount ?? 0, locale)} over budget.`,
          tone: "danger",
          icon: TriangleAlert,
          action: () => onNavigate("projects"),
        });
      } else {
        const gap = Math.round(alert.params.gap ?? 0);
        items.push({
          id: `alert:${alert.id}`,
          group: "alerts",
          title: isAr ? "المصروف يسبق الإنجاز" : "Spending ahead of progress",
          body: isAr
            ? `${name} متقدم بـ ${gap} نقطة عن نسبة الإنجاز.`
            : `${name} is ${gap} points ahead of completion.`,
          tone: alert.severity === "critical" ? "danger" : "warning",
          icon: TriangleAlert,
          action: () => onNavigate("projects"),
        });
      }
    }

    for (const inquiry of inquiries ?? []) {
      if (inquiry.status !== "new") continue;
      items.push({
        id: `inquiry:${inquiry.id}`,
        group: "inquiries",
        title: inquiry.name?.trim() || inquiry.email,
        body: [inquiry.reference, inquiry.email, formatDate(inquiry.createdAt, locale)]
          .filter(Boolean)
          .join(" · "),
        tone: "info",
        icon: Inbox,
        action: () => onNavigate("inquiries"),
      });
    }

    for (const project of projects) {
      if (project.archivedAt) continue;
      project.milestones.slice(0, 2).forEach((milestone, index) => {
        if (milestone.status === "complete") return;
        items.push({
          id: `milestone:${project.slug}:${index}`,
          group: "milestones",
          title: l(milestone.title),
          body: `${l(project.title)} · ${l(milestone.date)}`,
          tone: milestone.status === "current" ? "warning" : "neutral",
          icon: Flag,
          action: () => onNavigate("milestones"),
        });
      });
    }

    return items.slice(0, 40);
  }, [inquiries, isAr, l, locale, onNavigate, projects]);

  const unread = notices.filter((notice) => !read.has(notice.id)).length;

  const markAllRead = () => {
    const next = new Set(read);
    notices.forEach((notice) => next.add(notice.id));
    setRead(next);
    try {
      window.localStorage.setItem(readKey, JSON.stringify([...next]));
    } catch {
      // Read state is a convenience; failure should not block the drawer.
    }
  };

  const groups: Array<{ id: Notice["group"]; label: string; icon: typeof Inbox }> = [
    { id: "alerts", label: isAr ? "تنبيهات المشاريع" : "Project alerts", icon: TriangleAlert },
    { id: "inquiries", label: isAr ? "استفسارات جديدة" : "New inquiries", icon: FileSignature },
    { id: "milestones", label: isAr ? "المراحل القادمة" : "Upcoming milestones", icon: Flag },
  ];

  return (
    <Drawer
      open={open}
      onOpenChange={onOpenChange}
      title={isAr ? "التنبيهات" : "Notifications"}
      closeLabel={isAr ? "إغلاق" : "Close"}
      footer={
        <Button
          variant="secondary"
          onClick={markAllRead}
          disabled={!notices.length || unread === 0}
          className="w-full"
        >
          <CheckCheck className="h-4 w-4" />
          {isAr ? "تحديد الكل كمقروء" : "Mark all as read"}
        </Button>
      }
    >
      <div className="space-y-5">
        <div className="flex items-center justify-between gap-3 rounded-2xl border border-[var(--admin-card-border)] bg-[var(--admin-pill-surface)] p-4">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[rgba(226,176,74,0.14)] text-[#F3C86A]">
              <BellRing className="h-5 w-5" />
            </span>
            <div>
              <p className="text-[14px] font-medium text-[var(--admin-text)]">
                {isAr ? `${unread} غير مقروء` : `${unread} unread`}
              </p>
              <p className="text-[12px] text-[var(--admin-muted)]">
                {isAr ? "تنبيهات الميزانية والاستفسارات والمراحل." : "Budget, inquiry and milestone updates."}
              </p>
            </div>
          </div>
          <StatusPill tone={unread ? "warning" : "success"}>
            {unread ? (isAr ? "يتطلب انتباهاً" : "Needs attention") : isAr ? "محدّث" : "Up to date"}
          </StatusPill>
        </div>

        {inquiries === null ? (
          <div className="flex items-center justify-center gap-2 py-10 text-[13px] text-[var(--admin-muted)]">
            <Loader2 className="h-4 w-4 animate-spin" />
            {isAr ? "جارٍ تحميل الاستفسارات…" : "Loading inquiries…"}
          </div>
        ) : null}

        {groups.map((group) => {
          const items = notices.filter((notice) => notice.group === group.id);
          if (!items.length && group.id !== "alerts") return null;
          const Icon = group.icon;
          return (
            <section key={group.id}>
              <h3 className="mb-2 flex items-center gap-2 text-[13px] font-medium text-[var(--admin-muted)]">
                <Icon className="h-4 w-4" />
                {group.label}
                <span className="tabular-nums text-[var(--admin-muted)]/60">({items.length})</span>
              </h3>
              {items.length ? (
                <ul className="divide-y divide-[var(--admin-card-border)] overflow-hidden rounded-2xl border border-[var(--admin-card-border)]">
                  {items.map((notice) => {
                    const unreadItem = !read.has(notice.id);
                    const NoticeIcon = notice.icon;
                    return (
                      <li key={notice.id}>
                        <button
                          type="button"
                          onClick={notice.action}
                          className="admin-focus-ring flex w-full items-start gap-3 p-3.5 text-start transition-colors hover:bg-[var(--admin-pill-surface)]"
                        >
                          <span
                            className={
                              notice.tone === "danger"
                                ? "mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[rgba(255,107,94,0.12)] text-[#FF9A8F]"
                                : notice.tone === "warning"
                                  ? "mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[rgba(226,176,74,0.12)] text-[#F3C86A]"
                                  : "mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--admin-pill-surface)] text-[var(--admin-muted)]"
                            }
                          >
                            <NoticeIcon className="h-4 w-4" />
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="flex items-center gap-2">
                              <span className="truncate text-[14px] text-[var(--admin-text)]">{notice.title}</span>
                              {unreadItem ? <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#E2B04A]" /> : null}
                            </span>
                            <span className="mt-0.5 block text-[12px] leading-relaxed text-[var(--admin-muted)]">
                              {notice.body}
                            </span>
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <p className="rounded-2xl border border-dashed border-[var(--admin-card-border)] px-4 py-5 text-center text-[13px] text-[var(--admin-muted)]">
                  {isAr ? "لا توجد تنبيهات." : "Nothing to report."}
                </p>
              )}
            </section>
          );
        })}
      </div>
    </Drawer>
  );
}

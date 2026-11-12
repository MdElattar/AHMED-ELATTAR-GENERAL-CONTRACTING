"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  ArrowUpRight,
  Command as CommandIcon,
  FileSignature,
  FolderKanban,
  Inbox,
  Loader2,
  Search,
  Settings,
} from "lucide-react";
import { useI18n } from "@/components/providers/I18nProvider";
import { useSmoothScroll } from "@/components/providers/SmoothScroll";
import type { WorkspaceProject } from "@/components/providers/WorkspaceProvider";
import type { AdminSection } from "@/components/sections/admin/AdminDashboard";
import { acquireScrollLock, releaseScrollLock } from "@/lib/scroll/lock";
import { cn } from "@/lib/utils";

type InquiryRecord = {
  id: string;
  name?: string;
  email: string;
  reference?: string;
  status: string;
  createdAt: string;
};

type ContractRecord = {
  id: string;
  projectSlug: string;
  signerName: string;
  email: string;
  signedAt: string;
};

type PaletteSection = { id: AdminSection; label: string };

type Command = {
  id: string;
  group: string;
  label: string;
  meta: string;
  keywords: string;
  icon: typeof FolderKanban;
  run: () => void;
};

const copy = {
  ar: {
    title: "الأوامر السريعة",
    placeholder: "ابحث عن مشروع، استفسار، عقد، أو إعداد...",
    hint: "استخدم ↑ ↓ للتنقل، Enter للفتح، Esc للإغلاق",
    navigate: "التنقل",
    projects: "المشاريع",
    inquiries: "الاستفسارات",
    contracts: "العقود",
    empty: "لا توجد نتائج مطابقة.",
    loading: "جارٍ فهرسة البيانات...",
    open: "فتح",
  },
  en: {
    title: "Command palette",
    placeholder: "Search projects, inquiries, contracts, or settings...",
    hint: "Use ↑ ↓ to move, Enter to open, Esc to close",
    navigate: "Navigate",
    projects: "Projects",
    inquiries: "Inquiries",
    contracts: "Contracts",
    empty: "No matching commands.",
    loading: "Indexing admin data...",
    open: "Open",
  },
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function responseItems<T>(data: unknown, key: string): T[] {
  if (!isRecord(data) || !Array.isArray(data[key])) return [];
  return data[key] as T[];
}

export function AdminCommandPalette({
  projects,
  sections,
  onClose,
  onOpenProject,
  onNavigate,
}: {
  projects: WorkspaceProject[];
  sections: PaletteSection[];
  onClose: () => void;
  onOpenProject: (project: WorkspaceProject) => void;
  onNavigate: (section: AdminSection, focusId?: string) => void;
}) {
  const { locale, l } = useI18n();
  const c = copy[locale];
  const { stop, start } = useSmoothScroll();
  const [mounted, setMounted] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const [inquiries, setInquiries] = useState<InquiryRecord[]>([]);
  const [contracts, setContracts] = useState<ContractRecord[]>([]);
  const [loadingIndex, setLoadingIndex] = useState(true);
  const listRef = useRef<HTMLDivElement | null>(null);
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    // SDK portals need the DOM; render only after hydration.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  useEffect(() => {
    acquireScrollLock(stop);
    return () => releaseScrollLock(start);
  }, [start, stop]);

  useEffect(() => {
    const controller = new AbortController();

    const load = async () => {
      setLoadingIndex(true);
      try {
        const [inquiryResponse, contractResponse] = await Promise.all([
          fetch("/api/admin/inquiries", {
            cache: "no-store",
            credentials: "same-origin",
            signal: controller.signal,
          }),
          fetch("/api/admin/contracts", {
            cache: "no-store",
            credentials: "same-origin",
            signal: controller.signal,
          }),
        ]);
        const [inquiryData, contractData] = await Promise.all([
          inquiryResponse.json().catch(() => null),
          contractResponse.json().catch(() => null),
        ]);
        setInquiries(responseItems<InquiryRecord>(inquiryData, "inquiries"));
        setContracts(responseItems<ContractRecord>(contractData, "signoffs"));
      } catch (error) {
        if ((error as Error).name !== "AbortError") {
          setInquiries([]);
          setContracts([]);
        }
      } finally {
        setLoadingIndex(false);
      }
    };

    void load();
    return () => controller.abort();
  }, []);

  const commands = useMemo<Command[]>(() => {
    const items: Command[] = sections.map((section) => ({
      id: `section-${section.id}`,
      group: c.navigate,
      label: section.label,
      meta: section.id.replace(/-/g, " "),
      keywords: `section settings navigate ${section.id} ${section.label}`,
      icon: Settings,
      run: () => onNavigate(section.id),
    }));

    for (const project of projects) {
      const title = l(project.title);
      const location = l(project.location);
      items.push({
        id: `project-${project.slug}`,
        group: c.projects,
        label: title,
        meta: location || project.slug,
        keywords: `${title} ${project.slug} ${location} ${project.category} ${project.status}`,
        icon: FolderKanban,
        run: () => onOpenProject(project),
      });
    }

    for (const inquiry of inquiries) {
      const label = inquiry.name?.trim() || inquiry.email;
      items.push({
        id: `inquiry-${inquiry.id}`,
        group: c.inquiries,
        label,
        meta: [inquiry.reference, inquiry.email, inquiry.status].filter(Boolean).join(" · "),
        keywords: `${label} ${inquiry.email} ${inquiry.reference ?? ""} ${inquiry.status}`,
        icon: Inbox,
        run: () => onNavigate("inquiries", inquiry.id),
      });
    }

    for (const contract of contracts) {
      items.push({
        id: `contract-${contract.id}`,
        group: c.contracts,
        label: contract.signerName || contract.projectSlug,
        meta: `${contract.projectSlug} · ${contract.email}`,
        keywords: `${contract.signerName} ${contract.projectSlug} ${contract.email} ${contract.id}`,
        icon: FileSignature,
        run: () => onNavigate("contracts", contract.id),
      });
    }

    return items;
  }, [c.contracts, c.inquiries, c.navigate, c.projects, contracts, inquiries, l, onNavigate, onOpenProject, projects, sections]);

  const filtered = useMemo(() => {
    const tokens = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
    if (!tokens.length) return commands.slice(0, 80);
    return commands
      .filter((command) => {
        const haystack = `${command.label} ${command.meta} ${command.keywords}`.toLowerCase();
        return tokens.every((token) => haystack.includes(token));
      })
      .slice(0, 80);
  }, [commands, query]);

  const groups = useMemo(() => {
    const map = new Map<string, Command[]>();
    for (const command of filtered) {
      const group = map.get(command.group) ?? [];
      group.push(command);
      map.set(command.group, group);
    }
    return Array.from(map.entries());
  }, [filtered]);

  useEffect(() => {
    // Keep the highlighted row visible while arrowing through long result sets.
    const active = listRef.current?.querySelector<HTMLElement>(
      `[data-command-index="${activeIndex}"]`,
    );
    active?.scrollIntoView({ block: "nearest" });
  }, [activeIndex, filtered.length]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        onCloseRef.current();
        return;
      }
      if (event.key === "Escape") {
        event.preventDefault();
        onCloseRef.current();
        return;
      }
      if (event.key === "ArrowDown") {
        event.preventDefault();
        setActiveIndex((current) => (filtered.length ? (current + 1) % filtered.length : 0));
        return;
      }
      if (event.key === "ArrowUp") {
        event.preventDefault();
        setActiveIndex((current) =>
          filtered.length ? (current - 1 + filtered.length) % filtered.length : 0,
        );
        return;
      }
      if (event.key === "Enter") {
        const command = filtered[activeIndex];
        if (command) {
          event.preventDefault();
          command.run();
          onCloseRef.current();
        }
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [activeIndex, filtered]);

  if (!mounted || typeof document === "undefined") return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[250] flex items-start justify-center bg-obsidian/75 p-3 pt-[10vh] backdrop-blur-md sm:p-6 sm:pt-[12vh]"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={c.title}
        data-lenis-prevent
        className="flex max-h-[76vh] w-full max-w-2xl flex-col overflow-hidden border border-gold/25 bg-coal shadow-[0_40px_120px_-28px_rgba(0,0,0,0.95)]"
      >
        <div className="flex items-center gap-3 border-b border-white/10 px-4 py-3">
          <Search className="h-4 w-4 shrink-0 text-gold" />
          <input
            autoFocus
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setActiveIndex(0);
            }}
            placeholder={c.placeholder}
            aria-label={c.placeholder}
            className="h-10 min-w-0 flex-1 bg-transparent text-[0.94rem] text-ivory outline-none placeholder:text-ivory/35"
          />
          <span className="hidden items-center gap-1 border border-white/10 px-2 py-1 text-[0.64rem] text-ivory/40 sm:flex">
            <CommandIcon className="h-3 w-3" /> K
          </span>
        </div>

        <div ref={listRef} className="overflow-y-auto overscroll-contain">
          {loadingIndex ? (
            <div className="flex items-center justify-center gap-2 px-4 py-10 text-[0.76rem] text-ivory/45">
              <Loader2 className="h-4 w-4 animate-spin text-gold" />
              {c.loading}
            </div>
          ) : groups.length ? (
            groups.map(([group, items]) => (
              <div key={group}>
                <p className="sticky top-0 z-10 border-b border-white/6 bg-coal px-4 py-2 text-[0.64rem] font-semibold uppercase tracking-[0.16em] text-gold/70">
                  {group}
                </p>
                <div className="p-1.5">
                  {items.map((command) => {
                    const index = filtered.indexOf(command);
                    const active = index === activeIndex;
                    const Icon = command.icon;
                    return (
                      <button
                        key={command.id}
                        type="button"
                        data-command-index={index}
                        onMouseEnter={() => setActiveIndex(index)}
                        onClick={() => {
                          command.run();
                          onClose();
                        }}
                        className={cn(
                          "flex min-h-12 w-full items-center gap-3 px-3 py-2.5 text-start transition-colors",
                          active ? "bg-gold/12 text-ivory" : "text-ivory/65 hover:bg-white/[0.04]",
                        )}
                      >
                        <span
                          className={cn(
                            "flex h-8 w-8 shrink-0 items-center justify-center border",
                            active
                              ? "border-gold/45 bg-gold/10 text-gold"
                              : "border-white/10 text-ivory/45",
                          )}
                        >
                          <Icon className="h-3.5 w-3.5" />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-[0.82rem]">{command.label}</span>
                          <span className="block truncate text-[0.66rem] text-ivory/40">
                            {command.meta}
                          </span>
                        </span>
                        <ArrowUpRight
                          className={cn(
                            "h-3.5 w-3.5 shrink-0",
                            active ? "text-gold" : "text-ivory/20",
                          )}
                        />
                      </button>
                    );
                  })}
                </div>
              </div>
            ))
          ) : (
            <p className="px-4 py-10 text-center text-[0.76rem] text-ivory/40">{c.empty}</p>
          )}
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-white/10 px-4 py-2.5 text-[0.64rem] text-ivory/35">
          <span>{c.hint}</span>
          <span className="hidden sm:inline">{c.open}</span>
        </div>
      </div>
    </div>,
    document.body,
  );
}

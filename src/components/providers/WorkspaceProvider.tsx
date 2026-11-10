"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { L, type Localized } from "@/lib/dictionary";
import {
  projects as seedProjects,
  type ArtVariant,
  type Project,
  type ProjectCategory,
  type ProjectStatus,
} from "@/data/projects";
import { portalProjects } from "@/data/portal";
import { isSafeInternalPath } from "@/lib/security/validation";

export type WorkspaceProject = Project & {
  progress: number;
  budget: number;
  spent: number;
  profit: number;
  contractValue: number;
  updatedAt: string;
  gallery: ArtVariant[];
};

export type ServiceOverride = {
  title: Localized;
  tagline: Localized;
  description: Localized;
};

export type SiteContent = {
  heroEyebrow: Localized;
  heroTitleTop: Localized;
  heroTitleAccent: Localized;
  heroDescription: Localized;
  promoVisible: boolean;
  promoTitle: Localized;
  promoText: Localized;
  promoHref: string;
  serviceOverrides: Record<string, ServiceOverride>;
};

export type PortalMessage = {
  id: string;
  projectSlug: string;
  author: "client" | "manager";
  text: string;
  at: string;
};

type WorkspaceState = {
  projects: WorkspaceProject[];
  content: SiteContent;
  messages: PortalMessage[];
};

type WorkspaceContextValue = WorkspaceState & {
  ready: boolean;
  addProject: (project: WorkspaceProject) => void;
  updateProject: (slug: string, patch: Partial<WorkspaceProject>) => void;
  deleteProject: (slug: string) => void;
  updateContent: (patch: Partial<SiteContent>) => void;
  updateService: (slug: string, patch: Partial<ServiceOverride>) => void;
  addMessage: (projectSlug: string, text: string) => void;
  replyMessage: (projectSlug: string, text: string) => void;
  resetWorkspace: () => void;
};

const STORAGE_KEY = "ahmed-elattar-workspace-v1";

const progressBySlug: Record<string, number> = {
  "advanced-industries": 68,
  "al-hijr-hotel": 42,
  "marina-quarter": 12,
};

const financialsBySlug: Record<string, { budget: number; spent: number; profit: number }> = {
  "aurora-tower": { budget: 1400, spent: 1260, profit: 238 },
  "palm-oasis": { budget: 780, spent: 760, profit: 132 },
  "wadi-crossing": { budget: 920, spent: 905, profit: 148 },
  "advanced-industries": { budget: 1100, spent: 748, profit: 176 },
  "al-hijr-hotel": { budget: 650, spent: 273, profit: 104 },
  "riyadh-central-interchange": { budget: 540, spent: 531, profit: 82 },
  "marina-quarter": { budget: 1800, spent: 216, profit: 324 },
  "solar-energy-park": { budget: 2300, spent: 1564, profit: 391 },
};

const defaultProjects: WorkspaceProject[] = seedProjects.map((project, index) => {
  const progress =
    progressBySlug[project.slug] ??
    (project.status === "completed" ? 100 : project.status === "upcoming" ? 12 : 54);
  const financials =
    financialsBySlug[project.slug] ?? {
      budget: 500 + index * 120,
      spent: (500 + index * 120) * (progress / 100),
      profit: (500 + index * 120) * 0.18,
    };
  return {
    ...project,
    progress,
    budget: financials.budget,
    spent: Math.round(financials.spent),
    profit: Math.round(financials.profit),
    contractValue: financials.budget,
    updatedAt: "2026-10-12",
    gallery: [project.art],
  };
});

const defaultContent: SiteContent = {
  heroEyebrow: L(
    "منذ ١٩٨٧ · الرياض · المملكة العربية السعودية",
    "Since 1987 · Riyadh · Saudi Arabia",
  ),
  heroTitleTop: L("نبني", "We build"),
  heroTitleAccent: L("ما يبقى.", "what endures."),
  heroDescription: L(
    "أربعة عقود من الهندسة الدقيقة، والإنشاءات الضخمة، والتميّز الذي لا يقبل المساومة. من الرؤية الأولى إلى آخر مسمار.",
    "Four decades of precise engineering, monumental construction, and uncompromising excellence — from first vision to final bolt.",
  ),
  promoVisible: true,
  promoTitle: L("نبني لك ما يبقى.", "We build what endures for you."),
  promoText: L(
    "فريق تطوير الأعمال جاهز لمراجعة نطاق مشروعك وتقديم تصور مبدئي خلال ٢٤ ساعة.",
    "Our development team is ready to review your scope and share an initial approach within 24 hours.",
  ),
  promoHref: "/contact",
  serviceOverrides: {},
};

const defaultMessages: PortalMessage[] = [
  {
    id: "msg-1",
    projectSlug: "advanced-industries",
    author: "manager",
    text: "تم اعتماد عينات الهياكل الفولاذية للوحدة ٧. سنبدأ التركيب صباح الأحد.",
    at: "2026-10-11T09:40:00.000Z",
  },
  {
    id: "msg-2",
    projectSlug: "advanced-industries",
    author: "client",
    text: "شكراً. هل يمكن إضافة تقرير الجودة الأسبوعي إلى المستندات؟",
    at: "2026-10-11T10:12:00.000Z",
  },
  {
    id: "msg-3",
    projectSlug: "advanced-industries",
    author: "manager",
    text: "تم رفع التقرير، وسيتم تحديث لوحة التقدم اليوم.",
    at: "2026-10-11T10:26:00.000Z",
  },
];

const initialState: WorkspaceState = {
  projects: defaultProjects,
  content: defaultContent,
  messages: defaultMessages,
};

const categories: ProjectCategory[] = [
  "commercial",
  "residential",
  "infrastructure",
  "industrial",
];
const statuses: ProjectStatus[] = ["completed", "ongoing", "upcoming"];
const artVariants: ArtVariant[] = [
  "tower",
  "villa",
  "bridge",
  "industrial",
  "heritage",
  "interchange",
  "marina",
  "solar",
];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function finiteNumber(value: unknown, fallback: number) {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function normalizeLocalized(value: unknown, fallback: Localized): Localized {
  if (!isRecord(value)) return fallback;

  const ar = typeof value.ar === "string" ? value.ar.trim().slice(0, 4000) : "";
  const en = typeof value.en === "string" ? value.en.trim().slice(0, 4000) : "";

  return {
    ar: ar || fallback.ar,
    en: en || fallback.en,
  };
}

function normalizeProject(value: unknown): WorkspaceProject | null {
  if (!isRecord(value)) return null;

  const slug =
    typeof value.slug === "string" ? value.slug.trim().toLowerCase().slice(0, 80) : "";
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) return null;

  const seed = seedProjects.find((project) => project.slug === slug);
  const seedWorkspace = defaultProjects.find((project) => project.slug === slug);
  const titleFallback = seed?.title ?? L(slug, slug);
  const category = categories.includes(value.category as ProjectCategory)
    ? (value.category as ProjectCategory)
    : (seed?.category ?? "commercial");
  const status = statuses.includes(value.status as ProjectStatus)
    ? (value.status as ProjectStatus)
    : (seed?.status ?? "ongoing");
  const art = artVariants.includes(value.art as ArtVariant)
    ? (value.art as ArtVariant)
    : (seed?.art ?? "tower");
  const gallery = Array.isArray(value.gallery)
    ? value.gallery
        .filter((item): item is ArtVariant => artVariants.includes(item as ArtVariant))
        .slice(0, 8)
    : [];

  const scope = Array.isArray(value.scope)
    ? value.scope
        .map((item) => normalizeLocalized(item, L("", "")))
        .filter((item) => item.ar || item.en)
        .slice(0, 20)
    : (seed?.scope ?? []);

  const highlights = Array.isArray(value.highlights)
    ? value.highlights
        .map((item) => {
          if (!isRecord(item)) return null;
          const label = normalizeLocalized(item.label, L("", ""));
          const metric = typeof item.value === "string" ? item.value.trim().slice(0, 40) : "";
          if (!metric || (!label.ar && !label.en)) return null;
          return { value: metric, label };
        })
        .filter((item): item is { value: string; label: Localized } => item !== null)
        .slice(0, 12)
    : (seed?.highlights ?? []);

  const fallbackProgress =
    seedWorkspace?.progress ??
    (status === "completed" ? 100 : status === "upcoming" ? 12 : 54);
  const budget = Math.max(0, finiteNumber(value.budget, seedWorkspace?.budget ?? 500));
  const spent = clamp(finiteNumber(value.spent, seedWorkspace?.spent ?? 0), 0, budget);
  const profit = Math.max(0, finiteNumber(value.profit, seedWorkspace?.profit ?? 0));
  const contractValue = Math.max(
    0,
    finiteNumber(value.contractValue, seedWorkspace?.contractValue ?? budget),
  );
  const updatedAt =
    typeof value.updatedAt === "string" && !Number.isNaN(Date.parse(value.updatedAt))
      ? value.updatedAt.slice(0, 40)
      : (seedWorkspace?.updatedAt ?? "2026-10-12");

  return {
    slug,
    title: normalizeLocalized(value.title, titleFallback),
    category,
    status,
    location: normalizeLocalized(value.location, seed?.location ?? L("", "")),
    year: typeof value.year === "string" ? value.year.trim().slice(0, 20) : (seed?.year ?? ""),
    client: normalizeLocalized(value.client, seed?.client ?? L("", "")),
    area: normalizeLocalized(value.area, seed?.area ?? L("", "")),
    value: normalizeLocalized(value.value, seed?.value ?? L("", "")),
    summary: normalizeLocalized(value.summary, seed?.summary ?? L("", "")),
    description: normalizeLocalized(value.description, seed?.description ?? L("", "")),
    scope,
    highlights,
    art,
    ...(typeof value.featured === "boolean"
      ? { featured: value.featured }
      : seed?.featured
        ? { featured: true }
        : {}),
    progress: clamp(finiteNumber(value.progress, fallbackProgress), 0, 100),
    budget,
    spent,
    profit,
    contractValue,
    updatedAt,
    gallery: gallery.length ? gallery : (seedWorkspace?.gallery ?? [art]),
  };
}

function normalizeMessages(value: unknown): PortalMessage[] {
  if (!Array.isArray(value)) return defaultMessages;

  return value
    .slice(-200)
    .map((item, index) => {
      if (!isRecord(item)) return null;

      const projectSlug =
        typeof item.projectSlug === "string" ? item.projectSlug.trim().slice(0, 80) : "";
      const text = typeof item.text === "string" ? item.text.trim().slice(0, 4000) : "";
      const author = item.author === "manager" ? "manager" : item.author === "client" ? "client" : null;
      const at =
        typeof item.at === "string" && !Number.isNaN(Date.parse(item.at))
          ? item.at.slice(0, 40)
          : new Date().toISOString();
      const id =
        typeof item.id === "string" && item.id.length > 0
          ? item.id.slice(0, 80)
          : `msg-restored-${index}`;

      if (!projectSlug || !text || !author) return null;

      return { id, projectSlug, author, text, at };
    })
    .filter((item): item is PortalMessage => item !== null);
}

function normalizeServiceOverride(value: unknown): ServiceOverride {
  if (!isRecord(value)) return { title: L("", ""), tagline: L("", ""), description: L("", "") };

  return {
    title: normalizeLocalized(value.title, L("", "")),
    tagline: normalizeLocalized(value.tagline, L("", "")),
    description: normalizeLocalized(value.description, L("", "")),
  };
}

function normalizeContent(value: unknown): SiteContent {
  const stored = isRecord(value) ? value : {};
  const rawOverrides = isRecord(stored.serviceOverrides) ? stored.serviceOverrides : {};
  const serviceOverrides: Record<string, ServiceOverride> = {};

  for (const [slug, override] of Object.entries(rawOverrides).slice(0, 50)) {
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) || slug.length > 80) continue;
    serviceOverrides[slug] = normalizeServiceOverride(override);
  }

  return {
    heroEyebrow: normalizeLocalized(stored.heroEyebrow, defaultContent.heroEyebrow),
    heroTitleTop: normalizeLocalized(stored.heroTitleTop, defaultContent.heroTitleTop),
    heroTitleAccent: normalizeLocalized(
      stored.heroTitleAccent,
      defaultContent.heroTitleAccent,
    ),
    heroDescription: normalizeLocalized(
      stored.heroDescription,
      defaultContent.heroDescription,
    ),
    promoVisible:
      typeof stored.promoVisible === "boolean"
        ? stored.promoVisible
        : defaultContent.promoVisible,
    promoTitle: normalizeLocalized(stored.promoTitle, defaultContent.promoTitle),
    promoText: normalizeLocalized(stored.promoText, defaultContent.promoText),
    promoHref:
      typeof stored.promoHref === "string" && isSafeInternalPath(stored.promoHref)
        ? stored.promoHref.slice(0, 300)
        : defaultContent.promoHref,
    serviceOverrides,
  };
}

function loadState(): WorkspaceState {
  if (typeof window === "undefined") return initialState;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return initialState;
    const parsed: unknown = JSON.parse(raw);
    if (!isRecord(parsed)) return initialState;

    const projects = Array.isArray(parsed.projects)
      ? parsed.projects
          .slice(0, 100)
          .map(normalizeProject)
          .filter((project): project is WorkspaceProject => project !== null)
      : defaultProjects;

    return {
      projects,
      content: normalizeContent(parsed.content),
      messages: normalizeMessages(parsed.messages),
    };
  } catch {
    return initialState;
  }
}

const WorkspaceContext = createContext<WorkspaceContextValue | null>(null);

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<WorkspaceState>(initialState);
  const [ready, setReady] = useState(false);
  const replyTimers = useRef<Set<number>>(new Set());

  useEffect(() => {
    // localStorage is client-only; load after hydration to avoid a mismatch.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setState(loadState());
    setReady(true);
  }, []);

  useEffect(() => {
    const timers = replyTimers.current;
    return () => {
      for (const timer of timers) window.clearTimeout(timer);
      timers.clear();
    };
  }, []);

  useEffect(() => {
    if (!ready) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // Ignore storage failures.
    }
  }, [ready, state]);

  const addProject = useCallback((project: WorkspaceProject) => {
    const normalized = normalizeProject(project);
    if (!normalized) return;

    setState((current) => ({
      ...current,
      projects: [
        normalized,
        ...current.projects.filter((item) => item.slug !== normalized.slug),
      ].slice(0, 100),
    }));
  }, []);

  const updateProject = useCallback((slug: string, patch: Partial<WorkspaceProject>) => {
    setState((current) => ({
      ...current,
      projects: current.projects.map((project) => {
        if (project.slug !== slug) return project;
        return normalizeProject({ ...project, ...patch }) ?? project;
      }),
    }));
  }, []);

  const deleteProject = useCallback((slug: string) => {
    setState((current) => ({
      ...current,
      projects: current.projects.filter((project) => project.slug !== slug),
    }));
  }, []);

  const updateContent = useCallback((patch: Partial<SiteContent>) => {
    setState((current) => ({
      ...current,
      content: normalizeContent({ ...current.content, ...patch }),
    }));
  }, []);

  const updateService = useCallback((slug: string, patch: Partial<ServiceOverride>) => {
    const normalizedSlug = slug.trim().toLowerCase().slice(0, 80);
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(normalizedSlug)) return;

    setState((current) => ({
      ...current,
      content: {
        ...current.content,
        serviceOverrides: {
          ...current.content.serviceOverrides,
          [normalizedSlug]: normalizeServiceOverride({
            ...(current.content.serviceOverrides[normalizedSlug] ?? {
              title: L("", ""),
              tagline: L("", ""),
              description: L("", ""),
            }),
            ...patch,
          }),
        },
      },
    }));
  }, []);

  const addMessage = useCallback((projectSlug: string, text: string) => {
    const trimmed = text.trim().slice(0, 4000);
    if (!trimmed) return;
    const now = new Date().toISOString();
    const id = `msg-${Date.now()}`;

    setState((current) => ({
      ...current,
      messages: [
        ...current.messages,
        { id, projectSlug, author: "client" as const, text: trimmed, at: now },
      ].slice(-200),
    }));

    const timer = window.setTimeout(() => {
      replyTimers.current.delete(timer);
      setState((current) => ({
        ...current,
        messages: [
          ...current.messages,
          {
            id: `${id}-reply`,
            projectSlug,
            author: "manager" as const,
            text: "تم استلام رسالتك. سأراجع الملف وأعود إليك خلال ساعات العمل.",
            at: new Date().toISOString(),
          },
        ].slice(-200),
      }));
    }, 1400);

    replyTimers.current.add(timer);
  }, []);

  const replyMessage = useCallback((projectSlug: string, text: string) => {
    const trimmed = text.trim().slice(0, 4000);
    if (!trimmed) return;
    setState((current) => ({
      ...current,
      messages: [
        ...current.messages,
        {
          id: `msg-${Date.now()}-manager`,
          projectSlug,
          author: "manager" as const,
          text: trimmed,
          at: new Date().toISOString(),
        },
      ].slice(-200),
    }));
  }, []);

  const resetWorkspace = useCallback(() => {
    for (const timer of replyTimers.current) window.clearTimeout(timer);
    replyTimers.current.clear();
    setState(initialState);
  }, []);

  const value = useMemo<WorkspaceContextValue>(
    () => ({
      ...state,
      ready,
      addProject,
      updateProject,
      deleteProject,
      updateContent,
      updateService,
      addMessage,
      replyMessage,
      resetWorkspace,
    }),
    [
      state,
      ready,
      addProject,
      updateProject,
      deleteProject,
      updateContent,
      updateService,
      addMessage,
      replyMessage,
      resetWorkspace,
    ],
  );

  return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>;
}

export function useWorkspace() {
  const context = useContext(WorkspaceContext);
  if (!context) {
    throw new Error("useWorkspace must be used within a WorkspaceProvider");
  }
  return context;
}

export function projectProgress(slug: string) {
  return portalProjects.find((project) => project.slug === slug)?.progress ?? 0;
}

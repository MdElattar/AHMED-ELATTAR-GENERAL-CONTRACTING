"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { L, type Localized } from "@/lib/dictionary";
import {
  projects as seedProjects,
  type ArtVariant,
  type Project,
} from "@/data/projects";
import { portalProjects } from "@/data/portal";

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

function loadState(): WorkspaceState {
  if (typeof window === "undefined") return initialState;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return initialState;
    const parsed = JSON.parse(raw) as Partial<WorkspaceState>;
    return {
      projects: Array.isArray(parsed.projects)
        ? (parsed.projects as WorkspaceProject[])
        : defaultProjects,
      content: {
        ...defaultContent,
        ...(parsed.content ?? {}),
        serviceOverrides: {
          ...defaultContent.serviceOverrides,
          ...(parsed.content?.serviceOverrides ?? {}),
        },
      },
      messages: Array.isArray(parsed.messages) ? parsed.messages : defaultMessages,
    };
  } catch {
    return initialState;
  }
}

const WorkspaceContext = createContext<WorkspaceContextValue | null>(null);

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<WorkspaceState>(initialState);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // localStorage is client-only; load after hydration to avoid a mismatch.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setState(loadState());
    setReady(true);
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
    setState((current) => ({ ...current, projects: [project, ...current.projects] }));
  }, []);

  const updateProject = useCallback((slug: string, patch: Partial<WorkspaceProject>) => {
    setState((current) => ({
      ...current,
      projects: current.projects.map((project) =>
        project.slug === slug ? { ...project, ...patch } : project,
      ),
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
      content: { ...current.content, ...patch },
    }));
  }, []);

  const updateService = useCallback((slug: string, patch: Partial<ServiceOverride>) => {
    setState((current) => ({
      ...current,
      content: {
        ...current.content,
        serviceOverrides: {
          ...current.content.serviceOverrides,
          [slug]: {
            ...(current.content.serviceOverrides[slug] ?? {
              title: L("", ""),
              tagline: L("", ""),
              description: L("", ""),
            }),
            ...patch,
          },
        },
      },
    }));
  }, []);

  const addMessage = useCallback((projectSlug: string, text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    const now = new Date().toISOString();
    const id = `msg-${Date.now()}`;
    setState((current) => ({
      ...current,
      messages: [
        ...current.messages,
        { id, projectSlug, author: "client", text: trimmed, at: now },
      ],
    }));
    window.setTimeout(() => {
      setState((current) => ({
        ...current,
        messages: [
          ...current.messages,
          {
            id: `${id}-reply`,
            projectSlug,
            author: "manager",
            text:
              "تم استلام رسالتك. سأراجع الملف وأعود إليك خلال ساعات العمل.",
            at: new Date().toISOString(),
          },
        ],
      }));
    }, 1400);
  }, []);

  const replyMessage = useCallback((projectSlug: string, text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    setState((current) => ({
      ...current,
      messages: [
        ...current.messages,
        {
          id: `msg-${Date.now()}-manager`,
          projectSlug,
          author: "manager",
          text: trimmed,
          at: new Date().toISOString(),
        },
      ],
    }));
  }, []);

  const resetWorkspace = useCallback(() => {
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

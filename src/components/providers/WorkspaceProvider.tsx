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
  isAllowedMediaSource,
  isCmsPath,
  type MediaOverride,
} from "@/lib/cms";
import type {
  ArtVariant,
  Project,
  ProjectCategory,
  ProjectStatus,
} from "@/data/projects";
import { projectImageDefaults } from "@/data/project-images";
import type {
  PortalDocument,
  PortalInvoice,
  PortalMilestone,
} from "@/data/portal";
import type { Service } from "@/data/services";
import { isSafeInternalPath } from "@/lib/security/validation";

export type WorkspaceProject = Project & {
  progress: number;
  budget: number;
  spent: number;
  profit: number;
  contractValue: number;
  updatedAt: string;
  /** Ordered image URLs. The first entry is the cover. */
  gallery: string[];
  /** Art direction variants used by the public project cinema. */
  artGallery: ArtVariant[];
  milestones: PortalMilestone[];
  documents: PortalDocument[];
  invoices: PortalInvoice[];
  phase: Localized;
  manager: Localized;
  lastUpdate: Localized;
  nextMilestone: Localized;
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
  services: Service[];
  serviceOverrides: Record<string, ServiceOverride>;
  /** Flat dictionary-path overrides, e.g. `hero.titleTop` -> { ar, en }. */
  copyOverrides: Record<string, Localized>;
  /** Flat photography-registry overrides, e.g. `hero` -> { src, alt }. */
  mediaOverrides: Record<string, MediaOverride>;
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

const STORAGE_KEY = "ahmed-elattar-workspace-v2";

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
  services: [],
  serviceOverrides: {},
  copyOverrides: {},
  mediaOverrides: {},
};

const initialState: WorkspaceState = {
  projects: [],
  content: defaultContent,
  messages: [],
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
const serviceIcons: Service["icon"][] = ["building", "truck", "compass", "pen"];
const serviceArts: Service["art"][] = ["tower", "bridge", "villa", "industrial"];
const documentTypes: PortalDocument["type"][] = [
  "contract",
  "drawing",
  "report",
  "certificate",
];
const invoiceStatuses: PortalInvoice["status"][] = ["paid", "due", "pending"];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function finiteNumber(value: unknown, fallback: number) {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function safeText(value: unknown, max: number) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
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

function normalizeMilestones(value: unknown): PortalMilestone[] {
  if (!Array.isArray(value)) return [];

  const milestoneStatuses: PortalMilestone["status"][] = ["complete", "current", "upcoming"];

  return value
    .map((item) => {
      if (!isRecord(item)) return null;
      const title = normalizeLocalized(item.title, L("", ""));
      const date = normalizeLocalized(item.date, L("", ""));
      const status = milestoneStatuses.includes(item.status as PortalMilestone["status"])
        ? (item.status as PortalMilestone["status"])
        : "upcoming";
      if (!title.ar && !title.en) return null;
      return { title, date, status };
    })
    .filter((item): item is PortalMilestone => item !== null)
    .slice(0, 30);
}

function normalizeDocuments(value: unknown): PortalDocument[] {
  if (!Array.isArray(value)) return [];

  return value
    .map((item) => {
      if (!isRecord(item)) return null;
      const name = normalizeLocalized(item.name, L("", ""));
      if (!name.ar && !name.en) return null;
      const type = documentTypes.includes(item.type as PortalDocument["type"])
        ? (item.type as PortalDocument["type"])
        : "report";
      return {
        name,
        type,
        date: safeText(item.date, 40),
        size: safeText(item.size, 40),
      };
    })
    .filter((item): item is PortalDocument => item !== null)
    .slice(0, 60);
}

function normalizeInvoices(value: unknown): PortalInvoice[] {
  if (!Array.isArray(value)) return [];

  return value
    .map((item) => {
      if (!isRecord(item)) return null;
      const number = safeText(item.number, 60);
      const title = normalizeLocalized(item.title, L("", ""));
      const amount = safeText(item.amount, 60);
      if (!number || !amount || (!title.ar && !title.en)) return null;
      const status = invoiceStatuses.includes(item.status as PortalInvoice["status"])
        ? (item.status as PortalInvoice["status"])
        : "pending";
      return { number, title, amount, date: safeText(item.date, 40), status };
    })
    .filter((item): item is PortalInvoice => item !== null)
    .slice(0, 60);
}

function normalizeService(value: unknown): Service | null {
  if (!isRecord(value)) return null;

  const slug = safeText(value.slug, 80).toLowerCase();
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) return null;

  const title = normalizeLocalized(value.title, L("", ""));
  if (!title.ar && !title.en) return null;

  const capabilities = Array.isArray(value.capabilities)
    ? value.capabilities
        .map((item) => normalizeLocalized(item, L("", "")))
        .filter((item) => item.ar || item.en)
        .slice(0, 20)
    : [];

  const stats = Array.isArray(value.stats)
    ? value.stats
        .map((item) => {
          if (!isRecord(item)) return null;
          const metric = safeText(item.value, 40);
          const label = normalizeLocalized(item.label, L("", ""));
          if (!metric || (!label.ar && !label.en)) return null;
          return { value: metric, label };
        })
        .filter((item): item is { value: string; label: Localized } => item !== null)
        .slice(0, 12)
    : [];

  return {
    slug,
    number: safeText(value.number, 8),
    title,
    tagline: normalizeLocalized(value.tagline, L("", "")),
    description: normalizeLocalized(value.description, L("", "")),
    detail: normalizeLocalized(value.detail, L("", "")),
    capabilities,
    stats,
    icon: serviceIcons.includes(value.icon as Service["icon"])
      ? (value.icon as Service["icon"])
      : "building",
    art: serviceArts.includes(value.art as Service["art"])
      ? (value.art as Service["art"])
      : "tower",
  };
}

function normalizeServices(value: unknown): Service[] {
  if (!Array.isArray(value)) return [];
  const seen = new Set<string>();
  return value
    .map(normalizeService)
    .filter((service): service is Service => {
      if (!service || seen.has(service.slug)) return false;
      seen.add(service.slug);
      return true;
    })
    .slice(0, 30);
}

function normalizeProject(value: unknown): WorkspaceProject | null {
  if (!isRecord(value)) return null;

  const slug =
    typeof value.slug === "string" ? value.slug.trim().toLowerCase().slice(0, 80) : "";
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) return null;

  const category = categories.includes(value.category as ProjectCategory)
    ? (value.category as ProjectCategory)
    : "commercial";
  const status = statuses.includes(value.status as ProjectStatus)
    ? (value.status as ProjectStatus)
    : "ongoing";
  const art = artVariants.includes(value.art as ArtVariant)
    ? (value.art as ArtVariant)
    : "tower";
  const rawGallery = Array.isArray(value.gallery)
    ? value.gallery.filter((item): item is string => typeof item === "string")
    : [];
  const legacyArtGallery = rawGallery.filter((item): item is ArtVariant =>
    artVariants.includes(item as ArtVariant),
  );
  const gallery = rawGallery
    .filter(
      (item) => !artVariants.includes(item as ArtVariant) && isAllowedMediaSource(item),
    )
    .slice(0, 12);
  const artGallery = Array.isArray(value.artGallery)
    ? value.artGallery
        .filter((item): item is ArtVariant => artVariants.includes(item as ArtVariant))
        .slice(0, 8)
    : legacyArtGallery.length
      ? legacyArtGallery.slice(0, 8)
      : [art];
  const imageDefaults = projectImageDefaults[art];
  const coverUrl =
    (typeof value.coverUrl === "string" && isAllowedMediaSource(value.coverUrl)
      ? value.coverUrl
      : undefined) ??
    gallery[0] ??
    imageDefaults.coverUrl;
  const thumbUrl =
    typeof value.thumbUrl === "string" && isAllowedMediaSource(value.thumbUrl)
      ? value.thumbUrl
      : undefined;
  const blurDataURL =
    typeof value.blurDataURL === "string" &&
    /^data:image\/(?:webp|png|jpeg);base64,/.test(value.blurDataURL) &&
    value.blurDataURL.length <= 20_000
      ? value.blurDataURL
      : undefined;
  const location = normalizeLocalized(value.location, L("", ""));
  const [locationCity = "", locationDistrict = ""] = location.en
    .split("—")
    .map((part) => part.trim());
  const city =
    typeof value.city === "string" && value.city.trim()
      ? value.city.trim().slice(0, 120)
      : locationCity;
  const district =
    typeof value.district === "string" && value.district.trim()
      ? value.district.trim().slice(0, 160)
      : locationDistrict;

  const scope = Array.isArray(value.scope)
    ? value.scope
        .map((item) => normalizeLocalized(item, L("", "")))
        .filter((item) => item.ar || item.en)
        .slice(0, 20)
    : [];

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
    : [];

  const fallbackProgress = status === "completed" ? 100 : status === "upcoming" ? 12 : 54;
  const budget = Math.max(0, finiteNumber(value.budget, 0));
  const spent = clamp(finiteNumber(value.spent, 0), 0, budget || Number.MAX_SAFE_INTEGER);
  const profit = Math.max(0, finiteNumber(value.profit, 0));
  const contractValue = Math.max(0, finiteNumber(value.contractValue, budget));
  const updatedAt =
    typeof value.updatedAt === "string" && !Number.isNaN(Date.parse(value.updatedAt))
      ? value.updatedAt.slice(0, 40)
      : "";

  return {
    slug,
    title: normalizeLocalized(value.title, L(slug, slug)),
    category,
    status,
    location: normalizeLocalized(value.location, L("", "")),
    year: typeof value.year === "string" ? value.year.trim().slice(0, 20) : "",
    client: normalizeLocalized(value.client, L("", "")),
    area: normalizeLocalized(value.area, L("", "")),
    value: normalizeLocalized(value.value, L("", "")),
    summary: normalizeLocalized(value.summary, L("", "")),
    description: normalizeLocalized(value.description, L("", "")),
    scope,
    highlights,
    art,
    ...(value.featured === true ? { featured: true } : {}),
    coverUrl,
    ...(thumbUrl ? { thumbUrl } : {}),
    ...(blurDataURL ? { blurDataURL } : {}),
    gallery: gallery.length ? gallery : [coverUrl],
    artGallery,
    city,
    district,
    progress: clamp(finiteNumber(value.progress, fallbackProgress), 0, 100),
    budget,
    spent,
    profit,
    contractValue,
    updatedAt,
    milestones: normalizeMilestones(value.milestones),
    documents: normalizeDocuments(value.documents),
    invoices: normalizeInvoices(value.invoices),
    phase: normalizeLocalized(value.phase, L("", "")),
    manager: normalizeLocalized(value.manager, L("", "")),
    lastUpdate: normalizeLocalized(value.lastUpdate, L("", "")),
    nextMilestone: normalizeLocalized(value.nextMilestone, L("", "")),
  };
}

function normalizeMessages(value: unknown): PortalMessage[] {
  if (!Array.isArray(value)) return [];

  return value
    .slice(-200)
    .map((item, index) => {
      if (!isRecord(item)) return null;

      const projectSlug =
        typeof item.projectSlug === "string" ? item.projectSlug.trim().slice(0, 80) : "";
      const text = typeof item.text === "string" ? item.text.trim().slice(0, 4000) : "";
      const author =
        item.author === "manager" ? "manager" : item.author === "client" ? "client" : null;
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

function normalizeOptionalLocalized(value: unknown): Localized {
  if (!isRecord(value)) return L("", "");
  const ar = typeof value.ar === "string" ? value.ar.slice(0, 8000) : "";
  const en = typeof value.en === "string" ? value.en.slice(0, 8000) : "";
  return L(ar, en);
}

function normalizeCopyOverrides(value: unknown): Record<string, Localized> {
  if (!isRecord(value)) return {};
  const overrides: Record<string, Localized> = {};

  for (const [path, entry] of Object.entries(value).slice(0, 2_500)) {
    if (!isCmsPath(path)) continue;
    const localized = normalizeOptionalLocalized(entry);
    if (!localized.ar && !localized.en) continue;
    overrides[path] = localized;
  }

  return overrides;
}

function normalizeMediaOverrides(value: unknown): Record<string, MediaOverride> {
  if (!isRecord(value)) return {};
  const overrides: Record<string, MediaOverride> = {};

  for (const [key, entry] of Object.entries(value).slice(0, 500)) {
    if (!isCmsPath(key) || !isRecord(entry)) continue;
    const src = typeof entry.src === "string" ? entry.src.trim().slice(0, 2000) : "";
    if (!isAllowedMediaSource(src)) continue;
    overrides[key] = {
      src,
      alt: normalizeOptionalLocalized(entry.alt),
    };
  }

  return overrides;
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
    services: normalizeServices(stored.services),
    serviceOverrides,
    copyOverrides: normalizeCopyOverrides(stored.copyOverrides),
    mediaOverrides: normalizeMediaOverrides(stored.mediaOverrides),
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
      : [];

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
  const stateRef = useRef<WorkspaceState>(initialState);

  const commit = useCallback((next: WorkspaceState) => {
    stateRef.current = next;
    setState(next);
  }, []);

  useEffect(() => {
    // localStorage is client-only; load after hydration to avoid a mismatch.
    const restored = loadState();
    stateRef.current = restored;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setState(restored);
    setReady(true);
  }, []);

  // Hydrate from the database. The server is authoritative: no static mock
  // records are merged into the live feed.
  useEffect(() => {
    if (!ready) return;
    let cancelled = false;

    const hydrate = async () => {
      try {
        const [contentResponse, projectsResponse] = await Promise.all([
          fetch("/api/content", { cache: "no-store" }),
          fetch("/api/projects", { cache: "no-store" }),
        ]);

        if (cancelled) return;

        const contentData = (await contentResponse.json().catch(() => ({}))) as {
          content?: unknown;
        };
        const projectsData = (await projectsResponse.json().catch(() => ({}))) as {
          projects?: unknown;
        };

        const current = stateRef.current;
        let next: WorkspaceState = current;

        if (contentData.content) {
          next = { ...next, content: normalizeContent(contentData.content) };
        }

        if (projectsResponse.ok && Array.isArray(projectsData.projects)) {
          next = {
            ...next,
            projects: projectsData.projects
              .map(normalizeProject)
              .filter((project): project is WorkspaceProject => project !== null)
              .slice(0, 100),
          };
        }

        if (!cancelled) commit(next);
      } catch {
        // Offline: retain the last cached snapshot until the feed recovers.
      }
    };

    void hydrate();
    return () => {
      cancelled = true;
    };
  }, [ready, commit]);

  const persistProject = useCallback((project: WorkspaceProject) => {
    void fetch("/api/admin/projects", {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ project }),
    }).catch(() => undefined);
  }, []);

  const persistProjectPatch = useCallback((project: WorkspaceProject) => {
    void fetch(`/api/admin/projects/${encodeURIComponent(project.slug)}`, {
      method: "PATCH",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ project }),
    }).catch(() => undefined);
  }, []);

  const persistContent = useCallback((content: SiteContent) => {
    void fetch("/api/admin/content", {
      method: "PATCH",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content }),
    }).catch(() => undefined);
  }, []);

  useEffect(() => {
    if (!ready) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // Ignore storage failures.
    }
  }, [ready, state]);

  const addProject = useCallback(
    (project: WorkspaceProject) => {
      const normalized = normalizeProject(project);
      if (!normalized) return;

      const current = stateRef.current;
      commit({
        ...current,
        projects: [
          normalized,
          ...current.projects.filter((item) => item.slug !== normalized.slug),
        ].slice(0, 100),
      });
      persistProject(normalized);
    },
    [commit, persistProject],
  );

  const updateProject = useCallback(
    (slug: string, patch: Partial<WorkspaceProject>) => {
      const current = stateRef.current;
      const projects = current.projects.map((project) => {
        if (project.slug !== slug) return project;
        return normalizeProject({ ...project, ...patch }) ?? project;
      });
      const updated = projects.find((project) => project.slug === slug);

      commit({ ...current, projects });
      if (updated) persistProjectPatch(updated);
    },
    [commit, persistProjectPatch],
  );

  const deleteProject = useCallback(
    (slug: string) => {
      const current = stateRef.current;
      commit({
        ...current,
        projects: current.projects.filter((project) => project.slug !== slug),
      });
      void fetch(`/api/admin/projects/${encodeURIComponent(slug)}`, {
        method: "DELETE",
        credentials: "same-origin",
      }).catch(() => undefined);
    },
    [commit],
  );

  const updateContent = useCallback(
    (patch: Partial<SiteContent>) => {
      const current = stateRef.current;
      const content = normalizeContent({ ...current.content, ...patch });
      commit({ ...current, content });
      persistContent(content);
    },
    [commit, persistContent],
  );

  const updateService = useCallback(
    (slug: string, patch: Partial<ServiceOverride>) => {
      const normalizedSlug = slug.trim().toLowerCase().slice(0, 80);
      if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(normalizedSlug)) return;

      const current = stateRef.current;
      const content: SiteContent = {
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
      };

      commit({ ...current, content });
      persistContent(content);
    },
    [commit, persistContent],
  );

  const addMessage = useCallback(
    (projectSlug: string, text: string) => {
      const trimmed = text.trim().slice(0, 4000);
      if (!trimmed) return;
      const now = new Date().toISOString();
      const id = `msg-${Date.now()}`;
      const current = stateRef.current;

      commit({
        ...current,
        messages: [
          ...current.messages,
          { id, projectSlug, author: "client" as const, text: trimmed, at: now },
        ].slice(-200),
      });
    },
    [commit],
  );

  const replyMessage = useCallback(
    (projectSlug: string, text: string) => {
      const trimmed = text.trim().slice(0, 4000);
      if (!trimmed) return;
      const current = stateRef.current;

      commit({
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
      });
    },
    [commit],
  );

  const resetWorkspace = useCallback(() => {
    commit(initialState);
  }, [commit]);

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

export function projectProgress(projects: WorkspaceProject[], slug: string) {
  return projects.find((project) => project.slug === slug)?.progress ?? 0;
}

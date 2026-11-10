"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowUpRight, Search, SlidersHorizontal } from "lucide-react";
import { useI18n } from "@/components/providers/I18nProvider";
import { useWorkspace } from "@/components/providers/WorkspaceProvider";
import { ProjectCard } from "@/components/sections/projects/ProjectCard";
import { CTA } from "@/components/sections/home/CTA";
import { Modal } from "@/components/ui/Modal";
import { ProjectArt } from "@/components/ui/ProjectArt";
import { Reveal } from "@/components/ui/Reveal";
import { projectCategories, type Project, type ProjectCategory } from "@/data/projects";
import { cn } from "@/lib/utils";

type Filter = "all" | ProjectCategory;

export function ProjectsExplorer() {
  const { t, l, locale, isRTL } = useI18n();
  const { projects } = useWorkspace();
  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Project | null>(null);

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return projects.filter((project) => {
      if (filter !== "all" && project.category !== filter) return false;
      if (!normalized) return true;
      return [
        project.title.ar,
        project.title.en,
        project.location.ar,
        project.location.en,
        project.client.ar,
        project.client.en,
        project.summary.ar,
        project.summary.en,
      ]
        .join(" ")
        .toLowerCase()
        .includes(normalized);
    });
  }, [filter, projects, query]);

  const filters: Filter[] = ["all", ...projectCategories];

  const counts = useMemo(() => {
    const next = new Map<Filter, number>([["all", projects.length]]);
    for (const category of projectCategories) {
      next.set(
        category,
        projects.reduce(
          (total, project) => (project.category === category ? total + 1 : total),
          0,
        ),
      );
    }
    return next;
  }, [projects]);

  return (
    <>
      <section className="relative overflow-hidden bg-obsidian pb-16 pt-36 sm:pb-20 sm:pt-44">
        <div className="blueprint-grid pointer-events-none absolute inset-0 opacity-40" />
        <div className="pointer-events-none absolute -end-20 top-24 select-none text-[16rem] font-semibold leading-none tracking-tighter text-white/[0.025] sm:text-[24rem]">
          WORKS
        </div>
        <div className="pointer-events-none absolute start-1/4 top-1/3 h-[420px] w-[420px] rounded-full bg-gold/[0.05] blur-[130px]" />

        <div className="container-lux relative">
          <Reveal>
            <span className="eyebrow">{t.projectsPage.eyebrow}</span>
          </Reveal>
          <div className="mt-6 grid gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-end">
            <Reveal delay={80}>
              <h1 className="display-title max-w-3xl text-[clamp(2.8rem,6.4vw,6.2rem)] text-ivory">
                {t.projectsPage.title}
              </h1>
            </Reveal>
            <Reveal delay={180}>
              <p className="max-w-lg text-[0.95rem] leading-[1.95] text-ivory/50 lg:ms-auto">
                {t.projectsPage.description}
              </p>
            </Reveal>
          </div>

          <div className="mt-12 grid grid-cols-3 gap-6 border-t border-white/10 pt-7 sm:max-w-xl">
            {[
              { value: `${projects.length}`, label: t.projectsPage.results },
              { value: "04", label: locale === "en" ? "Sectors" : "قطاعات" },
              { value: "04", label: locale === "en" ? "Countries" : "دول" },
            ].map((item) => (
              <div key={item.label} className="flex flex-col gap-1">
                <span className="tabular text-2xl font-light text-ivory">{item.value}</span>
                <span className="text-[0.55rem] uppercase tracking-[0.16em] text-ivory/30">
                  {item.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="grain relative overflow-hidden bg-ivory text-ink">
        <div className="pointer-events-none absolute inset-0 opacity-[0.35] [background-image:linear-gradient(rgba(10,11,14,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(10,11,14,0.035)_1px,transparent_1px)] [background-size:90px_90px]" />

        <div className="container-lux section-pad relative">
          <div className="flex flex-col justify-between gap-6 border-b border-ink/10 pb-6 sm:flex-row sm:items-center">
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
              <SlidersHorizontal className="me-2 h-3.5 w-3.5 shrink-0 text-gold-dark" />
              {filters.map((item) => {
                const count = counts.get(item) ?? 0;
                return (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setFilter(item)}
                    className={cn(
                      "flex shrink-0 items-center gap-2 px-3 py-2 text-[0.62rem] font-semibold uppercase tracking-[0.14em] transition-colors",
                      filter === item
                        ? "bg-ink text-ivory"
                        : "text-ink/45 hover:text-ink",
                    )}
                  >
                    {item === "all" ? t.projectsPage.filters.all : t.projectsPage.categories[item]}
                    <span
                      className={cn(
                        "tabular text-[0.5rem]",
                        filter === item ? "text-gold" : "text-ink/25",
                      )}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <label className="relative block">
                <Search className="pointer-events-none absolute start-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink/30" />
                <input
                  type="search"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder={t.projectsPage.search}
                  className="h-9 w-full border border-ink/10 bg-transparent ps-9 pe-3 text-[0.68rem] text-ink outline-none transition-colors placeholder:text-ink/30 focus:border-gold-dark/60 sm:w-64"
                />
              </label>
              <span className="whitespace-nowrap text-[0.58rem] uppercase tracking-[0.18em] text-ink/35">
                <span className="tabular text-gold-dark">{filtered.length}</span>{" "}
                {t.projectsPage.results}
              </span>
            </div>
          </div>

          {filtered.length ? (
            <div
              key={filter}
              className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3"
            >
              {filtered.map((project, index) => (
                <Reveal key={project.slug} delay={(index % 3) * 70}>
                  <ProjectCard
                    project={project}
                    index={projects.findIndex((item) => item.slug === project.slug)}
                    onSelect={setSelected}
                    className="h-full"
                  />
                </Reveal>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <span className="font-display text-6xl text-ink/10">00</span>
              <p className="mt-4 text-sm text-ink/45">{t.projectsPage.empty}</p>
            </div>
          )}

          <div className="mt-16 flex flex-col items-start justify-between gap-5 border-t border-ink/10 pt-7 sm:flex-row sm:items-center">
            <p className="max-w-md text-xs leading-relaxed text-ink/40">
              {t.projectsPage.description}
            </p>
            <Link
              href="/contact"
              className="group inline-flex items-center gap-3 text-[0.65rem] font-semibold uppercase tracking-[0.16em] text-ink/60 transition-colors hover:text-gold-dark"
            >
              {t.cta.primary}
              <span className="flex h-8 w-8 items-center justify-center rounded-full border border-ink/15 transition-colors group-hover:border-gold-dark">
                <ArrowUpRight className={cn("h-3.5 w-3.5", isRTL && "-scale-x-100")} />
              </span>
            </Link>
          </div>
        </div>
      </section>

      <Modal
        open={Boolean(selected)}
        onClose={() => setSelected(null)}
        labelledBy="project-modal-title"
        closeLabel={t.common.close}
      >
        {selected ? (
          <div>
            <div className="relative h-52 overflow-hidden sm:h-72">
              <ProjectArt variant={selected.art} className="h-full w-full" />
              <div className="absolute inset-0 bg-gradient-to-t from-coal via-coal/20 to-transparent" />
              <div className="absolute inset-x-6 bottom-5 flex flex-wrap items-center gap-3">
                <span className="border border-gold/30 bg-obsidian/40 px-3 py-1 text-[0.52rem] uppercase tracking-[0.16em] text-gold backdrop-blur">
                  {t.projectsPage.categories[selected.category]}
                </span>
                <span className="text-[0.55rem] uppercase tracking-[0.16em] text-ivory/50">
                  {selected.year}
                </span>
                <span className="text-[0.55rem] uppercase tracking-[0.16em] text-ivory/50">
                  {l(selected.location)}
                </span>
              </div>
            </div>

            <div className="p-6 sm:p-10">
              <h2
                id="project-modal-title"
                className="display-title text-[clamp(2rem,4vw,3.4rem)] text-ivory"
              >
                {l(selected.title)}
              </h2>
              <p className="mt-4 max-w-3xl text-[0.9rem] leading-[1.9] text-ivory/55">
                {l(selected.summary)}
              </p>

              <div className="mt-8 grid grid-cols-2 gap-px overflow-hidden border border-white/10 bg-white/10 sm:grid-cols-4">
                {[
                  { label: t.projectsPage.modal.client, value: l(selected.client) },
                  { label: t.projectsPage.modal.area, value: l(selected.area) },
                  { label: t.projectsPage.modal.value, value: l(selected.value) },
                  {
                    label: t.projectsPage.modal.status,
                    value: t.projectsPage.status[selected.status],
                  },
                ].map((fact) => (
                  <div key={fact.label} className="bg-coal p-4">
                    <span className="text-[0.5rem] uppercase tracking-[0.16em] text-ivory/30">
                      {fact.label}
                    </span>
                    <p className="mt-1.5 text-[0.78rem] leading-snug text-ivory/75">{fact.value}</p>
                  </div>
                ))}
              </div>

              <div className="mt-8">
                <h3 className="text-[0.58rem] uppercase tracking-[0.2em] text-gold">
                  {t.projectsPage.modal.scope}
                </h3>
                <div className="mt-3 flex flex-wrap gap-2">
                  {selected.scope.map((item) => (
                    <span
                      key={item.en}
                      className="border border-white/10 px-3 py-1.5 text-[0.62rem] text-ivory/55"
                    >
                      {l(item)}
                    </span>
                  ))}
                </div>
              </div>

              <div className="mt-8 flex flex-col gap-3 border-t border-white/10 pt-6 sm:flex-row sm:items-center sm:justify-between">
                <Link
                  href={`/projects/${selected.slug}`}
                  className="btn-shine group inline-flex h-11 items-center justify-center gap-2 bg-gold px-5 text-[0.62rem] font-semibold uppercase tracking-[0.14em] text-obsidian transition-colors hover:bg-gold-light"
                >
                  {t.common.viewFullPage}
                  <ArrowUpRight className={cn("h-3.5 w-3.5", isRTL && "-scale-x-100")} />
                </Link>
                <button
                  type="button"
                  onClick={() => setSelected(null)}
                  className="text-[0.6rem] uppercase tracking-[0.16em] text-ivory/40 transition-colors hover:text-gold"
                >
                  {t.common.close}
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </Modal>

      <CTA />
    </>
  );
}

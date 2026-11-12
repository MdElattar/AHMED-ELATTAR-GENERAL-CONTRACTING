"use client";

import { useMemo } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowUpRight, MapPin } from "lucide-react";
import { useI18n } from "@/components/providers/I18nProvider";
import { useWorkspace } from "@/components/providers/WorkspaceProvider";
import { CTA } from "@/components/sections/home/CTA";
import { ProjectCard } from "@/components/sections/projects/ProjectCard";
import { ProjectCinema } from "@/components/sections/projects/ProjectCinema";
import { ProjectCostVisualizer } from "@/components/sections/projects/ProjectCostVisualizer";
import { ProjectArt } from "@/components/ui/ProjectArt";
import { Reveal } from "@/components/ui/Reveal";
import type { ArtVariant, Project } from "@/data/projects";
import { cn } from "@/lib/utils";

type DetailProject = Project & {
  gallery?: ArtVariant[];
  progress?: number;
  contractValue?: number;
};

export function ProjectDetail({ project }: { project: DetailProject }) {
  const { t, l, isRTL } = useI18n();
  const { projects } = useWorkspace();

  const related = useMemo(
    () =>
      projects
        .filter((item) => item.slug !== project.slug)
        .sort((a, b) => {
          const aScore = a.category === project.category ? 1 : 0;
          const bScore = b.category === project.category ? 1 : 0;
          return bScore - aScore;
        })
        .slice(0, 3),
    [project.category, project.slug, projects],
  );

  const facts = [
    { label: t.projectDetail.client, value: l(project.client) },
    { label: t.projectDetail.location, value: l(project.location) },
    { label: t.projectDetail.year, value: project.year },
    { label: t.projectDetail.value, value: l(project.value) },
    { label: t.projectDetail.area, value: l(project.area) },
    { label: t.projectDetail.status, value: t.projectsPage.status[project.status] },
    { label: t.projectDetail.category, value: t.projectsPage.categories[project.category] },
  ];

  if (typeof project.progress === "number") {
    facts.push({
      label: t.sections.inline.projectProgress,
      value: `${project.progress}%`,
    });
  }

  const gallery = project.gallery?.length ? project.gallery : [project.art];

  return (
    <>
      <section className="relative min-h-[82svh] overflow-hidden bg-obsidian">
        <div className="absolute inset-0">
          <ProjectArt variant={project.art} className="h-full w-full" />
          <div className="absolute inset-0 bg-gradient-to-t from-obsidian via-obsidian/60 to-obsidian/30" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_30%_30%,rgba(6,7,8,0.35),transparent_65%)]" />
        </div>

        <div className="container-lux relative flex min-h-[82svh] flex-col justify-end pb-12 pt-36 sm:pb-16">
          <Reveal>
            <Link
              href="/projects"
              className="group inline-flex items-center gap-2 text-[0.62rem] uppercase tracking-[0.18em] text-ivory/60 transition-colors hover:text-gold"
            >
              <ArrowLeft
                className={cn(
                  "h-3.5 w-3.5 transition-transform group-hover:-translate-x-0.5",
                  isRTL && "-scale-x-100",
                )}
              />
              {t.projectDetail.back}
            </Link>
          </Reveal>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <span className="border border-gold/30 bg-obsidian/40 px-3 py-1 text-[0.52rem] uppercase tracking-[0.16em] text-gold backdrop-blur">
              {t.projectsPage.categories[project.category]}
            </span>
            <span className="text-[0.55rem] uppercase tracking-[0.16em] text-ivory/60">
              {t.projectsPage.status[project.status]}
            </span>
            <span className="h-3 w-px bg-white/15" />
            <span className="flex items-center gap-1.5 text-[0.55rem] uppercase tracking-[0.14em] text-ivory/60">
              <MapPin className="h-3 w-3 text-gold/70" />
              {l(project.location)}
            </span>
          </div>

          <Reveal delay={80}>
            <h1 className="display-title mt-5 max-w-4xl text-[clamp(2.8rem,7vw,7rem)] text-ivory">
              {l(project.title)}
            </h1>
          </Reveal>
          <Reveal delay={160}>
            <p className="mt-5 max-w-2xl text-[0.95rem] leading-[1.95] text-ivory/65">
              {l(project.summary)}
            </p>
          </Reveal>
        </div>
      </section>

      <section className="relative border-y border-white/10 bg-coal">
        <div className="container-lux">
          <div className="grid grid-cols-2 gap-px bg-white/10 sm:grid-cols-4">
            {facts.slice(0, 4).map((fact) => (
              <div key={fact.label} className="bg-coal px-5 py-6">
                <span className="text-[0.5rem] uppercase tracking-[0.16em] text-ivory/40">
                  {fact.label}
                </span>
                <p className="mt-2 text-[0.8rem] leading-snug text-ivory/75">{fact.value}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {gallery.length > 1 ? (
        <section className="relative border-b border-white/10 bg-obsidian">
          <div className="container-lux py-10 sm:py-14">
            <div className="flex items-center justify-between gap-4">
              <span className="text-[0.55rem] font-semibold uppercase tracking-[0.18em] text-gold">
                {t.sections.inline.projectGallery}
              </span>
              <span className="tabular text-[0.52rem] text-ivory/35">
                {String(gallery.length).padStart(2, "0")}
              </span>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
              {gallery.slice(0, 8).map((variant, index) => (
                <Reveal key={`${variant}-${index}`} delay={index * 50}>
                  <div className="group relative aspect-[4/3] overflow-hidden border border-white/10">
                    <ProjectArt variant={variant} className="h-full w-full transition-transform duration-700 group-hover:scale-[1.03]" />
                    <div className="absolute inset-0 bg-gradient-to-t from-obsidian/50 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      <ProjectCinema project={project} gallery={gallery} />
      <ProjectCostVisualizer project={project} contractValue={project.contractValue} />

      <section className="grain relative overflow-hidden bg-ivory text-ink">
        <div className="pointer-events-none absolute inset-0 opacity-[0.35] [background-image:linear-gradient(rgba(10,11,14,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(10,11,14,0.035)_1px,transparent_1px)] [background-size:90px_90px]" />
        <div className="container-lux section-pad relative">
          <div className="grid gap-14 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20">
            <div>
              <Reveal>
                <span className="eyebrow text-gold-dark">{t.projectDetail.overview}</span>
              </Reveal>
              <Reveal delay={90}>
                <h2 className="display-title mt-6 text-[clamp(2rem,3.8vw,3.6rem)] text-ink">
                  {l(project.title)}
                </h2>
              </Reveal>

              <Reveal delay={160}>
                <dl className="mt-10 divide-y divide-ink/10 border-y border-ink/10">
                  {facts.map((fact) => (
                    <div key={fact.label} className="flex items-baseline justify-between gap-6 py-3.5">
                      <dt className="text-[0.55rem] uppercase tracking-[0.16em] text-ink/40">
                        {fact.label}
                      </dt>
                      <dd className="text-end text-[0.78rem] text-ink/70">{fact.value}</dd>
                    </div>
                  ))}
                </dl>
              </Reveal>
            </div>

            <div>
              <Reveal delay={120}>
                <p className="text-[1.02rem] leading-[2] text-ink/70">{l(project.description)}</p>
              </Reveal>

              <Reveal delay={200}>
                <div className="mt-12">
                  <h3 className="text-[0.6rem] font-semibold uppercase tracking-[0.2em] text-gold-dark">
                    {t.projectDetail.scope}
                  </h3>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {project.scope.map((item) => (
                      <span
                        key={item.en}
                        className="border border-ink/12 px-3.5 py-2 text-[0.68rem] text-ink/60"
                      >
                        {l(item)}
                      </span>
                    ))}
                  </div>
                </div>
              </Reveal>

              {project.highlights.length ? (
                <Reveal delay={260}>
                  <div className="mt-12">
                    <h3 className="text-[0.6rem] font-semibold uppercase tracking-[0.2em] text-gold-dark">
                      {t.projectDetail.highlights}
                    </h3>
                    <div className="mt-4 grid gap-px overflow-hidden border border-ink/10 bg-ink/10 sm:grid-cols-3">
                      {project.highlights.map((highlight) => (
                        <div key={highlight.label.en} className="bg-ivory p-5">
                          <span className="tabular font-display text-3xl text-ink">
                            {highlight.value}
                          </span>
                          <p className="mt-1.5 text-[0.62rem] uppercase leading-relaxed tracking-[0.1em] text-ink/40">
                            {l(highlight.label)}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                </Reveal>
              ) : null}
            </div>
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden bg-coal">
        <div className="blueprint-grid pointer-events-none absolute inset-0 opacity-30" />
        <div className="container-lux section-pad relative">
          <div className="flex flex-col justify-between gap-6 border-b border-white/10 pb-7 sm:flex-row sm:items-end">
            <div>
              <span className="eyebrow">{t.projectDetail.related}</span>
              <h2 className="display-title mt-4 text-[clamp(2rem,3.6vw,3.2rem)] text-ivory">
                {t.projectDetail.nextProject}
              </h2>
            </div>
            <Link
              href="/projects"
              className="group inline-flex items-center gap-2 text-[0.62rem] uppercase tracking-[0.16em] text-ivory/55 transition-colors hover:text-gold"
            >
              {t.projectDetail.back}
              <ArrowUpRight className={cn("h-3.5 w-3.5", isRTL && "-scale-x-100")} />
            </Link>
          </div>

          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {related.map((item, index) => (
              <Reveal key={item.slug} delay={index * 80}>
                <ProjectCard project={item} index={index} className="h-full" />
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <CTA />
    </>
  );
}

export function ProjectDetailLive({
  slug,
  initialProject,
}: {
  slug: string;
  initialProject: Project | null;
}) {
  const { projects, ready } = useWorkspace();
  const { t } = useI18n();
  // The server-rendered record is authoritative until the live workspace feed
  // is ready. If the client feed is empty or unreachable, keep the server
  // record instead of rendering a false 404 for a valid project.
  const project = (ready ? projects.find((item) => item.slug === slug) : undefined) ?? initialProject;

  if (!project) {
    if (!ready) {
      return (
        <section className="flex min-h-[80svh] items-center justify-center bg-obsidian pt-24">
          <span className="h-8 w-8 animate-spin rounded-full border border-white/15 border-t-gold" />
        </section>
      );
    }

    return (
      <section className="relative flex min-h-[80svh] items-center overflow-hidden bg-obsidian pt-24">
        <div className="blueprint-grid pointer-events-none absolute inset-0 opacity-40" />
        <div className="container-lux relative text-center">
          <span className="eyebrow justify-center">404</span>
          <h1 className="display-title mt-5 text-[clamp(2.4rem,5vw,4.6rem)] text-ivory">
            {t.sections.inline.projectNotFoundTitle}
          </h1>
          <p className="mx-auto mt-4 max-w-md text-[0.85rem] leading-relaxed text-ivory/55">
            {t.sections.inline.projectNotFoundText}
          </p>
          <Link
            href="/projects"
            className="btn-shine mt-8 inline-flex h-11 items-center gap-2 bg-gold px-5 text-[0.6rem] font-semibold uppercase tracking-[0.14em] text-obsidian transition-colors hover:bg-gold-light"
          >
            {t.projectDetail.back}
            <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </section>
    );
  }

  return <ProjectDetail project={project} />;
}

"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { useI18n } from "@/components/providers/I18nProvider";
import type { Project } from "@/data/projects";
import { projectPhotos } from "@/data/media";
import { cn } from "@/lib/utils";

type ProjectCardProps = {
  project: Project;
  index?: number;
  onSelect?: (project: Project) => void;
  className?: string;
  artClassName?: string;
  compact?: boolean;
};

export function ProjectCard({
  project,
  index = 0,
  onSelect,
  className,
  artClassName,
  compact = false,
}: ProjectCardProps) {
  const { t, l, isRTL } = useI18n();
  const photo = projectPhotos[project.art];

  const inner = (
    <>
      <div className={cn("relative aspect-[4/3] overflow-hidden bg-coal", artClassName)}>
        <Image
          src={photo.src}
          alt={photo.alt}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          className="object-cover photo-grade transition-transform duration-[1.4s] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.05]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-obsidian/85 via-obsidian/5 to-transparent" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_72%_24%,rgb(var(--atmo-glow)/0.12),transparent_55%)]" />
        <div className="absolute inset-x-4 top-4 flex items-center justify-between gap-3">
          <span className="border border-white/15 bg-obsidian/40 px-2.5 py-1 text-[0.52rem] font-medium uppercase tracking-[0.16em] text-ivory/80 backdrop-blur-md">
            {t.projectsPage.categories[project.category]}
          </span>
          <span className="tabular text-[0.58rem] tracking-[0.14em] text-ivory/60">
            {project.year}
          </span>
        </div>
        <div className="absolute inset-x-4 bottom-4 flex items-end justify-between gap-4">
          <div className="flex flex-col gap-1">
            <span className="text-[0.52rem] uppercase tracking-[0.18em] text-gold">
              {l(project.location)}
            </span>
            <span className="text-[0.55rem] uppercase tracking-[0.14em] text-ivory/40">
              {l(project.value)}
            </span>
          </div>
          <span className="flex h-9 w-9 shrink-0 items-center justify-center border border-white/20 text-ivory/70 transition-all duration-500 group-hover:border-gold group-hover:bg-gold group-hover:text-obsidian">
            <ArrowUpRight className={cn("h-3.5 w-3.5", isRTL && "-scale-x-100")} />
          </span>
        </div>
        <span className="absolute inset-x-0 bottom-0 h-px scale-x-0 bg-gold transition-transform duration-700 group-hover:scale-x-100" />
      </div>

      <div className="flex flex-1 flex-col border-x border-b border-white/10 bg-coal/70 p-5 transition-colors duration-500 group-hover:bg-coal">
        <div className="flex items-start justify-between gap-4">
          <div>
            <span className="text-[0.52rem] uppercase tracking-[0.18em] text-ivory/25">
              0{index + 1}
            </span>
            <h3 className="mt-2 font-display text-[1.35rem] leading-tight text-ivory transition-colors duration-500 group-hover:text-gold sm:text-[1.5rem]">
              {l(project.title)}
            </h3>
          </div>
          <span className="mt-1 shrink-0 text-[0.58rem] uppercase tracking-[0.12em] text-gold/80">
            {t.projectsPage.status[project.status]}
          </span>
        </div>

        {!compact ? (
          <p className="mt-3 line-clamp-2 text-[0.78rem] leading-relaxed text-ivory/40">
            {l(project.summary)}
          </p>
        ) : null}

        <div className="mt-auto flex items-center justify-between gap-4 border-t border-white/8 pt-4 text-[0.52rem] uppercase tracking-[0.14em] text-ivory/30">
          <span>{l(project.area)}</span>
          <span className="flex items-center gap-1.5 text-ivory/50 transition-colors group-hover:text-gold">
            {t.common.viewProject}
            <ArrowUpRight className={cn("h-3 w-3", isRTL && "-scale-x-100")} />
          </span>
        </div>
      </div>
    </>
  );

  if (onSelect) {
    return (
      <article className={cn("group flex flex-col", className)}>
        <button
          type="button"
          onClick={() => onSelect(project)}
          className="flex h-full w-full flex-col text-start"
          aria-label={`${t.common.viewProject}: ${l(project.title)}`}
        >
          {inner}
        </button>
      </article>
    );
  }

  return (
    <article className={cn("group flex flex-col", className)}>
      <Link href={`/projects/${project.slug}`} className="flex h-full flex-col">
        {inner}
      </Link>
    </article>
  );
}

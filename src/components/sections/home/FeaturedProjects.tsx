"use client";

import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { useI18n } from "@/components/providers/I18nProvider";
import { useWorkspace } from "@/components/providers/WorkspaceProvider";
import { ProjectCard } from "@/components/sections/projects/ProjectCard";
import { Reveal } from "@/components/ui/Reveal";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { cn } from "@/lib/utils";

const spans = [
  "lg:col-span-7",
  "lg:col-span-5",
  "lg:col-span-5",
  "lg:col-span-7",
  "lg:col-span-6",
  "lg:col-span-6",
];

const artRatios = [
  "aspect-[16/10]",
  "aspect-[4/3]",
  "aspect-[4/3]",
  "aspect-[16/10]",
  "aspect-[16/10]",
  "aspect-[16/10]",
];

export function FeaturedProjects() {
  const { t, isRTL } = useI18n();
  const { projects } = useWorkspace();
  const featured = projects.filter((project) => project.featured).slice(0, 6);

  return (
    <section className="grain relative overflow-hidden bg-ivory text-ink">
      <div className="pointer-events-none absolute inset-0 opacity-[0.4] [background-image:linear-gradient(rgba(10,11,14,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(10,11,14,0.035)_1px,transparent_1px)] [background-size:90px_90px]" />

      <div className="container-lux section-pad relative">
        <div className="flex flex-col justify-between gap-8 lg:flex-row lg:items-end">
          <SectionHeading
            eyebrow={t.featured.eyebrow}
            title={t.featured.title}
            description={t.featured.description}
            tone="light"
            titleClassName="max-w-3xl"
          />
          <Reveal delay={200}>
            <Link
              href="/projects"
              className="group inline-flex shrink-0 items-center gap-3 border border-ink/15 px-5 py-3 text-[0.65rem] font-semibold uppercase tracking-[0.16em] text-ink/65 transition-colors hover:border-gold-dark hover:text-gold-dark"
            >
              {t.featured.cta}
              <ArrowUpRight
                className={cn(
                  "h-3.5 w-3.5 transition-transform duration-500 group-hover:-translate-y-0.5 group-hover:translate-x-0.5",
                  isRTL && "-scale-x-100",
                )}
              />
            </Link>
          </Reveal>
        </div>

        <div className="mt-14 grid gap-5 md:grid-cols-2 lg:grid-cols-12">
          {featured.map((project, index) => (
            <Reveal
              key={project.slug}
              delay={(index % 3) * 90}
              className={cn(spans[index], "flex")}
            >
              <ProjectCard
                project={project}
                index={index}
                className="w-full"
                artClassName={artRatios[index]}
              />
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

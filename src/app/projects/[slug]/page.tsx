import type { Metadata } from "next";
import { ProjectDetailLive } from "@/components/sections/projects/ProjectDetail";
import { getProject, projects } from "@/data/projects";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return projects.map((project) => ({ slug: project.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const project = getProject(slug);
  if (!project) {
    // Unknown slugs may still resolve from the client-side admin workspace,
    // so keep the soft fallback but never let crawlers index it.
    return { robots: { index: false, follow: false } };
  }

  return {
    title: `${project.title.ar} | مشاريع أحمد العطار`,
    description: project.summary.ar,
    alternates: { canonical: `/projects/${project.slug}` },
    openGraph: {
      title: project.title.ar,
      description: project.summary.ar,
      type: "article",
      locale: "ar_SA",
    },
  };
}

export default async function ProjectPage({ params }: PageProps) {
  const { slug } = await params;
  const project = getProject(slug);

  return <ProjectDetailLive slug={slug} initialProject={project ?? null} />;
}

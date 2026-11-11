import type { Metadata } from "next";
import { connection } from "next/server";
import { ProjectDetailLive } from "@/components/sections/projects/ProjectDetail";
import type { Project } from "@/data/projects";
import { getProjectBySlug } from "@/lib/db";

type PageProps = {
  params: Promise<{ slug: string }>;
};

// The route reads the live project from MongoDB at request time. Opting out of
// instant-navigation validation keeps the shell from being prerendered with a
// client-only pathname while the database record is resolved.
export const instant = false;

async function loadProject(slug: string) {
  await connection();
  try {
    const record = await getProjectBySlug(slug);
    if (!record || record.slug.startsWith("__")) return null;
    return record.payload as unknown as Project;
  } catch (error) {
    console.error("[project] failed to load", slug, error);
    return null;
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const project = await loadProject(slug);

  if (!project) {
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
  const project = await loadProject(slug);

  return <ProjectDetailLive slug={slug} initialProject={project} />;
}

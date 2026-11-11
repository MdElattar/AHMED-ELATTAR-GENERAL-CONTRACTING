import type { MetadataRoute } from "next";
import { connection } from "next/server";
import { listProjects } from "@/lib/db";

const baseUrl = "https://alattar.sa";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  await connection();

  const now = new Date();

  const staticRoutes = [
    { path: "", priority: 1 },
    { path: "/projects", priority: 0.9 },
    { path: "/services", priority: 0.9 },
    { path: "/about", priority: 0.8 },
    { path: "/contact", priority: 0.8 },
    { path: "/privacy", priority: 0.3 },
    { path: "/terms", priority: 0.3 },
  ];

  let projectRoutes: MetadataRoute.Sitemap = [];
  try {
    const projects = (await listProjects()).filter(
      (project) => !project.slug.startsWith("__"),
    );
    projectRoutes = projects.map((project) => ({
      url: `${baseUrl}/projects/${project.slug}`,
      lastModified: project.updatedAt,
      changeFrequency: "yearly" as const,
      priority: 0.7,
    }));
  } catch (error) {
    console.error("[sitemap] failed to load projects", error);
  }

  return [
    ...staticRoutes.map((route) => ({
      url: `${baseUrl}${route.path}`,
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: route.priority,
    })),
    ...projectRoutes,
  ];
}

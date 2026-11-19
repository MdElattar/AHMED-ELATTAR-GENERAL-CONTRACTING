import { cacheLife, cacheTag } from "next/cache";
import { getPublicSiteContent, listPublicProjects, type StoredProject } from "@/lib/db";
import { PUBLIC_CONTENT_TAG } from "@/lib/revalidate";

export type PublicProjectFeed = {
  projects: {
    slug: string;
    featured: boolean;
    updatedAt: string;
    [key: string]: unknown;
  }[];
};

export type PublicContentFeed = {
  content: Record<string, unknown> | null;
};

/**
 * Public CMS reads are tagged so an admin save invalidates them immediately.
 * `connection()` stays in the route handler, so the database is never queried
 * during the build; the cached helper reduces repeat traffic to MongoDB.
 */
export async function loadPublicProjects(): Promise<PublicProjectFeed> {
  "use cache";
  cacheLife({ stale: 300, revalidate: 3600, expire: 86400 });
  cacheTag(PUBLIC_CONTENT_TAG);

  const projects = await listPublicProjects();
  return {
    projects: projects.map((project: StoredProject) => {
      const { clientEmails: _owners, ...payload } = project.payload;
      void _owners;
      return {
        slug: project.slug,
        featured: project.featured,
        ...payload,
        updatedAt: project.updatedAt,
      };
    }),
  };
}

export async function loadPublicContent(): Promise<PublicContentFeed> {
  "use cache";
  cacheLife({ stale: 300, revalidate: 3600, expire: 86400 });
  cacheTag(PUBLIC_CONTENT_TAG);

  return { content: await getPublicSiteContent() };
}

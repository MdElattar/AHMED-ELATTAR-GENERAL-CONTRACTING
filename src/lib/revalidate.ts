import { revalidatePath, revalidateTag } from "next/cache";

/** Public CMS/portfolio data shares one cache tag across feeds. */
export const PUBLIC_CONTENT_TAG = "public-content";

/**
 * Invalidate the public surface after an administrator saves content or a
 * project. The layout-level path clears every public route; the explicit paths
 * keep the intent readable and cover the most frequently visited pages.
 */
export function revalidatePublicContent(projectSlug?: string) {
  revalidateTag(PUBLIC_CONTENT_TAG, "max");
  revalidatePath("/", "layout");
  revalidatePath("/");
  revalidatePath("/projects");
  revalidatePath("/services");
  revalidatePath("/about");
  revalidatePath("/consultation");
  revalidatePath("/contact");

  if (projectSlug && !projectSlug.startsWith("__")) {
    revalidatePath(`/projects/${projectSlug}`);
  }
}

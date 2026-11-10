import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/portal", "/admin", "/auth", "/sign-in", "/sign-up", "/forgot-password", "/reset-password"],
    },
    sitemap: "https://alattar.sa/sitemap.xml",
    host: "https://alattar.sa",
  };
}

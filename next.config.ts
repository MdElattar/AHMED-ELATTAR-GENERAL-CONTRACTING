import type { NextConfig } from "next";
import { securityHeaders } from "./src/lib/security/headers";

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  poweredByHeader: false,
  // Keep the viewport clean during development; compile/runtime errors still
  // surface. The badge overlaps the admin sidebar edge toggle.
  devIndicators: false,
  reactStrictMode: true,
  // The workspace lives outside a git repository, so tracing otherwise walks
  // up to the home directory.
  outputFileTracingRoot: process.cwd(),
  images: {
    // Serve modern formats first and cache optimized variants for a month.
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 60 * 60 * 24 * 30,
    dangerouslyAllowSVG: false,
    contentDispositionType: "inline",
    // Photography is delivered through the optimiser. The browser requests
    // `/_next/image` on the same origin, so the strict `img-src 'self'` CSP
    // does not need a remote-image exception. Only known media hosts are
    // allowed as optimizer origins to prevent arbitrary server-side fetches.
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "firebasestorage.googleapis.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "storage.googleapis.com",
        pathname: "/**",
      },
    ],
  },
  experimental: {
    // Lucide is optimized by default; these two barrels are not and would
    // otherwise pull hundreds of unused modules into client chunks.
    optimizePackageImports: ["framer-motion", "@react-three/drei"],
    // Keep prefetched soft navigations pending through brief network drops,
    // then resume automatically. Full offline loads use the service worker.
    useOffline: true,
  },
  turbopack: {
    root: process.cwd(),
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
      {
        source: "/sw.js",
        headers: [
          { key: "Cache-Control", value: "public, max-age=0, must-revalidate" },
          { key: "Service-Worker-Allowed", value: "/" },
        ],
      },
      {
        source: "/icons/:path*",
        headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }],
      },
    ];
  },
};

export default nextConfig;

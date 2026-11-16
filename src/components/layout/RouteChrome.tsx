"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { Footer } from "@/components/layout/Footer";
import { Navbar } from "@/components/layout/Navbar";
import { ScrollProgress } from "@/components/layout/ScrollProgress";
import { SmoothScrollProvider } from "@/components/providers/SmoothScroll";
import { RouteScrollReset } from "@/components/providers/RouteScrollReset";

export function RouteChrome({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isAdmin = pathname === "/admin" || pathname.startsWith("/admin/");

  if (isAdmin) {
    // The admin shell owns its own fixed-height scroll containers. Mounting
    // Lenis here would hijack wheel events and scroll `window`, which cannot
    // move while the shell is `h-dvh overflow-hidden`.
    return <>{children}</>;
  }

  return (
    <SmoothScrollProvider>
      <RouteScrollReset />
      <ScrollProgress />
      <Navbar />
      <main id="main" className="min-h-screen">
        {children}
      </main>
      <Footer />
    </SmoothScrollProvider>
  );
}

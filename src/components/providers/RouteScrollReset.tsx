"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { useSmoothScroll } from "@/components/providers/SmoothScroll";

/**
 * Every route change starts at the very top of the document. This also resets
 * Lenis's internal target so a smooth-scroll animation from the previous page
 * cannot carry over into the new route.
 */
export function RouteScrollReset() {
  const pathname = usePathname();
  const { scrollToTop } = useSmoothScroll();
  const previousPathname = useRef<string | null>(null);

  useEffect(() => {
    if (previousPathname.current === null) {
      previousPathname.current = pathname;
      return;
    }

    if (previousPathname.current === pathname) return;
    previousPathname.current = pathname;

    scrollToTop(true);
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [pathname, scrollToTop]);

  return null;
}

"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { useSmoothScroll } from "@/components/providers/SmoothScroll";
import { acquireScrollLock, releaseScrollLock } from "@/lib/scroll/lock";
import { cn } from "@/lib/utils";

type DrawerProps = {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  labelledBy?: string;
  className?: string;
  closeLabel?: string;
};

/**
 * Right-hand inspection drawer for the live-site gallery.
 *
 * On phones it collapses into a tall bottom sheet; on desktop it is a full
 * height side panel. The scroll lock is shared with the mobile menu and modal,
 * so nested overlays cannot unlock the page behind each other.
 */
export function Drawer({
  open,
  onClose,
  children,
  labelledBy,
  className,
  closeLabel = "Close",
}: DrawerProps) {
  const [mounted, setMounted] = useState(false);
  const closeRef = useRef<HTMLButtonElement | null>(null);
  const onCloseRef = useRef(onClose);
  const { stop, start } = useSmoothScroll();

  useEffect(() => {
    // Portals require the DOM, so mount state is set after hydration.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!open) return;

    acquireScrollLock(stop);
    const timer = window.setTimeout(() => closeRef.current?.focus(), 80);

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onCloseRef.current();
    };
    document.addEventListener("keydown", onKeyDown);

    return () => {
      window.clearTimeout(timer);
      document.removeEventListener("keydown", onKeyDown);
      releaseScrollLock(start);
    };
  }, [open, start, stop]);

  if (!mounted || typeof document === "undefined") return null;

  return createPortal(
    <AnimatePresence>
      {open ? (
        <motion.div
          className="fixed inset-0 z-[105]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
        >
          <motion.button
            type="button"
            aria-label={closeLabel}
            className="absolute inset-0 cursor-default bg-obsidian/85 backdrop-blur-md"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />

          <motion.aside
            role="dialog"
            aria-modal="true"
            aria-labelledby={labelledBy}
            data-lenis-prevent
            initial={{ opacity: 0, x: 64 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 48 }}
            transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
            className={cn(
              "drawer-panel fixed inset-x-0 bottom-0 z-10 max-h-[92svh] overflow-y-auto border-t border-white/10 shadow-[0_-30px_120px_-30px_rgba(0,0,0,0.9)] sm:inset-x-auto sm:inset-y-0 sm:end-0 sm:h-full sm:max-h-none sm:w-full sm:max-w-xl sm:border-s sm:border-t-0",
              className,
            )}
          >
            <button
              ref={closeRef}
              type="button"
              onClick={onClose}
              aria-label={closeLabel}
              className="absolute end-4 top-4 z-20 flex h-11 w-11 items-center justify-center border border-white/15 bg-obsidian/70 text-ivory/70 backdrop-blur transition-colors hover:border-gold/60 hover:text-gold"
            >
              <X className="h-4 w-4" />
            </button>
            {children}
          </motion.aside>
        </motion.div>
      ) : null}
    </AnimatePresence>,
    document.body,
  );
}

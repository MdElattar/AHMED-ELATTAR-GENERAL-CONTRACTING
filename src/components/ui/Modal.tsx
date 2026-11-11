"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { useSmoothScroll } from "@/components/providers/SmoothScroll";
import { acquireScrollLock, releaseScrollLock } from "@/lib/scroll/lock";
import { cn } from "@/lib/utils";

type ModalProps = {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  labelledBy?: string;
  className?: string;
  closeLabel?: string;
};

export function Modal({
  open,
  onClose,
  children,
  labelledBy,
  className,
  closeLabel = "Close",
}: ModalProps) {
  const [mounted, setMounted] = useState(false);
  const closeRef = useRef<HTMLButtonElement | null>(null);
  const onCloseRef = useRef(onClose);
  const { stop, start } = useSmoothScroll();

  useEffect(() => {
    // Portals require the DOM, so mount state is set after hydration.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  // Keep the latest callback without re-running the lock/keydown effect on
  // every parent render (an unstable onClose used to unlock and re-lock the
  // page, which could fight with the mobile menu's own lock).
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
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
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
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby={labelledBy}
            data-lenis-prevent
            initial={{ opacity: 0, y: 28, scale: 0.985 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.99 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className={cn(
              "relative z-10 max-h-[90svh] w-full max-w-5xl overflow-y-auto border border-white/10 bg-coal shadow-[0_40px_120px_-30px_rgba(0,0,0,0.9)]",
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
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>,
    document.body,
  );
}

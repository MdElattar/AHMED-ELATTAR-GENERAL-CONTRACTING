"use client";

import {
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import * as PopoverPrimitive from "@radix-ui/react-popover";
import { AlertTriangle, Check, Loader2, X } from "lucide-react";
import { Toaster } from "sonner";
import { useSmoothScroll } from "@/components/providers/SmoothScroll";
import { acquireScrollLock, releaseScrollLock } from "@/lib/scroll/lock";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/admin";
import { Input } from "@/components/ui/admin/form";

const modalWidths = {
  sm: "md:w-[min(520px,92vw)]",
  md: "md:w-[min(720px,92vw)]",
  lg: "md:w-[min(920px,92vw)]",
  xl: "md:w-[min(1120px,92vw)]",
} as const;

type ModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: ReactNode;
  description?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  closeLabel?: string;
  size?: keyof typeof modalWidths;
  bare?: boolean;
  showClose?: boolean;
  className?: string;
  bodyClassName?: string;
  footerClassName?: string;
};

function useOverlayLock(open: boolean) {
  const { stop, start } = useSmoothScroll();
  useEffect(() => {
    if (!open) return;
    acquireScrollLock(stop);
    return () => releaseScrollLock(start);
  }, [open, start, stop]);
}

function OverlaySurface({
  title,
  description,
  children,
  footer,
  closeLabel = "Close",
  showClose = true,
  bare = false,
  bodyClassName,
  footerClassName,
  onClose,
  kind,
}: Omit<ModalProps, "open" | "onOpenChange" | "size"> & {
  onClose: () => void;
  kind: "modal" | "drawer";
}) {
  return (
    <>
      {kind === "modal" ? (
        <div className="mx-auto mt-2 h-1 w-10 shrink-0 rounded-full bg-white/15 md:hidden" />
      ) : null}
      {!bare ? (
        <div className="flex min-h-[72px] shrink-0 items-center justify-between gap-4 border-b border-white/[.06] px-6 py-4">
          <div className="min-w-0">
            <DialogPrimitive.Title className="truncate text-[20px] font-bold leading-tight text-[var(--admin-text,#F1EEE8)]">
              {title}
            </DialogPrimitive.Title>
            {description ? (
              <DialogPrimitive.Description className="mt-1 line-clamp-2 text-[14px] leading-relaxed text-[var(--admin-muted,#A6A9B4)]">
                {description}
              </DialogPrimitive.Description>
            ) : null}
          </div>
          {showClose ? (
            <button
              type="button"
              onClick={onClose}
              aria-label={closeLabel}
              className="admin-focus-ring inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/[.03] text-white/55 transition-colors hover:bg-white/[.08] hover:text-white"
            >
              <X className="h-4 w-4" strokeWidth={1.8} />
            </button>
          ) : null}
        </div>
      ) : (
        <>
          <DialogPrimitive.Title className="sr-only">{title}</DialogPrimitive.Title>
          {description ? (
            <DialogPrimitive.Description className="sr-only">
              {description}
            </DialogPrimitive.Description>
          ) : null}
        </>
      )}

      <div
        data-lenis-prevent
        className={cn(
          "min-h-0 flex-1 overflow-y-auto overscroll-contain px-6 py-5 [scrollbar-width:thin] [scrollbar-color:rgba(255,255,255,.16)_transparent]",
          bodyClassName,
        )}
      >
        {children}
      </div>

      {footer ? (
        <div
          className={cn(
            "shrink-0 border-t border-white/[.08] bg-[#101218]/85 px-6 py-4 backdrop-blur",
            footerClassName,
          )}
        >
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-end [&>*]:w-full sm:[&>*]:w-auto">
            {footer}
          </div>
        </div>
      ) : null}

    </>
  );
}

export function Modal({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
  closeLabel,
  size = "lg",
  bare,
  showClose,
  className,
  bodyClassName,
  footerClassName,
}: ModalProps) {
  useOverlayLock(open);

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange} modal>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="admin-overlay fixed inset-0 z-[250] bg-black/60 backdrop-blur-sm" />
        <DialogPrimitive.Content
          data-slot="admin-modal"
          className={cn(
            "admin-modal-content fixed inset-x-0 bottom-0 z-[260] flex max-h-[94dvh] flex-col rounded-t-3xl border border-white/[.08] bg-gradient-to-b from-[#161820] to-[#101218] text-[var(--admin-text,#F1EEE8)] shadow-[0_24px_80px_rgba(0,0,0,.6)] outline-none md:inset-x-auto md:bottom-auto md:left-1/2 md:top-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:max-h-[90dvh] md:rounded-3xl",
            modalWidths[size],
            className,
          )}
        >
          <OverlaySurface
            title={title}
            description={description}
            closeLabel={closeLabel}
            showClose={showClose}
            bare={bare}
            className={className}
            bodyClassName={bodyClassName}
            footerClassName={footerClassName}
            footer={footer}
            onClose={() => onOpenChange(false)}
            kind="modal"
          >
            {children}
          </OverlaySurface>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

/*
 * The modal surface owns the footer layout. The exported `footer` prop is
 * forwarded through a closure so consumers can keep the same API for drawers.
 * `OverlaySurface` above renders it inside the content column.
 */

type DrawerProps = Omit<ModalProps, "size"> & {
  side?: "start" | "end";
  widthClassName?: string;
};

export function Drawer({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
  closeLabel,
  side = "end",
  widthClassName = "sm:w-[560px]",
  bare,
  showClose,
  className,
  bodyClassName,
  footerClassName,
}: DrawerProps) {
  useOverlayLock(open);

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange} modal>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="admin-overlay fixed inset-0 z-[250] bg-black/60 backdrop-blur-sm" />
        <DialogPrimitive.Content
          data-slot="admin-drawer"
          data-side={side}
          className={cn(
            "admin-drawer-content fixed inset-y-0 z-[260] flex h-dvh w-full flex-col border-white/[.08] bg-gradient-to-b from-[#161820] to-[#101218] text-[var(--admin-text,#F1EEE8)] shadow-[0_24px_80px_rgba(0,0,0,.6)] outline-none",
            side === "end" ? "end-0 border-s" : "start-0 border-e",
            widthClassName,
            className,
          )}
        >
          <OverlaySurface
            title={title}
            description={description}
            closeLabel={closeLabel}
            showClose={showClose}
            bare={bare}
            className={className}
            bodyClassName={bodyClassName}
            footerClassName={footerClassName}
            footer={footer}
            onClose={() => onOpenChange(false)}
            kind="drawer"
          >
            {children}
          </OverlaySurface>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

/* -------------------------------------------------------------------------- */
/* Confirm dialog                                                             */
/* -------------------------------------------------------------------------- */

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  destructive = false,
  requireText,
  onConfirm,
  busy = false,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: ReactNode;
  description?: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  requireText?: string;
  onConfirm: () => void | Promise<void>;
  busy?: boolean;
}) {
  const [typed, setTyped] = useState("");
  const inputRef = useRef<HTMLInputElement | null>(null);

  const matches = !requireText || typed.trim() === requireText.trim();
  const handleOpenChange = (next: boolean) => {
    if (!next) setTyped("");
    onOpenChange(next);
  };

  return (
    <Modal
      open={open}
      onOpenChange={handleOpenChange}
      title={title}
      description={description}
      size="sm"
      footer={
        <>
          <Button
            variant="ghost"
            onClick={() => handleOpenChange(false)}
            disabled={busy}
          >
            {cancelLabel}
          </Button>
          <Button
            variant={destructive ? "secondary" : "primary"}
            onClick={() => void onConfirm()}
            disabled={busy || !matches}
            className={cn(
              destructive &&
                "border-red-400/20 bg-red-500/10 text-red-200 hover:border-red-400/30 hover:bg-red-500/15",
            )}
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : destructive ? <AlertTriangle className="h-4 w-4" /> : <Check className="h-4 w-4" />}
            {confirmLabel}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        {description ? (
          <div className="flex items-start gap-3 rounded-xl border border-white/10 bg-white/[.03] p-3.5">
            <span
              className={cn(
                "mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
                destructive ? "bg-red-500/12 text-red-300" : "bg-[#E2B04A]/12 text-[#F3C86A]",
              )}
            >
              {destructive ? <AlertTriangle className="h-4 w-4" /> : <Check className="h-4 w-4" />}
            </span>
            <div className="text-[14px] leading-relaxed text-[var(--admin-muted,#A6A9B4)]">
              {description}
            </div>
          </div>
        ) : null}
        {requireText ? (
          <div className="space-y-2">
            <p className="text-[13px] leading-relaxed text-[var(--admin-muted,#A6A9B4)]">
              Type <strong className="font-semibold text-[var(--admin-text,#F1EEE8)]">{requireText}</strong> to confirm.
            </p>
            <Input
              ref={inputRef}
              value={typed}
              onChange={(event) => setTyped(event.target.value)}
              autoFocus
              aria-label={`Type ${requireText} to confirm`}
              placeholder={requireText}
            />
          </div>
        ) : null}
      </div>
    </Modal>
  );
}

/* -------------------------------------------------------------------------- */
/* Popover                                                                    */
/* -------------------------------------------------------------------------- */

export function Popover({
  trigger,
  children,
  align = "end",
  side = "bottom",
  className,
  open,
  onOpenChange,
}: {
  trigger: ReactNode;
  children: ReactNode;
  align?: "start" | "center" | "end";
  side?: "top" | "right" | "bottom" | "left";
  className?: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  return (
    <PopoverPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <PopoverPrimitive.Trigger asChild>{trigger}</PopoverPrimitive.Trigger>
      <PopoverPrimitive.Portal>
        <PopoverPrimitive.Content
          align={align}
          side={side}
          sideOffset={8}
          className={cn(
            "z-[280] min-w-[180px] rounded-xl border border-white/10 bg-[#161820] p-1.5 text-[var(--admin-text,#F1EEE8)] shadow-[0_18px_60px_rgba(0,0,0,.55)] outline-none",
            className,
          )}
        >
          {children}
        </PopoverPrimitive.Content>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  );
}

export function AdminToaster() {
  return (
    <Toaster
      theme="dark"
      position="top-right"
      closeButton
      toastOptions={{
        style: {
          background: "#161820",
          border: "1px solid rgba(255,255,255,.08)",
          color: "#F1EEE8",
          borderRadius: "16px",
          boxShadow: "0 24px 80px rgba(0,0,0,.6)",
        },
      }}
    />
  );
}

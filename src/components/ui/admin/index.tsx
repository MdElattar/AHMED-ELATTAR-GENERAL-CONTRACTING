"use client";

import Image from "next/image";
import { forwardRef, type ButtonHTMLAttributes, type HTMLAttributes, type ReactNode, type TdHTMLAttributes, type ThHTMLAttributes } from "react";
import { cn } from "@/lib/utils";
import { ProjectArt } from "@/components/ui/ProjectArt";
import type { ArtVariant } from "@/data/projects";

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-[22px] border border-[var(--admin-card-border)] [background:var(--admin-card)] text-[var(--admin-text,#F1EEE8)]",
        className,
      )}
      {...props}
    />
  );
}

export function KpiCard({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "flex flex-col gap-2 rounded-[20px] border border-[var(--admin-card-border)] [background:var(--admin-card)] p-5 text-[var(--admin-text,#F1EEE8)] transition-all duration-[160ms] hover:-translate-y-0.5 hover:border-[rgba(226,176,74,0.25)]",
        className,
      )}
      {...props}
    />
  );
}

export function PageHeader({
  title,
  description,
  actions,
  className,
}: {
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col justify-between gap-3 sm:flex-row sm:items-end", className)}>
      <div className="min-w-0">
        <h2 className="m-0 text-[28px] font-bold leading-tight text-[var(--admin-text,#F1EEE8)] [font-family:var(--font-inter),var(--font-arabic),system-ui,sans-serif]">
          {title}
        </h2>
        {description ? <p className="mt-1 text-[14px] leading-relaxed text-[var(--admin-muted,#A6A9B4)]">{description}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  );
}

type ButtonVariant = "primary" | "secondary" | "ghost";

export const Button = forwardRef<HTMLButtonElement, ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant; size?: "sm" | "md" }>(
  function Button({ className, variant = "secondary", size = "md", type = "button", ...props }, ref) {
    const base = "admin-focus-ring inline-flex items-center justify-center gap-2 rounded-[12px] font-bold transition-all duration-[160ms] disabled:cursor-not-allowed disabled:opacity-50";
    const sizes = size === "sm" ? "min-h-[40px] px-3.5 text-[14px]" : "min-h-[44px] px-5 text-[15px]";
    const variants: Record<ButtonVariant, string> = {
      primary:
        "border border-transparent bg-[linear-gradient(180deg,#F3C86A,#D9A03A)] text-[#1a1205] shadow-[0_8px_24px_rgba(226,176,74,0.28)] hover:-translate-y-0.5",
      secondary:
        "border border-[var(--admin-card-border)] bg-[var(--admin-pill-surface)] text-[var(--admin-text,#F1EEE8)] hover:-translate-y-0.5 hover:border-[rgba(226,176,74,0.25)] hover:bg-[var(--admin-pill-surface)]",
      ghost:
        "border border-transparent bg-transparent text-[var(--admin-text,#C9CAD1)] hover:bg-[var(--admin-pill-surface)] hover:text-[var(--admin-text,#F1EEE8)]",
    };
    return <button ref={ref} type={type} className={cn(base, sizes, variants[variant], className)} {...props} />;
  },
);

export function Chip({
  active,
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { active?: boolean }) {
  return (
    <button
      type="button"
      className={cn(
        "admin-focus-ring min-h-[40px] rounded-[999px] border px-3.5 py-1.5 text-[14px] font-medium transition-colors",
        active
          ? "border-[rgba(226,176,74,0.3)] bg-[rgba(226,176,74,0.14)] text-[#F3C86A]"
          : "border-[var(--admin-card-border)] bg-transparent text-[var(--admin-muted,#A6A9B4)] hover:border-[rgba(226,176,74,0.25)] hover:text-[var(--admin-text,#F1EEE8)]",
        className,
      )}
      {...props}
    />
  );
}

export function StatusPill({
  tone = "neutral",
  className,
  ...props
}: HTMLAttributes<HTMLSpanElement> & { tone?: "success" | "warning" | "danger" | "info" | "neutral" | "gold" }) {
  const tones: Record<string, string> = {
    success: "bg-[rgba(76,203,150,0.14)] text-[#7BE0B4]",
    warning: "bg-[rgba(226,176,74,0.14)] text-[#F3C86A]",
    danger: "bg-[rgba(255,107,94,0.14)] text-[#FF9A8F]",
    info: "bg-[rgba(107,182,255,0.14)] text-[#8CC7FF]",
    neutral: "bg-[var(--admin-pill-surface)] text-[var(--admin-muted,#A6A9B4)]",
    gold: "bg-[rgba(226,176,74,0.14)] text-[#F3C86A]",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center whitespace-nowrap rounded-[999px] px-3 py-[5px] text-[13px] font-medium",
        tones[tone],
        className,
      )}
      {...props}
    />
  );
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: {
  icon?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col items-center justify-center gap-3 rounded-[20px] border border-dashed border-[var(--admin-card-border)] bg-[var(--admin-pill-surface)] px-6 py-12 text-center", className)}>
      {icon ? <div className="flex h-12 w-12 items-center justify-center rounded-full border border-[var(--admin-card-border)] bg-[var(--admin-pill-surface)] text-[var(--admin-muted,#A6A9B4)]">{icon}</div> : null}
      <div>
        <p className="text-[15px] font-medium text-[var(--admin-text,#F1EEE8)]">{title}</p>
        {description ? <p className="mt-1 text-[14px] text-[var(--admin-muted,#A6A9B4)]">{description}</p> : null}
      </div>
      {action ? <div className="mt-1 flex flex-wrap items-center justify-center gap-2">{action}</div> : null}
    </div>
  );
}

export function DataTable({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <Card className={cn("overflow-hidden p-0", className)}>
      <div className="overflow-x-auto md:overflow-visible">{children}</div>
    </Card>
  );
}

export function Table({ className, ...props }: HTMLAttributes<HTMLTableElement>) {
  return <table className={cn("w-full min-w-[720px] border-collapse", className)} {...props} />;
}

export function THead({ className, ...props }: HTMLAttributes<HTMLTableSectionElement>) {
  return <thead className={cn("sticky top-0 z-10 bg-[var(--admin-bg,#14161d)]/95 backdrop-blur", className)} {...props} />;
}

export function TH({ className, ...props }: ThHTMLAttributes<HTMLTableCellElement>) {
  return <th className={cn("h-14 border-b border-[var(--admin-card-border)] px-4 text-start text-[13px] font-semibold text-[var(--admin-muted,#A6A9B4)]", className)} {...props} />;
}

export function TR({ className, ...props }: HTMLAttributes<HTMLTableRowElement>) {
  return <tr className={cn("h-16 border-b border-[var(--admin-card-border)] transition-colors hover:bg-[var(--admin-pill-surface)] last:border-0", className)} {...props} />;
}

export function TD({ className, ...props }: TdHTMLAttributes<HTMLTableCellElement>) {
  return <td className={cn("px-4 py-2 align-middle text-[14px] text-[var(--admin-text,#E5E3DE)]", className)} {...props} />;
}

export function AdminInput({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "admin-focus-ring h-11 w-full rounded-[12px] border border-[var(--admin-card-border)] bg-[var(--admin-pill-surface)] px-3.5 text-[14px] text-[var(--admin-text,#F1EEE8)] outline-none placeholder:text-[var(--admin-muted,#A6A9B4)] transition-colors focus:border-[rgba(226,176,74,0.4)]",
        className,
      )}
      {...props}
    />
  );
}

export function AdminSelect({ className, ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn(
        "admin-focus-ring h-11 rounded-[12px] border border-[var(--admin-card-border)] bg-[var(--admin-bg,#14161d)] px-3.5 text-[14px] text-[var(--admin-text,#F1EEE8)] outline-none transition-colors focus:border-[rgba(226,176,74,0.4)]",
        className,
      )}
      {...props}
    />
  );
}

export function AdminTextarea({ className, ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(
        "admin-focus-ring w-full rounded-[12px] border border-[var(--admin-card-border)] bg-[var(--admin-pill-surface)] px-3.5 py-3 text-[14px] text-[var(--admin-text,#F1EEE8)] outline-none placeholder:text-[var(--admin-muted,#A6A9B4)] transition-colors focus:border-[rgba(226,176,74,0.4)]",
        className,
      )}
      {...props}
    />
  );
}

export function ProjectPhoto({
  src,
  alt,
  art,
  className,
}: {
  src?: string;
  alt: string;
  art?: ArtVariant;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "relative block h-12 w-16 overflow-hidden rounded-[12px] border border-[var(--admin-card-border)] bg-[var(--admin-track,#232632)]",
        className,
      )}
    >
      {src ? (
        <Image src={src} alt={alt} fill sizes="72px" className="object-cover" />
      ) : art ? (
        <ProjectArt variant={art} className="h-full w-full" />
      ) : (
        <span className="flex h-full w-full items-center justify-center text-[12px] text-[var(--admin-muted,#A6A9B4)]">—</span>
      )}
    </span>
  );
}

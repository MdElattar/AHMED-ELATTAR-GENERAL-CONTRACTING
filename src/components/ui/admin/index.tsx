"use client";

import { forwardRef, type ButtonHTMLAttributes, type HTMLAttributes, type ReactNode, type TdHTMLAttributes, type ThHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-[22px] border border-line bg-surface text-fg",
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
        "flex flex-col gap-2 rounded-[20px] border border-line bg-surface p-5 text-fg transition-all duration-[160ms] hover:-translate-y-0.5 hover:border-[rgb(var(--accent-rgb)/0.25)]",
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
        <h2 className="m-0 text-[28px] font-bold leading-tight text-fg [font-family:var(--font-inter),var(--font-arabic),system-ui,sans-serif]">
          {title}
        </h2>
        {description ? <p className="mt-1 text-[14px] leading-relaxed text-muted">{description}</p> : null}
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
        "border border-transparent bg-accent-fill text-accent-fg shadow-e1 hover:-translate-y-0.5",
      secondary:
        "border border-line bg-surface-2 text-fg hover:-translate-y-0.5 hover:border-[rgb(var(--accent-rgb)/0.25)] hover:bg-surface-2",
      ghost:
        "border border-transparent bg-transparent text-fg hover:bg-surface-2 hover:text-fg",
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
          ? "border-[rgb(var(--accent-rgb)/0.3)] bg-[rgb(var(--accent-rgb)/0.14)] text-accent"
          : "border-line bg-transparent text-muted hover:border-[rgb(var(--accent-rgb)/0.25)] hover:text-fg",
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
    success: "bg-[rgb(var(--success-rgb)/0.14)] text-success",
    warning: "bg-[rgb(var(--warning-rgb)/0.14)] text-warning",
    danger: "bg-[rgb(var(--danger-rgb)/0.14)] text-danger",
    info: "bg-[rgb(var(--info-rgb)/0.14)] text-info",
    neutral: "bg-surface-2 text-muted",
    gold: "bg-[rgb(var(--accent-rgb)/0.14)] text-accent",
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
    <div className={cn("flex flex-col items-center justify-center gap-3 rounded-[20px] border border-dashed border-line bg-surface-2 px-6 py-12 text-center", className)}>
      {icon ? <div className="flex h-12 w-12 items-center justify-center rounded-full border border-line bg-surface-2 text-muted">{icon}</div> : null}
      <div>
        <p className="text-[15px] font-medium text-fg">{title}</p>
        {description ? <p className="mt-1 text-[14px] text-muted">{description}</p> : null}
      </div>
      {action ? <div className="mt-1 flex flex-wrap items-center justify-center gap-2">{action}</div> : null}
    </div>
  );
}

export function DataTable({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <Card className={cn("overflow-hidden p-0", className)}>
      <div className="scroll-area overflow-x-auto md:overflow-visible">{children}</div>
    </Card>
  );
}

export function Table({ className, ...props }: HTMLAttributes<HTMLTableElement>) {
  return <table className={cn("w-full min-w-[720px] border-collapse", className)} {...props} />;
}

export function THead({ className, ...props }: HTMLAttributes<HTMLTableSectionElement>) {
  return <thead className={cn("sticky top-0 z-10 bg-bg backdrop-blur", className)} {...props} />;
}

export function TH({ className, ...props }: ThHTMLAttributes<HTMLTableCellElement>) {
  return <th className={cn("h-14 border-b border-line px-4 text-start text-[13px] font-semibold text-muted", className)} {...props} />;
}

export function TR({ className, ...props }: HTMLAttributes<HTMLTableRowElement>) {
  return <tr className={cn("h-16 border-b border-line transition-colors hover:bg-surface-2 last:border-0", className)} {...props} />;
}

export function TD({ className, ...props }: TdHTMLAttributes<HTMLTableCellElement>) {
  return <td className={cn("px-4 py-2 align-middle text-[14px] text-fg", className)} {...props} />;
}

export function AdminInput({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "admin-focus-ring h-11 w-full rounded-[12px] border border-line bg-surface-2 px-3.5 text-[14px] text-fg outline-none placeholder:text-muted transition-colors focus:border-[rgb(var(--accent-rgb)/0.4)]",
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
        "admin-focus-ring h-11 rounded-[12px] border border-line bg-bg px-3.5 text-[14px] text-fg outline-none transition-colors focus:border-[rgb(var(--accent-rgb)/0.4)]",
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
        "admin-focus-ring w-full rounded-[12px] border border-line bg-surface-2 px-3.5 py-3 text-[14px] text-fg outline-none placeholder:text-muted transition-colors focus:border-[rgb(var(--accent-rgb)/0.4)]",
        className,
      )}
      {...props}
    />
  );
}

export * from "./form";



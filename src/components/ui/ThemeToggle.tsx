"use client";

import { Monitor, Moon, Sun } from "lucide-react";
import { useTheme, type Theme } from "@/components/providers/ThemeProvider";
import { cn } from "@/lib/utils";

type ThemeLabels = Partial<Record<Theme | "cycle" | "toggle" | "label", string>>;

type ThemeToggleProps = {
  /** All UI strings are caller-supplied; the fallbacks are English only. */
  labels?: ThemeLabels;
  className?: string;
  /** Presentational hint for callers; the control stays a 44px button. */
  variant?: "icon" | "menu";
};

const FALLBACK_LABELS = {
  system: "System",
  light: "Light",
  dark: "Dark",
  cycle: "Switch theme",
} as const;

/**
 * Compact 44px theme control. Cycle order is system → light → dark → system.
 * Drop it in the admin topbar or the public navigation without adding copies.
 */
export function ThemeToggle({ labels, className, variant = "icon" }: ThemeToggleProps) {
  const { theme, cycleTheme } = useTheme();
  const cycleLabel = labels?.cycle ?? labels?.toggle ?? labels?.label ?? FALLBACK_LABELS.cycle;
  const themeLabel = labels?.[theme] ?? FALLBACK_LABELS[theme];

  return (
    <button
      type="button"
      onClick={cycleTheme}
      aria-label={cycleLabel}
      title={themeLabel}
      data-theme-preference={theme}
      data-variant={variant}
      className={cn(
        "inline-flex h-11 w-11 min-h-11 min-w-11 shrink-0 items-center justify-center rounded-full border border-line bg-surface text-fg transition-colors hover:bg-surface-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
        className,
      )}
    >
      {theme === "system" ? (
        <Monitor aria-hidden="true" className="h-4 w-4" />
      ) : theme === "light" ? (
        <Sun aria-hidden="true" className="h-4 w-4" />
      ) : (
        <Moon aria-hidden="true" className="h-4 w-4" />
      )}
    </button>
  );
}

export default ThemeToggle;

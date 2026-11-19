"use client";

import { MoonStar, Sparkles, Sun } from "lucide-react";
import {
  useAtmosphere,
  VIBES,
  type Vibe,
} from "@/components/providers/AtmosphereProvider";
import { useI18n } from "@/components/providers/I18nProvider";
import { cn } from "@/lib/utils";

const labels: Record<
  Vibe,
  { ar: string; en: string; short: { ar: string; en: string } }
> = {
  golden: {
    ar: "الساعة الذهبية",
    en: "Golden hour",
    short: { ar: "ذهبي", en: "GOLD" },
  },
  blue: {
    ar: "الساعة الزرقاء",
    en: "Blue hour",
    short: { ar: "أزرق", en: "BLUE" },
  },
  studio: {
    ar: "استوديو",
    en: "Studio",
    short: { ar: "استوديو", en: "STUDIO" },
  },
};

const icons: Record<Vibe, typeof Sun> = {
  golden: Sun,
  blue: MoonStar,
  studio: Sparkles,
};

type LightingToggleProps = {
  tone?: "dark" | "light";
  compact?: boolean;
  className?: string;
};

/**
 * Cycles the global architectural-lighting grade. The active grade is stored
 * in localStorage and applied as `data-vibe` on <html>, so every glass panel,
 * photo grade, glow layer, and card spotlight updates from one switch.
 */
export function LightingToggle({
  tone = "dark",
  compact = false,
  className,
}: LightingToggleProps) {
  const { vibe, cycleVibe } = useAtmosphere();
  const { locale } = useI18n();
  const Icon = icons[vibe];
  const current = labels[vibe];
  const nextVibe = VIBES[(VIBES.indexOf(vibe) + 1) % VIBES.length];
  const next = labels[nextVibe];

  const ariaLabel =
    locale === "ar"
      ? `الإضاءة: ${current.ar}. اضغط للتبديل إلى ${next.ar}`
      : `Lighting: ${current.en}. Switch to ${next.en}`;

  return (
    <button
      type="button"
      onClick={cycleVibe}
      aria-label={ariaLabel}
      title={ariaLabel}
      data-vibe={vibe}
      className={cn(
        "group relative flex h-10 items-center gap-2 border px-3 text-[0.6rem] font-medium uppercase tracking-[0.14em] transition-colors duration-300",
        tone === "light"
          ? "border-ink/15 text-ink/55 hover:border-gold-dark/60 hover:text-gold-dark"
          : "border-white/15 text-ivory/65 hover:border-gold/50 hover:text-gold",
        compact && "w-10 justify-center px-0",
        className,
      )}
    >
      <Icon className="h-3.5 w-3.5 shrink-0 text-gold" aria-hidden="true" />
      {!compact ? <span>{current.short[locale]}</span> : null}
      <span className="absolute inset-x-2 -bottom-px h-px scale-x-0 bg-gold transition-transform duration-500 group-hover:scale-x-100" />
    </button>
  );
}

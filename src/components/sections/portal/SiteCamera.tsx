"use client";

import { useEffect, useState } from "react";
import { Camera, Radio, Signal } from "lucide-react";
import { ProjectArt } from "@/components/ui/ProjectArt";
import type { ArtVariant } from "@/data/projects";
import { useI18n } from "@/components/providers/I18nProvider";
import { cn } from "@/lib/utils";

const copy = {
  ar: {
    live: "بث مباشر",
    camera: "كاميرا الموقع",
    cam: "كاميرا",
    updated: "آخر تحديث",
    signal: "إشارة قوية",
    progress: "تقدم الموقع",
  },
  en: {
    live: "Live",
    camera: "Site camera",
    cam: "Cam",
    updated: "Last update",
    signal: "Strong signal",
    progress: "Site progress",
  },
};

export function SiteCamera({
  title,
  location,
  progress,
  art,
}: {
  title: string;
  location: string;
  progress: number;
  art: ArtVariant;
}) {
  const { locale } = useI18n();
  const c = copy[locale];
  const [cam, setCam] = useState(0);
  const [now, setNow] = useState<string>("");

  useEffect(() => {
    const tick = () => {
      setNow(
        new Intl.DateTimeFormat(locale === "ar" ? "ar-SA" : "en-GB", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        }).format(new Date()),
      );
    };
    tick();
    const timer = window.setInterval(tick, 1000);
    return () => window.clearInterval(timer);
  }, [locale]);

  const cams = [
    { label: `${c.cam} 01`, art },
    { label: `${c.cam} 02`, art: "industrial" as ArtVariant },
    { label: `${c.cam} 03`, art: "interchange" as ArtVariant },
  ];

  return (
    <div className="overflow-hidden border border-ink/10 bg-obsidian text-ivory">
      <div className="flex items-center justify-between gap-3 border-b border-white/10 px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-60" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500" />
          </span>
          <span className="text-[0.52rem] font-semibold uppercase tracking-[0.16em] text-red-300">
            {c.live}
          </span>
          <span className="text-[0.5rem] uppercase tracking-[0.14em] text-ivory/30">
            {c.camera}
          </span>
        </div>
        <div className="flex items-center gap-2 text-[0.5rem] uppercase tracking-[0.14em] text-ivory/35">
          <Signal className="h-3 w-3 text-emerald-400/80" />
          {c.signal}
          <span className="tabular text-ivory/60">{now}</span>
        </div>
      </div>

      <div className="relative aspect-[16/10] overflow-hidden">
        <ProjectArt variant={cams[cam].art} className="h-full w-full" />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-obsidian/80 via-transparent to-obsidian/25" />
        <div className="pointer-events-none absolute inset-0 opacity-30 [background-image:linear-gradient(rgba(255,255,255,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.08)_1px,transparent_1px)] [background-size:56px_56px]" />
        <div className="site-scan pointer-events-none absolute inset-x-0 h-16 bg-gradient-to-b from-transparent via-gold/12 to-transparent" />

        <div className="absolute inset-x-4 top-4 flex items-start justify-between gap-3">
          <span className="border border-white/20 bg-obsidian/55 px-2.5 py-1 text-[0.5rem] uppercase tracking-[0.14em] text-ivory/70 backdrop-blur">
            {cams[cam].label}
          </span>
          <span className="border border-gold/30 bg-obsidian/55 px-2.5 py-1 text-[0.5rem] uppercase tracking-[0.14em] text-gold backdrop-blur">
            {progress}% {c.progress}
          </span>
        </div>

        <div className="absolute inset-x-4 bottom-4">
          <p className="truncate text-sm font-medium text-ivory">{title}</p>
          <p className="mt-0.5 truncate text-[0.58rem] text-ivory/45">{location}</p>
          <div className="mt-3 h-1 overflow-hidden bg-white/15">
            <div
              className="h-full bg-gradient-to-r from-gold-dark to-gold"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <div className="absolute inset-0 flex items-center justify-center">
          <span className="flex h-10 w-10 items-center justify-center rounded-full border border-white/25 bg-obsidian/35 text-ivory/70 backdrop-blur">
            <Camera className="h-4 w-4" />
          </span>
        </div>
      </div>

      <div className="flex items-center justify-between gap-2 border-t border-white/10 px-3 py-2">
        <div className="flex items-center gap-1.5">
          {cams.map((item, index) => (
            <button
              key={item.label}
              type="button"
              onClick={() => setCam(index)}
              className={cn(
                "h-7 border px-2.5 text-[0.5rem] uppercase tracking-[0.12em] transition-colors",
                cam === index
                  ? "border-gold bg-gold text-obsidian"
                  : "border-white/12 text-ivory/45 hover:border-gold/40 hover:text-gold",
              )}
            >
              {item.label}
            </button>
          ))}
        </div>
        <span className="flex items-center gap-1.5 text-[0.5rem] uppercase tracking-[0.12em] text-ivory/25">
          <Radio className="h-3 w-3 text-gold/70" />
          {c.updated} {now}
        </span>
      </div>
    </div>
  );
}

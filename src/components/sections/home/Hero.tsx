"use client";

import Link from "next/link";
import { ArrowDown, ArrowUpRight, MoveDown } from "lucide-react";
import { useI18n } from "@/components/providers/I18nProvider";
import { useSmoothScroll } from "@/components/providers/SmoothScroll";
import { useWorkspace } from "@/components/providers/WorkspaceProvider";
import { PhotoLayer } from "@/components/media/PhotoLayer";
import { heroPhoto } from "@/data/media";
import { resolveMedia } from "@/lib/cms";
import { cn } from "@/lib/utils";

export function Hero() {
  const { t, isRTL, locale } = useI18n();
  const { content } = useWorkspace();
  const { scrollTo } = useSmoothScroll();
  const heroImage = resolveMedia(content.mediaOverrides, "hero", heroPhoto, locale);

  return (
    <section className="relative min-h-[100svh] overflow-hidden bg-obsidian">
      <PhotoLayer
        images={[heroImage]}
        preloadFirst
        overlay="none"
        sizes="100vw"
        className="kenburns z-0"
        imageClassName="brightness-[0.82]"
      />

      <div className="hero-aurora pointer-events-none absolute inset-0 z-[2] opacity-80" aria-hidden="true" />
      <div className="atmo-glow pointer-events-none absolute inset-0 z-[2] opacity-60" aria-hidden="true" />
      <div className="pointer-events-none absolute inset-0 z-[2] bg-gradient-to-b from-obsidian/78 via-obsidian/18 to-obsidian" />
      <div className="pointer-events-none absolute inset-0 z-[2] bg-[radial-gradient(ellipse_at_18%_42%,rgba(6,7,8,0.82),transparent_62%)]" />
      <div className="pointer-events-none absolute inset-0 z-[2] bg-[radial-gradient(ellipse_at_78%_28%,rgba(212,175,55,0.14),transparent_55%)]" />

      <div className="relative z-10 flex min-h-[100svh] flex-col">
        <div className="container-lux flex flex-1 flex-col justify-center pb-36 pt-32 sm:pb-40 sm:pt-36">
          <div className="max-w-3xl">
            <div className="hero-fade flex items-center gap-4" style={{ animationDelay: "120ms" }}>
              <span className="h-px w-10 bg-gold/70" />
              <span className="text-[0.6rem] font-medium uppercase tracking-[0.24em] text-gold sm:text-[0.68rem]">
                {t.hero.eyebrow}
              </span>
            </div>

            <h1 className="display-title text-shadow-lux mt-7 text-[clamp(3.4rem,10vw,8.4rem)] text-ivory">
              <span className="hero-line">
                <span style={{ animationDelay: "180ms" }}>{t.hero.titleTop}</span>
              </span>
              <span className="hero-line">
                <span style={{ animationDelay: "300ms" }} className="gold-text italic">
                  {t.hero.titleAccent}
                </span>
              </span>
            </h1>

            <p
              className="hero-fade text-shadow-lux mt-7 max-w-lg text-[0.95rem] leading-[1.95] text-ivory/70 sm:text-base"
              style={{ animationDelay: "460ms" }}
            >
              {t.hero.description}
            </p>

            <div
              className="hero-fade mt-9 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center"
              style={{ animationDelay: "580ms" }}
            >
              <Link
                href="/projects"
                className="btn-shine group inline-flex h-13 items-center justify-center gap-3 bg-gold px-7 text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-obsidian transition-colors duration-500 hover:bg-gold-light"
              >
                {t.hero.primary}
                <ArrowUpRight
                  className={cn(
                    "h-4 w-4 transition-transform duration-500 group-hover:-translate-y-0.5 group-hover:translate-x-0.5",
                    isRTL && "-scale-x-100",
                  )}
                />
              </Link>
              <Link
                href="/contact"
                className="group inline-flex h-13 items-center justify-center gap-3 border border-white/20 px-7 text-[0.7rem] font-medium uppercase tracking-[0.16em] text-ivory/80 transition-all duration-500 hover:border-gold/60 hover:text-gold"
              >
                {t.hero.secondary}
                <span className="flex h-5 w-5 items-center justify-center rounded-full border border-current">
                  <ArrowUpRight className="h-2.5 w-2.5" />
                </span>
              </Link>

              <button
                type="button"
                onClick={() => scrollTo("#live-sites", -84)}
                className="group inline-flex h-13 items-center gap-2.5 px-1 text-[0.62rem] font-medium uppercase tracking-[0.16em] text-ivory/65 transition-colors hover:text-gold"
              >
                <span className="relative flex h-1.5 w-1.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-gold/60" />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-gold" />
                </span>
                {t.sections.inline.heroLiveSites}
                <ArrowUpRight
                  className={cn(
                    "h-3.5 w-3.5 transition-transform duration-500 group-hover:-translate-y-0.5 group-hover:translate-x-0.5",
                    isRTL && "-scale-x-100",
                  )}
                />
              </button>
            </div>
          </div>
        </div>

        <div className="container-lux relative z-10">
          <div className="flex flex-col gap-6 border-t border-white/[0.1] py-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="grid grid-cols-3 gap-6 sm:gap-10">
              {t.hero.stats.map((stat, index) => (
                <div
                  key={stat.label}
                  className={cn(
                    "flex flex-col gap-1",
                    index !== 0 && "border-s border-white/[0.1] ps-6 sm:ps-10",
                  )}
                >
                  <span className="tabular text-xl font-light text-ivory sm:text-2xl">
                    {stat.value}
                  </span>
                  <span className="text-[0.58rem] uppercase leading-relaxed tracking-[0.14em] text-ivory/45 sm:text-[0.62rem]">
                    {stat.label}
                  </span>
                </div>
              ))}
            </div>

            <div className="flex items-center gap-4 sm:gap-6">
              <div className="flex items-center gap-3 text-[0.6rem] uppercase tracking-[0.2em] text-ivory/45">
                <span>{t.hero.scroll}</span>
                <span className="relative flex h-9 w-5 items-start justify-center rounded-full border border-white/20 p-1">
                  <span className="scroll-dot h-1.5 w-1.5 rounded-full bg-gold" />
                </span>
              </div>
              <div className="hidden items-center gap-2 text-[0.58rem] uppercase tracking-[0.18em] text-ivory/35 md:flex">
                <MoveDown className="h-3 w-3" />
                24.7136° N · 46.6753° E
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="pointer-events-none absolute end-5 top-1/2 z-10 hidden -translate-y-1/2 items-center gap-3 xl:flex">
        <span className="vertical-text text-[0.55rem] uppercase tracking-[0.28em] text-ivory/35">
          {t.hero.vertical}
        </span>
        <span className="h-16 w-px bg-gradient-to-b from-gold/60 to-transparent" />
      </div>

      <div className="pointer-events-none absolute start-5 top-1/2 z-10 hidden -translate-y-1/2 xl:flex">
        <span className="vertical-text text-[0.55rem] uppercase tracking-[0.3em] text-ivory/30">
          EST. 1987 — RIYADH
        </span>
      </div>

      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-[2] h-24 bg-gradient-to-t from-obsidian to-transparent" />
      <ArrowDown className="pointer-events-none absolute bottom-5 start-1/2 z-10 hidden h-4 w-4 -translate-x-1/2 text-gold/40 sm:block" />
    </section>
  );
}

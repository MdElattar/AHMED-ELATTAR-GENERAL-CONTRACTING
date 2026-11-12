"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Activity,
  ArrowUpRight,
  Check,
  CircleDot,
  MapPin,
  Radio,
  Ruler,
  Timer,
  Users,
  Workflow,
} from "lucide-react";
import { useI18n } from "@/components/providers/I18nProvider";
import { useWorkspace } from "@/components/providers/WorkspaceProvider";
import { Drawer } from "@/components/ui/Drawer";
import { Reveal } from "@/components/ui/Reveal";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { SpotlightCard } from "@/components/ui/SpotlightCard";
import { getLiveSite, liveSites, type LiveSite } from "@/data/liveSites";
import { resolveMedia } from "@/lib/cms";
import { cn } from "@/lib/utils";

function formatTime(value: number, locale: "ar" | "en") {
  try {
    return new Intl.DateTimeFormat(locale === "ar" ? "ar-SA" : "en-GB", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    }).format(new Date(value));
  } catch {
    return new Date(value).toISOString().slice(11, 19);
  }
}

function LiveSiteDetail({ site }: { site: LiveSite }) {
  const { t, locale, l, isRTL } = useI18n();
  const { content } = useWorkspace();
  const c = t.sections.liveSites;
  const sitePhoto = resolveMedia(
    content.mediaOverrides,
    `liveSite.${site.id}`,
    site.photo,
    locale,
  );

  // The drawer simulates a live telemetry feed: a timestamp that advances
  // every few seconds and an "N seconds ago" counter between refreshes. Both
  // values live in state and are computed inside the interval (never during
  // render), so the component stays idempotent.
  const [sync, setSync] = useState(() => ({ at: Date.now(), secondsAgo: 0 }));

  useEffect(() => {
    const started = Date.now();
    const id = window.setInterval(() => {
      const elapsed = Math.floor((Date.now() - started) / 1000);
      setSync({
        at: started + Math.floor(elapsed / 5) * 5000,
        secondsAgo: elapsed % 5,
      });
    }, 1000);
    return () => window.clearInterval(id);
  }, []);

  const syncLabel =
    sync.secondsAgo < 3
      ? c.justNow
      : c.secondsAgo.replace("{n}", String(sync.secondsAgo));
  const activeMilestone = site.milestones.findIndex((milestone) => !milestone.done);

  return (
    <div className="pb-8">
      <div className="relative h-64 overflow-hidden sm:h-72">
        <Image
          src={sitePhoto.src}
          alt={sitePhoto.alt}
          fill
          sizes="(max-width: 640px) 100vw, 576px"
          className="object-cover photo-grade"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0b0c0f] via-obsidian/35 to-obsidian/20" />
        <div className="absolute inset-x-6 bottom-6">
          <div className="flex items-center gap-3">
            <span className="live-pill">{c.live}</span>
            <span className="tabular text-[0.55rem] tracking-[0.14em] text-ivory/55">
              {site.coordinates}
            </span>
          </div>
          <p className="mt-4 text-[0.6rem] font-medium uppercase tracking-[0.2em] text-gold">
            {l(site.city)} · {l(site.country)}
          </p>
          <h2
            id="live-site-title"
            className="display-title mt-2 text-[clamp(2rem,5vw,3rem)] text-ivory"
          >
            {l(site.project)}
          </h2>
          <p className="mt-1 flex items-center gap-2 text-[0.65rem] uppercase tracking-[0.16em] text-ivory/45">
            <MapPin className="h-3.5 w-3.5 text-gold/70" />
            {l(site.district)}
          </p>
        </div>
      </div>

      <div className="space-y-8 px-6 pt-7 sm:px-8">
        <div>
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-[0.55rem] font-semibold uppercase tracking-[0.2em] text-ivory/40">
                {c.progress}
              </p>
              <p className="display-title mt-1 text-5xl text-ivory">
                {site.progress}
                <span className="ms-1 text-2xl text-gold">%</span>
              </p>
            </div>
            <div className="text-end">
              <p className="text-[0.55rem] uppercase tracking-[0.16em] text-ivory/35">{c.next}</p>
              <p className="mt-1 max-w-52 text-[0.72rem] leading-relaxed text-ivory/70">
                {l(site.nextMilestone)}
              </p>
            </div>
          </div>
          <div className="mt-4 h-1.5 overflow-hidden bg-white/10">
            <div
              className="h-full bg-gradient-to-r from-gold-dark via-gold to-gold-light shadow-[0_0_20px_rgb(var(--atmo-glow)/0.5)]"
              style={{ width: `${site.progress}%` }}
            />
          </div>
        </div>

        <div>
          <p className="mb-3 flex items-center gap-2 text-[0.55rem] font-semibold uppercase tracking-[0.2em] text-gold">
            <Ruler className="h-3.5 w-3.5" />
            {c.specs}
          </p>
          <dl className="grid grid-cols-2 gap-px overflow-hidden border border-white/10 bg-white/10 sm:grid-cols-3">
            {site.specs.map((spec) => (
              <div key={spec.label.en} className="bg-coal/95 p-4">
                <dt className="text-[0.52rem] uppercase tracking-[0.12em] text-ivory/35">
                  {l(spec.label)}
                </dt>
                <dd className="tabular mt-1.5 text-base text-ivory">{spec.value}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="glass-panel-soft p-5">
          <div className="flex items-center justify-between gap-4">
            <p className="flex items-center gap-2 text-[0.55rem] font-semibold uppercase tracking-[0.2em] text-gold">
              <Radio className="h-3.5 w-3.5" />
              {c.telemetry}
            </p>
            <span className="flex items-center gap-2 text-[0.52rem] uppercase tracking-[0.12em] text-ivory/40">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-gold/60" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-gold" />
              </span>
              {c.lastSync} {formatTime(sync.at, locale)}
              <span className="text-ivory/25">·</span>
              {syncLabel}
            </span>
          </div>
          <div className="mt-5 grid grid-cols-2 gap-5">
            {site.telemetry.map((metric) => (
              <div key={metric.label.en}>
                <p className="text-[0.52rem] uppercase tracking-[0.12em] text-ivory/35">
                  {l(metric.label)}
                </p>
                <p className="tabular mt-1 text-lg text-ivory">
                  {metric.value}
                  <span className="ms-1 text-[0.6rem] uppercase tracking-[0.12em] text-gold/70">
                    {metric.unit}
                  </span>
                </p>
              </div>
            ))}
          </div>
        </div>

        <div>
          <p className="mb-4 flex items-center gap-2 text-[0.55rem] font-semibold uppercase tracking-[0.2em] text-gold">
            <Workflow className="h-3.5 w-3.5" />
            {c.milestones}
          </p>
          <ol className="relative space-y-3">
            <span
              className="absolute start-[0.42rem] top-2 bottom-2 w-px bg-white/10"
              aria-hidden="true"
            />
            {site.milestones.map((milestone, index) => {
              const isActive = index === activeMilestone;
              return (
                <li key={milestone.label.en} className="relative flex items-start gap-3">
                  <span
                    className={cn(
                      "relative z-10 mt-0.5 flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full border",
                      milestone.done
                        ? "border-gold bg-gold text-obsidian"
                        : isActive
                          ? "border-gold bg-obsidian text-gold shadow-[0_0_16px_rgb(var(--atmo-glow)/0.45)]"
                          : "border-white/20 bg-obsidian text-transparent",
                    )}
                  >
                    {milestone.done ? (
                      <Check className="h-2.5 w-2.5" />
                    ) : (
                      <CircleDot className="h-2.5 w-2.5" />
                    )}
                  </span>
                  <span className="flex min-w-0 flex-1 items-baseline justify-between gap-3">
                    <span
                      className={cn(
                        "text-[0.72rem]",
                        milestone.done || isActive ? "text-ivory/80" : "text-ivory/40",
                      )}
                    >
                      {l(milestone.label)}
                    </span>
                    <span className="tabular shrink-0 text-[0.55rem] uppercase tracking-[0.1em] text-ivory/30">
                      {milestone.date}
                    </span>
                  </span>
                </li>
              );
            })}
          </ol>
        </div>

        <div className="flex flex-col gap-3 border-t border-white/10 pt-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4 text-[0.55rem] uppercase tracking-[0.12em] text-ivory/35">
            <span className="flex items-center gap-1.5">
              <Users className="h-3.5 w-3.5 text-gold/60" />
              {site.specs.find((spec) => spec.label.en === "Workforce")?.value ?? "—"}
            </span>
            <span className="flex items-center gap-1.5">
              <Timer className="h-3.5 w-3.5 text-gold/60" />
              {site.status ? l(site.status) : "—"}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/projects"
              className="inline-flex h-10 items-center gap-2 border border-white/15 px-4 text-[0.6rem] uppercase tracking-[0.14em] text-ivory/60 transition-colors hover:border-gold/50 hover:text-gold"
            >
              {c.allProjects}
            </Link>
            <Link
              href="/contact"
              className="inline-flex h-10 items-center gap-2 bg-gold px-4 text-[0.6rem] font-semibold uppercase tracking-[0.14em] text-obsidian transition-colors hover:bg-gold-light"
            >
              {c.visit}
              <ArrowUpRight className={cn("h-3.5 w-3.5", isRTL && "-scale-x-100")} />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export function LiveSiteGallery() {
  const { t, locale, l, isRTL } = useI18n();
  const { content } = useWorkspace();
  const c = t.sections.liveSites;
  const [activeId, setActiveId] = useState<LiveSite["id"] | null>(null);
  const activeSite = useMemo(
    () => (activeId ? getLiveSite(activeId) : null),
    [activeId],
  );

  return (
    <section id="live-sites" className="relative overflow-hidden bg-ink section-pad">
      <div className="atmo-glow pointer-events-none absolute inset-0 opacity-70" aria-hidden="true" />
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-gold/30 to-transparent"
        aria-hidden="true"
      />

      <div className="container-lux relative">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          <SectionHeading
            eyebrow={c.eyebrow}
            title={c.title}
            description={c.description}
            titleClassName="text-balance"
          />

          <div className="glass-panel-soft flex items-center gap-4 px-5 py-4">
            <span className="relative flex h-2.5 w-2.5 shrink-0">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-gold/60" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-gold" />
            </span>
            <div>
              <p className="flex items-center gap-2 text-[0.55rem] font-semibold uppercase tracking-[0.18em] text-gold">
                <Activity className="h-3.5 w-3.5" />
                {c.liveFeed}
              </p>
              <p className="mt-1 text-[0.7rem] text-ivory/55">{c.sitesCount}</p>
            </div>
          </div>
        </div>

        <div className="mt-12 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {liveSites.map((site, index) => {
            const sitePhoto = resolveMedia(
              content.mediaOverrides,
              `liveSite.${site.id}`,
              site.photo,
              locale,
            );
            return (
            <Reveal key={site.id} delay={index * 90} variant="scale" className="h-full">
              <SpotlightCard
                as="article"
                className="group h-full overflow-hidden border border-white/10 bg-coal"
              >
                <button
                  type="button"
                  onClick={() => setActiveId(site.id)}
                  aria-label={`${l(site.project)} — ${l(site.city)}`}
                  className="relative flex h-full w-full flex-col text-start"
                >
                  <div className="relative aspect-[4/5] w-full overflow-hidden">
                    <Image
                      src={sitePhoto.src}
                      alt={sitePhoto.alt}
                      fill
                      sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
                      className="object-cover photo-grade transition-transform duration-[1.4s] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.05]"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-obsidian via-obsidian/35 to-transparent" />
                    <div
                      className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-gold/50 to-transparent"
                      aria-hidden="true"
                    />
                    <div className="absolute inset-x-5 top-5 flex items-center justify-between gap-3">
                      <span className="live-pill">{c.live}</span>
                      <span className="tabular text-[0.52rem] tracking-[0.12em] text-ivory/55">
                        {site.coordinates}
                      </span>
                    </div>

                    <div className="absolute inset-x-5 bottom-5">
                      <span className="text-[0.55rem] font-semibold uppercase tracking-[0.2em] text-gold">
                        {l(site.city)} · {l(site.country)}
                      </span>
                      <h3 className="display-title mt-2 text-[clamp(1.6rem,2.4vw,2.2rem)] text-ivory">
                        {l(site.project)}
                      </h3>
                      <p className="mt-1 text-[0.62rem] uppercase tracking-[0.16em] text-ivory/45">
                        {l(site.district)}
                      </p>

                      <div className="mt-5 flex items-center gap-3">
                        <div className="h-1 flex-1 overflow-hidden bg-white/15">
                          <div
                            className="h-full bg-gradient-to-r from-gold-dark via-gold to-gold-light"
                            style={{ width: `${site.progress}%` }}
                          />
                        </div>
                        <span className="tabular text-[0.65rem] text-gold">{site.progress}%</span>
                      </div>

                      <div className="mt-4 flex items-center justify-between gap-3 border-t border-white/10 pt-3">
                        <span className="text-[0.52rem] uppercase leading-relaxed tracking-[0.1em] text-ivory/40">
                          {l(site.nextMilestone)}
                        </span>
                        <span className="inline-flex shrink-0 items-center gap-1.5 text-[0.52rem] font-semibold uppercase tracking-[0.14em] text-gold">
                          {c.inspect}
                          <ArrowUpRight
                            className={cn(
                              "h-3.5 w-3.5 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5",
                              isRTL && "-scale-x-100",
                            )}
                          />
                        </span>
                      </div>
                    </div>
                  </div>
                </button>
              </SpotlightCard>
            </Reveal>
            );
          })}
        </div>
      </div>

      <Drawer
        open={Boolean(activeSite)}
        onClose={() => setActiveId(null)}
        labelledBy="live-site-title"
        closeLabel={c.close}
      >
        {activeSite ? <LiveSiteDetail site={activeSite} /> : null}
      </Drawer>
    </section>
  );
}

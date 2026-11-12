"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import {
  ChevronLeft,
  ChevronRight,
  Expand,
  Pause,
  Play,
  SlidersHorizontal,
  Sparkles,
} from "lucide-react";
import { useI18n } from "@/components/providers/I18nProvider";
import { Modal } from "@/components/ui/Modal";
import { SectionHeading } from "@/components/ui/SectionHeading";
import {
  cinemaSource,
  craftsmanshipPhotos,
  cranePhotos,
  projectPhotos,
  type MediaAsset,
} from "@/data/media";
import type { ArtVariant, Project } from "@/data/projects";
import { cn } from "@/lib/utils";

const copy = {
  ar: {
    eyebrow: "من الموقع إلى التوقيع",
    title: "شاهد الفرق.",
    description:
      "اسحب الفاصل لمقارنة الموقع أثناء التنفيذ مع النتيجة النهائية، ثم افتح وضع السينما لمشاهدة المشروع بالكامل.",
    before: "أثناء التنفيذ",
    after: "بعد التسليم",
    drag: "اسحب للمقارنة",
    cinema: "وضع السينما 4K",
    cinemaLabel: "سينما 4K",
    play: "تشغيل",
    pause: "إيقاف",
    prev: "السابق",
    next: "التالي",
    fullscreen: "ملء الشاشة",
    gallery: "معرض المشروع",
    slide: "لقطة",
    close: "إغلاق",
  },
  en: {
    eyebrow: "From site to signature",
    title: "See the difference.",
    description:
      "Drag the divider to compare the live construction site with the delivered result, then open cinema mode for the full project.",
    before: "During construction",
    after: "Delivered",
    drag: "Drag to compare",
    cinema: "4K cinema mode",
    cinemaLabel: "4K cinema",
    play: "Play",
    pause: "Pause",
    prev: "Previous",
    next: "Next",
    fullscreen: "Fullscreen",
    gallery: "Project gallery",
    slide: "Frame",
    close: "Close",
  },
};

const beforeByCategory: Record<Project["category"], MediaAsset> = {
  commercial: craftsmanshipPhotos[2],
  residential: craftsmanshipPhotos[1],
  infrastructure: craftsmanshipPhotos[0],
  industrial: cranePhotos[3],
};

export function ProjectCinema({
  project,
  gallery,
}: {
  project: Project;
  gallery?: ArtVariant[];
}) {
  const { locale, l } = useI18n();
  const c = copy[locale];
  const [position, setPosition] = useState(52);
  const [open, setOpen] = useState(false);
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(true);
  const stageRef = useRef<HTMLDivElement | null>(null);

  const after = projectPhotos[project.art] ?? projectPhotos.tower;
  const before = beforeByCategory[project.category] ?? craftsmanshipPhotos[2];

  const images = useMemo(() => {
    const variants = gallery?.length ? gallery : [project.art];
    return [...new Set(variants)].map((variant) => projectPhotos[variant]).filter(Boolean);
  }, [gallery, project.art]);

  useEffect(() => {
    if (!open || !playing || images.length < 2) return;
    const timer = window.setInterval(() => {
      setIndex((current) => (current + 1) % images.length);
    }, 5200);
    return () => window.clearInterval(timer);
  }, [images.length, open, playing]);

  const openCinema = () => {
    setIndex(0);
    setPlaying(true);
    setOpen(true);
  };

  const step = (direction: 1 | -1) => {
    setIndex((current) => (current + direction + images.length) % images.length);
  };

  const toggleFullscreen = async () => {
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      } else {
        await stageRef.current?.requestFullscreen();
      }
    } catch {
      // Fullscreen is a progressive enhancement; the modal remains usable.
    }
  };

  const current = images[index] ?? after;

  return (
    <section className="relative overflow-hidden bg-coal text-ivory">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_0%,rgba(212,175,55,0.08),transparent_55%)]" />
      <div className="container-lux section-pad relative">
        <SectionHeading
          eyebrow={c.eyebrow}
          title={c.title}
          description={c.description}
          titleClassName="max-w-2xl"
        />

        <div className="mt-12 grid gap-6 lg:grid-cols-[1.55fr_0.45fr] lg:items-end">
          <div className="relative aspect-[16/10] overflow-hidden border border-white/12 bg-obsidian">
            <Image
              src={after.src}
              alt={after.alt}
              fill
              sizes="(max-width: 1024px) 100vw, 70vw"
              className="object-cover"
            />
            <div
              className="absolute inset-0"
              style={{ clipPath: `inset(0 ${100 - position}% 0 0)` }}
            >
              <Image
                src={before.src}
                alt={before.alt}
                fill
                sizes="(max-width: 1024px) 100vw, 70vw"
                className="object-cover"
              />
              <div className="absolute inset-0 bg-obsidian/20" />
            </div>

            <div className="pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between p-4 sm:p-6">
              <span className="border border-white/15 bg-obsidian/55 px-3 py-1.5 text-[0.5rem] uppercase tracking-[0.16em] text-ivory/70 backdrop-blur">
                {c.before}
              </span>
              <span className="border border-gold/35 bg-gold/10 px-3 py-1.5 text-[0.5rem] uppercase tracking-[0.16em] text-gold backdrop-blur">
                {c.after}
              </span>
            </div>

            <div
              className="pointer-events-none absolute inset-y-0 z-10 w-px bg-gold/80"
              style={{ left: `${position}%` }}
            >
              <span className="absolute left-1/2 top-1/2 flex h-11 w-11 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-gold bg-obsidian text-gold shadow-[0_0_30px_rgba(212,175,55,0.35)]">
                <SlidersHorizontal className="h-4 w-4" />
              </span>
            </div>

            <input
              type="range"
              min={0}
              max={100}
              value={position}
              onChange={(event) => setPosition(Number(event.target.value))}
              aria-label={c.drag}
              className="absolute inset-0 z-20 h-full w-full cursor-ew-resize opacity-0"
            />
            <span className="pointer-events-none absolute bottom-4 left-1/2 -translate-x-1/2 text-[0.48rem] uppercase tracking-[0.16em] text-ivory/50">
              {c.drag}
            </span>
          </div>

          <div className="flex flex-col gap-4 border border-white/10 bg-obsidian/60 p-5">
            <span className="flex items-center gap-2 text-[0.52rem] uppercase tracking-[0.16em] text-gold">
              <Sparkles className="h-3.5 w-3.5" />
              {c.cinemaLabel}
            </span>
            <p className="text-[0.72rem] leading-relaxed text-ivory/45">
              {l(project.title)} · {l(project.location)}
            </p>
            <button
              type="button"
              onClick={openCinema}
              className="inline-flex h-11 items-center justify-center gap-2 border border-gold bg-gold px-4 text-[0.56rem] font-semibold uppercase tracking-[0.14em] text-obsidian transition-colors hover:bg-gold-light"
            >
              <Play className="h-3.5 w-3.5" />
              {c.cinema}
            </button>
            <p className="text-[0.54rem] leading-relaxed text-ivory/25">
              {images.length} {c.slide} · {c.gallery}
            </p>
          </div>
        </div>
      </div>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        labelledBy="cinema-title"
        closeLabel={c.close}
        className="max-w-[96vw] border-gold/25 bg-obsidian p-0"
      >
        <div ref={stageRef} className="relative bg-black">
          <div className="relative aspect-video w-full overflow-hidden">
            <AnimatePresence mode="wait">
              <motion.div
                key={current.src}
                initial={{ opacity: 0, scale: 1.02 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                className="absolute inset-0"
              >
                <Image
                  src={cinemaSource(current.src)}
                  alt={current.alt}
                  fill
                  sizes="96vw"
                  className="object-cover"
                  priority
                />
              </motion.div>
            </AnimatePresence>
            <div className="absolute inset-0 bg-gradient-to-t from-obsidian via-obsidian/10 to-obsidian/35" />

            <div className="absolute inset-x-0 top-0 flex items-start justify-between p-5 sm:p-7">
              <span className="border border-gold/40 bg-obsidian/55 px-3 py-1.5 text-[0.48rem] uppercase tracking-[0.18em] text-gold backdrop-blur">
                {c.cinemaLabel}
              </span>
              <span className="font-mono text-[0.55rem] text-ivory/45">
                {String(index + 1).padStart(2, "0")} / {String(images.length).padStart(2, "0")}
              </span>
            </div>

            <div className="absolute inset-x-0 bottom-0 p-5 sm:p-8">
              <p className="text-[0.52rem] uppercase tracking-[0.16em] text-gold/80">
                {l(project.location)}
              </p>
              <h2
                id="cinema-title"
                className="display-title mt-2 text-[clamp(1.8rem,4vw,3.8rem)] text-ivory"
              >
                {l(project.title)}
              </h2>

              <div className="mt-5 flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => step(-1)}
                  aria-label={c.prev}
                  className="flex h-10 w-10 items-center justify-center border border-white/15 bg-obsidian/50 text-ivory/70 backdrop-blur transition-colors hover:border-gold/50 hover:text-gold"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setPlaying((value) => !value)}
                  aria-label={playing ? c.pause : c.play}
                  className="flex h-10 w-10 items-center justify-center border border-gold/40 bg-gold/10 text-gold backdrop-blur transition-colors hover:bg-gold/20"
                >
                  {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                </button>
                <button
                  type="button"
                  onClick={() => step(1)}
                  aria-label={c.next}
                  className="flex h-10 w-10 items-center justify-center border border-white/15 bg-obsidian/50 text-ivory/70 backdrop-blur transition-colors hover:border-gold/50 hover:text-gold"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={toggleFullscreen}
                  aria-label={c.fullscreen}
                  className="ms-auto flex h-10 items-center gap-2 border border-white/15 bg-obsidian/50 px-3 text-[0.5rem] uppercase tracking-[0.14em] text-ivory/60 backdrop-blur transition-colors hover:border-gold/50 hover:text-gold"
                >
                  <Expand className="h-3.5 w-3.5" />
                  {c.fullscreen}
                </button>
              </div>
            </div>
          </div>

          <div className="flex gap-2 overflow-x-auto border-t border-white/10 bg-obsidian p-3">
            {images.map((image, imageIndex) => (
              <button
                key={`${image.src}-${imageIndex}`}
                type="button"
                onClick={() => setIndex(imageIndex)}
                aria-label={`${c.slide} ${imageIndex + 1}`}
                aria-pressed={index === imageIndex}
                className={cn(
                  "relative h-14 w-24 shrink-0 overflow-hidden border transition-colors",
                  index === imageIndex
                    ? "border-gold"
                    : "border-white/10 opacity-55 hover:opacity-100",
                )}
              >
                <Image
                  src={image.src}
                  alt={image.alt}
                  fill
                  sizes="96px"
                  className="object-cover"
                />
              </button>
            ))}
          </div>
        </div>
      </Modal>
    </section>
  );
}

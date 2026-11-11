"use client";

import { useEffect, useRef, type MutableRefObject } from "react";

type Point = { x: number; y: number };

function ease(value: number) {
  return value * value * (3 - 2 * value);
}

function smoothstep(edge0: number, edge1: number, value: number) {
  const t = Math.max(0, Math.min(1, (value - edge0) / (edge1 - edge0)));
  return ease(t);
}

// Geometry tables are immutable, so they are built once at module scope
// instead of being re-allocated on every animation frame.
const COLUMNS: ReadonlyArray<readonly [number, number]> = [
  [0, 0],
  [2, 0],
  [0, 2],
  [2, 2],
  [1, 0],
  [0, 1],
  [2, 1],
  [1, 2],
  [1, 1],
];

const LEVELS: readonly number[] = [0, 1, 2, 3];

const BEAM_PAIRS: ReadonlyArray<
  readonly [readonly [number, number], readonly [number, number]]
> = [
  [[0, 0], [2, 0]],
  [[0, 2], [2, 2]],
  [[0, 0], [0, 2]],
  [[2, 0], [2, 2]],
  [[1, 0], [1, 2]],
  [[0, 1], [2, 1]],
];

const COLUMN_HIGHLIGHTS = COLUMNS.slice(0, 4);

type CraftsmanshipCanvasProps = {
  progressRef: MutableRefObject<number>;
  activeRef: MutableRefObject<number>;
  stepCountRef: MutableRefObject<number>;
};

/**
 * Scroll-driven 2D canvas. Loaded through next/dynamic with ssr:false so the
 * drawing code never touches the server bundle and the section copy can still
 * be server-rendered for SEO.
 */
export function CraftsmanshipCanvas({
  progressRef,
  activeRef,
  stepCountRef,
}: CraftsmanshipCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const smoothRef = useRef(0);
  const visibleRef = useRef(true);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    // The scene repaints every pixel each frame, so an opaque context avoids
    // per-frame alpha compositing with the page behind it.
    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) return;

    let frame = 0;
    let width = 0;
    let height = 0;
    let background: CanvasGradient | null = null;
    let glow: CanvasGradient | null = null;
    let scan: CanvasGradient | null = null;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = rect.width;
      height = rect.height;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      if (width === 0 || height === 0) {
        background = null;
        glow = null;
        scan = null;
        return;
      }

      // Gradients are expensive to construct; rebuild them only on resize.
      background = ctx.createLinearGradient(0, 0, 0, height);
      background.addColorStop(0, "#060708");
      background.addColorStop(0.55, "#0a0c10");
      background.addColorStop(1, "#060708");

      glow = ctx.createRadialGradient(
        width * 0.56,
        height * 0.5,
        0,
        width * 0.56,
        height * 0.5,
        Math.max(width, height) * 0.55,
      );
      glow.addColorStop(0, "rgba(212,175,55,0.10)");
      glow.addColorStop(1, "rgba(212,175,55,0)");

      scan = ctx.createLinearGradient(0, -40, 0, 40);
      scan.addColorStop(0, "rgba(212,175,55,0)");
      scan.addColorStop(0.5, "rgba(212,175,55,0.045)");
      scan.addColorStop(1, "rgba(212,175,55,0)");
    };

    const resizeObserver =
      typeof ResizeObserver !== "undefined" ? new ResizeObserver(resize) : null;
    resizeObserver?.observe(canvas);
    window.addEventListener("resize", resize);
    resize();

    const visibility =
      typeof IntersectionObserver !== "undefined"
        ? new IntersectionObserver(
            ([entry]) => {
              visibleRef.current = entry.isIntersecting;
              if (entry.isIntersecting) start();
              else stop();
            },
            { rootMargin: "120px" },
          )
        : null;
    visibility?.observe(canvas);

    const project = (x: number, y: number, z: number): Point => {
      const scale = Math.min(width, height) * 0.17;
      return {
        x: width * 0.57 + (x - z) * scale * 0.92,
        y: height * 0.58 + (x + z) * scale * 0.42 - y * scale * 1.28,
      };
    };

    const line = (
      a: Point,
      b: Point,
      progress: number,
      color = "212,175,55",
      lineWidth = 1,
    ) => {
      if (progress <= 0) return;
      ctx.strokeStyle = `rgba(${color},${progress})`;
      ctx.lineWidth = lineWidth;
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.stroke();
    };

    const draw = () => {
      frame = 0;
      if (!visibleRef.current || width === 0 || height === 0) return;
      smoothRef.current += (progressRef.current - smoothRef.current) * 0.08;
      const p = smoothRef.current;

      ctx.fillStyle = background ?? "#060708";
      ctx.fillRect(0, 0, width, height);

      if (glow) {
        ctx.fillStyle = glow;
        ctx.fillRect(0, 0, width, height);
      }

      ctx.strokeStyle = "rgba(255,255,255,0.035)";
      ctx.lineWidth = 1;
      for (let i = -8; i <= 8; i += 1) {
        const a = project(-2.4, 0, i * 0.55);
        const b = project(4.4, 0, i * 0.55);
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
        const c1 = project(i * 0.55, 0, -2.4);
        const d1 = project(i * 0.55, 0, 4.4);
        ctx.beginPath();
        ctx.moveTo(c1.x, c1.y);
        ctx.lineTo(d1.x, d1.y);
        ctx.stroke();
      }

      // Foundation slab
      const slabP = smoothstep(0.02, 0.2, p);
      if (slabP > 0) {
        const a = project(-0.35, 0, -0.35);
        const b = project(2.35, 0, -0.35);
        const c1 = project(2.35, 0, 2.35);
        const d = project(-0.35, 0, 2.35);
        ctx.fillStyle = `rgba(212,175,55,${0.07 * slabP})`;
        ctx.strokeStyle = `rgba(212,175,55,${0.28 * slabP})`;
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.lineTo(c1.x, c1.y);
        ctx.lineTo(d.x, d.y);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      }

      // Columns
      COLUMNS.forEach(([x, z], columnIndex) => {
        const threshold = 0.18 + columnIndex * 0.012;
        const columnP = smoothstep(threshold, threshold + 0.16, p);
        if (columnP <= 0) return;
        const base = project(x, 0, z);
        const top = project(x, 3, z);
        line(base, top, columnP, "226,216,198", 2.2);
        line(base, top, columnP * 0.8, "212,175,55", 0.7);
        for (let level = 0; level < 3; level += 1) {
          const joint = project(x, level + 1, z);
          ctx.fillStyle = `rgba(212,175,55,${0.55 * columnP})`;
          ctx.beginPath();
          ctx.arc(joint.x, joint.y, 2.2, 0, Math.PI * 2);
          ctx.fill();
        }
      });

      // Beams by level
      LEVELS.forEach((level, levelIndex) => {
        const threshold = 0.28 + levelIndex * 0.1;
        const beamP = smoothstep(threshold, threshold + 0.15, p);
        if (beamP <= 0) return;
        const y = level + 0.001;
        BEAM_PAIRS.forEach(([a, b]) => {
          line(project(a[0], y, a[1]), project(b[0], y, b[1]), beamP, "226,216,198", 1.5);
        });
        if (level > 0) {
          const a = project(-0.1, y, -0.1);
          const b = project(2.1, y, -0.1);
          const c1 = project(2.1, y, 2.1);
          const d = project(-0.1, y, 2.1);
          ctx.fillStyle = `rgba(255,255,255,${0.018 * beamP})`;
          ctx.strokeStyle = `rgba(212,175,55,${0.13 * beamP})`;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.lineTo(c1.x, c1.y);
          ctx.lineTo(d.x, d.y);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();
        }
      });

      // Rebar bending simulation
      const rebarP = smoothstep(0.08, 0.4, p) * (1 - smoothstep(0.7, 0.9, p));
      if (rebarP > 0) {
        const start = project(0.35, 0.02, 0.35);
        const end = project(1.65, 0.02, 0.35);
        const bend = Math.sin(p * Math.PI * 2) * 22 * rebarP;
        ctx.strokeStyle = `rgba(212,175,55,${0.55 * rebarP})`;
        ctx.lineWidth = 1.3;
        for (let index = 0; index < 5; index += 1) {
          const offset = index * 5;
          ctx.beginPath();
          ctx.moveTo(start.x, start.y + offset);
          ctx.quadraticCurveTo(
            (start.x + end.x) / 2,
            start.y + bend + offset,
            end.x,
            end.y + offset,
          );
          ctx.stroke();
        }
        ctx.fillStyle = `rgba(212,175,55,${0.6 * rebarP})`;
        ctx.font = "10px ui-monospace, monospace";
        ctx.fillText("Ø 32 · B500B", start.x, start.y - 14);
      }

      // Joint highlights on active phase
      const activeProgress =
        (activeRef.current + 0.5) / Math.max(1, stepCountRef.current);
      const highlight = 1 - Math.min(1, Math.abs(p - activeProgress) * 5);
      if (highlight > 0) {
        COLUMN_HIGHLIGHTS.forEach(([x, z]) => {
          const point = project(x, 2, z);
          const radius = 14 + Math.sin(performance.now() * 0.002 + x) * 3;
          ctx.strokeStyle = `rgba(212,175,55,${0.22 * highlight})`;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.arc(point.x, point.y, radius, 0, Math.PI * 2);
          ctx.stroke();
        });
      }

      // Measurement annotation
      const measureP = smoothstep(0.58, 0.74, p);
      if (measureP > 0) {
        const a = project(-0.35, 0, 2.35);
        const b = project(2.35, 0, 2.35);
        ctx.strokeStyle = `rgba(212,175,55,${0.42 * measureP})`;
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(a.x, a.y + 18);
        ctx.lineTo(b.x, b.y + 18);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = `rgba(243,238,228,${0.45 * measureP})`;
        ctx.font = "10px ui-monospace, monospace";
        ctx.fillText("24.0 m", (a.x + b.x) / 2 - 16, (a.y + b.y) / 2 + 32);
      }

      // Scan line — the gradient is cached on resize and translated instead
      // of being rebuilt 60 times per second.
      const scanY = (performance.now() * 0.04) % height;
      if (scan) {
        ctx.save();
        ctx.translate(0, scanY);
        ctx.fillStyle = scan;
        ctx.fillRect(0, -40, width, 80);
        ctx.restore();
      }

      frame = requestAnimationFrame(draw);
    };

    function start() {
      if (frame || !visibleRef.current) return;
      frame = requestAnimationFrame(draw);
    }

    function stop() {
      if (!frame) return;
      cancelAnimationFrame(frame);
      frame = 0;
    }

    start();

    return () => {
      stop();
      resizeObserver?.disconnect();
      window.removeEventListener("resize", resize);
      visibility?.disconnect();
    };
  }, [activeRef, progressRef, stepCountRef]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 h-full w-full"
      aria-hidden="true"
    />
  );
}

"use client";

import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { MoveDown } from "lucide-react";
import { useI18n } from "@/components/providers/I18nProvider";
import { useSmoothScroll } from "@/components/providers/SmoothScroll";
import { cn } from "@/lib/utils";

const copy = {
  ar: {
    eyebrow: "حرفية التنفيذ",
    title: "كل مفصل. كل ملليمتر. كل مرة.",
    description:
      "البناء ليس تجميع مواد. إنه تسلسل دقيق: مسح، تسليح، صب، تركيب، ثم تحقق. مرّر لتشاهد الهيكل يُبنى أمامك.",
    hint: "مرّر لتجميع الهيكل",
    stepLabel: "مرحلة",
    steps: [
      {
        index: "٠١",
        title: "المسح والأساس",
        heading: "الدقة تبدأ قبل أول صبّة.",
        text: "مسح شبكي مستقل، نقاط تحكم جيوديسية، وفحص تربة معتمد قبل توقيع أي أساس.",
        metric: "±2 مم",
        metricLabel: "دقة المسح",
      },
      {
        index: "٠٢",
        title: "التسليح والقوالب",
        heading: "الحديد يُروى كما تُروى القصة.",
        text: "قص وثني رقمي، تباعد مدروس، وتغطية خرسانية لا تقل عن ٤٠ مم — موثقة بالصور قبل الصب.",
        metric: "١٢٧",
        metricLabel: "نقطة فحص",
      },
      {
        index: "٠٣",
        title: "الهيكل الإنشائي",
        heading: "العظم الذي يحمل الحلم.",
        text: "أعمدة وكمرات تُركّب بترتيب محسوب، مع قياس إجهادات حي ومراجعة استشاري مستقلة.",
        metric: "٤٨٠",
        metricLabel: "ميغاباسكال",
      },
      {
        index: "٠٤",
        title: "الغلاف والأنظمة",
        heading: "العزل الذي لا يُرى.",
        text: "غلاف حراري، شبكات كهروميكانيكية، واختبارات ضغط وتوازن قبل إغلاق الأسقف.",
        metric: "٣٥٪",
        metricLabel: "كفاءة طاقة",
      },
      {
        index: "٠٥",
        title: "التسليم والتحقق",
        heading: "لا مفتاح قبل آخر فحص.",
        text: "قائمة تسليم من ١٢٧ بنداً، تدقيق مستقل، وتوثيق رقمي لكل نظام قبل التسليم.",
        metric: "٩٨٪",
        metricLabel: "تسليم أول مرة",
      },
    ],
  },
  en: {
    eyebrow: "Construction craftsmanship",
    title: "Every joint. Every millimetre. Every time.",
    description:
      "Construction is not assembling materials. It is a precise sequence: survey, reinforcement, pour, install, verify. Scroll to watch the frame build itself.",
    hint: "Scroll to assemble the frame",
    stepLabel: "Phase",
    steps: [
      {
        index: "01",
        title: "Survey & foundation",
        heading: "Precision starts before the first pour.",
        text: "Independent grid survey, geodetic control points, and certified soil testing before any foundation is signed off.",
        metric: "±2 mm",
        metricLabel: "Survey tolerance",
      },
      {
        index: "02",
        title: "Rebar & formwork",
        heading: "Steel is detailed like a story.",
        text: "Digital cutting and bending, engineered spacing, and a concrete cover of no less than 40 mm — photographed before the pour.",
        metric: "127",
        metricLabel: "Inspection points",
      },
      {
        index: "03",
        title: "Structural frame",
        heading: "The skeleton that carries the dream.",
        text: "Columns and beams installed in a calculated sequence, with live stress monitoring and independent consultant review.",
        metric: "480",
        metricLabel: "MPa concrete",
      },
      {
        index: "04",
        title: "Envelope & systems",
        heading: "The insulation no one sees.",
        text: "Thermal envelope, MEP networks, and pressure and balance testing before ceilings are closed.",
        metric: "35%",
        metricLabel: "Energy efficiency",
      },
      {
        index: "05",
        title: "Handover & verification",
        heading: "No key before the final check.",
        text: "A 127-item handover checklist, independent audit, and digital documentation for every system before delivery.",
        metric: "98%",
        metricLabel: "First-time handover",
      },
    ],
  },
};

type Point = { x: number; y: number };

function ease(value: number) {
  return value * value * (3 - 2 * value);
}

function smoothstep(edge0: number, edge1: number, value: number) {
  const t = Math.max(0, Math.min(1, (value - edge0) / (edge1 - edge0)));
  return ease(t);
}

export function CraftsmanshipExperience() {
  const sectionRef = useRef<HTMLElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const progressRef = useRef(0);
  const smoothRef = useRef(0);
  const visibleRef = useRef(true);
  const fillRef = useRef<HTMLDivElement | null>(null);
  const triggerRef = useRef<ScrollTrigger | null>(null);
  const activeRef = useRef(0);
  const [active, setActive] = useState(0);
  const { locale } = useI18n();
  const { scrollTo } = useSmoothScroll();
  const c = copy[locale];

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    const section = sectionRef.current;
    if (!section) return;

    const context = gsap.context(() => {
      const trigger = ScrollTrigger.create({
        trigger: section,
        start: "top top",
        end: "+=340%",
        pin: true,
        pinSpacing: true,
        anticipatePin: 1,
        invalidateOnRefresh: true,
        onUpdate: (self) => {
          progressRef.current = self.progress;
          if (fillRef.current) fillRef.current.style.width = `${self.progress * 100}%`;
          const next = Math.min(
            c.steps.length - 1,
            Math.floor(self.progress * c.steps.length),
          );
          if (next !== activeRef.current) {
            activeRef.current = next;
            setActive(next);
          }
        },
      });
      triggerRef.current = trigger;
    }, section);

    const timer = window.setTimeout(() => ScrollTrigger.refresh(), 400);
    return () => {
      window.clearTimeout(timer);
      triggerRef.current = null;
      context.revert();
    };
  }, [c.steps.length]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let frame = 0;
    let width = 0;
    let height = 0;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = rect.width;
      height = rect.height;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const observer = new ResizeObserver(resize);
    observer.observe(canvas);
    resize();

    const visibility = new IntersectionObserver(
      ([entry]) => {
        visibleRef.current = entry.isIntersecting;
      },
      { rootMargin: "120px" },
    );
    visibility.observe(canvas);

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
      color = "201,164,92",
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
      frame = requestAnimationFrame(draw);
      if (!visibleRef.current || width === 0 || height === 0) return;
      smoothRef.current += (progressRef.current - smoothRef.current) * 0.08;
      const p = smoothRef.current;

      const gradient = ctx.createLinearGradient(0, 0, 0, height);
      gradient.addColorStop(0, "#060708");
      gradient.addColorStop(0.55, "#0a0c10");
      gradient.addColorStop(1, "#060708");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);

      const glow = ctx.createRadialGradient(
        width * 0.56,
        height * 0.5,
        0,
        width * 0.56,
        height * 0.5,
        Math.max(width, height) * 0.55,
      );
      glow.addColorStop(0, "rgba(201,164,92,0.10)");
      glow.addColorStop(1, "rgba(201,164,92,0)");
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, width, height);

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

      const columns = [
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
      const levels = [0, 1, 2, 3];

      // Foundation slab
      const slabP = smoothstep(0.02, 0.2, p);
      if (slabP > 0) {
        const a = project(-0.35, 0, -0.35);
        const b = project(2.35, 0, -0.35);
        const c1 = project(2.35, 0, 2.35);
        const d = project(-0.35, 0, 2.35);
        ctx.fillStyle = `rgba(201,164,92,${0.07 * slabP})`;
        ctx.strokeStyle = `rgba(201,164,92,${0.28 * slabP})`;
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
      columns.forEach(([x, z], columnIndex) => {
        const threshold = 0.18 + columnIndex * 0.012;
        const columnP = smoothstep(threshold, threshold + 0.16, p);
        if (columnP <= 0) return;
        const base = project(x, 0, z);
        const top = project(x, 3, z);
        line(base, top, columnP, "226,216,198", 2.2);
        line(base, top, columnP * 0.8, "201,164,92", 0.7);
        for (let level = 0; level < 3; level += 1) {
          const joint = project(x, level + 1, z);
          ctx.fillStyle = `rgba(201,164,92,${0.55 * columnP})`;
          ctx.beginPath();
          ctx.arc(joint.x, joint.y, 2.2, 0, Math.PI * 2);
          ctx.fill();
        }
      });

      // Beams by level
      levels.forEach((level, levelIndex) => {
        const threshold = 0.28 + levelIndex * 0.1;
        const beamP = smoothstep(threshold, threshold + 0.15, p);
        if (beamP <= 0) return;
        const y = level + 0.001;
        const pairs: Array<[[number, number], [number, number]]> = [
          [[0, 0], [2, 0]],
          [[0, 2], [2, 2]],
          [[0, 0], [0, 2]],
          [[2, 0], [2, 2]],
          [[1, 0], [1, 2]],
          [[0, 1], [2, 1]],
        ];
        pairs.forEach(([a, b]) => {
          line(project(a[0], y, a[1]), project(b[0], y, b[1]), beamP, "226,216,198", 1.5);
        });
        if (level > 0) {
          const a = project(-0.1, y, -0.1);
          const b = project(2.1, y, -0.1);
          const c1 = project(2.1, y, 2.1);
          const d = project(-0.1, y, 2.1);
          ctx.fillStyle = `rgba(255,255,255,${0.018 * beamP})`;
          ctx.strokeStyle = `rgba(201,164,92,${0.13 * beamP})`;
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
        ctx.strokeStyle = `rgba(201,164,92,${0.55 * rebarP})`;
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
        ctx.fillStyle = `rgba(201,164,92,${0.6 * rebarP})`;
        ctx.font = "10px ui-monospace, monospace";
        ctx.fillText("Ø 32 · B500B", start.x, start.y - 14);
      }

      // Joint highlights on active phase
      const activeProgress = (active + 0.5) / c.steps.length;
      const highlight = 1 - Math.min(1, Math.abs(p - activeProgress) * 5);
      if (highlight > 0) {
        columns.slice(0, 4).forEach(([x, z]) => {
          const point = project(x, 2, z);
          const radius = 14 + Math.sin(performance.now() * 0.002 + x) * 3;
          ctx.strokeStyle = `rgba(201,164,92,${0.22 * highlight})`;
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
        ctx.strokeStyle = `rgba(201,164,92,${0.42 * measureP})`;
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

      // Scan line
      const scanY = (performance.now() * 0.04) % height;
      const scan = ctx.createLinearGradient(0, scanY - 40, 0, scanY + 40);
      scan.addColorStop(0, "rgba(201,164,92,0)");
      scan.addColorStop(0.5, "rgba(201,164,92,0.045)");
      scan.addColorStop(1, "rgba(201,164,92,0)");
      ctx.fillStyle = scan;
      ctx.fillRect(0, scanY - 40, width, 80);
    };

    frame = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      visibility.disconnect();
    };
  }, [active, c.steps.length]);

  const jumpTo = (index: number) => {
    const trigger = triggerRef.current;
    if (!trigger) return;
    const span = trigger.end - trigger.start;
    const ratio = 0.1 + (index / Math.max(1, c.steps.length - 1)) * 0.8;
    scrollTo(trigger.start + span * ratio, 0);
  };

  return (
    <section
      ref={sectionRef}
      id="craftsmanship"
      className="relative h-[100svh] overflow-hidden bg-obsidian"
    >
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" aria-hidden="true" />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-obsidian/85 via-transparent to-obsidian" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_30%_50%,rgba(6,7,8,0.72),transparent_68%)]" />

      <div className="relative z-10 flex h-full flex-col justify-between pb-6 pt-28 sm:pb-8 sm:pt-32">
        <div className="container-lux grid gap-6 lg:grid-cols-[1fr_auto] lg:items-start">
          <div className="max-w-xl">
            <span className="eyebrow">{c.eyebrow}</span>
            <h2 className="display-title mt-5 text-[clamp(2.3rem,4.6vw,4.4rem)] text-ivory">
              {c.title}
            </h2>
            <p className="mt-4 max-w-md text-sm leading-relaxed text-ivory/50">
              {c.description}
            </p>
          </div>
          <div className="hidden items-end gap-5 md:flex">
            <div className="flex flex-col items-end gap-2">
              <span className="text-[0.58rem] uppercase tracking-[0.2em] text-ivory/30">
                {c.hint}
              </span>
              <div className="h-14 w-px overflow-hidden bg-white/15">
                <div className="scroll-dot h-3 w-px bg-gold" />
              </div>
            </div>
            <MoveDown className="mb-1 h-4 w-4 text-gold/60" />
          </div>
        </div>

        <div className="container-lux grid items-end gap-7 lg:grid-cols-[1fr_460px]">
          <div className="hidden flex-col gap-4 pb-2 lg:flex">
            <div className="flex items-center gap-3">
              <span className="tabular text-[0.6rem] uppercase tracking-[0.2em] text-gold">
                {c.stepLabel}
              </span>
              <span className="h-px w-8 bg-gold/40" />
              <span className="tabular text-[0.6rem] text-ivory/30">
                {String(active + 1).padStart(2, "0")} / 0{c.steps.length}
              </span>
            </div>
            {c.steps.map((step, index) => (
              <button
                key={step.title}
                type="button"
                onClick={() => jumpTo(index)}
                aria-current={active === index}
                className={cn(
                  "group flex items-center gap-4 py-1.5 text-start transition-colors duration-300",
                  active === index ? "text-ivory" : "text-ivory/35 hover:text-ivory/65",
                )}
              >
                <span
                  className={cn(
                    "tabular text-[0.58rem] transition-colors",
                    active === index ? "text-gold" : "text-ivory/25",
                  )}
                >
                  {step.index}
                </span>
                <span className="text-sm font-medium tracking-wide">{step.title}</span>
                <span
                  className={cn(
                    "h-px max-w-14 flex-1 bg-gold/50 transition-opacity duration-500",
                    active === index ? "opacity-100" : "opacity-0",
                  )}
                />
              </button>
            ))}
          </div>

          <div className="relative">
            <div className="mb-4 flex items-center justify-between lg:hidden">
              <div className="flex items-center gap-2">
                {c.steps.map((step, index) => (
                  <button
                    key={step.title}
                    type="button"
                    onClick={() => jumpTo(index)}
                    aria-label={step.title}
                    aria-current={active === index}
                    className={cn(
                      "h-1.5 transition-all duration-500",
                      active === index ? "w-8 bg-gold" : "w-3 bg-white/20",
                    )}
                  />
                ))}
              </div>
              <span className="tabular text-[0.58rem] text-ivory/35">
                {String(active + 1).padStart(2, "0")} / 0{c.steps.length}
              </span>
            </div>

            <div className="relative min-h-[335px] sm:min-h-[315px]">
              {c.steps.map((step, index) => (
                <article
                  key={step.title}
                  aria-hidden={active !== index}
                  className={cn(
                    "absolute inset-0 flex flex-col justify-between border border-white/12 bg-obsidian/72 p-6 backdrop-blur-xl transition-all duration-700 sm:p-7",
                    active === index
                      ? "pointer-events-auto translate-y-0 opacity-100"
                      : "pointer-events-none translate-y-5 opacity-0",
                  )}
                  style={{ transitionTimingFunction: "cubic-bezier(0.16,1,0.3,1)" }}
                >
                  <span className="absolute -top-px start-0 h-px w-16 bg-gold" />
                  <span className="absolute -start-px top-0 h-16 w-px bg-gold/50" />
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-[0.58rem] uppercase tracking-[0.2em] text-gold/80">
                        {step.title}
                      </span>
                      <span className="font-display text-3xl italic text-gold/30">
                        {step.index}
                      </span>
                    </div>
                    <h3 className="mt-4 font-display text-[1.7rem] leading-tight text-ivory sm:text-[2rem]">
                      {step.heading}
                    </h3>
                    <p className="mt-3 text-[0.83rem] leading-[1.8] text-ivory/50">
                      {step.text}
                    </p>
                  </div>
                  <div className="mt-6 flex items-end justify-between border-t border-white/10 pt-4">
                    <div>
                      <div className="tabular text-2xl font-light text-gold">{step.metric}</div>
                      <div className="mt-1 text-[0.55rem] uppercase tracking-[0.18em] text-ivory/30">
                        {step.metricLabel}
                      </div>
                    </div>
                    <span className="flex h-8 w-8 items-center justify-center rounded-full border border-gold/30 text-[0.6rem] text-gold">
                      {step.index}
                    </span>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-[2] h-16 bg-gradient-to-t from-obsidian to-transparent" />
      <div className="absolute inset-x-0 bottom-0 z-20 h-[2px] bg-white/10">
        <div ref={fillRef} className="h-full w-0 bg-gradient-to-r from-gold-dark via-gold to-gold-light" />
      </div>
      <span className="sr-only" aria-live="polite">
        {c.steps[active]?.title}
      </span>
    </section>
  );
}

"use client";

import Link from "next/link";
import { ArrowUpRight, BadgeCheck, ShieldCheck } from "lucide-react";
import { useI18n } from "@/components/providers/I18nProvider";
import { Reveal } from "@/components/ui/Reveal";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { certifications } from "@/data/company";
import { cn } from "@/lib/utils";

export function Certifications() {
  const { t, l, isRTL } = useI18n();
  const c = t.sections.certifications;

  return (
    <section id="certifications" className="relative overflow-hidden bg-bg">
      <div className="blueprint-grid pointer-events-none absolute inset-0 opacity-25" />
      <div className="pointer-events-none absolute end-0 top-0 h-[480px] w-[480px] rounded-full bg-accent/[0.045] blur-[130px]" />
      <div className="container-lux section-pad relative">
        <div className="flex flex-col justify-between gap-8 lg:flex-row lg:items-end">
          <SectionHeading
            eyebrow={c.eyebrow}
            title={c.title}
            description={c.description}
            titleClassName="max-w-3xl"
          />
          <Reveal delay={180}>
            <Link
              href="/about#certifications"
              className="group inline-flex shrink-0 items-center gap-3 border border-line px-5 py-3 text-[0.65rem] font-semibold uppercase tracking-[0.16em] text-fg transition-colors hover:border-accent/50 hover:text-accent"
            >
              {c.cta}
              <ArrowUpRight
                className={cn(
                  "h-3.5 w-3.5 transition-transform duration-500 group-hover:-translate-y-0.5 group-hover:translate-x-0.5",
                  isRTL && "-scale-x-100",
                )}
              />
            </Link>
          </Reveal>
        </div>

        <div className="mt-14 grid gap-px overflow-hidden border border-line bg-line sm:grid-cols-2 lg:grid-cols-3">
          {certifications.map((cert, index) => (
            <Reveal key={cert.code} delay={(index % 3) * 70}>
              <article className="group relative flex h-full flex-col bg-surface p-7 transition-colors duration-500 hover:bg-surface-2 sm:p-8">
                <div className="flex items-start justify-between gap-4">
                  <span className="flex h-11 w-11 items-center justify-center rounded-full border border-accent/30 bg-accent/5 text-accent">
                    {index % 2 === 0 ? (
                      <ShieldCheck className="h-5 w-5" />
                    ) : (
                      <BadgeCheck className="h-5 w-5" />
                    )}
                  </span>
                  <span className="border border-line px-2.5 py-1 text-[0.52rem] uppercase tracking-[0.14em] text-fg">
                    {c.year} {cert.year}
                  </span>
                </div>

                <p className="mt-7 text-[0.58rem] font-semibold uppercase tracking-[0.22em] text-accent">
                  {cert.code}
                </p>
                <h3 className="mt-2 text-xl font-medium text-fg">{l(cert.title)}</h3>
                <p className="mt-2 text-[0.75rem] leading-relaxed text-fg">
                  {l(cert.issuer)}
                </p>

                <div className="mt-auto flex items-center justify-between gap-4 border-t border-line pt-5">
                  <span className="text-[0.62rem] text-fg">{l(cert.note)}</span>
                  <span className="flex items-center gap-1.5 text-[0.52rem] uppercase tracking-[0.12em] text-fg">
                    <span className="h-1.5 w-1.5 rounded-full bg-success/70" />
                    {c.audit}
                  </span>
                </div>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

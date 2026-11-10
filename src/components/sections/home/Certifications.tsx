"use client";

import Link from "next/link";
import { ArrowUpRight, BadgeCheck, ShieldCheck } from "lucide-react";
import { useI18n } from "@/components/providers/I18nProvider";
import { Reveal } from "@/components/ui/Reveal";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { certifications } from "@/data/company";
import { cn } from "@/lib/utils";

const copy = {
  ar: {
    eyebrow: "الجودة والسلامة",
    title: "معايير لا نتنازل عنها.",
    description:
      "الشهادات ليست شعارات على الحائط. كل اعتماد هنا يُدقّق سنوياً، ويُقاس ميدانياً، ويُوثّق في كل مشروع نسلّمه.",
    cta: "اقرأ سياسة الجودة",
    audit: "تدقيق مستقل",
    year: "سنة الاعتماد",
  },
  en: {
    eyebrow: "Quality & safety",
    title: "Standards we never trade.",
    description:
      "Certifications are not wall decorations. Every accreditation here is audited annually, measured on site, and documented on every project we hand over.",
    cta: "Read our quality policy",
    audit: "Independent audit",
    year: "Certified",
  },
};

export function Certifications() {
  const { locale, l, isRTL } = useI18n();
  const c = copy[locale];

  return (
    <section id="certifications" className="relative overflow-hidden bg-obsidian">
      <div className="blueprint-grid pointer-events-none absolute inset-0 opacity-25" />
      <div className="pointer-events-none absolute end-0 top-0 h-[480px] w-[480px] rounded-full bg-gold/[0.045] blur-[130px]" />
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
              className="group inline-flex shrink-0 items-center gap-3 border border-white/15 px-5 py-3 text-[0.65rem] font-semibold uppercase tracking-[0.16em] text-ivory/60 transition-colors hover:border-gold/50 hover:text-gold"
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

        <div className="mt-14 grid gap-px overflow-hidden border border-white/10 bg-white/10 sm:grid-cols-2 lg:grid-cols-3">
          {certifications.map((cert, index) => (
            <Reveal key={cert.code} delay={(index % 3) * 70}>
              <article className="group relative flex h-full flex-col bg-coal p-7 transition-colors duration-500 hover:bg-graphite sm:p-8">
                <div className="flex items-start justify-between gap-4">
                  <span className="flex h-11 w-11 items-center justify-center rounded-full border border-gold/30 bg-gold/5 text-gold">
                    {index % 2 === 0 ? (
                      <ShieldCheck className="h-5 w-5" />
                    ) : (
                      <BadgeCheck className="h-5 w-5" />
                    )}
                  </span>
                  <span className="border border-white/10 px-2.5 py-1 text-[0.52rem] uppercase tracking-[0.14em] text-ivory/35">
                    {c.year} {cert.year}
                  </span>
                </div>

                <p className="mt-7 text-[0.58rem] font-semibold uppercase tracking-[0.22em] text-gold">
                  {cert.code}
                </p>
                <h3 className="mt-2 text-xl font-medium text-ivory">{l(cert.title)}</h3>
                <p className="mt-2 text-[0.75rem] leading-relaxed text-ivory/40">
                  {l(cert.issuer)}
                </p>

                <div className="mt-auto flex items-center justify-between gap-4 border-t border-white/10 pt-5">
                  <span className="text-[0.62rem] text-ivory/45">{l(cert.note)}</span>
                  <span className="flex items-center gap-1.5 text-[0.52rem] uppercase tracking-[0.12em] text-ivory/25">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400/70" />
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

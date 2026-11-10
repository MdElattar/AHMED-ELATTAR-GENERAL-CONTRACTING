"use client";

import { useI18n } from "@/components/providers/I18nProvider";
import { Counter } from "@/components/ui/Counter";
import { Reveal } from "@/components/ui/Reveal";
import { SectionHeading } from "@/components/ui/SectionHeading";

export function Stats() {
  const { t } = useI18n();

  return (
    <section className="relative overflow-hidden bg-coal">
      <div className="blueprint-grid pointer-events-none absolute inset-0 opacity-40" />
      <div className="pointer-events-none absolute -start-40 top-1/3 h-[420px] w-[420px] rounded-full bg-gold/5 blur-[120px]" />

      <div className="container-lux section-pad relative">
        <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-end">
          <SectionHeading
            eyebrow={t.stats.eyebrow}
            title={t.stats.title}
            titleClassName="max-w-2xl"
          />
          <Reveal delay={200}>
            <p className="max-w-lg text-[0.92rem] leading-[1.95] text-ivory/50 lg:ms-auto">
              {t.stats.description}
            </p>
          </Reveal>
        </div>

        <div className="mt-16 grid border-t border-white/10 sm:grid-cols-2 lg:grid-cols-4">
          {t.stats.items.map((item, index) => {
            const decimals = Number.isInteger(item.value) ? 0 : 1;
            return (
              <Reveal
                key={item.label}
                delay={index * 90}
                className="group relative border-b border-white/10 py-10 lg:border-b-0 lg:border-e lg:px-8 lg:first:ps-0 lg:last:border-e-0"
              >
                <span className="tabular text-[0.58rem] uppercase tracking-[0.2em] text-gold/55">
                  0{index + 1}
                </span>
                <div className="mt-7 flex items-baseline gap-1.5">
                  <Counter
                    value={item.value}
                    decimals={decimals}
                    suffix={item.suffix}
                    className="tabular text-[clamp(2.8rem,5.2vw,4.9rem)] font-light leading-none text-ivory"
                  />
                </div>
                <p className="mt-4 max-w-[180px] text-sm leading-relaxed text-ivory/60">
                  {item.label}
                </p>
                <p className="mt-2 text-[0.6rem] uppercase tracking-[0.16em] text-ivory/25">
                  {item.note}
                </p>
                <span className="absolute bottom-0 start-0 h-px w-0 bg-gold transition-all duration-700 group-hover:w-full" />
              </Reveal>
            );
          })}
        </div>

        <div className="mt-10 flex flex-wrap items-center gap-x-12 gap-y-5">
          {t.stats.secondary.map((item, index) => (
            <Reveal key={item.label} delay={index * 80}>
              <div className="flex items-baseline gap-3">
                <span className="tabular text-lg text-gold">{item.value}</span>
                <span className="text-[0.6rem] uppercase tracking-[0.18em] text-ivory/35">
                  {item.label}
                </span>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

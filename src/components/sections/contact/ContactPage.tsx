"use client";

import Link from "next/link";
import { ArrowUpRight, Clock, Mail, MapPin, Phone } from "lucide-react";
import { SmartConsultant } from "@/components/ai/SmartConsultant";
import { useI18n } from "@/components/providers/I18nProvider";
import { BidForm } from "@/components/sections/contact/BidForm";
import { Reveal } from "@/components/ui/Reveal";
import { cn } from "@/lib/utils";

export function ContactPage() {
  const { t, isRTL } = useI18n();

  const contactItems = [
    {
      icon: MapPin,
      label: t.contactPage.headquarters,
      value: t.contactPage.address,
      href: undefined,
    },
    {
      icon: Phone,
      label: t.contactPage.phone,
      value: t.contactPage.phone,
      href: `tel:${t.contactPage.phone.replace(/\s/g, "")}`,
      ltr: true,
    },
    {
      icon: Mail,
      label: t.contactPage.email,
      value: t.contactPage.email,
      href: `mailto:${t.contactPage.email}`,
    },
    {
      icon: Clock,
      label: t.contactPage.hours,
      value: t.contactPage.hours,
      href: undefined,
    },
  ];

  return (
    <>
      <section className="relative overflow-hidden bg-bg pb-16 pt-36 sm:pb-20 sm:pt-44">
        <div className="blueprint-grid pointer-events-none absolute inset-0 opacity-40" />
        <div className="pointer-events-none absolute -end-20 top-16 select-none text-[15rem] font-semibold leading-none tracking-tighter text-fg/[0.025] sm:text-[22rem]">
          BUILD
        </div>
        <div className="pointer-events-none absolute start-1/4 top-1/3 h-[440px] w-[440px] rounded-full bg-accent/[0.05] blur-[140px]" />

        <div className="container-lux relative">
          <Reveal>
            <span className="eyebrow">{t.contactPage.eyebrow}</span>
          </Reveal>
          <div className="mt-6 grid gap-10 lg:grid-cols-[1.15fr_0.85fr] lg:items-end">
            <Reveal delay={80}>
              <h1 className="display-title max-w-4xl text-[clamp(2.8rem,6.4vw,6.2rem)] text-fg">
                {t.contactPage.title}
              </h1>
            </Reveal>
            <Reveal delay={160}>
              <p className="max-w-lg text-[0.95rem] leading-[1.95] text-fg lg:ms-auto">
                {t.contactPage.description}
              </p>
            </Reveal>
          </div>

          <div className="mt-14 grid gap-px border border-line bg-line sm:grid-cols-3">
            {[
              { label: t.contactPage.phone, value: t.contactPage.phone, href: `tel:${t.contactPage.phone.replace(/\s/g, "")}` },
              { label: t.contactPage.email, value: t.contactPage.email, href: `mailto:${t.contactPage.email}` },
              { label: t.contactPage.hours, value: t.contactPage.hours },
            ].map((item) => (
              <div key={item.label} className="bg-bg px-5 py-6">
                <span className="text-[0.52rem] uppercase tracking-[0.18em] text-fg">
                  {item.label}
                </span>
                {item.href ? (
                  <a
                    href={item.href}
                    className="mt-2 block text-[0.82rem] text-fg transition-colors hover:text-accent"
                    dir={item.label === t.contactPage.phone ? "ltr" : undefined}
                  >
                    {item.value}
                  </a>
                ) : (
                  <p className="mt-2 text-[0.82rem] leading-relaxed text-fg">{item.value}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="grain relative overflow-hidden bg-fg text-fg">
        <div className="pointer-events-none absolute inset-0 opacity-[0.35] [background-image:linear-gradient(rgb(var(--fg-rgb)/0.05)_1px,transparent_1px),linear-gradient(90deg,rgb(var(--fg-rgb)/0.05)_1px,transparent_1px)] [background-size:90px_90px]" />
        <div className="container-lux section-pad relative">
          <div className="grid gap-12 lg:grid-cols-[1.15fr_0.85fr] lg:gap-16">
            <Reveal>
              <BidForm />
            </Reveal>

            <div className="flex flex-col gap-8">
              <Reveal delay={80}>
                <div className="border border-line bg-surface-2">
                  <div className="border-b border-line px-6 py-4">
                    <span className="text-[0.58rem] font-semibold uppercase tracking-[0.18em] text-accent">
                      {t.contactPage.infoTitle}
                    </span>
                  </div>
                  <ul className="divide-y divide-line">
                    {contactItems.map((item) => (
                      <li key={item.label} className="flex items-start gap-4 px-6 py-5">
                        <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center border border-line text-accent">
                          <item.icon className="h-4 w-4" />
                        </span>
                        <div className="min-w-0">
                          <span className="text-[0.52rem] uppercase tracking-[0.16em] text-fg">
                            {item.label}
                          </span>
                          {item.href ? (
                            <a
                              href={item.href}
                              dir={item.ltr ? "ltr" : undefined}
                              className="mt-1 block break-words text-[0.8rem] leading-relaxed text-fg transition-colors hover:text-accent"
                            >
                              {item.value}
                            </a>
                          ) : (
                            <p className="mt-1 text-[0.8rem] leading-relaxed text-fg">
                              {item.value}
                            </p>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              </Reveal>

              <Reveal delay={160}>
                <div className="border border-line">
                  <div className="border-b border-line px-6 py-4">
                    <span className="text-[0.58rem] font-semibold uppercase tracking-[0.18em] text-accent">
                      {t.contactPage.officesTitle}
                    </span>
                  </div>
                  <div className="divide-y divide-line">
                    {t.contactPage.offices.map((office) => (
                      <div key={office.city} className="flex items-start justify-between gap-6 px-6 py-4">
                        <span className="text-[0.8rem] font-medium text-fg">{office.city}</span>
                        <span className="max-w-[220px] text-end text-[0.68rem] leading-relaxed text-fg">
                          {office.detail}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </Reveal>

              <Reveal delay={220}>
                <div className="border border-line bg-surface-2 p-6">
                  <span className="text-[0.55rem] font-semibold uppercase tracking-[0.18em] text-accent">
                    {t.contactPage.procurementTitle}
                  </span>
                  <p className="mt-3 text-[0.78rem] leading-relaxed text-fg">
                    {t.contactPage.procurementText}
                  </p>
                  <a
                    href={`mailto:${t.contactPage.procurementEmail}`}
                    className="group mt-4 inline-flex items-center gap-2 text-[0.7rem] font-semibold text-fg transition-colors hover:text-accent"
                  >
                    {t.contactPage.procurementEmail}
                    <ArrowUpRight className={cn("h-3.5 w-3.5", isRTL && "-scale-x-100")} />
                  </a>
                </div>
              </Reveal>
            </div>
          </div>
        </div>
      </section>

      <section
        id="procurement"
        className="relative scroll-mt-28 overflow-hidden border-t border-line bg-bg"
      >
        <div className="blueprint-grid pointer-events-none absolute inset-0 opacity-30" />
        <div className="container-lux relative py-20 sm:py-24">
          <div className="grid gap-10 lg:grid-cols-[1fr_0.8fr] lg:items-center">
            <div>
              <Reveal>
                <span className="eyebrow">{t.contactPage.procurementTitle}</span>
              </Reveal>
              <Reveal delay={80}>
                <h2 className="display-title mt-6 max-w-2xl text-[clamp(2.2rem,4.4vw,4.2rem)] text-fg">
                  {t.contactPage.procurementTitle}
                </h2>
              </Reveal>
              <Reveal delay={140}>
                <p className="mt-5 max-w-xl text-[0.9rem] leading-[1.9] text-fg">
                  {t.contactPage.procurementText}
                </p>
              </Reveal>
            </div>
            <Reveal delay={180}>
              <div className="flex flex-col gap-4 border border-line bg-surface p-7">
                <span className="text-[0.55rem] uppercase tracking-[0.18em] text-accent">
                  {t.contactPage.procurementTitle}
                </span>
                <a
                  href={`mailto:${t.contactPage.procurementEmail}`}
                  className="font-display text-xl text-fg transition-colors hover:text-accent"
                >
                  {t.contactPage.procurementEmail}
                </a>
                <Link
                  href="/contact"
                  className="group inline-flex items-center gap-2 text-[0.62rem] font-semibold uppercase tracking-[0.14em] text-fg transition-colors hover:text-accent"
                >
                  {t.contactPage.form.title}
                  <ArrowUpRight className={cn("h-3.5 w-3.5", isRTL && "-scale-x-100")} />
                </Link>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* "Elattar AI" floating consultant — structured feasibility guidance
          before the visitor commits to the full RFQ form. */}
      <SmartConsultant />
    </>
  );
}

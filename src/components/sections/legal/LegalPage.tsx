"use client";

import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { useI18n } from "@/components/providers/I18nProvider";
import { cn } from "@/lib/utils";

type LegalKind = "privacy" | "terms";

const copy = {
  ar: {
    privacy: {
      eyebrow: "الخصوصية",
      title: "سياسة الخصوصية",
      updated: "آخر تحديث: نوفمبر ٢٠٢٦",
      sections: [
        {
          title: "المعلومات التي نجمعها",
          text: "نجمع بيانات التواصل التي تقدمها طوعاً عبر نماذج المشاريع والبريد الإلكتروني، مثل الاسم والبريد والهاتف وتفاصيل المشروع. لا نجمع بيانات دفع من هذا الموقع.",
        },
        {
          title: "كيف نستخدمها",
          text: "نستخدم البيانات للرد على طلباتك، تقييم نطاق المشروع، وإدارة التواصل التعاقدي. لا نبيع بياناتك لأطراف ثالثة.",
        },
        {
          title: "التخزين والأمان",
          text: "تُنقل البيانات عبر اتصال مشفر، وتُقيّد الصلاحيات على من يحتاجها فقط. تُخزَّن بيانات الحساب والمشاريع في قاعدة بيانات الشركة، ولا تُشارك مع أطراف ثالثة.",
        },
        {
          title: "حقوقك",
          text: "يمكنك طلب الوصول إلى بياناتك أو تصحيحها أو حذفها عبر projects@alattar.sa.",
        },
      ],
    },
    terms: {
      eyebrow: "الشروط",
      title: "شروط الاستخدام",
      updated: "آخر تحديث: نوفمبر ٢٠٢٦",
      sections: [
        {
          title: "طبيعة الموقع",
          text: "هذا الموقع تعريفي لمشاريع شركة أحمد العطار للمقاولات العامة وخدماتها. المحتوى لا يُعد عرضاً تعاقدياً ملزماً إلا بعد توقيع اتفاقية منفصلة.",
        },
        {
          title: "التقديرات",
          text: "حاسبة التكلفة والوقت وتقديرات المشاريع استرشادية فقط، وتعتمد على مدخلات المستخدم ولا تشمل الظروف الموقعية أو تغيرات الأسعار.",
        },
        {
          title: "الملكية الفكرية",
          text: "العلامات التجارية والتصاميم والنصوص والصور مملوكة للشركة أو مرخصة لها. لا يجوز إعادة استخدامها تجارياً دون إذن كتابي.",
        },
        {
          title: "بوابة العملاء",
          text: "حسابات بوابة العملاء مخصصة للعملاء المعتمدين. تُخزَّن كلمات المرور بصيغة مشفرة، ولا ينبغي مشاركة بيانات الدخول مع أي طرف آخر.",
        },
      ],
    },
    back: "العودة للرئيسية",
  },
  en: {
    privacy: {
      eyebrow: "Privacy",
      title: "Privacy policy",
      updated: "Last updated: November 2026",
      sections: [
        {
          title: "Information we collect",
          text: "We collect contact details you voluntarily submit through project forms and email, such as name, email, phone, and project scope. This site does not collect payment data.",
        },
        {
          title: "How we use it",
          text: "We use the data to respond to enquiries, assess project scope, and manage contractual communication. We do not sell your data to third parties.",
        },
        {
          title: "Storage and security",
          text: "Data is transmitted over an encrypted connection and access is limited to those who need it. Account and project data are stored in the company database and are not shared with third parties.",
        },
        {
          title: "Your rights",
          text: "You may request access, correction, or deletion of your data by contacting projects@alattar.sa.",
        },
      ],
    },
    terms: {
      eyebrow: "Terms",
      title: "Terms of use",
      updated: "Last updated: November 2026",
      sections: [
        {
          title: "Website purpose",
          text: "This website presents the projects and services of Ahmed Elattar General Contracting Co. Its content is not a binding contractual offer until a separate agreement is signed.",
        },
        {
          title: "Estimates",
          text: "The cost and time estimator and project estimates are indicative only. They depend on user inputs and exclude site conditions and price changes.",
        },
        {
          title: "Intellectual property",
          text: "Trademarks, designs, text, and imagery are owned by or licensed to the company. Commercial reuse requires written permission.",
        },
        {
          title: "Client portal",
          text: "Client portal accounts are reserved for approved clients. Passwords are stored in encrypted form, and sign-in credentials should never be shared with anyone else.",
        },
      ],
    },
    back: "Back to homepage",
  },
};

export function LegalPage({ kind }: { kind: LegalKind }) {
  const { locale, isRTL } = useI18n();
  const c = copy[locale][kind];
  const back = copy[locale].back;
  const BackIcon = isRTL ? ArrowRight : ArrowLeft;

  return (
    <section className="relative overflow-hidden bg-obsidian pb-20 pt-32 text-ivory sm:pt-40">
      <div className="blueprint-grid pointer-events-none absolute inset-0 opacity-30" />
      <div className="container-lux relative max-w-4xl">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-[0.6rem] uppercase tracking-[0.18em] text-ivory/40 transition-colors hover:text-gold"
        >
          <BackIcon className="h-3.5 w-3.5" />
          {back}
        </Link>
        <span className="eyebrow mt-10 block">{c.eyebrow}</span>
        <h1 className="display-title mt-5 text-[clamp(2.6rem,5vw,4.6rem)] text-ivory">
          {c.title}
        </h1>
        <p className="mt-3 text-[0.68rem] uppercase tracking-[0.16em] text-gold/70">
          {c.updated}
        </p>

        <div className="mt-12 divide-y divide-white/10 border-y border-white/10">
          {c.sections.map((section, index) => (
            <article key={section.title} className="grid gap-4 py-8 sm:grid-cols-[auto_1fr]">
              <span className={cn("tabular text-[0.62rem] text-gold/70", "sm:pt-1")}>
                {String(index + 1).padStart(2, "0")}
              </span>
              <div>
                <h2 className="font-display text-xl text-ivory">{section.title}</h2>
                <p className="mt-2 text-[0.86rem] leading-[1.9] text-ivory/50">
                  {section.text}
                </p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

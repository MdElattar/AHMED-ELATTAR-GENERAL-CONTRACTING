import type { Metadata } from "next";
import { ContactPage } from "@/components/sections/contact/ContactPage";

export const metadata: Metadata = {
  title: "تواصل معنا | لنبنِ شيئاً استثنائياً",
  description:
    "أخبرنا عن مشروعك. فريق تطوير الأعمال في أحمد العطار يعود إليك خلال 24 ساعة عمل بخطة واضحة وجدول زمني.",
  alternates: { canonical: "/contact" },
};

export default function ContactRoute() {
  return <ContactPage />;
}

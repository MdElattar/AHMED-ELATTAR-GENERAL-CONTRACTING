import type { Metadata } from "next";
import { LegalPage } from "@/components/sections/legal/LegalPage";

export const metadata: Metadata = {
  title: "شروط الاستخدام | أحمد العطار",
  description: "شروط استخدام موقع شركة أحمد العطار للمقاولات العامة.",
  alternates: { canonical: "/terms" },
};

export default function TermsPage() {
  return <LegalPage kind="terms" />;
}

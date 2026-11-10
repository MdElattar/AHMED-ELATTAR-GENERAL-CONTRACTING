import type { Metadata } from "next";
import { LegalPage } from "@/components/sections/legal/LegalPage";

export const metadata: Metadata = {
  title: "سياسة الخصوصية | أحمد العطار",
  description: "كيف تجمع شركة أحمد العطار للمقاولات العامة بياناتك وتحميها.",
  alternates: { canonical: "/privacy" },
};

export default function PrivacyPage() {
  return <LegalPage kind="privacy" />;
}

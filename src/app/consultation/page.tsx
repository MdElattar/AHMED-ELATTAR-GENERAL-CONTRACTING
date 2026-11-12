import type { Metadata } from "next";
import { connection } from "next/server";
import { ConsultationPage } from "@/components/sections/consultation/ConsultationPage";
import { nextConsultationDates } from "@/lib/consultation";

export const metadata: Metadata = {
  title: "استشارة تنفيذية | مكتب المدير التنفيذي",
  description:
    "احجز جلسة استشارية خاصة مع قيادة أحمد العطار في مقر الرياض، أو عبر اجتماع مرئي أو زيارة موقع.",
  alternates: { canonical: "/consultation" },
};

export default async function ConsultationRoute() {
  await connection();
  const dates = nextConsultationDates(28);
  return <ConsultationPage dates={dates} />;
}

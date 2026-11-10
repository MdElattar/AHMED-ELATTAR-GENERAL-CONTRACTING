import type { Metadata } from "next";
import { PortalDashboard } from "@/components/sections/portal/PortalDashboard";

export const metadata: Metadata = {
  title: "بوابة العملاء | متابعة المشاريع",
  description: "تابع تقدم مشاريعك ومستنداتك ومدفوعاتك لحظة بلحظة عبر بوابة عملاء أحمد العطار.",
  alternates: { canonical: "/portal" },
  robots: { index: false, follow: false },
};

export default function PortalRoute() {
  return <PortalDashboard />;
}

import type { Metadata } from "next";
import { PortalFinancials } from "@/components/sections/portal/PortalFinancials";

export const metadata: Metadata = {
  title: "المالية والفواتير | بوابة العملاء",
  description: "قيمة العقد، المدفوعات، التدفق النقدي، والفواتير القابلة للتنزيل.",
  alternates: { canonical: "/portal/financials" },
  robots: { index: false, follow: false },
};

export default function PortalFinancialsRoute() {
  return <PortalFinancials />;
}

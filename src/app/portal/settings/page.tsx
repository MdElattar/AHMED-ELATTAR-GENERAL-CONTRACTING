import type { Metadata } from "next";
import { PortalSettings } from "@/components/sections/portal/PortalSettings";

export const metadata: Metadata = {
  title: "إعدادات الحساب | بوابة العملاء",
  description: "حدّث بياناتك، تفضيلات التواصل، اللغة، وأمان الحساب.",
  alternates: { canonical: "/portal/settings" },
  robots: { index: false, follow: false },
};

export default function PortalSettingsRoute() {
  return <PortalSettings />;
}

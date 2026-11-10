import type { Metadata } from "next";
import { PortalProjects } from "@/components/sections/portal/PortalProjects";

export const metadata: Metadata = {
  title: "متابعة المشاريع | بوابة العملاء",
  description: "تقدم لحظي، كاميرا موقع، مخططات قابلة للتنزيل، وتواصل مباشر مع مدير المشروع.",
  alternates: { canonical: "/portal/projects" },
  robots: { index: false, follow: false },
};

export default function PortalProjectsRoute() {
  return <PortalProjects />;
}

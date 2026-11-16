import type { Metadata } from "next";

// The dashboard shell is a client component hydrated from the layout, so the
// /admin segment has no useful static shell to validate for instant nav.
export const instant = false;

export const metadata: Metadata = {
  title: "لوحة الإدارة | مركز التحكم",
  description: "إدارة المشاريع، المالية، محتوى الموقع، الوسائط، ورسائل العملاء.",
  alternates: { canonical: "/admin" },
  robots: { index: false, follow: false },
};

// The persistent shell is rendered by app/admin/layout.tsx.
export default function AdminRoute() {
  return null;
}

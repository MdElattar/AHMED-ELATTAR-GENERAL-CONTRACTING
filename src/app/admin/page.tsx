import type { Metadata } from "next";

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

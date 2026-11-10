import type { Metadata } from "next";
import { AdminDashboard } from "@/components/sections/admin/AdminDashboard";

export const metadata: Metadata = {
  title: "لوحة الإدارة | مركز التحكم",
  description: "إدارة المشاريع، المالية، محتوى الموقع، الوسائط، ورسائل العملاء.",
  alternates: { canonical: "/admin" },
  robots: { index: false, follow: false },
};

export default function AdminRoute() {
  return <AdminDashboard />;
}

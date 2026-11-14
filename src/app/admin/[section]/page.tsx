import type { Metadata } from "next";
import { notFound } from "next/navigation";
import type { AdminSection } from "@/components/sections/admin/AdminDashboard";

// The admin shell reads the authenticated pathname and session in client
// components. A blocking route keeps prerendering from evaluating those
// runtime-only hooks while still allowing client-side section navigation.
export const instant = false;

type SectionRoute = {
  section: AdminSection;
  title: string;
  description: string;
};

const sectionRoutes: Record<string, SectionRoute> = {
  overview: {
    section: "overview",
    title: "نظرة عامة",
    description: "ملخص الأداء والمشاريع والرسائل في مركز التحكم.",
  },
  projects: {
    section: "projects",
    title: "المشاريع",
    description: "إدارة المشاريع والميزانيات والمراحل.",
  },
  milestones: {
    section: "milestones",
    title: "المراحل",
    description: "اعتماد مراحل التنفيذ ومتابعة التسليم.",
  },
  consultations: {
    section: "consultations",
    title: "الاستشارات",
    description: "إدارة طلبات الاستشارة التنفيذية والمواعيد.",
  },
  contracts: {
    section: "contracts",
    title: "العقود",
    description: "متابعة توقيعات العقود والتحقق من المراحل.",
  },
  notifications: {
    section: "notifications",
    title: "التنبيهات",
    description: "قنوات تنبيه البريد وواتساب للإدارة.",
  },
  inquiries: {
    section: "inquiries",
    title: "الاستفسارات",
    description: "مراجعة طلبات العملاء والمتابعة.",
  },
  financials: {
    section: "financials",
    title: "المالية والأرباح",
    description: "الميزانيات والمنفق وصافي الربح لكل مشروع.",
  },
  "site-content": {
    section: "content",
    title: "محتوى الموقع",
    description: "تحكم كامل في كل نص وصورة على الموقع العام.",
  },
  content: {
    section: "content",
    title: "محتوى الموقع",
    description: "تحكم كامل في كل نص وصورة على الموقع العام.",
  },
  media: {
    section: "media",
    title: "الوسائط والبانرات",
    description: "إدارة أغلفة المشاريع ومعارض الصور.",
  },
  messages: {
    section: "messages",
    title: "رسائل العملاء",
    description: "مراجعة رسائل بوابة العملاء والردّ عليها.",
  },
  audit: {
    section: "audit",
    title: "سجل النشاط",
    description: "تتبع كل إجراء إداري على المنصة.",
  },
  access: {
    section: "access",
    title: "تفويض الصلاحيات",
    description: "منح وسحب الصلاحيات الإدارية بحماية كلمة المرور ورمز البريد.",
  },
};

type PageProps = {
  params: Promise<{ section: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { section } = await params;
  const route = sectionRoutes[section];

  return {
    title: route
      ? `${route.title} | لوحة الإدارة`
      : "لوحة الإدارة | مركز التحكم",
    description: route?.description ?? "مركز تحكم إدارة محتوى الموقع.",
    alternates: { canonical: `/admin/${section}` },
    robots: { index: false, follow: false },
  };
}

export default async function AdminSectionPage({ params }: PageProps) {
  const { section } = await params;
  const route = sectionRoutes[section];
  if (!route) notFound();

  // The persistent shell is rendered by app/admin/layout.tsx and syncs the
  // active section from the pathname.
  return null;
}

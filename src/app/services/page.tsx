import type { Metadata } from "next";
import { ServicesPage } from "@/components/sections/services/ServicesPage";

export const metadata: Metadata = {
  title: "الخدمات | المقاولات، المعدات، الهندسة، التصميم",
  description:
    "أربع قدرات متكاملة: المقاولات العامة، تأجير المعدات الثقيلة، الهندسة المدنية، والتصميم المعماري — تحت إدارة واحدة.",
  alternates: { canonical: "/services" },
};

export default function ServicesRoute() {
  return <ServicesPage />;
}

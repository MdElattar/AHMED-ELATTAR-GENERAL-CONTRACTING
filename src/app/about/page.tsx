import type { Metadata } from "next";
import { AboutPage } from "@/components/sections/about/AboutPage";

export const metadata: Metadata = {
  title: "من نحن | إرث من الإتقان",
  description:
    "أربعة عقود من بناء الثقة. تعرّف على قصة أحمد العطار، قيمنا، معايير السلامة، ومحطات مسيرتنا منذ 1987.",
  alternates: { canonical: "/about" },
};

export default function AboutRoute() {
  return <AboutPage />;
}

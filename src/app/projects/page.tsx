import type { Metadata } from "next";
import { ProjectsExplorer } from "@/components/sections/projects/ProjectsExplorer";

export const metadata: Metadata = {
  title: "المشاريع | محفظة أحمد العطار",
  description:
    "من الأبراج الشاهقة إلى البنية التحتية الوطنية — استكشف محفظة مشاريع شركة أحمد العطار للمقاولات العامة.",
  alternates: { canonical: "/projects" },
};

export default function ProjectsPage() {
  return <ProjectsExplorer />;
}

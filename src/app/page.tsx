import dynamic from "next/dynamic";
import { Hero } from "@/components/sections/home/Hero";
import { Manifesto } from "@/components/sections/home/Manifesto";
import { Stats } from "@/components/sections/home/Stats";
import { PromoBanner } from "@/components/sections/home/PromoBanner";
import { CraneExperience } from "@/components/sections/home/CraneExperience";
import { CraftsmanshipExperience } from "@/components/sections/home/CraftsmanshipExperience";
import { FeaturedProjects } from "@/components/sections/home/FeaturedProjects";
import { LiveSiteGallery } from "@/components/sections/home/LiveSiteGallery";
import { ServicesGrid } from "@/components/sections/home/ServicesGrid";
import { FleetExperience } from "@/components/sections/home/FleetExperience";
import { Certifications } from "@/components/sections/home/Certifications";
import { Estimator } from "@/components/sections/home/Estimator";
import { Process } from "@/components/sections/home/Process";
import { Testimonials } from "@/components/sections/home/Testimonials";
import { CTA } from "@/components/sections/home/CTA";

// The regional map is a heavy, interactive SVG section below the fold. Ship it
// as its own chunk so it never competes with the hero for first paint.
const RegionalMap = dynamic(
  () =>
    import("@/components/sections/home/RegionalMap").then((m) => m.RegionalMap),
  {
    loading: () => (
      <section className="bg-ink section-pad" aria-hidden="true">
        <div className="container-lux">
          <div className="h-[520px] animate-pulse rounded-[24px] border border-white/[.06] bg-white/[.03]" />
        </div>
      </section>
    ),
  },
);

export default function HomePage() {
  return (
    <>
      <Hero />
      <Manifesto />
      <Stats />
      <PromoBanner />
      <CraneExperience />
      <CraftsmanshipExperience />
      <FeaturedProjects />
      <LiveSiteGallery />
      <ServicesGrid />
      <FleetExperience />
      <Certifications />
      <RegionalMap />
      <Estimator />
      <Process />
      <Testimonials />
      <CTA />
    </>
  );
}

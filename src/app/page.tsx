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
import { RegionalMap } from "@/components/sections/home/RegionalMap";
import { Estimator } from "@/components/sections/home/Estimator";
import { Process } from "@/components/sections/home/Process";
import { Testimonials } from "@/components/sections/home/Testimonials";
import { CTA } from "@/components/sections/home/CTA";

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

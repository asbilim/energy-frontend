"use client";

import HomeHero from "@/components/HomeHero";
import StatsSection from "@/components/StatsSection";
import FeaturesGrid from "@/components/FeaturesGrid";
import CtaSection from "@/components/CtaSection";

export default function HomePage() {
  return (
    <>
      <HomeHero />
      <StatsSection />
      <FeaturesGrid />
      <CtaSection />
    </>
  );
}

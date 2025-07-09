"use client";

import HomeHero from "@/components/HomeHero";
import StatsSection from "@/components/StatsSection";
import CalculatorTabs from "@/components/CalculatorTabs";
import FeaturesGrid from "@/components/FeaturesGrid";
import CtaSection from "@/components/CtaSection";

export default function HomePage() {
  return (
    <>
      <HomeHero />
      <StatsSection />
      <CalculatorTabs />
      <FeaturesGrid />
      <CtaSection />
    </>
  );
}

"use client";

import HomeHero from "./HomeHero";
import StatsSection from "./StatsSection";
import CalculatorTabs from "./CalculatorTabs";
import FeaturesGrid from "./FeaturesGrid";
import CtaSection from "./CtaSection";

const ClientComponentsWrapper = () => {
  return (
    <>
      <HomeHero />
      <StatsSection />
      <CalculatorTabs />
      <FeaturesGrid />
      <CtaSection />
    </>
  );
};

export default ClientComponentsWrapper;

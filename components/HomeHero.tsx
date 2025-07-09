"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calculator, Info, Lightbulb } from "lucide-react";
import Link from "next/link";

export default function HomeHero() {
  return (
    <section className="container space-y-10 py-24 md:py-32">
      <div className="mx-auto flex max-w-[58rem] flex-col items-center justify-center text-center">
        <Badge variant="secondary" className="mb-4">
          <Lightbulb className="mr-1 h-3 w-3" />
          Professional Solar PV System Design
        </Badge>

        <h1 className="font-heading text-4xl font-bold md:text-6xl lg:text-7xl">
          Design Optimal{" "}
          <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Solar Systems
          </span>
        </h1>

        <p className="mt-6 max-w-[42rem] text-muted-foreground text-xl">
          Professional-grade solar PV system calibration application that helps
          you design optimal solar systems based on energy needs and
          environmental conditions.
        </p>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
          <Button asChild size="lg" className="gap-2">
            <Link href="/calculator">
              <Calculator className="h-4 w-4" />
              Start Calculating
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg" className="gap-2">
            <Link href="/about">
              <Info className="h-4 w-4" />
              Learn More
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}

"use client";

import { Button } from "@/components/ui/button";
import { Calculator } from "lucide-react";
import Link from "next/link";

export default function CtaSection() {
  return (
    <section className="bg-muted py-16 md:py-24">
      <div className="container">
        <div className="flex flex-col items-center text-center space-y-4">
          <h2 className="text-3xl font-bold md:text-4xl">
            Prêt à concevoir votre système solaire ?
          </h2>
          <p className="max-w-[42rem] text-muted-foreground text-lg">
            Utilisez notre calculateur de qualité professionnelle pour concevoir un système solaire photovoltaïque optimal adapté à vos besoins énergétiques spécifiques et à vos conditions environnementales.
          </p>
          <Button asChild size="lg" className="mt-6 gap-2">
            <Link href="/calculator">
              <Calculator className="h-4 w-4" />
              Commencez à calculer maintenant
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}

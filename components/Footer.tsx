"use client";

import Link from "next/link";
import Image from "next/image";
import { Separator } from "@/components/ui/separator";
import { ModeToggle } from "@/components/ui/mode-toggle";

export function Footer() {
  return (
    <footer className="w-full border-t bg-background">
      <div className="container mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center gap-8 md:flex-row md:justify-between">
          {/* Logo and description */}
          <div className="flex flex-col items-center gap-4 text-center md:items-start md:text-left">
            <Link href="/" className="flex items-center gap-2">
              <Image
                src="/logo.svg"
                alt="SolarCal Logo"
                width={24}
                height={24}
              />
              <span className="text-lg font-semibold">SolarCal</span>
            </Link>
            <p className="text-sm text-muted-foreground max-w-md">
              Application de calibrage de systèmes solaires photovoltaïques de
              qualité professionnelle
            </p>
          </div>

          {/* Navigation links */}
          <div className="flex flex-col items-center gap-6 md:flex-row">
            <nav className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm">
              <Link
                href="/about"
                className="text-muted-foreground hover:text-primary">
                À propos
              </Link>
              <Link
                href="/projects"
                className="text-muted-foreground hover:text-primary">
                Projets
              </Link>
              <Link
                href="/conditions"
                className="text-muted-foreground hover:text-primary">
                Conditions
              </Link>
              <Link
                href="/contact"
                className="text-muted-foreground hover:text-primary">
                Contact
              </Link>
              <Link
                href="/confidentialite"
                className="text-muted-foreground hover:text-primary">
                Confidentialité
              </Link>
            </nav>
            <Separator orientation="vertical" className="hidden h-6 md:block" />
            <ModeToggle />
          </div>
        </div>

        <div className="mt-8 border-t pt-6 text-center">
          <p className="text-xs text-muted-foreground">
            &copy; {new Date().getFullYear()} SolarCal. Tous droits réservés.
          </p>
        </div>
      </div>
    </footer>
  );
}

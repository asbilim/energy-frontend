import { Metadata } from "next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export const metadata: Metadata = {
  title: "À propos - SolarCal",
  description:
    "SolarCal est une plate-forme académique de dimensionnement de systèmes solaires photovoltaïques.",
};

export default function AboutPage() {
  return (
    <div className="container max-w-3xl py-10">
      <h1 className="text-3xl font-bold mb-4">À propos de SolarCal</h1>
      <Card>
        <CardHeader>
          <CardTitle>Notre mission</CardTitle>
        </CardHeader>
        <CardContent className="prose max-w-none">
          <p>
            SolarCal est un outil pédagogique et de recherche permettant de
            concevoir rapidement des installations solaires autonomes ou
            connectées au réseau. Il combine :
          </p>
          <ul>
            <li>Calculs basés sur les standards IEC 60891 et IEC 61724</li>
            <li>Données météorologiques locales (NASA POWER / Open-Meteo)</li>
            <li>Analyse financière simplifiée adaptée au contexte africain</li>
          </ul>
          <Separator className="my-4" />
          <h3 className="text-lg font-semibold">Technologies</h3>
          <p>
            Next.js 15, TypeScript 5, Tailwind CSS v4, Supabase Auth, OpenRouter
            AI, et les bibliothèques open-source de la fondation Shadcn/ui.
          </p>
          <Separator className="my-4" />
          <h3 className="text-lg font-semibold">Contact</h3>
          <p>
            Pour toute question ou collaboration académique, écrivez à{" "}
            <a
              href="mailto:contact@solarcal.app"
              className="text-primary underline">
              contact@solarcal.app
            </a>
            .
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import dynamic from "next/dynamic";
import { Sun, DollarSign, BarChart, Sparkles } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Skeleton } from "@/components/ui/skeleton";
import { type CalculatorFormValues } from "./types";

// Define interfaces
interface CalculationResults {
  panelsNeeded: number;
  batteryCapacityAh: number;
  chargeControllerRating: number;
  inverterSizeKw: number;
  energyNeededWithLosses: number;
}

interface ResultsDisplayProps {
  results: CalculationResults | null;
  formData: CalculatorFormValues;
  aiSummary: string;
  isAISummaryLoading: boolean;
}

// Replace static import with:
const Mermaid = dynamic(() => import("@/components/Mermaid"), {
  ssr: false,
  loading: () => <Skeleton className="h-[400px] w-full" />,
});

// A simple formatter for numbers
const formatNumber = (num: number) =>
  new Intl.NumberFormat("fr-FR").format(num);

export function ResultsDisplay({
  results,
  formData,
  aiSummary,
  isAISummaryLoading,
}: ResultsDisplayProps) {
  if (!results) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Résultats</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Les résultats des calculs apparaîtront ici.</p>
        </CardContent>
      </Card>
    );
  }

  const {
    panelsNeeded,
    batteryCapacityAh,
    chargeControllerRating,
    inverterSizeKw,
    energyNeededWithLosses,
  } = results;

  const { systemType } = formData.projectDetails;

  // Update costs to XAF (approximate conversion: 1 EUR ≈ 656 XAF)
  const costPerPanel = 131200; // 200 EUR * 656
  const costPerAh = 328; // 0.5 EUR * 656
  const costPerInverterKw = 98400; // 150 EUR * 656
  const costPerControllerA = 1312; // 2 EUR * 656
  const costKwhGrid = 85; // 0.13 EUR * 656 ≈ 85 FCFA per kWh (adjusted for local rates)

  const estimatedPanelCost = panelsNeeded * costPerPanel;
  const estimatedBatteryCost =
    systemType !== "grid-tied" ? batteryCapacityAh * costPerAh : 0;
  const estimatedInverterCost = inverterSizeKw * costPerInverterKw;
  const estimatedControllerCost = chargeControllerRating * costPerControllerA;
  const totalSystemCost =
    estimatedPanelCost +
    estimatedBatteryCost +
    estimatedInverterCost +
    estimatedControllerCost;

  const annualSavings =
    systemType !== "off-grid" ? energyNeededWithLosses * 365 * costKwhGrid : 0;
  const roiYears =
    totalSystemCost > 0 && annualSavings > 0
      ? (totalSystemCost / annualSavings).toFixed(1)
      : "N/A";

  const systemDiagram = `
graph TD
    A[Panneaux Solaires] -->|DC| B{Régulateur de Charge};
    ${systemType !== "grid-tied" ? "B -->|DC| C[Parc de Batteries];" : ""}
    ${
      systemType !== "grid-tied"
        ? "C -->|DC| D{Onduleur};"
        : "B -->|DC| D{Onduleur};"
    }
    D -->|AC| E[Charges AC];
    subgraph "Système Solaire"
        A
        B
        ${systemType !== "grid-tied" ? "C" : ""}
        D
    end
    `;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sun className="text-primary" />
            Aperçu du Système
          </CardTitle>
          <CardDescription>
            Spécifications des composants principaux de votre installation.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 bg-muted rounded-lg text-center">
            <p className="text-2xl font-bold">{formatNumber(panelsNeeded)}</p>
            <p className="text-sm text-muted-foreground">Panneaux requis</p>
            <p className="text-sm text-muted-foreground mt-2">
              Nombre de panneaux solaires nécessaires pour générer l&apos;énergie
              requise, calculé en fonction de la consommation quotidienne, des
              heures d&apos;ensoleillement et de la puissance par panneau.
            </p>
          </div>
          <div className="p-4 bg-muted rounded-lg text-center">
            <p className="text-2xl font-bold">{inverterSizeKw} kW</p>
            <p className="text-sm text-muted-foreground">Taille Onduleur</p>
            <p className="text-sm text-muted-foreground mt-2">
              Taille de l&apos;onduleur nécessaire pour convertir le courant continu
              (DC) en courant alternatif (AC) et alimenter les charges.
            </p>
          </div>
          <div className="p-4 bg-muted rounded-lg text-center">
            <p className="text-2xl font-bold">
              {formatNumber(chargeControllerRating)} A
            </p>
            <p className="text-sm text-muted-foreground">Régulateur</p>
            <p className="text-sm text-muted-foreground mt-2">
              Capacité du régulateur de charge nécessaire pour gérer la charge
              et la décharge des batteries.
            </p>
          </div>
          <div className="p-4 bg-muted rounded-lg text-center">
            <p className="text-2xl font-bold">
              {systemType !== "grid-tied"
                ? formatNumber(Math.round(batteryCapacityAh))
                : "N/A"}
            </p>
            <p className="text-sm text-muted-foreground">
              Capacité Batterie (Ah)
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              Capacité de la batterie nécessaire pour stocker l&apos;énergie produite
              par les panneaux solaires et la fournir lorsque le soleil ne
              brille pas.
            </p>
          </div>
        </CardContent>
      </Card>

      {(systemType !== "off-grid" || totalSystemCost > 0) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="text-green-500" />
              Analyse Financière
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-muted rounded-lg text-center">
              <p className="text-2xl font-bold">
                {formatNumber(Math.round(totalSystemCost))} FCFA
              </p>
              <p className="text-sm text-muted-foreground">Coût total estimé</p>
              <p className="text-sm text-muted-foreground mt-2">
                Estimation du coût total du système basée sur les prix moyens
                des composants au Cameroun en FCFA.
              </p>
            </div>
            {systemType !== "off-grid" && (
              <>
                <div className="p-4 bg-muted rounded-lg text-center">
                  <p className="text-2xl font-bold">
                    {formatNumber(Math.round(annualSavings))} FCFA
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Économies annuelles
                  </p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Économies annuelles estimées en réduisant la consommation
                    d&apos;énergie du réseau électrique.
                  </p>
                </div>
                <div className="p-4 bg-muted rounded-lg text-center">
                  <p className="text-2xl font-bold">{roiYears} ans</p>
                  <p className="text-sm text-muted-foreground">
                    Retour sur investissement
                  </p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Nombre d&apos;années estimées nécessaires pour récupérer
                    l&apos;investissement initial en fonction des économies
                    annuelles.
                  </p>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart className="text-blue-500" />
            Architecture du Système
          </CardTitle>
        </CardHeader>
        <CardContent className="flex justify-center">
          <Mermaid id="system-architecture" chart={systemDiagram} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="text-purple-500" />
            Analyse et Recommandations IA
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isAISummaryLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          ) : (
            <div className="prose prose-sm dark:prose-invert w-full p-4 border rounded-lg overflow-auto">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {aiSummary}
              </ReactMarkdown>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

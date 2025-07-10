"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import Mermaid from "@/components/Mermaid";
import { Sun, DollarSign, BarChart, Sparkles } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Skeleton } from "@/components/ui/skeleton";

// A simple formatter for numbers
const formatNumber = (num: number) =>
  new Intl.NumberFormat("fr-FR").format(num);

export function ResultsDisplay({
  results,
  formData,
  aiSummary,
  isAISummaryLoading,
}) {
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

  // Placeholder costs - can be moved to a config file
  const costPerPanel = 200; // euros
  const costPerAh = 0.5; // euros per Ah for batteries
  const costPerInverterKw = 150; // euros
  const costPerControllerA = 2; // euros
  const costKwhGrid = 0.13; // euros (FCFA converted)

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
          </div>
          <div className="p-4 bg-muted rounded-lg text-center">
            <p className="text-2xl font-bold">{inverterSizeKw} kW</p>
            <p className="text-sm text-muted-foreground">Taille Onduleur</p>
          </div>
          <div className="p-4 bg-muted rounded-lg text-center">
            <p className="text-2xl font-bold">
              {formatNumber(chargeControllerRating)} A
            </p>
            <p className="text-sm text-muted-foreground">Régulateur</p>
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
                {formatNumber(Math.round(totalSystemCost))} €
              </p>
              <p className="text-sm text-muted-foreground">Coût total estimé</p>
            </div>
            {systemType !== "off-grid" && (
              <>
                <div className="p-4 bg-muted rounded-lg text-center">
                  <p className="text-2xl font-bold">
                    {formatNumber(Math.round(annualSavings))} €
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Économies annuelles
                  </p>
                </div>
                <div className="p-4 bg-muted rounded-lg text-center">
                  <p className="text-2xl font-bold">{roiYears} ans</p>
                  <p className="text-sm text-muted-foreground">
                    Retour sur investissement
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
            <div className="prose prose-sm dark:prose-invert max-w-none">
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

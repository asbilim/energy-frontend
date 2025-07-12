"use client";

import { useMemo } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Info, FileText } from "lucide-react";
import dynamic from "next/dynamic";
import { Sun, DollarSign, BarChart, Sparkles } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import { Skeleton } from "@/components/ui/skeleton";
import { type CalculatorFormValues } from "./types";
import { calculateEneoBill, EneoBillDetails } from "@/lib/billing";

// Helper to format numbers as currency in FCFA
const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("fr-CM", {
    style: "currency",
    currency: "XAF",
    minimumFractionDigits: 0,
  }).format(Math.round(value));
};

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
  totalKwh: number;
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
  totalKwh,
}: ResultsDisplayProps) {
  const billDetails: EneoBillDetails = useMemo(
    () => calculateEneoBill(totalKwh),
    [totalKwh]
  );
  if (!results || totalKwh <= 0) {
    return (
      <Alert>
        <Info className="h-4 w-4" />
        <AlertTitle>En attente de vos appareils</AlertTitle>
        <AlertDescription>
          Ajoutez des appareils et leur consommation pour estimer votre facture
          mensuelle.
        </AlertDescription>
      </Alert>
    );
  }

  const applianceCostBreakdown = useMemo(() => {
    if (!results || billDetails.totalKwh <= 0) return [];

    const { appliances } = formData.energyConsumption;
    const { totalKwh, totalCost } = billDetails;

    return appliances.map((app) => {
      const dailyWh =
        (app.power || 0) * (app.quantity || 0) * (app.hoursPerDay || 0);
      const dailyKwh = dailyWh / 1000;
      const monthlyKwh = dailyKwh * 30;

      // Proportional cost
      const monthlyCost =
        totalKwh > 0 ? (monthlyKwh / totalKwh) * totalCost : 0;
      const dailyCost = monthlyCost / 30;
      const weeklyCost = dailyCost * 7;

      return {
        name: app.name,
        dailyKwh,
        dailyCost,
        weeklyCost,
        monthlyCost,
      };
    });
  }, [formData, results, billDetails]);

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
            <DollarSign className="text-green-500" />
            Analyse Financière et Économies
          </CardTitle>
          <CardDescription>
            Estimations financières de votre facture actuelle et du système
            solaire proposé.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Eneo Bill Estimation Section */}
          <div>
            <h3 className="text-xl font-semibold mb-2 text-center">
              Estimation de votre Facture Eneo Actuelle
            </h3>
            <div className="text-center mb-4">
              <p className="text-sm text-muted-foreground">
                Basée sur une consommation mensuelle de{" "}
                <span className="font-bold text-primary">
                  {formatNumber(billDetails.totalKwh)} kWh
                </span>
              </p>
              <p className="text-4xl font-bold tracking-tighter mt-2">
                {formatCurrency(billDetails.totalCost)}
              </p>
              <p className="text-sm text-muted-foreground">
                Montant Total Estimé (TTC)
              </p>
            </div>
            {/* Detailed Bill Breakdown */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <p className="text-muted-foreground">
                  Coût total de la consommation
                </p>
                <p className="font-medium">
                  {formatCurrency(billDetails.consumptionCost)}
                </p>
              </div>
              <div className="flex justify-between items-center">
                <p className="text-muted-foreground">
                  Redevance Fixe (Prime Fixe)
                </p>
                <p className="font-medium">
                  {formatCurrency(billDetails.fixedFee)}
                </p>
              </div>
              <div className="flex justify-between items-center">
                <p className="text-muted-foreground">TVA (19.25%)</p>
                <p className="font-medium">
                  {formatCurrency(billDetails.vatAmount)}
                </p>
              </div>
              <div className="flex justify-between items-center">
                <p className="text-muted-foreground">Taxe municipale</p>
                <p className="font-medium">
                  {formatCurrency(billDetails.municipalTax)}
                </p>
              </div>
              <div className="flex justify-between items-center">
                <p className="text-muted-foreground">Droit de timbre</p>
                <p className="font-medium">
                  {formatCurrency(billDetails.stampDuty)}
                </p>
              </div>
            </div>
          </div>

          <Separator />

          {/* Per-Appliance Cost Breakdown */}
          <div>
            <h3 className="text-xl font-semibold mb-4 text-center">
              Détail des Coûts par Appareil
            </h3>
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Appareil</TableHead>
                    <TableHead className="text-right">Coût / jour</TableHead>
                    <TableHead className="text-right">Coût / semaine</TableHead>
                    <TableHead className="text-right">Coût / mois</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {applianceCostBreakdown.map((item) => (
                    <TableRow key={item.name}>
                      <TableCell className="font-medium">{item.name}</TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(item.dailyCost)}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(item.weeklyCost)}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(item.monthlyCost)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>

          <Separator />

          {/* Solar System Financials */}
          <div>
            <h3 className="text-xl font-semibold mb-4 text-center">
              Analyse de l'Investissement Solaire
            </h3>
            <div className="space-y-4">
              {/* Cost breakdown */}
              <div className="p-4 border rounded-lg">
                <h4 className="font-semibold mb-3 text-center">
                  Détail du Coût du Système
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      Coût des Panneaux ({panelsNeeded} unités)
                    </span>
                    <span className="font-medium">
                      {formatCurrency(estimatedPanelCost)}
                    </span>
                  </div>
                  {systemType !== "grid-tied" && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">
                        Coût des Batteries (
                        {formatNumber(Math.round(batteryCapacityAh))} Ah)
                      </span>
                      <span className="font-medium">
                        {formatCurrency(estimatedBatteryCost)}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      Coût de l'Onduleur ({inverterSizeKw} kW)
                    </span>
                    <span className="font-medium">
                      {formatCurrency(estimatedInverterCost)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      Coût du Régulateur de Charge ({chargeControllerRating} A)
                    </span>
                    <span className="font-medium">
                      {formatCurrency(estimatedControllerCost)}
                    </span>
                  </div>
                  <Separator className="my-2" />
                  <div className="flex justify-between font-bold text-base">
                    <span>Coût Total Estimé de l'Installation</span>
                    <span>{formatCurrency(totalSystemCost)}</span>
                  </div>
                </div>
              </div>

              {/* Savings and ROI */}
              {systemType !== "off-grid" ? (
                <div className="p-4 border rounded-lg">
                  <h4 className="font-semibold mb-3 text-center">
                    Bénéfices Financiers
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 bg-muted rounded-lg text-center">
                      <p className="text-2xl font-bold">
                        {formatCurrency(annualSavings)}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Économies annuelles estimées
                      </p>
                    </div>
                    <div className="p-4 bg-muted rounded-lg text-center">
                      <p className="text-2xl font-bold">{roiYears} ans</p>
                      <p className="text-sm text-muted-foreground">
                        Retour sur investissement
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-muted rounded-lg text-center">
                  <p className="text-lg font-semibold">
                    Indépendance Énergétique
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Ce système vous affranchit du réseau Eneo, vous protégeant
                    des coupures et des hausses de tarifs.
                  </p>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart className="text-blue-500" />
            Analyse du Système Recommandé
          </CardTitle>
          <CardDescription>
            Spécifications des composants principaux et architecture de votre
            installation.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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
          </div>
          <Separator />
          <div className="flex justify-center">
            <Mermaid id="system-architecture" chart={systemDiagram} />
          </div>
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
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                rehypePlugins={[rehypeRaw]}>
                {aiSummary}
              </ReactMarkdown>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

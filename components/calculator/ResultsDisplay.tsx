"use client";

import { useMemo, useState, useEffect } from "react";
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
import { Info, FileText, Loader2, FileJson, AlertCircle } from "lucide-react";
import dynamic from "next/dynamic";
import { Sun, DollarSign, BarChart, Sparkles } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import { Skeleton } from "@/components/ui/skeleton";
import { type CalculatorFormValues } from "./types";
import { calculateEneoBill, EneoBillDetails } from "@/lib/billing";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { formatCurrency, formatNumber } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";

// Define interfaces
interface CalculationResults {
  panelsNeeded: number;
  batteryCapacityAh: number;
  chargeControllerRating: number;
  inverterSizeKw: number;
  energyNeededWithLosses: number;
  energyProduced: number;
  peakPowerW: number;
  batteriesInSeries: number;
  batteriesInParallel: number;
  totalBatteries: number;
  dailyGridExport?: number;
  selfConsumptionRate?: number;
  annualGridSavings?: number;
  autonomyHours?: number;
  gridDependencyRate?: number;
  dailyGridExchange?: number;
  backupDuration?: number;
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

export function ResultsDisplay({
  results,
  formData,
  aiSummary,
  isAISummaryLoading,
  totalKwh,
}: ResultsDisplayProps) {
  const [isDownloadingPDF, setIsDownloadingPDF] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);

  // Vérifier si l'utilisateur est connecté
  useEffect(() => {
    async function checkLoginStatus() {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setIsLoggedIn(!!user);
    }

    checkLoginStatus();
  }, []);

  const billDetails: EneoBillDetails = useMemo(
    () => calculateEneoBill(totalKwh),
    [totalKwh]
  );
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

  const {
    panelsNeeded,
    batteryCapacityAh,
    chargeControllerRating,
    inverterSizeKw,
    energyNeededWithLosses,
    energyProduced,
    peakPowerW,
    batteriesInSeries,
    batteriesInParallel,
    totalBatteries,
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

  const annualSavings = energyNeededWithLosses * 365 * costKwhGrid; // Calculate for all system types
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

  const handleDownloadPDF = async () => {
    setIsDownloadingPDF(true);
    try {
      const response = await fetch("/api/generate-pdf", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          aiSummary,
          formData,
          results,
          totalKwh,
          applianceCostBreakdown,
          systemDiagram,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate PDF");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${
        formData.projectDetails.projectName || "rapport"
      }-solarcal.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error downloading PDF:", error);
      toast.error("Impossible de générer le PDF. Veuillez réessayer.");
    } finally {
      setIsDownloadingPDF(false);
    }
  };

  // Handle JSON download
  const handleDownloadJSON = () => {
    try {
      // Create a project object similar to the one in projects page
      const projectData = {
        name: formData.projectDetails.projectName,
        form_data: formData,
        results: results,
      };

      // Create and download the JSON file
      const blob = new Blob([JSON.stringify(projectData, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${formData.projectDetails.projectName.replace(
        /\s+/g,
        "_"
      )}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);

      toast.success("Fichier JSON téléchargé avec succès");
    } catch (error) {
      console.error("Error downloading JSON:", error);
      toast.error("Impossible de télécharger le fichier JSON");
    }
  };

  return (
    <div className="space-y-6" id="results-content">
      {/* Section pour les utilisateurs non connectés */}
      {isLoggedIn === false && (
        <Card className="border-yellow-400 bg-yellow-50 dark:bg-yellow-900/20">
          <CardContent className="p-4">
            <div className="flex flex-row items-center gap-2 mb-2">
              <AlertCircle className="h-5 w-5 text-yellow-600" />
              <h3 className="font-medium">
                Connectez-vous pour sauvegarder votre projet
              </h3>
            </div>
            <p className="text-sm text-muted-foreground">
              Les résultats de ce calcul sont temporaires. Pour sauvegarder
              votre projet et y accéder ultérieurement, veuillez vous connecter
              ou créer un compte.
            </p>
            <div className="mt-3 flex flex-row gap-2">
              <Button variant="outline" size="sm" asChild>
                <a href="/login">Se connecter</a>
              </Button>
              <Button variant="outline" size="sm" asChild>
                <a href="/signup">Créer un compte</a>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

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
              Analyse de l&apos;Investissement Solaire
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
                      Coût de l&apos;Onduleur ({inverterSizeKw} kW)
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
                    <span>Coût Total Estimé de l&apos;Installation</span>
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
                <div className="p-4 border rounded-lg">
                  <h4 className="font-semibold mb-3 text-center">
                    Indépendance Énergétique et Bénéfices Financiers
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 bg-muted rounded-lg text-center">
                      <p className="text-2xl font-bold">
                        {formatCurrency(annualSavings)}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Équivalent d&apos;économies annuelles
                      </p>
                    </div>
                    <div className="p-4 bg-muted rounded-lg text-center">
                      <p className="text-2xl font-bold">{roiYears} ans</p>
                      <p className="text-sm text-muted-foreground">
                        Retour sur investissement estimé
                      </p>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground mt-3">
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

          {systemType !== "grid-tied" && (
            <div className="mt-4">
              <h3 className="text-lg font-semibold mb-4">
                Configuration des Batteries
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-muted rounded-lg text-center">
                  <p className="text-2xl font-bold">
                    {formatNumber(batteriesInSeries)}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Batteries en série (NBS)
                  </p>
                </div>
                <div className="p-4 bg-muted rounded-lg text-center">
                  <p className="text-2xl font-bold">
                    {formatNumber(batteriesInParallel)}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Batteries en parallèle (NBP)
                  </p>
                </div>
                <div className="p-4 bg-muted rounded-lg text-center">
                  <p className="text-2xl font-bold">
                    {formatNumber(totalBatteries)}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Nombre total de batteries
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Puissance et Énergie */}
          <div className="mt-4">
            <h3 className="text-lg font-semibold mb-4">Puissance et Énergie</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-muted rounded-lg text-center">
                <p className="text-2xl font-bold">
                  {formatNumber(Math.round(peakPowerW))} Wc
                </p>
                <p className="text-sm text-muted-foreground">
                  Puissance Crête (PC)
                </p>
              </div>
              <div className="p-4 bg-muted rounded-lg text-center">
                <p className="text-2xl font-bold">
                  {formatNumber(energyProduced)} kWh/jour
                </p>
                <p className="text-sm text-muted-foreground">
                  Énergie Produite
                </p>
              </div>
            </div>
          </div>

          {/* Indicateurs spécifiques par type de système */}
          {systemType === "grid-tied" &&
            results.dailyGridExport !== undefined && (
              <div className="mt-6 p-4 border rounded-lg">
                <h3 className="text-lg font-semibold mb-3">
                  Indicateurs Spécifiques - Système Connecté au Réseau
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 bg-muted rounded-lg text-center">
                    <p className="text-2xl font-bold">
                      {formatNumber(results.dailyGridExport || 0)} kWh/jour
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Injection au Réseau
                    </p>
                  </div>
                  <div className="p-4 bg-muted rounded-lg text-center">
                    <p className="text-2xl font-bold">
                      {results.selfConsumptionRate || 0}%
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Taux d&apos;Autoconsommation
                    </p>
                  </div>
                  <div className="p-4 bg-muted rounded-lg text-center">
                    <p className="text-2xl font-bold">
                      {formatCurrency(results.annualGridSavings || 0)}/an
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Économies Annuelles
                    </p>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground mt-3">
                  Ce système vous permet d&apos;injecter l&apos;excédent
                  d&apos;énergie dans le réseau pendant les heures ensoleillées
                  et de consommer l&apos;électricité du réseau pendant la nuit
                  ou lors de faible production solaire.
                </p>
              </div>
            )}

          {systemType === "off-grid" && results.autonomyHours !== undefined && (
            <div className="mt-6 p-4 border rounded-lg">
              <h3 className="text-lg font-semibold mb-3">
                Indicateurs Spécifiques - Système Autonome
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-muted rounded-lg text-center">
                  <p className="text-2xl font-bold">
                    {formatNumber(results.autonomyHours || 0)} heures
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Autonomie Effective
                  </p>
                </div>
                <div className="p-4 bg-muted rounded-lg text-center">
                  <p className="text-2xl font-bold">
                    {formatNumber(
                      Math.round(
                        (batteryCapacityAh *
                          parseInt(formData.systemParameters.systemVoltage)) /
                          1000
                      )
                    )}{" "}
                    kWh
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Capacité de Stockage
                  </p>
                </div>
              </div>
              <p className="text-sm text-muted-foreground mt-3">
                Ce système autonome vous affranchit complètement du réseau
                électrique et vous protège des coupures. Son dimensionnement
                prend en compte vos besoins quotidiens plus une marge de
                sécurité pour les périodes peu ensoleillées.
              </p>
            </div>
          )}

          {systemType === "hybrid" &&
            results.gridDependencyRate !== undefined && (
              <div className="mt-6 p-4 border rounded-lg">
                <h3 className="text-lg font-semibold mb-3">
                  Indicateurs Spécifiques - Système Hybride
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 bg-muted rounded-lg text-center">
                    <p className="text-2xl font-bold">
                      {results.backupDuration || 0} heures
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Backup en cas de coupure
                    </p>
                  </div>
                  <div className="p-4 bg-muted rounded-lg text-center">
                    <p className="text-2xl font-bold">
                      {results.gridDependencyRate || 0}%
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Dépendance au réseau
                    </p>
                  </div>
                  <div className="p-4 bg-muted rounded-lg text-center">
                    <p className="text-2xl font-bold">
                      {formatNumber(results.dailyGridExchange || 0)} kWh/jour
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Échange Quotidien
                    </p>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground mt-3">
                  Ce système hybride vous offre une solution équilibrée entre
                  l&apos;indépendance énergétique et l&apos;optimisation des
                  coûts. Il permet de stocker l&apos;énergie solaire pour une
                  utilisation nocturne et offre une sécurité en cas de coupure
                  du réseau.
                </p>
              </div>
            )}

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
      <div className="flex justify-center mt-8 space-x-4">
        <Button
          onClick={handleDownloadPDF}
          disabled={isDownloadingPDF}
          className="bg-primary text-primary-foreground">
          {isDownloadingPDF ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Téléchargement...
            </>
          ) : (
            <>
              <FileText className="mr-2 h-4 w-4" />
              Télécharger en PDF
            </>
          )}
        </Button>

        <Button
          onClick={handleDownloadJSON}
          variant="outline"
          className="border-primary text-primary hover:bg-primary/10">
          <FileJson className="mr-2 h-4 w-4" />
          Télécharger en JSON
        </Button>
      </div>
    </div>
  );
}

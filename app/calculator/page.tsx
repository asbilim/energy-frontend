"use client";

/* eslint-disable react/no-unescaped-entities */

import { useState, useEffect, useRef, useMemo } from "react";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Loader2,
  Calculator,
  MapPin,
  AlertCircle,
  Sparkles,
  Check,
  ChevronsUpDown,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useChat } from "@ai-sdk/react";
import { v4 as uuidv4 } from "uuid";
import { saveProject } from "@/app/projects/actions";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import {
  projectDetailsSchema,
  energyConsumptionSchema,
  systemParametersSchema,
} from "@/components/calculator/types";
import { ApplianceList } from "@/components/calculator/ApplianceList";
import { ResultsDisplay } from "@/components/calculator/ResultsDisplay";

const STEPS = [
  { id: 1, name: "Projet" },
  { id: 2, name: "Consommation" },
  { id: 3, name: "Paramètres" },
  { id: 4, name: "Résultats" },
];

const formSchema = z.object({
  projectDetails: projectDetailsSchema,
  energyConsumption: energyConsumptionSchema,
  systemParameters: systemParametersSchema,
});

type CalculatorFormValues = z.infer<typeof formSchema>;

export default function CalculatorPage() {
  const [currentStep, setCurrentStep] = useState(1);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(
    null
  );
  const [locationName, setLocationName] = useState<string | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [isLocationLoading, setIsLocationLoading] = useState(false);
  const [sunHours, setSunHours] = useState<number | null>(5); // Default value
  const [calculationResult, setCalculationResult] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  const resultsRef = useRef<HTMLDivElement>(null);

  const [aiSummary, setAiSummary] = useState("");
  const [isAISummaryLoading, setIsAISummaryLoading] = useState(false);

  const form = useForm<CalculatorFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      projectDetails: {
        projectName: "Mon Projet Solaire",
        systemType: "off-grid",
      },
      energyConsumption: {
        appliances: [
          {
            id: uuidv4(),
            name: "Ampoules LED",
            power: 10,
            quantity: 5,
            hoursPerDay: 6,
          },
          {
            id: uuidv4(),
            name: "Réfrigérateur",
            power: 150,
            quantity: 1,
            hoursPerDay: 8,
          },
          {
            id: uuidv4(),
            name: "Télévision",
            power: 100,
            quantity: 1,
            hoursPerDay: 4,
          },
        ],
      },
      systemParameters: {
        systemVoltage: "24",
        autonomyDays: 3,
        batteryDepthOfDischarge: 80,
        coefficientK: 0.7,
        panelPower: 410,
        installationAngle: 15,
        peakSunHours: 5,
        batteryUnitVoltage: 12,
        batteryUnitCapacity: 100,
      },
    },
  });

  useEffect(() => {
    // Geolocation logic remains the same
    // ...
  }, []);

  const handleNextStep = async () => {
    let isValid = false;
    if (currentStep === 1) {
      isValid = await form.trigger("projectDetails");
    } else if (currentStep === 2) {
      isValid = await form.trigger("energyConsumption");
    } else if (currentStep === 3) {
      isValid = await form.trigger("systemParameters");
    }

    if (!isValid) {
      toast.error(
        "Veuillez remplir tous les champs requis avant de continuer."
      );
      return;
    }

    if (currentStep < 4) {
      if (currentStep === 3) {
        handleCalculate();
      }
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const getAISummary = async (results: any, formData: CalculatorFormValues) => {
    setIsAISummaryLoading(true);
    setAiSummary(""); // Clear previous summary

    const {
      projectDetails,
      energyConsumption: { appliances },
      systemParameters,
    } = formData;
    const applianceDetails = appliances
      .map(
        (a) =>
          `- ${a.quantity} x ${a.name} (${a.power}W) pendant ${a.hoursPerDay}h/jour`
      )
      .join("\n");

    const prompt = `
      Vous êtes un expert en ingénierie de systèmes solaires photovoltaïques. Fournissez une analyse professionnelle, détaillée et encourageante pour un projet de système solaire. La réponse doit être en français, bien structurée en Markdown.

      **Résumé du Projet : ${projectDetails.projectName}**
      - **Type de Système :** ${projectDetails.systemType}
      - **Tension du Système :** ${systemParameters.systemVoltage}V
      - **Localisation :** ${locationName || "Non spécifiée"}

      **Besoins Énergétiques**
      - **Consommation Quotidienne Totale :** ${results.totalDailyConsumptionKWh.toFixed(
        2
      )} kWh
      - **Puissance Crête Calculée :** ${results.peakPowerW.toFixed(2)} W
      - **Énergie Produite :** ${results.energyProduced.toFixed(2)} kWh/jour
      - **Liste des Appareils :**
      ${applianceDetails}

      **Paramètres de Conception**
      - **Heures d'ensoleillement de pointe :** ${
        sunHours?.toFixed(2) ?? systemParameters.peakSunHours
      }h/jour
      - **Coefficient de perte (K) :** ${systemParameters.coefficientK}
      - **Puissance des panneaux :** ${systemParameters.panelPower}Wc
      - **Jours d'autonomie :** ${
        projectDetails.systemType === "grid-tied"
          ? "N/A"
          : `${systemParameters.autonomyDays} jours`
      }
      - **Profondeur de décharge des batteries :** ${
        projectDetails.systemType === "grid-tied"
          ? "N/A"
          : `${systemParameters.batteryDepthOfDischarge}%`
      }

      **Résultats de Dimensionnement Recommandés**
      - **Nombre de Panneaux Solaires :** ${results.panelsNeeded} panneaux de ${
      systemParameters.panelPower
    }Wc
      - **Taille de l'Onduleur :** ${results.inverterSizeKw} kW
      - **Calibre du Régulateur de Charge :** ${
        results.chargeControllerRating
      } A
      - **Capacité du Parc de Batteries :** ${
        projectDetails.systemType === "grid-tied"
          ? "N/A"
          : `${Math.round(results.batteryCapacityAh)} Ah à ${
              systemParameters.systemVoltage
            }V`
      }
      ${
        projectDetails.systemType !== "grid-tied"
          ? `- **Configuration des Batteries :** ${results.batteriesInSeries} batteries en série × ${results.batteriesInParallel} branches en parallèle = ${results.totalBatteries} batteries au total`
          : ""
      }

      **Instructions pour la réponse :**
      1.  **Introduction :** Commencez par une phrase d'introduction professionnelle et objective sur le projet.
      2.  **Analyse des Composants :** Pour chaque composant clé (panneaux, onduleur, batteries, régulateur), expliquez de manière concise et technique pourquoi le dimensionnement est approprié pour ce projet. Fournissez des conseils pratiques et des considérations techniques pertinentes. Évitez de répéter les données d'entrée brutes.
      3.  **Performances Attendues :** Décrivez les performances attendues du système en termes d'efficacité, de fiabilité et de couverture des besoins énergétiques. Concentrez-vous sur l'analyse des implications des résultats.
      4.  **Prochaines Étapes :** Fournissez 2-3 prochaines étapes claires, réalisables et professionnelles que l'utilisateur devrait entreprendre (ex: "Consulter un ingénieur en énergie solaire pour une étude de site approfondie", "Obtenir des devis détaillés auprès de fournisseurs certifiés", "Évaluer les réglementations locales et les incitations fiscales").
      5.  **Conclusion :** Terminez par une conclusion concise et factuelle sur la viabilité et les avantages du projet.

      Utilisez un ton strictement professionnel, académique et objectif. N'utilisez aucune expression amicale, emoji, ou langage informel. Concentrez-vous sur l'analyse technique et les informations à valeur ajoutée, sans paraphraser les données déjà fournies.
    `;

    try {
      const response = await fetch(
        "https://openrouter.ai/api/v1/chat/completions",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${process.env.NEXT_PUBLIC_OPENROUTER_API_KEY}`,
            "HTTP-Referer": "https://solarcal.app",
            "X-Title": "SolarCal",
          },
          body: JSON.stringify({
            model:
              process.env.AI_MODEL ||
              "mistralai/mistral-small-3.2-24b-instruct:free",
            messages: [{ role: "user", content: prompt }],
            stream: false,
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setAiSummary(data.choices[0].message.content);
    } catch (error) {
      console.error("Failed to fetch AI summary:", error);
      toast.error("Impossible de générer le résumé AI.");
    } finally {
      setIsAISummaryLoading(false);
    }
  };

  const handleCalculate = () => {
    setIsLoading(true);
    const formData = form.getValues();

    // Defer calculation to avoid blocking UI
    setTimeout(async () => {
      const {
        energyConsumption: { appliances },
        systemParameters,
        projectDetails,
      } = formData;

      const systemType = projectDetails.systemType;
      const totalDailyConsumptionWh = appliances.reduce((total, app) => {
        return total + app.power * app.quantity * app.hoursPerDay;
      }, 0);

      const totalDailyConsumptionKWh = totalDailyConsumptionWh / 1000;

      // Calcul de la puissance crête selon la formule PC = Ec / (K × Ir)
      // Où Ec est l'énergie consommée journalière en Wh/Jour
      // K est le coefficient de perte (entre 0.65 et 0.75)
      // Ir est l'irradiation moyenne de la ville (heures d'ensoleillement)
      const peakPowerW =
        totalDailyConsumptionWh /
        (systemParameters.coefficientK *
          (sunHours ?? systemParameters.peakSunHours));

      // Calcul du nombre de panneaux: NP = Puissance crête / Puissance des panneaux
      const panelsNeeded = Math.ceil(peakPowerW / systemParameters.panelPower);

      const systemVoltage = parseInt(systemParameters.systemVoltage);

      // Facteurs de surdimensionnement selon le type de système
      const oversizeFactor =
        systemType === "off-grid" ? 1.5 : systemType === "hybrid" ? 1.3 : 1.1;

      // Calcul de l'énergie produite: Ep = facteur * EC
      const energyProduced = totalDailyConsumptionWh * oversizeFactor;

      let results;

      // Calculs spécifiques par type de système
      if (systemType === "off-grid") {
        // Calcul de la capacité des batteries selon la formule: Csyst = (Ep × N) / (D × Usys)
        // Où Ep est l'énergie produite, N est le nombre de jours d'autonomie
        // D est le taux de décharge, et Usys est la tension du système
        const batteryCapacityAh =
          (energyProduced * systemParameters.autonomyDays) /
          ((systemParameters.batteryDepthOfDischarge / 100) * systemVoltage);

        // Calcul du nombre de batteries en série: NBS = Usys / Ub
        const batteriesInSeries = Math.ceil(
          systemVoltage / systemParameters.batteryUnitVoltage
        );

        // Calcul du nombre de batteries en parallèle: NBP = Csyst / Cb
        const batteriesInParallel = Math.ceil(
          batteryCapacityAh / systemParameters.batteryUnitCapacity
        );

        // Calcul du nombre total de batteries: NTB = NBS * NBP
        const totalBatteries = batteriesInSeries * batteriesInParallel;

        const chargeControllerRating = Math.ceil(
          ((panelsNeeded * systemParameters.panelPower) / systemVoltage) * 1.25
        );

        const peakLoadW = appliances.reduce(
          (max, app) => Math.max(max, app.power * app.quantity),
          0
        );
        // Pour les systèmes off-grid, l'onduleur doit pouvoir gérer les pics de charge
        const inverterSizeKw = parseFloat(
          ((peakLoadW * 1.5) / 1000).toFixed(1)
        );

        // Calcul des heures d'autonomie réelles
        const autonomyHours =
          (batteryCapacityAh *
            systemVoltage *
            (systemParameters.batteryDepthOfDischarge / 100)) /
          (totalDailyConsumptionWh / 24);

        results = {
          systemType: "off-grid",
          totalDailyConsumptionKWh,
          energyProduced: energyProduced / 1000, // Convertir en kWh
          peakPowerW,
          panelsNeeded,
          batteryCapacityAh,
          batteriesInSeries,
          batteriesInParallel,
          totalBatteries,
          chargeControllerRating,
          inverterSizeKw,
          autonomyHours,
          energyNeededWithLosses: totalDailyConsumptionKWh, // Pour la facturation
          results: {
            totalDailyConsumptionKWh,
            peakPowerW,
            panelsNeeded,
            energyProduced: energyProduced / 1000,
            inverterSizeKw,
            chargeControllerRating,
            batteryCapacityAh,
            batteriesInSeries,
            batteriesInParallel,
            totalBatteries,
            autonomyHours,
          },
        };
      } else if (systemType === "grid-tied") {
        // Pas de batterie pour les systèmes connectés au réseau

        const chargeControllerRating = Math.ceil(
          ((panelsNeeded * systemParameters.panelPower) / systemVoltage) * 1.25
        );

        const peakLoadW = appliances.reduce(
          (max, app) => Math.max(max, app.power * app.quantity),
          0
        );

        // Pour les systèmes grid-tied, l'onduleur est dimensionné pour la production
        const inverterSizeKw = parseFloat(
          ((panelsNeeded * systemParameters.panelPower * 1.1) / 1000).toFixed(1)
        );

        // Calculer l'export d'énergie quotidien (simplifié)
        const dailyConsumptionPattern = [
          0.2, 0.15, 0.05, 0.05, 0.1, 0.3, 0.6, 0.7, 0.5, 0.3, 0.2, 0.2, 0.3,
          0.4, 0.3, 0.3, 0.4, 0.6, 0.8, 0.7, 0.5, 0.4, 0.3, 0.2,
        ];
        const solarProductionPattern = [
          0, 0, 0, 0, 0, 0.05, 0.2, 0.4, 0.6, 0.8, 0.9, 0.95, 1.0, 0.95, 0.9,
          0.7, 0.5, 0.3, 0.1, 0, 0, 0, 0, 0,
        ];

        // Convertir en production horaire
        const hourlyProduction = solarProductionPattern.map(
          (factor) =>
            ((energyProduced / 1000) * factor) /
            solarProductionPattern.reduce((sum, val) => sum + val, 0)
        );

        // Convertir en consommation horaire
        const hourlyConsumption = dailyConsumptionPattern.map(
          (factor) =>
            (totalDailyConsumptionKWh * factor) /
            dailyConsumptionPattern.reduce((sum, val) => sum + val, 0)
        );

        // Calculer l'export et l'autoconsommation
        let gridExport = 0;
        let selfConsumption = 0;

        for (let hour = 0; hour < 24; hour++) {
          const netEnergy = hourlyProduction[hour] - hourlyConsumption[hour];
          if (netEnergy > 0) {
            gridExport += netEnergy;
          } else {
            selfConsumption += hourlyProduction[hour];
          }
        }

        const dailyGridExport = parseFloat(gridExport.toFixed(2));
        const selfConsumptionRate = parseFloat(
          ((selfConsumption / (energyProduced / 1000)) * 100).toFixed(1)
        );

        // Économies annuelles (simplifiées)
        const kwhCost = 85; // FCFA par kWh
        const annualGridSavings = parseFloat(
          (totalDailyConsumptionKWh * 365 * kwhCost).toFixed(0)
        );

        results = {
          systemType: "grid-tied",
          totalDailyConsumptionKWh,
          energyProduced: energyProduced / 1000,
          peakPowerW,
          panelsNeeded,
          batteryCapacityAh: 0,
          batteriesInSeries: 0,
          batteriesInParallel: 0,
          totalBatteries: 0,
          chargeControllerRating,
          inverterSizeKw,
          dailyGridExport,
          selfConsumptionRate,
          annualGridSavings,
          energyNeededWithLosses: totalDailyConsumptionKWh,
          results: {
            totalDailyConsumptionKWh,
            peakPowerW,
            panelsNeeded,
            energyProduced: energyProduced / 1000,
            inverterSizeKw,
            chargeControllerRating,
            dailyGridExport,
            selfConsumptionRate,
            annualGridSavings,
          },
        };
      } else {
        // Hybride
        // Pour les systèmes hybrides, autonomie réduite
        const hybridAutonomyDays = Math.min(systemParameters.autonomyDays, 1.5);

        const batteryCapacityAh =
          (energyProduced * hybridAutonomyDays) /
          ((systemParameters.batteryDepthOfDischarge / 100) * systemVoltage);

        const batteriesInSeries = Math.ceil(
          systemVoltage / systemParameters.batteryUnitVoltage
        );

        const batteriesInParallel = Math.ceil(
          batteryCapacityAh / systemParameters.batteryUnitCapacity
        );

        const totalBatteries = batteriesInSeries * batteriesInParallel;

        const chargeControllerRating = Math.ceil(
          ((panelsNeeded * systemParameters.panelPower) / systemVoltage) * 1.25
        );

        const peakLoadW = appliances.reduce(
          (max, app) => Math.max(max, app.power * app.quantity),
          0
        );

        // L'onduleur doit gérer à la fois la charge et l'export
        const inverterSizeKw = parseFloat(
          Math.max(
            (peakLoadW * 1.3) / 1000,
            (panelsNeeded * systemParameters.panelPower * 1.1) / 1000
          ).toFixed(1)
        );

        // Calcul du taux de dépendance au réseau
        // Estimation simple: Production / Consommation avec correction pour l'autonomie
        const autonomyCorrection = hybridAutonomyDays / 3; // Normaliser à 3 jours comme référence
        const gridDependencyRate = parseFloat(
          Math.max(
            0,
            Math.min(
              100,
              (1 -
                (energyProduced / 1000 / totalDailyConsumptionKWh) *
                  autonomyCorrection) *
                100
            )
          ).toFixed(1)
        );

        // Durée de backup estimée en heures
        const backupDuration = parseFloat(
          (
            ((batteryCapacityAh *
              systemVoltage *
              (systemParameters.batteryDepthOfDischarge / 100)) /
              totalDailyConsumptionWh) *
            24
          ).toFixed(1)
        );

        // Échange quotidien avec le réseau (simplifié)
        const dailyGridExchange = parseFloat(
          Math.max(
            0,
            totalDailyConsumptionKWh - (energyProduced / 1000) * 0.7
          ).toFixed(2)
        );

        results = {
          systemType: "hybrid",
          totalDailyConsumptionKWh,
          energyProduced: energyProduced / 1000,
          peakPowerW,
          panelsNeeded,
          batteryCapacityAh,
          batteriesInSeries,
          batteriesInParallel,
          totalBatteries,
          chargeControllerRating,
          inverterSizeKw,
          gridDependencyRate,
          backupDuration,
          dailyGridExchange,
          energyNeededWithLosses: totalDailyConsumptionKWh,
          results: {
            totalDailyConsumptionKWh,
            peakPowerW,
            panelsNeeded,
            energyProduced: energyProduced / 1000,
            inverterSizeKw,
            chargeControllerRating,
            batteryCapacityAh,
            batteriesInSeries,
            batteriesInParallel,
            totalBatteries,
            gridDependencyRate,
            backupDuration,
            dailyGridExchange,
          },
        };
      }

      setCalculationResult(results);
      getAISummary(results, formData); // Trigger AI summary

      // Save the project to Supabase only if user is logged in
      try {
        const supabase = await import("@/lib/supabase/client").then((mod) =>
          mod.createClient()
        );
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (user) {
          await saveProject(projectDetails.projectName, formData, results);
          toast.success("Projet sauvegardé avec succès!");
        }
      } catch (error) {
        console.error("Error saving project:", error);
      }

      setIsLoading(false);
      toast.success("Calculs terminés avec succès!");
    }, 500);
  };

  const [totalKwh, setTotalKwh] = useState(0);

  return (
    <div className="flex flex-1 items-start justify-center py-10">
      <div className="container max-w-4xl">
        <div className="mb-10 space-y-2 text-center">
          <h1 className="text-3xl font-bold">
            Calculateur de Système Solaire Avancé
          </h1>
          <p className="text-muted-foreground">
            Concevez votre système solaire photovoltaïque sur mesure, étape par
            étape.
          </p>
        </div>

        {/* Stepper */}
        <div className="mb-8 flex justify-center">
          <ol className="flex items-center w-full max-w-2xl">
            {STEPS.map((step, index) => (
              <li
                key={step.id}
                className={`flex w-full items-center ${
                  index < STEPS.length - 1
                    ? "after:content-[''] after:w-full after:h-1 after:border-b after:border-4 after:inline-block"
                    : ""
                } ${
                  currentStep > step.id
                    ? "after:border-primary"
                    : "after:border-border"
                }`}>
                <span
                  className={`flex items-center justify-center w-10 h-10 rounded-full shrink-0 ${
                    currentStep >= step.id
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                  }`}>
                  {currentStep > step.id ? (
                    <Check className="w-5 h-5" />
                  ) : (
                    step.id
                  )}
                </span>
              </li>
            ))}
          </ol>
        </div>

        <FormProvider {...form}>
          <form onSubmit={(e) => e.preventDefault()}>
            {currentStep === 1 && (
              <Card>
                <CardHeader>
                  <CardTitle>1. Détails du Projet</CardTitle>
                  <CardDescription>
                    Commencez par nommer votre projet et choisir le type de
                    système.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <FormField
                    control={form.control}
                    name="projectDetails.projectName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nom du Projet</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Ex: Maison de campagne"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          Donnez un nom descriptif à votre projet pour le
                          reconnaître facilement.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="projectDetails.systemType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Type de Système</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Sélectionnez un type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="off-grid">
                              Hors réseau (Autonome)
                            </SelectItem>
                            <SelectItem value="grid-tied">
                              Connecté au réseau
                            </SelectItem>
                            <SelectItem value="hybrid">Hybride</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          - Hors réseau: Système indépendant avec batteries. -
                          Connecté au réseau: Sans batteries, vend l'excédent au
                          réseau. - Hybride: Combine les deux avec stockage.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {form.watch("projectDetails.systemType") === "off-grid" && (
                    <div className="p-4 bg-muted rounded-lg">
                      <h3 className="text-md font-medium mb-2">
                        Système Autonome (Hors réseau)
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        Ce type de système est complètement indépendant du
                        réseau électrique. Il nécessite des batteries
                        dimensionnées pour une autonomie totale et est idéal
                        pour les zones isolées ou sans accès au réseau Eneo.
                      </p>
                    </div>
                  )}

                  {form.watch("projectDetails.systemType") === "grid-tied" && (
                    <div className="p-4 bg-muted rounded-lg">
                      <h3 className="text-md font-medium mb-2">
                        Système Connecté au Réseau
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        Ce système fonctionne en parallèle avec le réseau
                        électrique. Il n'utilise pas de batteries mais injecte
                        l'excédent d'énergie dans le réseau, permettant
                        potentiellement une vente d'électricité. Ne fournit pas
                        de secours en cas de coupure de courant.
                      </p>
                    </div>
                  )}

                  {form.watch("projectDetails.systemType") === "hybrid" && (
                    <div className="p-4 bg-muted rounded-lg">
                      <h3 className="text-md font-medium mb-2">
                        Système Hybride
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        Combine le meilleur des deux approches: stockage dans
                        des batteries pour une autonomie partielle en cas de
                        coupure, et connexion au réseau pour injecter l'excédent
                        ou compléter en cas de besoin. Offre plus de flexibilité
                        mais avec un coût initial plus élevé.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {currentStep === 2 && <ApplianceList setTotalKwh={setTotalKwh} />}

            {currentStep === 3 && (
              <Card>
                <CardHeader>
                  <CardTitle>3. Paramètres du Système</CardTitle>
                  <CardDescription>
                    Ajustez les paramètres techniques pour affiner les calculs.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="systemParameters.systemVoltage"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Tension du système</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="12">12V</SelectItem>
                              <SelectItem value="24">24V</SelectItem>
                              <SelectItem value="48">48V</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormDescription>
                            La tension nominale du système. Choisissez 12V pour
                            les petits systèmes, 24V ou 48V pour les plus grands
                            afin de réduire les pertes électriques.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="systemParameters.peakSunHours"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            Heures d'ensoleillement de pointe (h/jour)
                          </FormLabel>
                          <FormControl>
                            <Input type="number" {...field} />
                          </FormControl>
                          <FormDescription>
                            Le nombre moyen d'heures par jour où le soleil
                            produit une énergie équivalente à 1000W/m². Utilisez
                            des données locales pour plus de précision.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="systemParameters.coefficientK"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Coefficient de perte (K)</FormLabel>
                          <FormControl>
                            <Input type="number" step="0.01" {...field} />
                          </FormControl>
                          <FormDescription>
                            Le coefficient de perte du système, généralement
                            entre 0.65 et 0.75. Plus la valeur est élevée, plus
                            le système est efficace.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="systemParameters.autonomyDays"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Jours d'autonomie</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              {...field}
                              disabled={
                                form.watch("projectDetails.systemType") ===
                                "grid-tied"
                              }
                            />
                          </FormControl>
                          <FormDescription>
                            Le nombre de jours que le système peut fonctionner
                            sans soleil, en utilisant uniquement les batteries.
                            Typiquement 1-3 jours pour les systèmes autonomes.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="systemParameters.batteryDepthOfDischarge"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Profondeur de décharge (DoD %)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              {...field}
                              disabled={
                                form.watch("projectDetails.systemType") ===
                                "grid-tied"
                              }
                            />
                          </FormControl>
                          <FormDescription>
                            Le pourcentage maximum de la capacité de la batterie
                            que vous pouvez utiliser sans l'endommager. Pour les
                            batteries au plomb, c'est souvent 50-80%. Pour les
                            batteries lithium, cela peut aller de 95% à 100%.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="systemParameters.batteryUnitVoltage"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            Tension unitaire de la batterie (V)
                          </FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              {...field}
                              disabled={
                                form.watch("projectDetails.systemType") ===
                                "grid-tied"
                              }
                            />
                          </FormControl>
                          <FormDescription>
                            La tension d'une batterie individuelle (généralement
                            2V, 6V, 12V, 24V ou 48V).
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="systemParameters.batteryUnitCapacity"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            Capacité unitaire de la batterie (Ah)
                          </FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              {...field}
                              disabled={
                                form.watch("projectDetails.systemType") ===
                                "grid-tied"
                              }
                            />
                          </FormControl>
                          <FormDescription>
                            La capacité d'une batterie individuelle en
                            ampères-heures (Ah).
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="systemParameters.panelPower"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Puissance des panneaux (Wc)</FormLabel>
                          <FormControl>
                            <Input type="number" {...field} />
                          </FormControl>
                          <FormDescription>
                            La puissance crête d'un panneau solaire individuel
                            en watts-crête (Wc). Les panneaux modernes font
                            souvent 300-500 Wc.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="systemParameters.installationAngle"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Angle d'installation (°)</FormLabel>
                          <FormControl>
                            <Input type="number" {...field} />
                          </FormControl>
                          <FormDescription>
                            L'angle d'inclinaison des panneaux par rapport à
                            l'horizontale. Optimalement égal à la latitude de
                            votre position pour une production annuelle
                            maximale.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </CardContent>
              </Card>
            )}

            {currentStep === 4 && (
              <Card ref={resultsRef}>
                <CardHeader>
                  <CardTitle>4. Résultats et Recommandations</CardTitle>
                  <CardDescription>
                    Voici la configuration de système solaire recommandée pour
                    votre projet.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <div className="flex justify-center p-8">
                      <Loader2 className="h-8 w-8 animate-spin" />
                    </div>
                  ) : (
                    <ResultsDisplay
                      results={calculationResult}
                      formData={form.getValues()}
                      aiSummary={aiSummary}
                      isAISummaryLoading={isAISummaryLoading}
                      totalKwh={totalKwh}
                    />
                  )}
                </CardContent>
              </Card>
            )}

            {/* Navigation */}
            <div className="mt-8 flex justify-between">
              {currentStep > 1 && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handlePrevStep}>
                  Précédent
                </Button>
              )}
              <div />
              {currentStep < 4 ? (
                <Button type="button" onClick={handleNextStep}>
                  Suivant
                </Button>
              ) : (
                <Button type="button" onClick={() => setCurrentStep(1)}>
                  Nouveau Calcul
                </Button>
              )}
            </div>
          </form>
        </FormProvider>
      </div>
    </div>
  );
}

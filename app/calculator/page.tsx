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
import { useCompletion } from "ai/react";
import { v4 as uuidv4 } from "uuid";

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

  const {
    completion,
    complete,
    isLoading: isAISummaryLoading,
  } = useCompletion({
    api: "/api/chat",
    onError: (error) => {
      toast.error("Impossible de générer le résumé AI.");
    },
  });

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
        efficiencyLoss: 20,
        panelPower: 410,
        installationAngle: 15,
        peakSunHours: 5,
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

  const getAISummary = (results: any, formData: CalculatorFormValues) => {
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
      - **Consommation avec Pertes (+${
        systemParameters.efficiencyLoss
      }%) :** ${results.energyNeededWithLosses.toFixed(2)} kWh
      - **Liste des Appareils :**
      ${applianceDetails}

      **Paramètres de Conception**
      - **Heures d'ensoleillement de pointe :** ${
        sunHours?.toFixed(2) ?? systemParameters.peakSunHours
      }h/jour
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

      **Instructions pour la réponse :**
      1.  **Introduction :** Commencez par une phrase d'introduction positive et encourageante sur le projet.
      2.  **Analyse des Composants :** Pour chaque composant clé (panneaux, onduleur, batteries, régulateur), expliquez brièvement pourquoi le dimensionnement est approprié pour ce projet. Donnez des conseils pratiques. Par exemple, pour les panneaux, suggérez une configuration de câblage simple (ex: "X chaînes en série de Y panneaux").
      3.  **Performances Attendues :** Décrivez ce que l'utilisateur peut attendre de cette installation. En quoi ce système couvrira-t-il ses besoins ?
      4.  **Prochaines Étapes :** Fournissez 2-3 prochaines étapes claires et réalisables que l'utilisateur devrait entreprendre (ex: "Contacter un installateur local certifié", "Demander des devis pour ces composants", "Vérifier l'espace de toit disponible").
      5.  **Conclusion :** Terminez par une note optimiste sur les bénéfices de l'énergie solaire.

      Utilisez un ton professionnel mais accessible. La mise en forme (gras, listes, titres) est cruciale pour la lisibilité.
    `;

    complete(prompt);
  };

  const handleCalculate = () => {
    setIsLoading(true);
    const formData = form.getValues();

    // Defer calculation to avoid blocking UI
    setTimeout(() => {
      const {
        energyConsumption: { appliances },
        systemParameters,
        projectDetails,
      } = formData;

      const totalDailyConsumptionWh = appliances.reduce((total, app) => {
        return total + app.power * app.quantity * app.hoursPerDay;
      }, 0);

      const totalDailyConsumptionKWh = totalDailyConsumptionWh / 1000;

      const energyNeededWithLosses =
        totalDailyConsumptionKWh * (1 + systemParameters.efficiencyLoss / 100);

      const panelsNeeded = Math.ceil(
        (energyNeededWithLosses * 1000) /
          (systemParameters.panelPower * (sunHours ?? 5))
      );

      const systemVoltage = parseInt(systemParameters.systemVoltage);

      const batteryCapacityAh =
        projectDetails.systemType !== "grid-tied"
          ? (energyNeededWithLosses * 1000 * systemParameters.autonomyDays) /
            ((systemParameters.batteryDepthOfDischarge / 100) * systemVoltage)
          : 0;

      const chargeControllerRating = Math.ceil(
        ((panelsNeeded * systemParameters.panelPower) / systemVoltage) * 1.25
      );

      const peakPowerW = appliances.reduce(
        (max, app) => Math.max(max, app.power * app.quantity),
        0
      );
      const inverterSizeKw = parseFloat(
        ((peakPowerW * 1.25) / 1000).toFixed(1)
      );

      const results = {
        totalDailyConsumptionKWh,
        energyNeededWithLosses,
        panelsNeeded,
        batteryCapacityAh,
        chargeControllerRating,
        inverterSizeKw,
      };

      setCalculationResult(results);
      getAISummary(results, formData); // Trigger AI summary
      setIsLoading(false);
      toast.success("Calculs terminés avec succès!");
    }, 500);
  };

  const totalConsumption = useMemo(() => {
    const appliances = form.watch("energyConsumption.appliances");
    if (!appliances) return { Wh: 0, kWh: 0 };
    const totalWh = appliances.reduce(
      (acc, app) => acc + app.power * app.quantity * app.hoursPerDay,
      0
    );
    return { Wh: totalWh, kWh: totalWh / 1000 };
  }, [form.watch("energyConsumption.appliances")]);

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
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
            )}

            {currentStep === 2 && <ApplianceList />}

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
                            Typiquement 2-3 jours pour les systèmes autonomes.
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
                            batteries au plomb, c'est souvent 50-80%.
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
                    <FormField
                      control={form.control}
                      name="systemParameters.efficiencyLoss"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Pertes d'efficacité (%)</FormLabel>
                          <FormControl>
                            <Input type="number" {...field} />
                          </FormControl>
                          <FormDescription>
                            Le pourcentage de pertes totales dans le système
                            (câbles, onduleur, etc.). Typiquement 15-25% pour un
                            système bien conçu.
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
                      aiSummary={completion}
                      isAISummaryLoading={isAISummaryLoading}
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

            {currentStep === 2 && (
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle>Résumé de la Consommation</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-lg">
                    Consommation journalière totale:{" "}
                    <span className="font-bold text-primary">
                      {totalConsumption.kWh.toFixed(2)} kWh
                    </span>{" "}
                    ({totalConsumption.Wh.toFixed(0)} Wh)
                  </p>
                </CardContent>
              </Card>
            )}
          </form>
        </FormProvider>
      </div>
    </div>
  );
}

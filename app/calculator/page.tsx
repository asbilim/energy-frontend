"use client";

/* eslint-disable react/no-unescaped-entities */

import { useState, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2, Calculator, AlertCircle, MapPin } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useCompletion } from "ai/react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";

// Define schemas for different calculator forms
const consumptionFormSchema = z.object({
  systemType: z.enum(["off-grid", "grid-connected"]),
  dailyConsumption: z.coerce
    .number()
    .min(1, "La consommation doit être d&apos;au moins 1 kWh"),
  autonomyDays: z.coerce
    .number()
    .min(1, "Les jours d&apos;autonomie doivent être d&apos;au moins 1")
    .max(14, "Maximum 14 jours d'autonomie"),
  efficiencyLoss: z.coerce
    .number()
    .min(0, "Ne peut pas être négatif")
    .max(50, "Perte maximale de 50%"),
});

const panelFormSchema = z.object({
  panelPower: z.coerce.number().min(100, "La puissance du panneau doit être d&apos;au moins 100W"),
  panelVoltage: z.enum(["12", "24", "48"]),
  installationAngle: z.coerce
    .number()
    .min(0, "L&apos;angle ne peut pas être négatif")
    .max(90, "Maximum 90 degrés"),
});

export default function CalculatorPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("consumption");
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(
    null
  );
  const [locationName, setLocationName] = useState<string | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [isLocationLoading, setIsLocationLoading] = useState(false);
  const [calculationResult, setCalculationResult] = useState<any>(null);
  const [calculationError, setCalculationError] = useState<string | null>(null);
  const [sunHours, setSunHours] = useState<number | null>(null);
  const [kwhCost, setKwhCost] = useState<number>(85); // Average cost in FCFA

  const resultsRef = useRef<HTMLDivElement>(null);

  const {
    completion,
    complete,
    isLoading: isAISummaryLoading,
  } = useCompletion({
    api: "/api/chat",
    onError: (error) => {
      console.error("Erreur de résumé AI :", error);
      toast.error("Impossible de générer le résumé AI.");
    },
    headers: {
      "Content-Type": "application/json",
    },
  });

  const consumptionForm = useForm<z.infer<typeof consumptionFormSchema>>({
    resolver: zodResolver(consumptionFormSchema),
    defaultValues: {
      systemType: "grid-connected",
      dailyConsumption: 10,
      autonomyDays: 3,
      efficiencyLoss: 20,
    },
  });

  const panelForm = useForm<z.infer<typeof panelFormSchema>>({
    resolver: zodResolver(panelFormSchema),
    defaultValues: {
      panelPower: 400,
      panelVoltage: "24",
      sunHoursPerDay: 5,
      installationAngle: 30,
    },
  });

  // Get user location on component mount
  useEffect(() => {
    const getLocation = async () => {
      setIsLocationLoading(true);
      setLocationError(null);

      if (!navigator.geolocation) {
        setLocationError("La géolocalisation n'est pas prise en charge par votre navigateur");
        setIsLocationLoading(false);
        return;
      }

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          setLocation({
            lat: latitude,
            lng: longitude,
          });

          // Fetch sun hours
          try {
            const sunHoursResponse = await fetch(
              `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&daily=sunshine_duration`
            );
            const sunHoursData = await sunHoursResponse.json();
            if (sunHoursData && sunHoursData.daily && sunHoursData.daily.sunshine_duration) {
              // Get the average of the next 7 days
              const totalSunHours = sunHoursData.daily.sunshine_duration
                .slice(0, 7)
                .reduce((a: number, b: number) => a + b, 0);
              const averageSunHours = totalSunHours / 7 / 3600; // Convert seconds to hours
              setSunHours(averageSunHours);
              toast.success(`Heures d'ensoleillement moyennes récupérées : ${averageSunHours.toFixed(2)}h/jour`);
            } else {
              throw new Error("Impossible de récupérer les données d'ensoleillement.");
            }
          } catch (error) {
            setSunHours(null);
            toast.warning("Impossible de récupérer les données d'ensoleillement, veuillez les saisir manuellement.");
          }

          try {
            const response = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
            );
            const data = await response.json();
            if (data && data.address) {
              const { city, town, village, country } = data.address;
              const locationString = [
                city || town || village,
                country,
              ]
                .filter(Boolean)
                .join(", ");
              setLocationName(locationString);
              toast.success(`Lieu détecté : ${locationString}`);
            } else {
              throw new Error("Impossible de trouver le nom du lieu.");
            }
          } catch (error) {
            setLocationName(null);
            toast.warning("Impossible de récupérer le nom du lieu, mais les coordonnées sont enregistrées.");
          }

          setIsLocationLoading(false);
        },
        (error) => {
          setLocationError("Impossible de récupérer votre position");
          setIsLocationLoading(false);
          toast.error("Échec de la détection de l'emplacement");
        }
      );
    };

    getLocation();
  }, []);

  const onConsumptionSubmit = (data: z.infer<typeof consumptionFormSchema>) => {
    setIsLoading(true);
    setCalculationError(null);

    // Simulate API call
    setTimeout(() => {
      try {
        // Example calculation logic
        const dailyEnergyNeeded =
          data.dailyConsumption * (1 + data.efficiencyLoss / 100);
        const batteryCapacity =
          data.systemType === "off-grid"
            ? (dailyEnergyNeeded * data.autonomyDays * 1000) /
              parseInt(panelForm.getValues("panelVoltage"))
            : 0;

        setCalculationResult({
          dailyEnergyNeeded,
          batteryCapacity,
          systemType: data.systemType,
        });

        setActiveTab("panels");
        setIsLoading(false);
      } catch (error) {
        setCalculationError("Erreur lors du calcul des besoins énergétiques");
        setIsLoading(false);
      }
    }, 1500);
  };

  const getAISummary = (results: any, consumptionData: any, panelData: any) => {
    const prompt = `
      Vous êtes un expert en énergie solaire. Fournissez un résumé et des recommandations détaillés et professionnels pour un système solaire photovoltaïque basé sur les données suivantes. La réponse doit être en français.

      **Données de l'utilisateur :**
      - **Type de système :** ${consumptionData.systemType}
      - **Consommation d'énergie quotidienne :** ${
        consumptionData.dailyConsumption
      } kWh
      - **Jours d'autonomie :** ${
        consumptionData.systemType === "off-grid"
          ? consumptionData.autonomyDays
          : "N/A"
      }
      - **Perte d'efficacité du système :** ${consumptionData.efficiencyLoss}%
      - **Puissance du panneau solaire :** ${panelData.panelPower}W
      - **Tension du système :** ${panelData.panelVoltage}V
      - **Heures de pointe de soleil :** ${panelData.sunHoursPerDay} heures/jour
      - **Angle d'installation :** ${panelData.installationAngle} degrés

      **Résultats des calculs :**
      - **Panneaux solaires requis :** ${results.panelsNeeded}
      - **Taille de l'onduleur :** ${results.inverterSize} kW
      - **Calibre du régulateur de charge :** ${
        results.chargeControllerRating
      } A
      - **Capacité de la batterie :** ${
        results.batteryCapacity > 0
          ? `${results.batteryCapacity.toFixed(0)} Ah`
          : "N/A"
      }
      - **Coût estimé :** ${results.totalSystemCost.toFixed(2)} €

      **Instructions :**
      1.  **Aperçu :** Commencez par un bref aperçu du système recommandé.
      2.  **Détail des composants :** détaillez chaque composant (panneaux, onduleur, batteries, régulateur de charge), en expliquant pourquoi la taille/quantité spécifiée est appropriée.
      3.  **Attentes de performance :** Expliquez brièvement ce que l'utilisateur peut attendre de ce système en termes de production d'énergie.
      4.  **Conclusion :** Concluez par un résumé des avantages du système et les prochaines étapes que vous recommanderiez.

      Formatez la réponse en utilisant la démarque pour une lisibilité claire. Utilisez des titres, du texte en gras et des listes à puces.
    `;

    console.log("Envoi de la requête de résumé AI");

    try {
      // Make sure we're sending the prompt correctly
      complete(prompt)
        .then(() => {
          console.log("Résumé AI terminé avec succès");
          setTimeout(() => {
            resultsRef.current?.scrollIntoView({ behavior: "smooth" });
          }, 300);
        })
        .catch((error) => {
          console.error("Erreur dans la complétion du résumé AI :", error);
          toast.error("Échec de la génération du résumé AI");
        });
    } catch (error) {
      console.error("Erreur lors de l'envoi de la requête de résumé AI :", error);
      toast.error("Échec de la génération du résumé AI");
    }
  };

  const onPanelSubmit = (
    data: z.infer<typeof panelFormSchema>,
    e: React.FormEvent<HTMLFormElement>
  ) => {
    setIsLoading(true);
    setCalculationError(null);

    // Simulate API call
    setTimeout(() => {
      try {
        if (!calculationResult) {
          throw new Error("Veuillez d'abord remplir le formulaire de consommation d'énergie");
        }

        if (!sunHours) {
          throw new Error("Les données d'ensoleillement n'ont pas pu être récupérées. Veuillez réessayer.");
        }

        // Example calculation logic
        const dailyEnergyNeeded = calculationResult.dailyEnergyNeeded;
        const panelsNeeded = Math.ceil(
          (dailyEnergyNeeded * 1000) / (data.panelPower * sunHours)
        );
        const systemVoltage = parseInt(data.panelVoltage);

        // Calculate inverter size (add 20% buffer)
        const inverterSize = Math.ceil(dailyEnergyNeeded * 1.2);

        // Calculate charge controller rating
        const chargeControllerRating = Math.ceil(
          ((panelsNeeded * data.panelPower) / systemVoltage) * 1.25
        );

        const finalResults = {
          ...calculationResult,
          panelsNeeded,
          inverterSize,
          chargeControllerRating,
          totalSystemCost:
            panelsNeeded * 250 +
            inverterSize * 100 +
            chargeControllerRating * 50 +
            (calculationResult.batteryCapacity > 0
              ? calculationResult.batteryCapacity * 0.2
              : 0),
          monthlySavings: dailyEnergyNeeded * 30 * kwhCost,
          annualSavings: dailyEnergyNeeded * 365 * kwhCost,
          roi: (panelsNeeded * 250 +
            inverterSize * 100 +
            chargeControllerRating * 50 +
            (calculationResult.batteryCapacity > 0
              ? calculationResult.batteryCapacity * 0.2
              : 0)) / (dailyEnergyNeeded * 365 * kwhCost),
        };

        setCalculationResult(finalResults);
        setActiveTab("results");
        toast.success("Calcul terminé avec succès");
        getAISummary(finalResults, consumptionForm.getValues(), data);
      } catch (error: any) {
        setCalculationError(
          error.message || "Erreur lors du calcul des besoins en panneaux"
        );
        toast.error("Le calcul a échoué");
      } finally {
        setIsLoading(false);
      }
    }, 1500);
  };

  const resetCalculator = () => {
    consumptionForm.reset();
    panelForm.reset();
    setCalculationResult(null);
    setCalculationError(null);
    setActiveTab("consumption");
    toast.info("Le calculateur a été réinitialisé");
  };

  const costFormatted = new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
  }).format(calculationResult?.totalSystemCost || 0);

  return (
    <div className="flex flex-1 items-start justify-center py-10">
      <div className="container max-w-4xl">
        <div className="mb-10 space-y-4 text-center">
          <h1 className="text-3xl font-bold">Calculateur de système solaire</h1>
          <p className="text-muted-foreground">
            Concevez votre système solaire photovoltaïque optimal en fonction des besoins énergétiques et des conditions environnementales.
          </p>
          {isLocationLoading && (
            <p className="text-sm text-muted-foreground flex items-center justify-center">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Détection de votre position...
            </p>
          )}
          {locationName && (
            <div className="flex items-center justify-center gap-2 text-sm font-medium text-primary">
              <MapPin className="h-4 w-4" />
              <span>{locationName}</span>
            </div>
          )}
        </div>

        {locationError && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Erreur de localisation</AlertTitle>
            <AlertDescription>
              {locationError}. Certains calculs peuvent être moins précis sans données de localisation.
            </AlertDescription>
          </Alert>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="consumption">Besoins énergétiques</TabsTrigger>
            <TabsTrigger value="panels" disabled={!calculationResult}>
              Configuration des panneaux
            </TabsTrigger>
            <TabsTrigger
              value="results"
              disabled={!calculationResult?.panelsNeeded}>
              Résultats
            </TabsTrigger>
          </TabsList>

          <TabsContent value="consumption">
            <Card>
              <CardHeader>
                <CardTitle>Consommation d'énergie</CardTitle>
                <CardDescription>
                  Définissez vos besoins énergétiques et les exigences du système
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...consumptionForm}>
                  <form
                    onSubmit={consumptionForm.handleSubmit(onConsumptionSubmit)}
                    className="space-y-6">
                    <FormField
                      control={consumptionForm.control}
                      name="systemType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Type de système</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Sélectionnez le type de système" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="grid-connected">
                                Connecté au réseau
                              </SelectItem>
                              <SelectItem value="off-grid">
                                Hors réseau (autonome)
                              </SelectItem>
                            </SelectContent>
                          </Select>
                          <FormDescription>
                            Choisissez entre un système hors réseau (autonome) ou connecté au réseau
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={consumptionForm.control}
                      name="dailyConsumption"
                      render={({ field }) => (
                        <FormItem>
                          {/* eslint-disable-next-line react/no-unescaped-entities */}
                          <FormLabel>Consommation d'énergie quotidienne (kWh)</FormLabel>
                          <FormControl>
                            <Input type="number" placeholder="10" {...field} />
                          </FormControl>
                          <FormDescription>
                            Consommation d&apos;électricité quotidienne moyenne en kilowattheures
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={consumptionForm.control}
                      name="autonomyDays"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Jours d&apos;autonomie</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              placeholder="3"
                              {...field}
                              disabled={
                                consumptionForm.watch("systemType") !==
                                "off-grid"
                              }
                            />
                          </FormControl>
                          <FormDescription>
                            Nombre de jours pendant lesquels le système doit fonctionner sans soleil (hors réseau uniquement)
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={consumptionForm.control}
                      name="efficiencyLoss"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Perte d&apos;efficacité du système (%)</FormLabel>
                          <FormControl>
                            <Input type="number" placeholder="20" {...field} />
                          </FormControl>
                          <FormDescription>
                            Tenir compte des pertes du système (câblage, onduleur, etc.)
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Button
                      type="submit"
                      disabled={isLoading}
                      className="w-full">
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Calcul en cours...
                        </>
                      ) : (
                        <>
                          <Calculator className="mr-2 h-4 w-4" />
                          Calculer les besoins énergétiques
                        </>
                      )}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="panels">
            <Card>
              <CardHeader>
                <CardTitle>Configuration des panneaux</CardTitle>
                <CardDescription>
                  Configurez votre installation de panneaux solaires
                </CardDescription>
              </CardHeader>
              <CardContent>
                {calculationResult && (
                  <div className="mb-6 p-4 bg-muted rounded-md">
                    <h3 className="font-medium mb-2">
                      Résumé des besoins énergétiques
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Énergie quotidienne nécessaire:{" "}
                      <span className="font-medium">
                        {calculationResult.dailyEnergyNeeded.toFixed(2)} kWh
                      </span>
                    </p>
                    {calculationResult.systemType === "off-grid" && (
                      <p className="text-sm text-muted-foreground">
                        Capacité de batterie nécessaire:{" "}
                        <span className="font-medium">
                          {calculationResult.batteryCapacity.toFixed(2)} Ah
                        </span>
                      </p>
                    )}
                    {sunHours && (
                       <p className="text-sm text-muted-foreground">
                        Heures d'ensoleillement moyennes:{" "}
                        <span className="font-medium">
                          {sunHours.toFixed(2)} h/jour
                        </span>
                      </p>
                    )}
                  </div>
                )}

                <Form {...panelForm}>
                  <form
                    onSubmit={(e) =>
                      panelForm.handleSubmit((data) => onPanelSubmit(data, e))(
                        e
                      )
                    }
                    className="space-y-6">
                    <FormField
                      control={panelForm.control}
                      name="panelPower"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Puissance nominale du panneau solaire (W)</FormLabel>
                          <Select
                            onValueChange={(value) =>
                              field.onChange(parseInt(value))
                            }
                            defaultValue={field.value.toString()}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Sélectionnez la puissance du panneau" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="250">250W</SelectItem>
                              <SelectItem value="300">300W</SelectItem>
                              <SelectItem value="350">350W</SelectItem>
                              <SelectItem value="400">400W</SelectItem>
                              <SelectItem value="450">450W</SelectItem>
                              <SelectItem value="500">500W</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormDescription>
                            Puissance nominale standard de chaque panneau solaire
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={panelForm.control}
                      name="panelVoltage"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Tension du système (V)</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Sélectionnez la tension du système" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="12">12V</SelectItem>
                              <SelectItem value="24">24V</SelectItem>
                              <SelectItem value="48">48V</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormDescription>
                            Tension de votre système d&apos;énergie solaire
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={panelForm.control}
                      name="installationAngle"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Angle d&apos;installation (degrés)</FormLabel>
                          <Select
                            onValueChange={(value) =>
                              field.onChange(parseInt(value))
                            }
                            defaultValue={field.value.toString()}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Sélectionnez l'angle d'installation" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="0">0° (Plat)</SelectItem>
                              <SelectItem value="15">15°</SelectItem>
                              <SelectItem value="20">20°</SelectItem>
                              <SelectItem value="25">25°</SelectItem>
                              <SelectItem value="30">30°</SelectItem>
                              <SelectItem value="35">35°</SelectItem>
                              <SelectItem value="40">40°</SelectItem>
                              <SelectItem value="45">45°</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormDescription>
                            Angle auquel les panneaux seront installés
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="flex gap-3">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setActiveTab("consumption")}
                        className="flex-1">
                        Retour
                      </Button>
                      <Button
                        type="submit"
                        disabled={isLoading}
                        className="flex-1">
                        {isLoading ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Calcul en cours...
                          </>
                        ) : (
                          <>
                            <Calculator className="mr-2 h-4 w-4" />
                            Calculer le système
                          </>
                        )}
                      </Button>
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="results">
            <Card id="results-summary" ref={resultsRef}>
              <CardHeader>
                <CardTitle>Résultats du système</CardTitle>
                <CardDescription>
                  Votre configuration optimale de système solaire photovoltaïque
                </CardDescription>
              </CardHeader>
              <CardContent>
                {calculationError ? (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Erreur de calcul</AlertTitle>
                    <AlertDescription>{calculationError}</AlertDescription>
                  </Alert>
                ) : calculationResult?.totalSystemCost !== undefined ? (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-medium mb-3">
                        Aperçu du système
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Card>
                          <CardContent className="pt-6">
                            <div className="text-2xl font-bold">
                              {calculationResult.panelsNeeded}
                            </div>
                            <p className="text-sm text-muted-foreground">
                              Panneaux solaires requis
                            </p>
                          </CardContent>
                        </Card>
                        <Card>
                          <CardContent className="pt-6">
                            <div className="text-2xl font-bold">
                              {calculationResult.inverterSize} kW
                            </div>
                            <p className="text-sm text-muted-foreground">
                              Taille de l'onduleur
                            </p>
                          </CardContent>
                        </Card>
                        <Card>
                          <CardContent className="pt-6">
                            <div className="text-2xl font-bold">
                              {calculationResult.chargeControllerRating} A
                            </div>
                            <p className="text-sm text-muted-foreground">
                              Calibre du régulateur de charge
                            </p>
                          </CardContent>
                        </Card>
                        <Card>
                          <CardContent className="pt-6">
                            <div className="text-2xl font-bold">
                              {calculationResult.batteryCapacity > 0
                                ? `${calculationResult.batteryCapacity.toFixed(
                                    0
                                  )} Ah`
                                : "N/A"}
                            </div>
                            <p className="text-sm text-muted-foreground">
                              Capacité de la batterie
                            </p>
                          </CardContent>
                        </Card>
                      </div>
                    </div>

                    <Separator />

                    <div>
                      <h3 className="text-lg font-medium mb-3">
                        Analyse Financière
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Card>
                          <CardContent className="pt-6">
                            <div className="text-2xl font-bold">
                              {new Intl.NumberFormat("fr-FR").format(
                                calculationResult.monthlySavings
                              )}{' '}
                              FCFA
                            </div>
                            <p className="text-sm text-muted-foreground">
                              Économies mensuelles estimées
                            </p>
                          </CardContent>
                        </Card>
                        <Card>
                          <CardContent className="pt-6">
                            <div className="text-2xl font-bold">
                              {new Intl.NumberFormat("fr-FR").format(
                                calculationResult.annualSavings
                              )}{' '}
                              FCFA
                            </div>
                            <p className="text-sm text-muted-foreground">
                              Économies annuelles estimées
                            </p>
                          </CardContent>
                        </Card>
                        <Card>
                          <CardContent className="pt-6">
                            <div className="text-2xl font-bold">
                              {calculationResult.roi.toFixed(1)} ans
                            </div>
                            <p className="text-sm text-muted-foreground">
                              Retour sur investissement
                            </p>
                          </CardContent>
                        </Card>
                      </div>
                    </div>

                    <Separator />

                    <div>
                      <h3 className="text-lg font-medium mb-3">
                        Estimation financière
                      </h3>
                      <Card>
                        <CardContent className="pt-6">
                          <div className="text-3xl font-bold">
                            {calculationResult?.totalSystemCost
                              ? costFormatted
                              : "N/A"}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            Coût estimé du système
                          </p>
                        </CardContent>
                      </Card>
                    </div>

                    <Separator />

                    <div>
                      <h3 className="text-lg font-medium mb-3">
                        Analyse et Recommandations
                      </h3>
                      <Card>
                        <CardContent className="pt-6">
                          {isAISummaryLoading && !completion ? (
                            <div className="space-y-4">
                              <Skeleton className="h-4 w-3/4" />
                              <Skeleton className="h-4 w-full" />
                              <Skeleton className="h-4 w-5/6" />
                            </div>
                          ) : (
                            <div className="prose prose-sm dark:prose-invert max-w-none">
                              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                {completion}
                              </ReactMarkdown>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setActiveTab("panels")}
                        className="flex-1">
                        Retour
                      </Button>
                      <Button
                        type="button"
                        onClick={resetCalculator}
                        className="flex-1">
                        Commencer un nouveau calcul
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-24 w-full" />
                    <Skeleton className="h-24 w-full" />
                    <Skeleton className="h-12 w-full" />
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

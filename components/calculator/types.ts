import * as z from "zod";

// Schema for a single appliance
export const applianceSchema = z.object({
  id: z.string().uuid().optional(), // for list key
  name: z.string().min(1, "Le nom est requis"),
  power: z.coerce.number().min(1, "La puissance doit être > 0"),
  quantity: z.coerce.number().min(1, "La quantité doit être > 0"),
  hoursPerDay: z.coerce
    .number()
    .min(0.1, "Les heures doivent être > 0")
    .max(24),
});

export type Appliance = z.infer<typeof applianceSchema>;

// Step 1: Project Details
export const projectDetailsSchema = z.object({
  projectName: z.string().min(1, "Le nom du projet est requis"),
  systemType: z.enum(["off-grid", "grid-tied", "hybrid"]),
  location: z.string().optional(),
});

export type ProjectDetails = z.infer<typeof projectDetailsSchema>;

// This will be the form schema for adding/editing appliances, managed in a list.
export const energyConsumptionSchema = z.object({
  appliances: z.array(applianceSchema),
});

export type EnergyConsumption = z.infer<typeof energyConsumptionSchema>;

// Step 3: System Parameters
const baseSystemParametersSchema = z.object({
  peakSunHours: z.coerce
    .number()
    .min(1, "Veuillez entrer une valeur valide")
    .max(12),
  systemVoltage: z.enum(["12", "24", "48"]),
  coefficientK: z.coerce
    .number()
    .min(0.65, "Le coefficient K doit être au moins 0.65")
    .max(0.75, "Le coefficient K ne peut pas dépasser 0.75"),
  panelPower: z.coerce
    .number()
    .min(100, "La puissance du panneau doit être d'au moins 100W"),
  installationAngle: z.coerce
    .number()
    .min(0, "L'angle ne peut pas être négatif")
    .max(90, "Maximum 90 degrés"),
  powerFactor: z.coerce
    .number()
    .min(0.7, "Le facteur de puissance doit être au moins 0.7")
    .max(0.95, "Le facteur de puissance ne peut pas dépasser 0.95")
    .default(0.8),
});

const offGridSystemParametersSchema = baseSystemParametersSchema.extend({
  autonomyDays: z.coerce.number().min(1).max(14),
  batteryDepthOfDischarge: z.coerce.number().min(20).max(100),
  batteryUnitVoltage: z.coerce
    .number()
    .min(1, "La tension unitaire de la batterie doit être positive"),
  batteryUnitCapacity: z.coerce
    .number()
    .min(1, "La capacité unitaire de la batterie doit être positive"),
});

const gridTiedSystemParametersSchema = baseSystemParametersSchema.extend({
  gridFeedInTariff: z.coerce.number().min(0).optional(),
  gridPurchaseTariff: z.coerce.number().min(0).optional(),
});

const hybridSystemParametersSchema = baseSystemParametersSchema.extend({
  autonomyDays: z.coerce.number().min(1).max(14),
  batteryDepthOfDischarge: z.coerce.number().min(20).max(100),
  batteryUnitVoltage: z.coerce
    .number()
    .min(1, "La tension unitaire de la batterie doit être positive"),
  batteryUnitCapacity: z.coerce
    .number()
    .min(1, "La capacité unitaire de la batterie doit être positive"),
  gridFeedInTariff: z.coerce.number().min(0).optional(),
  gridPurchaseTariff: z.coerce.number().min(0).optional(),
  gridBackupPercentage: z.coerce.number().min(0).max(100).optional(),
  priorityMode: z.enum(["self-consumption", "grid-feed"]).optional(),
});

export const systemParametersSchema = z.union([
  offGridSystemParametersSchema,
  gridTiedSystemParametersSchema,
  hybridSystemParametersSchema,
]);

export type SystemParameters = z.infer<typeof systemParametersSchema>;

// Full data structure for calculations
export interface CalculationInput {
  projectDetails: ProjectDetails;
  energyConsumption: EnergyConsumption;
  systemParameters: SystemParameters;
  location?: {
    lat: number;
    lng: number;
  };
}

export const formSchema = z
  .object({
    projectDetails: projectDetailsSchema,
    energyConsumption: energyConsumptionSchema,
    systemParameters: z.any(), // We'll refine this
  })
  .superRefine((data, ctx) => {
    const { systemType } = data.projectDetails;
    let result;
    if (systemType === "off-grid") {
      result = offGridSystemParametersSchema.safeParse(data.systemParameters);
    } else if (systemType === "grid-tied") {
      result = gridTiedSystemParametersSchema.safeParse(data.systemParameters);
    } else {
      result = hybridSystemParametersSchema.safeParse(data.systemParameters);
    }

    if (!result.success) {
      result.error.issues.forEach((issue) => {
        ctx.addIssue({
          ...issue,
          path: ["systemParameters", ...issue.path],
        });
      });
    }
  });

export type CalculatorFormValues = z.infer<typeof formSchema>;

// Types de résultats spécifiques à chaque système
export interface BaseCalculationResults {
  totalDailyConsumptionKWh: number;
  peakPowerW: number;
  panelsNeeded: number;
  energyProduced: number; // kWh/jour
  inverterSizeKw: number;
  chargeControllerRating: number;
  energyNeededWithLosses: number;
}

export interface OffGridResults extends BaseCalculationResults {
  batteryCapacityAh: number;
  batteriesInSeries: number;
  batteriesInParallel: number;
  totalBatteries: number;
  autonomyHours: number; // Heures d'autonomie réelles
}

export interface GridTiedResults extends BaseCalculationResults {
  dailyGridExport: number; // kWh/jour estimés exportés vers le réseau
  selfConsumptionRate: number; // % d'autoconsommation
  annualGridSavings: number; // Économies annuelles
}

export interface HybridResults extends BaseCalculationResults {
  batteryCapacityAh: number;
  batteriesInSeries: number;
  batteriesInParallel: number;
  totalBatteries: number;
  gridDependencyRate: number; // % de dépendance au réseau
  backupDuration: number; // Heures d'autonomie en cas de coupure
  dailyGridExchange: number; // kWh/jour échangés avec le réseau
}

// Type de résultat combiné
export type CalculationResults =
  | (BaseCalculationResults & {
      systemType: "off-grid";
      results: OffGridResults;
    })
  | (BaseCalculationResults & {
      systemType: "grid-tied";
      results: GridTiedResults;
    })
  | (BaseCalculationResults & { systemType: "hybrid"; results: HybridResults });

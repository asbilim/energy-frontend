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
});

export type ProjectDetails = z.infer<typeof projectDetailsSchema>;

// This will be the form schema for adding/editing appliances, managed in a list.
export const energyConsumptionSchema = z.object({
  appliances: z.array(applianceSchema),
});

export type EnergyConsumption = z.infer<typeof energyConsumptionSchema>;

// Step 3: System Parameters
export const systemParametersSchema = z.object({
  peakSunHours: z.coerce
    .number()
    .min(1, "Veuillez entrer une valeur valide")
    .max(12),
  systemVoltage: z.enum(["12", "24", "48"]),
  autonomyDays: z.coerce.number().min(1).max(14),
  batteryDepthOfDischarge: z.coerce.number().min(20).max(100),
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
  batteryUnitVoltage: z.coerce
    .number()
    .min(1, "La tension unitaire de la batterie doit être positive"),
  batteryUnitCapacity: z.coerce
    .number()
    .min(1, "La capacité unitaire de la batterie doit être positive"),
});

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

export const formSchema = z.object({
  projectDetails: projectDetailsSchema,
  energyConsumption: energyConsumptionSchema,
  systemParameters: systemParametersSchema,
});

export type CalculatorFormValues = z.infer<typeof formSchema>;

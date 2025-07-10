"use client";

import { useFieldArray, useFormContext } from "react-hook-form";
import { v4 as uuidv4 } from "uuid";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { PlusCircle, Trash2 } from "lucide-react";
import { energyConsumptionSchema } from "./types";
import { z } from "zod";

import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { type CalculatorFormValues } from "./types";

// Pre-defined appliances with approximate wattages (adapted for Cameroon)
const predefinedAppliances = [
  { name: "Ampoule LED", power: 10, suggestedQuantity: 5, suggestedHours: 6 },
  {
    name: "Réfrigérateur",
    power: 150,
    suggestedQuantity: 1,
    suggestedHours: 8,
  },
  { name: "Télévision", power: 100, suggestedQuantity: 1, suggestedHours: 4 },
  { name: "Ventilateur", power: 50, suggestedQuantity: 2, suggestedHours: 5 },
  {
    name: "Chargeur de téléphone",
    power: 5,
    suggestedQuantity: 3,
    suggestedHours: 2,
  },
  { name: "Pompe à eau", power: 500, suggestedQuantity: 1, suggestedHours: 1 },
  {
    name: "Ordinateur portable",
    power: 60,
    suggestedQuantity: 1,
    suggestedHours: 4,
  },
  {
    name: "Fer à repasser",
    power: 1000,
    suggestedQuantity: 1,
    suggestedHours: 0.5,
  },
  { name: "Radio", power: 20, suggestedQuantity: 1, suggestedHours: 3 },
  {
    name: "Micro-ondes",
    power: 800,
    suggestedQuantity: 1,
    suggestedHours: 0.3,
  },
];

export function ApplianceList() {
  const { control } = useFormContext<CalculatorFormValues>();

  const { fields, append, remove } = useFieldArray({
    control,
    name: "energyConsumption.appliances",
  });

  const handleAddAppliance = () => {
    append({
      id: uuidv4(),
      name: "",
      power: 100,
      quantity: 1,
      hoursPerDay: 1,
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Besoins Énergétiques</CardTitle>
        <CardDescription>
          Ajoutez tous les appareils électriques que votre système devra
          alimenter.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-4">
          {fields.map((field, index) => (
            <div
              key={field.id}
              className="grid grid-cols-1 md:grid-cols-5 gap-4 items-start p-4 border rounded-lg">
              <FormField
                control={control}
                name={`energyConsumption.appliances.${index}.name`}
                render={({ field }) => (
                  <FormItem className="col-span-2 md:col-span-1">
                    <FormLabel>Appareil</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Ampoule LED" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={control}
                name={`energyConsumption.appliances.${index}.power`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Puissance (W)</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={control}
                name={`energyConsumption.appliances.${index}.quantity`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Quantité</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={control}
                name={`energyConsumption.appliances.${index}.hoursPerDay`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>h/jour</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.5" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex items-end h-full">
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  onClick={() => remove(index)}
                  aria-label="Supprimer l'appareil">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              className="w-[200px] justify-between">
              Ajouter un appareil
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[200px] p-0">
            <Command>
              <CommandInput placeholder="Rechercher un appareil..." />
              <CommandList>
                <CommandEmpty>Aucun appareil trouvé.</CommandEmpty>
                <CommandGroup>
                  {predefinedAppliances.map((appliance) => (
                    <CommandItem
                      key={appliance.name}
                      value={appliance.name}
                      onSelect={() => {
                        append({
                          id: uuidv4(),
                          name: appliance.name,
                          power: appliance.power,
                          quantity: appliance.suggestedQuantity,
                          hoursPerDay: appliance.suggestedHours,
                        });
                      }}>
                      {appliance.name} ({appliance.power}W)
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </CardContent>
    </Card>
  );
}

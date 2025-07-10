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

type EnergyConsumptionForm = z.infer<typeof energyConsumptionSchema>;

export function ApplianceList() {
  const { control } = useFormContext<EnergyConsumptionForm>();

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
        <Button
          type="button"
          variant="outline"
          onClick={handleAddAppliance}
          className="w-full">
          <PlusCircle className="mr-2 h-4 w-4" />
          Ajouter un appareil
        </Button>
      </CardContent>
    </Card>
  );
}

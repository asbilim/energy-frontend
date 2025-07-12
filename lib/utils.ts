import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Helper to format numbers as currency in FCFA
export const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("fr-CM", {
    style: "currency",
    currency: "XAF",
    minimumFractionDigits: 0,
  }).format(Math.round(value));
};

// A simple formatter for numbers
export const formatNumber = (num: number) =>
  new Intl.NumberFormat("fr-FR").format(num);

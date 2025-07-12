// lib/billing.ts

/**
 * This file contains the billing logic for the Eneo electricity provider in Cameroon.
 * The calculation is based on a progressive tariff system with multiple brackets, a fixed fee, and VAT.
 *
 * All currency values are in FCFA.
 */

// --- Eneo Billing Constants ---

// Value Added Tax (VAT) rate in Cameroon
const ENEO_VAT_RATE = 0.1925;

// Fixed monthly fee (Prime Fixe) in FCFA
const ENEO_FIXED_FEE = 3275;

// Tariff brackets for residential low-voltage customers.
// Each bracket defines the upper limit of kWh for that tier and the rate per kWh.
const ENEO_TARIFF_BRACKETS = [
  { limit: 110, rate: 50 }, // Tranche 1: 0-110 kWh
  { limit: 400, rate: 79 }, // Tranche 2: 111-400 kWh
  { limit: 800, rate: 94 }, // Tranche 3: 401-800 kWh
  { limit: Infinity, rate: 99 }, // Tranche 4: > 800 kWh
];

// --- Detailed Breakdown Interfaces ---

export interface BillBreakdownItem {
  tranche: string;
  kwh: number;
  rate: number;
  cost: number;
}

// Interface pour les détails de la facture
export interface EneoBillDetails {
  totalKwh: number;
  breakdown: {
    tranche: string;
    kwh: number;
    rate: number;
    cost: number;
  }[];
  consumptionCost: number;
  fixedFee: number;
  vatAmount: number;
  municipalTax: number;
  stampDuty: number;
  totalCost: number;
}

// --- Calculation Function ---

/**
 * Calculates the estimated monthly electricity bill based on Eneo's tariff structure.
 * @param totalKwh - The total monthly electricity consumption in kWh.
 * @returns A detailed bill object including total cost, breakdown by bracket, fees, and VAT.
 */
export const calculateEneoBill = (totalKwh: number): EneoBillDetails => {
  if (totalKwh <= 0) {
    return {
      totalKwh: 0,
      totalCost: 0,
      consumptionCost: 0,
      fixedFee: 0,
      vatAmount: 0,
      breakdown: [],
      municipalTax: 0,
      stampDuty: 0,
    };
  }

  let remainingKwh = totalKwh;
  const breakdown: BillBreakdownItem[] = [];
  let lastLimit = 0;

  for (const bracket of ENEO_TARIFF_BRACKETS) {
    if (remainingKwh <= 0) break;

    const kwhInBracket = Math.min(remainingKwh, bracket.limit - lastLimit);
    const costInBracket = kwhInBracket * bracket.rate;

    const trancheName =
      lastLimit === 0
        ? `Tranche 1 (0 - ${bracket.limit} kWh)`
        : bracket.limit === Infinity
        ? `Tranche 4 (> ${lastLimit} kWh)`
        : `Tranche ${breakdown.length + 1} (${lastLimit + 1} - ${
            bracket.limit
          } kWh)`;

    breakdown.push({
      tranche: trancheName,
      kwh: kwhInBracket,
      rate: bracket.rate,
      cost: costInBracket,
    });

    remainingKwh -= kwhInBracket;
    lastLimit = bracket.limit;
  }

  const consumptionCost = breakdown.reduce((sum, item) => sum + item.cost, 0);

  // Frais fixes et taxes
  const fixedFee = 3270; // Prime fixe pour tarif domestique
  const subTotal = consumptionCost + fixedFee;
  const vatRate = 0.1925; // 19.25%
  const vatAmount = subTotal * vatRate;

  // Ajout des taxes supplémentaires
  const municipalTax = subTotal * 0.01; // Taxe municipale ~1% du HT
  const stampDuty = 1000; // Droit de timbre (fixe pour factures > 1000 FCFA)

  const totalCost = subTotal + vatAmount + municipalTax + stampDuty;

  return {
    totalKwh,
    breakdown,
    consumptionCost,
    fixedFee,
    vatAmount,
    municipalTax,
    stampDuty,
    totalCost,
  };
};

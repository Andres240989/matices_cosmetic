const DAYS_PER_YEAR = 365;

export type ProfitabilityInput = {
  unitCostMinor: number;
  unitPriceMinor: number | null;
  soldUnits: number;
  averageStockUnits: number;
  periodDays: number;
};

export type ProfitabilityResult = {
  /** (price - cost) / price. `null` without a positive price. */
  marginRatio: number | null;
  /** Gross margin earned per peso of average inventory at cost, scaled to a year. */
  gmroiAnnualized: number | null;
};

export function computeProfitability(input: ProfitabilityInput): ProfitabilityResult {
  const { unitCostMinor, unitPriceMinor } = input;
  if (unitPriceMinor === null || unitPriceMinor <= 0) {
    return { marginRatio: null, gmroiAnnualized: null };
  }
  const marginRatio = (unitPriceMinor - unitCostMinor) / unitPriceMinor;
  const averageInventoryCost = input.averageStockUnits * unitCostMinor;
  if (averageInventoryCost <= 0) return { marginRatio, gmroiAnnualized: null };
  const grossMargin = (unitPriceMinor - unitCostMinor) * input.soldUnits;
  const gmroiAnnualized = (grossMargin / averageInventoryCost) * (DAYS_PER_YEAR / input.periodDays);
  return { marginRatio, gmroiAnnualized };
}

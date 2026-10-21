import type { RulesConfig } from "@/contracts/rules-config";
import { poissonQuantile } from "./poisson";

export type PurchasePlanInput = {
  soldUnits: number;
  periodDays: number;
  /** Stock today plus units already in transit. */
  availableUnits: number;
  config: RulesConfig;
};

export type PurchasePlan = {
  dailyDemand: number;
  /** Units that cover lead time plus review period at the configured service level. */
  targetLevelUnits: number;
  /** Units that cover lead time alone: at or below this, order now. */
  reorderPointUnits: number;
  suggestedUnits: number;
};

/** Demand of each product is modelled as Poisson, using its sales over the analysis period. */
export function computePurchasePlan(input: PurchasePlanInput): PurchasePlan {
  const { config } = input;
  const dailyDemand = input.periodDays > 0 ? input.soldUnits / input.periodDays : 0;
  const horizonDays = config.leadTimeDays + config.reviewPeriodDays;
  const targetLevelUnits = poissonQuantile(dailyDemand * horizonDays, config.serviceLevel);
  const reorderPointUnits = poissonQuantile(dailyDemand * config.leadTimeDays, config.serviceLevel);
  const suggestedUnits = Math.max(0, targetLevelUnits - input.availableUnits);
  return { dailyDemand, targetLevelUnits, reorderPointUnits, suggestedUnits };
}

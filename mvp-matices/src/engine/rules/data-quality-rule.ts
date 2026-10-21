import type { RuleResult } from "@/contracts/recommendation";
import type { RuleContext } from "../rule-context";

/**
 * R1 is a gate: if the data cannot be trusted, no purchase is computed from it.
 * Returns WATCH with the first problem found.
 */
export function evaluateDataQualityRule(ctx: RuleContext): RuleResult {
  const { product, periodDays, config } = ctx;
  const base = { ruleId: "R1_DATA_QUALITY" as const };

  const hasNegativeNumber =
    product.openingStockUnits < 0 ||
    product.closingStockUnits < 0 ||
    product.currentStockUnits < 0 ||
    product.inTransitUnits < 0 ||
    product.soldUnits < 0;
  if (hasNegativeNumber) {
    return { ...base, outcome: "WATCH", reasonCode: "NEGATIVE_QUANTITY", values: {} };
  }
  if (product.unitCostMinor === 0) {
    return { ...base, outcome: "WATCH", reasonCode: "ZERO_COST", values: {} };
  }
  if (periodDays < config.minHistoryDays) {
    return {
      ...base,
      outcome: "WATCH",
      reasonCode: "SHORT_HISTORY",
      values: { periodDays, minHistoryDays: config.minHistoryDays },
    };
  }
  return { ...base, outcome: "OK", reasonCode: "DATA_OK", values: {} };
}

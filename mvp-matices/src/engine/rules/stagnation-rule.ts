import type { RuleResult } from "@/contracts/recommendation";
import type { RuleContext } from "../rule-context";

/**
 * R4 reports capital sitting in a product that did not sell during the period.
 * It never asks for a purchase, so its outcome is always OK; the reason code carries the finding.
 */
export function evaluateStagnationRule(ctx: RuleContext): RuleResult {
  const { product } = ctx;
  const isStagnant = product.soldUnits === 0 && product.currentStockUnits > 0;
  return {
    ruleId: "R4_STAGNATION",
    outcome: "OK",
    reasonCode: isStagnant ? "STAGNANT_CAPITAL" : "MOVING",
    values: {
      currentStockUnits: product.currentStockUnits,
      stagnantCapitalMinor: isStagnant ? product.currentStockUnits * product.unitCostMinor : 0,
    },
  };
}

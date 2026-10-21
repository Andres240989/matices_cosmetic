import type { RuleResult } from "@/contracts/recommendation";
import type { RuleContext } from "../rule-context";

/** R2: with demand and stock at or below the reorder point, the product runs out before the next delivery. */
export function evaluateReorderPointRule(ctx: RuleContext): RuleResult {
  const { plan, availableUnits } = ctx;
  const values = {
    availableUnits,
    reorderPointUnits: plan.reorderPointUnits,
    dailyDemand: plan.dailyDemand,
  };
  const mustOrder = plan.dailyDemand > 0 && availableUnits <= plan.reorderPointUnits;
  return mustOrder
    ? { ruleId: "R2_REORDER_POINT", outcome: "ORDER_NOW", reasonCode: "AT_REORDER_POINT", values }
    : { ruleId: "R2_REORDER_POINT", outcome: "OK", reasonCode: "ABOVE_REORDER_POINT", values };
}

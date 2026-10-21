import type { RuleResult } from "@/contracts/recommendation";
import type { RuleContext } from "../rule-context";

/** R3: above the reorder point but below the target level, the next cycle will need a purchase. */
export function evaluateCoverageRule(ctx: RuleContext): RuleResult {
  const { plan, availableUnits } = ctx;
  const values = { availableUnits, targetLevelUnits: plan.targetLevelUnits };
  const isBelowTarget = plan.dailyDemand > 0 && availableUnits < plan.targetLevelUnits;
  return isBelowTarget
    ? { ruleId: "R3_COVERAGE", outcome: "WATCH", reasonCode: "BELOW_TARGET", values }
    : { ruleId: "R3_COVERAGE", outcome: "OK", reasonCode: "COVERED", values };
}

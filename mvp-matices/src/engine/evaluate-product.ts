import { countDaysInclusive } from "@/contracts/dates";
import type { ProductPeriod } from "@/contracts/product";
import type { Recommendation, RecommendationOutcome, RuleResult } from "@/contracts/recommendation";
import type { RulesConfig } from "@/contracts/rules-config";
import { explainRecommendation } from "./messages";
import { computeProfitability } from "./profitability";
import { computePurchasePlan } from "./purchase";
import { computeRotation } from "./rotation";
import type { RuleContext } from "./rule-context";
import { evaluateCoverageRule } from "./rules/coverage-rule";
import { evaluateDataQualityRule } from "./rules/data-quality-rule";
import { evaluateReorderPointRule } from "./rules/reorder-point-rule";
import { evaluateStagnationRule } from "./rules/stagnation-rule";

export type EvaluateProductInput = {
  product: ProductPeriod;
  periodStart: string;
  periodEnd: string;
  asOf: string;
  config: RulesConfig;
};

/** Most restrictive wins: ORDER_NOW over WATCH over SUFFICIENT. */
function combineOutcomes(results: RuleResult[]): RecommendationOutcome {
  if (results.some((r) => r.outcome === "ORDER_NOW")) return "ORDER_NOW";
  if (results.some((r) => r.outcome === "WATCH")) return "WATCH";
  return "SUFFICIENT";
}

export function evaluateProduct(input: EvaluateProductInput): Recommendation {
  const { product, config } = input;
  const periodDays = countDaysInclusive(input.periodStart, input.periodEnd);
  const availableUnits = product.currentStockUnits + product.inTransitUnits;
  const plan = computePurchasePlan({
    soldUnits: Math.max(0, product.soldUnits),
    periodDays,
    availableUnits,
    config,
  });
  const ctx: RuleContext = { product, periodDays, config, availableUnits, plan };

  // All rules always run, so the record shows every reason, not just the first one.
  const ruleResults = [
    evaluateDataQualityRule(ctx),
    evaluateReorderPointRule(ctx),
    evaluateCoverageRule(ctx),
    evaluateStagnationRule(ctx),
  ];

  // R1 is a gate: untrusted data never produces a purchase.
  const isDataTrusted = ruleResults[0]?.outcome === "OK";
  const outcome: RecommendationOutcome = isDataTrusted ? combineOutcomes(ruleResults) : "WATCH";
  const suggestedPurchaseUnits = isDataTrusted ? plan.suggestedUnits : 0;
  const suggestedPurchaseMinor = suggestedPurchaseUnits * product.unitCostMinor;

  const rotation = computeRotation({
    openingStockUnits: product.openingStockUnits,
    closingStockUnits: product.closingStockUnits,
    soldUnits: product.soldUnits,
    periodDays,
  });
  const profitability = computeProfitability({
    unitCostMinor: product.unitCostMinor,
    unitPriceMinor: product.unitPriceMinor,
    soldUnits: product.soldUnits,
    averageStockUnits: (product.openingStockUnits + product.closingStockUnits) / 2,
    periodDays,
  });
  const stagnation = ruleResults[3];
  const stagnantCapitalMinor = Number(stagnation?.values.stagnantCapitalMinor ?? 0);

  return {
    productId: product.productId,
    name: product.name,
    outcome,
    ruleResults,
    metrics: {
      periodDays,
      dailyDemand: plan.dailyDemand,
      rotation: rotation.rotation,
      daysOfInventory: rotation.daysOfInventory,
      marginRatio: profitability.marginRatio,
      gmroiAnnualized: profitability.gmroiAnnualized,
      targetLevelUnits: plan.targetLevelUnits,
      reorderPointUnits: plan.reorderPointUnits,
      availableUnits,
      stagnantCapitalMinor,
    },
    suggestedPurchaseUnits,
    suggestedPurchaseMinor,
    explanation: explainRecommendation(
      outcome,
      ruleResults,
      suggestedPurchaseUnits,
      suggestedPurchaseMinor,
    ),
    rulesConfigVersion: config.version,
    asOf: input.asOf,
  };
}

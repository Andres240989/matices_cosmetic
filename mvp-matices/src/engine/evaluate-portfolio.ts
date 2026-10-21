import type { InventoryPeriod } from "@/contracts/product";
import type {
  PortfolioSummary,
  Recommendation,
  RecommendationOutcome,
} from "@/contracts/recommendation";
import type { RulesConfig } from "@/contracts/rules-config";
import { evaluateProduct } from "./evaluate-product";

export type PortfolioResult = {
  recommendations: Recommendation[];
  summary: PortfolioSummary;
};

const PRIORITY: Record<RecommendationOutcome, number> = { ORDER_NOW: 0, WATCH: 1, SUFFICIENT: 2 };

/** Evaluates every product. Order: ORDER_NOW first, biggest purchase first inside each group. */
export function evaluatePortfolio(period: InventoryPeriod, config: RulesConfig): PortfolioResult {
  const recommendations = period.products
    .map((product) =>
      evaluateProduct({
        product,
        periodStart: period.periodStart,
        periodEnd: period.periodEnd,
        asOf: period.asOf,
        config,
      }),
    )
    .sort(
      (a, b) =>
        PRIORITY[a.outcome] - PRIORITY[b.outcome] ||
        b.suggestedPurchaseMinor - a.suggestedPurchaseMinor ||
        a.name.localeCompare(b.name),
    );

  const count = (outcome: RecommendationOutcome) =>
    recommendations.filter((r) => r.outcome === outcome).length;
  const orderNow = recommendations.filter((r) => r.outcome === "ORDER_NOW");

  const summary: PortfolioSummary = {
    productCount: recommendations.length,
    orderNowCount: count("ORDER_NOW"),
    watchCount: count("WATCH"),
    sufficientCount: count("SUFFICIENT"),
    orderNowUnits: orderNow.reduce((sum, r) => sum + r.suggestedPurchaseUnits, 0),
    orderNowMinor: orderNow.reduce((sum, r) => sum + r.suggestedPurchaseMinor, 0),
    stagnantCapitalMinor: recommendations.reduce(
      (sum, r) => sum + r.metrics.stagnantCapitalMinor,
      0,
    ),
    inventoryCostMinor: period.products.reduce(
      (sum, p) => sum + Math.max(0, p.currentStockUnits) * p.unitCostMinor,
      0,
    ),
  };
  return { recommendations, summary };
}

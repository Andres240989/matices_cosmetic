import type { ProductPeriod } from "@/contracts/product";

/**
 * Rotation of a group of products, weighted at cost: cost of units sold over average stock at cost.
 * Weighting at cost lets periods be compared even when products have different costs.
 * `null` when the average stock at cost is not positive.
 */
export function computePortfolioRotation(products: ProductPeriod[]): number | null {
  let soldCost = 0;
  let doubledAverageStockCost = 0;
  for (const p of products) {
    soldCost += p.soldUnits * p.unitCostMinor;
    doubledAverageStockCost += (p.openingStockUnits + p.closingStockUnits) * p.unitCostMinor;
  }
  if (doubledAverageStockCost <= 0) return null;
  return (2 * soldCost) / doubledAverageStockCost;
}

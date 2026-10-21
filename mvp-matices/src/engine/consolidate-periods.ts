import type { ExcludedProduct } from "@/contracts/analysis";
import { countDaysInclusive } from "@/contracts/dates";
import type { LoadedPeriod } from "@/contracts/ingestion";
import type { ProductPeriod } from "@/contracts/product";

export type ConsolidationResult = {
  period: LoadedPeriod;
  excludedProducts: ExcludedProduct[];
};

export function sortPeriods(periods: LoadedPeriod[]): LoadedPeriod[] {
  return [...periods].sort(
    (a, b) => a.periodStart.localeCompare(b.periodStart) || a.periodEnd.localeCompare(b.periodEnd),
  );
}

/** True when each period starts the day after the previous one ends. Expects sorted periods. */
export function areConsecutive(periods: LoadedPeriod[]): boolean {
  return periods.every((period, index) => {
    const previous = periods[index - 1];
    return (
      previous === undefined || countDaysInclusive(previous.periodEnd, period.periodStart) === 2
    );
  });
}

function mergeProduct(rows: ProductPeriod[]): ProductPeriod {
  const first = rows[0] as ProductPeriod;
  const last = rows[rows.length - 1] as ProductPeriod;
  return {
    ...last,
    openingStockUnits: first.openingStockUnits,
    closingStockUnits: last.closingStockUnits,
    soldUnits: rows.reduce((sum, row) => sum + row.soldUnits, 0),
  };
}

/**
 * Merges consecutive periods into one window: opening stock of the first, closing stock of the last,
 * sales summed. Today's stock, in-transit units, cost and price come from the last period.
 * A product missing from any period is left out, because its sales in that period are unknown.
 * Returns `null` with fewer than two periods or when they are not consecutive.
 */
export function consolidatePeriods(periods: LoadedPeriod[]): ConsolidationResult | null {
  const sorted = sortPeriods(periods);
  const first = sorted[0];
  const last = sorted[sorted.length - 1];
  if (sorted.length < 2 || !first || !last || !areConsecutive(sorted)) return null;

  const byPeriod = sorted.map((period) => new Map(period.products.map((p) => [p.productId, p])));
  const productIds = [
    ...new Set(sorted.flatMap((period) => period.products.map((p) => p.productId))),
  ];
  const products: ProductPeriod[] = [];
  const excludedProducts: ExcludedProduct[] = [];

  for (const productId of productIds) {
    const rows = byPeriod.map((map) => map.get(productId));
    const present = rows.filter((row): row is ProductPeriod => row !== undefined);
    if (present.length === rows.length) {
      products.push(mergeProduct(present));
      continue;
    }
    const missing = sorted.filter((_, index) => rows[index] === undefined);
    excludedProducts.push({
      productId,
      name: (present[present.length - 1] as ProductPeriod).name,
      reason: `No aparece en ${missing.map((p) => `${p.periodStart} a ${p.periodEnd}`).join(", ")}; sin esas ventas no se puede consolidar.`,
    });
  }

  return {
    period: { periodStart: first.periodStart, periodEnd: last.periodEnd, products },
    excludedProducts,
  };
}

import { ProductPeriodSchema, type ProductPeriod } from "@/contracts/product";
import { DEFAULT_RULES_CONFIG } from "@/contracts/rules-config";

export const YELLOW_COST_MINOR = 862_500; // COP 8,625.00

export function makeProduct(overrides: Partial<ProductPeriod> = {}): ProductPeriod {
  return ProductPeriodSchema.parse({
    productId: "3000",
    name: "TINTE YELLOW PRUEBA 60 ML",
    openingStockUnits: 0,
    closingStockUnits: 0,
    soldUnits: 0,
    currentStockUnits: 0,
    unitCostMinor: YELLOW_COST_MINOR,
    unitPriceMinor: null,
    ...overrides,
  });
}

/** Analysis window of the Yellow line case: 1 Aug to 10 Oct 2026 (71 days), analysed on 15 Oct. */
export const YELLOW_WINDOW = {
  periodStart: "2026-08-01",
  periodEnd: "2026-10-10",
  asOf: "2026-10-15",
};

export const config = DEFAULT_RULES_CONFIG;

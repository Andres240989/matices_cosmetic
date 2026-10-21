import { describe, expect, it } from "vitest";
import type { LoadedPeriod } from "@/contracts/ingestion";
import { areConsecutive, consolidatePeriods } from "@/engine/consolidate-periods";
import { makeProduct } from "../helpers";

function period(periodStart: string, periodEnd: string, products = [makeProduct()]): LoadedPeriod {
  return { periodStart, periodEnd, products };
}

describe("areConsecutive", () => {
  it("accepts a period that starts the day after the previous one ends", () => {
    expect(
      areConsecutive([period("2026-07-01", "2026-07-31"), period("2026-08-01", "2026-08-31")]),
    ).toBe(true);
  });

  it("rejects a one-day gap and a one-day overlap", () => {
    expect(
      areConsecutive([period("2026-07-01", "2026-07-30"), period("2026-08-01", "2026-08-31")]),
    ).toBe(false);
    expect(
      areConsecutive([period("2026-07-01", "2026-08-01"), period("2026-08-01", "2026-08-31")]),
    ).toBe(false);
  });
});

describe("consolidatePeriods", () => {
  const july = period("2026-07-01", "2026-07-31", [
    makeProduct({
      productId: "A",
      name: "A",
      openingStockUnits: 8,
      closingStockUnits: 5,
      soldUnits: 3,
      currentStockUnits: 99,
    }),
    makeProduct({ productId: "B", name: "B", openingStockUnits: 4, closingStockUnits: 4 }),
  ]);
  const august = period("2026-08-01", "2026-08-31", [
    makeProduct({
      productId: "A",
      name: "A",
      openingStockUnits: 5,
      closingStockUnits: 7,
      soldUnits: 4,
      currentStockUnits: 6,
      unitCostMinor: 950_000,
    }),
    makeProduct({
      productId: "C",
      name: "C NUEVO",
      openingStockUnits: 0,
      closingStockUnits: 4,
      soldUnits: 2,
    }),
  ]);

  it("uses opening of the first period, closing of the last and the sum of sales", () => {
    const result = consolidatePeriods([august, july]);
    expect(result?.period.periodStart).toBe("2026-07-01");
    expect(result?.period.periodEnd).toBe("2026-08-31");
    expect(result?.period.products).toEqual([
      expect.objectContaining({
        productId: "A",
        openingStockUnits: 8,
        closingStockUnits: 7,
        soldUnits: 7,
        currentStockUnits: 6,
        unitCostMinor: 950_000,
      }),
    ]);
  });

  it("leaves out and reports products missing from a period", () => {
    const result = consolidatePeriods([july, august]);
    expect(result?.excludedProducts.map((e) => e.productId)).toEqual(["B", "C"]);
    expect(result?.excludedProducts[1]?.reason).toContain("2026-07-01 a 2026-07-31");
  });

  it("returns null for a single period or periods that are not consecutive", () => {
    expect(consolidatePeriods([july])).toBeNull();
    expect(consolidatePeriods([july, period("2026-09-01", "2026-09-30")])).toBeNull();
  });
});

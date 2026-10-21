import { describe, expect, it } from "vitest";
import { computeProfitability } from "@/engine/profitability";
import { computeRotation } from "@/engine/rotation";

describe("computeRotation", () => {
  it("divides sold units by average stock", () => {
    const result = computeRotation({
      openingStockUnits: 10,
      closingStockUnits: 6,
      soldUnits: 8,
      periodDays: 30,
    });
    expect(result.rotation).toBe(1);
    expect(result.daysOfInventory).toBe(30);
  });

  it("has no rotation when average stock is zero", () => {
    const result = computeRotation({
      openingStockUnits: 0,
      closingStockUnits: 0,
      soldUnits: 0,
      periodDays: 30,
    });
    expect(result).toEqual({ rotation: null, daysOfInventory: null });
  });

  it("has no days of inventory when nothing sold", () => {
    const result = computeRotation({
      openingStockUnits: 5,
      closingStockUnits: 5,
      soldUnits: 0,
      periodDays: 30,
    });
    expect(result.rotation).toBe(0);
    expect(result.daysOfInventory).toBeNull();
  });
});

describe("computeProfitability", () => {
  it("computes margin and annualized GMROI", () => {
    const result = computeProfitability({
      unitCostMinor: 600,
      unitPriceMinor: 1000,
      soldUnits: 10,
      averageStockUnits: 10,
      periodDays: 365,
    });
    expect(result.marginRatio).toBeCloseTo(0.4);
    expect(result.gmroiAnnualized).toBeCloseTo((400 * 10) / (10 * 600));
  });

  it("is not computed without a price", () => {
    const result = computeProfitability({
      unitCostMinor: 600,
      unitPriceMinor: null,
      soldUnits: 10,
      averageStockUnits: 10,
      periodDays: 30,
    });
    expect(result).toEqual({ marginRatio: null, gmroiAnnualized: null });
  });
});

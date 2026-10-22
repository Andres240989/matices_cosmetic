import { describe, expect, it } from "vitest";
import { evaluateProduct } from "@/engine/evaluate-product";
import { YELLOW_COST_MINOR, YELLOW_WINDOW, config, makeProduct } from "../helpers";
import type { ProductPeriod } from "@/contracts/product";

function evaluate(overrides: Partial<ProductPeriod>, window = YELLOW_WINDOW) {
  return evaluateProduct({ product: makeProduct(overrides), ...window, config });
}

describe("R2 reorder point (6 sold in 71 days: reorder point 2, target 6)", () => {
  const sold = { soldUnits: 6 };

  it("orders now at the reorder point", () => {
    const result = evaluate({ ...sold, currentStockUnits: 2 });
    expect(result.outcome).toBe("ORDER_NOW");
    expect(result.suggestedPurchaseUnits).toBe(4);
  });

  it("only watches one unit above the reorder point", () => {
    const result = evaluate({ ...sold, currentStockUnits: 3 });
    expect(result.outcome).toBe("WATCH");
  });

  it("is sufficient at the target level", () => {
    const result = evaluate({ ...sold, currentStockUnits: 6 });
    expect(result.outcome).toBe("SUFFICIENT");
    expect(result.suggestedPurchaseUnits).toBe(0);
  });

  it("counts units in transit as available", () => {
    const result = evaluate({ ...sold, currentStockUnits: 0, inTransitUnits: 6 });
    expect(result.outcome).toBe("SUFFICIENT");
  });
});

describe("R1 data quality gate", () => {
  it("never suggests a purchase with less history than the minimum", () => {
    const result = evaluate(
      { soldUnits: 6, currentStockUnits: 0 },
      { periodStart: "2026-10-01", periodEnd: "2026-10-10", asOf: "2026-10-15" },
    );
    expect(result.outcome).toBe("WATCH");
    expect(result.suggestedPurchaseUnits).toBe(0);
    expect(result.explanation).toContain("10 días de historial");
  });

  it("trusts a full February: 28 days meets the minimum", () => {
    const result = evaluate(
      { soldUnits: 6, currentStockUnits: 0 },
      { periodStart: "2027-02-01", periodEnd: "2027-02-28", asOf: "2027-02-28" },
    );
    expect(result.outcome).toBe("ORDER_NOW");
    expect(result.suggestedPurchaseUnits).toBeGreaterThan(0);
  });

  it("does not trust 27 days, one below the minimum", () => {
    const result = evaluate(
      { soldUnits: 6, currentStockUnits: 0 },
      { periodStart: "2027-02-01", periodEnd: "2027-02-27", asOf: "2027-02-28" },
    );
    expect(result.outcome).toBe("WATCH");
    expect(result.suggestedPurchaseUnits).toBe(0);
  });

  it("turns negative stock into WATCH instead of failing", () => {
    const result = evaluate({ soldUnits: 6, currentStockUnits: -2 });
    expect(result.outcome).toBe("WATCH");
    expect(result.suggestedPurchaseUnits).toBe(0);
  });

  it("does not trust a zero cost", () => {
    const result = evaluate({ soldUnits: 6, currentStockUnits: 0, unitCostMinor: 0 });
    expect(result.outcome).toBe("WATCH");
    expect(result.suggestedPurchaseUnits).toBe(0);
  });

  it("runs every rule even when the gate closes", () => {
    const result = evaluate({ soldUnits: 6, currentStockUnits: 0, unitCostMinor: 0 });
    expect(result.ruleResults.map((r) => r.ruleId)).toEqual([
      "R1_DATA_QUALITY",
      "R2_REORDER_POINT",
      "R3_COVERAGE",
      "R4_STAGNATION",
    ]);
  });
});

describe("R4 stagnation", () => {
  it("reports idle capital but never asks for a purchase", () => {
    const result = evaluate({ soldUnits: 0, currentStockUnits: 3 });
    expect(result.outcome).toBe("SUFFICIENT");
    expect(result.suggestedPurchaseUnits).toBe(0);
    expect(result.metrics.stagnantCapitalMinor).toBe(3 * YELLOW_COST_MINOR);
    expect(result.explanation).toContain("unidades paradas");
  });
});

describe("explanation", () => {
  it("quotes the numbers behind an ORDER_NOW", () => {
    const result = evaluate({ soldUnits: 6, currentStockUnits: 0 });
    expect(result.explanation).toContain("Pedir ya.");
    expect(result.explanation).toContain("punto de pedido es 2");
    expect(result.explanation).toContain("6 unidades");
  });
});

import { describe, expect, it } from "vitest";
import { InventoryPeriodSchema } from "@/contracts/product";
import { evaluatePortfolio } from "@/engine/evaluate-portfolio";
import { YELLOW_WINDOW, config, makeProduct } from "../helpers";

/**
 * Golden case taken from the August 2026 analysis of the Alfaparf Yellow line
 * (docs/casos/yellow-agosto-2026.md): 6 references to buy, 16 units, COP 138,000 at cost.
 */
const buyers = [
  { id: "2975", sold: 6, stock: 0, buy: 6 },
  { id: "3009", sold: 3, stock: 0, buy: 3 },
  { id: "3017", sold: 1, stock: 0, buy: 2 },
  { id: "3022", sold: 1, stock: 0, buy: 2 },
  { id: "3024", sold: 1, stock: 0, buy: 2 },
  { id: "3018", sold: 1, stock: 1, buy: 1 },
];

describe("Yellow line, August 2026", () => {
  const period = InventoryPeriodSchema.parse({
    ...YELLOW_WINDOW,
    products: [
      ...buyers.map((b) =>
        makeProduct({
          productId: b.id,
          name: `REF ${b.id}`,
          soldUnits: b.sold,
          currentStockUnits: b.stock,
          openingStockUnits: b.stock + b.sold,
          closingStockUnits: b.stock,
        }),
      ),
      // Enough stock for their demand: no purchase.
      makeProduct({ productId: "5001", name: "REF 5001", soldUnits: 3, currentStockUnits: 5 }),
      // Never sold, with stock: idle capital.
      makeProduct({ productId: "6001", name: "REF 6001", soldUnits: 0, currentStockUnits: 4 }),
    ],
  });

  const { recommendations, summary } = evaluatePortfolio(period, config);

  it("suggests the same units per reference as the analysis", () => {
    for (const b of buyers) {
      const found = recommendations.find((r) => r.productId === b.id);
      expect(found?.outcome, b.id).toBe("ORDER_NOW");
      expect(found?.suggestedPurchaseUnits, b.id).toBe(b.buy);
    }
  });

  it("totals 16 units and COP 138,000", () => {
    expect(summary.orderNowCount).toBe(6);
    expect(summary.orderNowUnits).toBe(16);
    expect(summary.orderNowMinor).toBe(13_800_000);
  });

  it("does not buy products that already have enough stock or no sales", () => {
    const covered = recommendations.find((r) => r.productId === "5001");
    const idle = recommendations.find((r) => r.productId === "6001");
    expect(covered?.suggestedPurchaseUnits).toBe(0);
    expect(idle?.suggestedPurchaseUnits).toBe(0);
    expect(summary.stagnantCapitalMinor).toBe(4 * 862_500);
  });

  it("lists orders first, biggest purchase first", () => {
    expect(recommendations[0]?.productId).toBe("2975");
    expect(recommendations.slice(0, 6).every((r) => r.outcome === "ORDER_NOW")).toBe(true);
  });

  it("changes the result when the service level changes (sensitivity)", () => {
    const stricter = evaluatePortfolio(period, { ...config, version: 2, serviceLevel: 0.95 });
    expect(stricter.summary.orderNowUnits).toBeGreaterThan(summary.orderNowUnits);
    expect(stricter.recommendations[0]?.rulesConfigVersion).toBe(2);
  });
});

import { describe, expect, it } from "vitest";
import type { LoadedPeriod } from "@/contracts/ingestion";
import { analyzePeriods } from "@/engine/analyze-periods";
import { computePortfolioRotation } from "@/engine/portfolio-rotation";
import { config, makeProduct } from "../helpers";

const july: LoadedPeriod = {
  periodStart: "2026-07-01",
  periodEnd: "2026-07-31",
  products: [
    makeProduct({
      productId: "A",
      name: "A",
      openingStockUnits: 8,
      closingStockUnits: 5,
      soldUnits: 3,
      currentStockUnits: 0,
    }),
  ],
};
const august: LoadedPeriod = {
  periodStart: "2026-08-01",
  periodEnd: "2026-08-31",
  products: [
    makeProduct({
      productId: "A",
      name: "A",
      openingStockUnits: 5,
      closingStockUnits: 2,
      soldUnits: 3,
      currentStockUnits: 0,
    }),
  ],
};

describe("analyzePeriods", () => {
  it("uses the consolidated window by default when periods are consecutive", () => {
    const result = analyzePeriods({
      periods: [july, august],
      asOf: "2026-09-15",
      rulesConfig: config,
    });
    expect(result.basis).toBe("CONSOLIDATED");
    expect(result.basisOptions.map((o) => o.basis)).toEqual([
      "CONSOLIDATED",
      "2026-08-01_2026-08-31",
      "2026-07-01_2026-07-31",
    ]);
    // Rotation = 6 sold / ((8 + 2) / 2) = 1.2 over 62 days.
    expect(result.recommendations[0]?.metrics).toMatchObject({
      periodDays: 62,
      averageStockUnits: 5,
      rotation: 1.2,
    });
    expect(result.recommendations[0]?.rulesConfigVersion).toBe(config.version);
  });

  it("uses the latest period by default when periods are not consecutive", () => {
    const later = { ...august, periodStart: "2026-08-02" };
    const result = analyzePeriods({
      periods: [july, later],
      asOf: "2026-09-15",
      rulesConfig: config,
    });
    expect(result.basis).toBe("2026-08-02_2026-08-31");
  });

  it("evaluates a single period when asked", () => {
    const result = analyzePeriods({
      periods: [july, august],
      asOf: "2026-09-15",
      rulesConfig: config,
      basis: "2026-07-01_2026-07-31",
    });
    expect(result.evaluatedPeriod).toMatchObject({ periodStart: "2026-07-01", asOf: "2026-09-15" });
    expect(result.recommendations[0]?.metrics.rotation).toBeCloseTo(3 / 6.5);
  });

  it("reports the portfolio rotation of every period", () => {
    const result = analyzePeriods({
      periods: [august, july],
      asOf: "2026-08-31",
      rulesConfig: config,
    });
    expect(result.periodRotations.map((p) => p.periodStart)).toEqual(["2026-07-01", "2026-08-01"]);
    expect(result.periodRotations[1]?.rotation).toBeCloseTo(3 / 3.5);
  });

  it("refuses an analysis date before the latest period ends, and an unknown basis", () => {
    expect(() =>
      analyzePeriods({ periods: [july, august], asOf: "2026-08-30", rulesConfig: config }),
    ).toThrow("no puede ser anterior");
    expect(() =>
      analyzePeriods({
        periods: [july],
        asOf: "2026-08-30",
        rulesConfig: config,
        basis: "CONSOLIDATED",
      }),
    ).toThrow("no existe");
  });
});

describe("computePortfolioRotation", () => {
  it("weights each product by its cost", () => {
    const cheap = makeProduct({
      productId: "A",
      openingStockUnits: 10,
      closingStockUnits: 10,
      soldUnits: 10,
      unitCostMinor: 100,
    });
    const dear = makeProduct({
      productId: "B",
      openingStockUnits: 10,
      closingStockUnits: 10,
      soldUnits: 0,
      unitCostMinor: 900,
    });
    // (10 x 100) / (10 x 100 + 10 x 900) = 0.1; in units it would be 0.5.
    expect(computePortfolioRotation([cheap, dear])).toBeCloseTo(0.1);
  });

  it("is null without stock", () => {
    expect(computePortfolioRotation([makeProduct()])).toBeNull();
  });
});

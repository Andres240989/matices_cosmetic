import { describe, expect, it } from "vitest";
import { poissonQuantile } from "@/engine/poisson";

describe("poissonQuantile", () => {
  it("returns 0 when there is no demand", () => {
    expect(poissonQuantile(0, 0.9)).toBe(0);
  });

  it.each([
    [0.563, 2], // 1 unit sold in 71 days over a 40-day horizon
    [1.69, 3],
    [3.38, 6],
  ])("lambda %f at 90%% needs %i units", (lambda, expected) => {
    expect(poissonQuantile(lambda, 0.9)).toBe(expected);
  });

  it("grows with the service level", () => {
    expect(poissonQuantile(3.38, 0.95)).toBeGreaterThanOrEqual(poissonQuantile(3.38, 0.9));
  });

  it("does not underflow with large demand", () => {
    const quantile = poissonQuantile(900, 0.9);
    expect(quantile).toBeGreaterThan(900);
    expect(quantile).toBeLessThan(1000);
  });
});

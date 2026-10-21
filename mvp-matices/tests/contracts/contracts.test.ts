import { describe, expect, it } from "vitest";
import { PurchaseApprovalSchema } from "@/contracts/approval";
import { IsoDateSchema, countDaysInclusive } from "@/contracts/dates";
import { InventoryPeriodSchema } from "@/contracts/product";
import { RulesConfigSchema } from "@/contracts/rules-config";

describe("dates", () => {
  it("counts both ends: 1 Aug to 10 Oct 2026 is 71 days", () => {
    expect(countDaysInclusive("2026-08-01", "2026-10-10")).toBe(71);
  });

  it("rejects impossible dates", () => {
    expect(IsoDateSchema.safeParse("2026-02-31").success).toBe(false);
    expect(IsoDateSchema.safeParse("2026-10-21").success).toBe(true);
  });
});

describe("InventoryPeriodSchema", () => {
  it("rejects an analysis date before the end of the period", () => {
    const result = InventoryPeriodSchema.safeParse({
      periodStart: "2026-08-01",
      periodEnd: "2026-10-10",
      asOf: "2026-10-01",
      products: [],
    });
    expect(result.success).toBe(false);
  });
});

describe("RulesConfigSchema", () => {
  it("rejects a service level of 100%", () => {
    const result = RulesConfigSchema.safeParse({
      version: 1,
      leadTimeDays: 10,
      reviewPeriodDays: 30,
      serviceLevel: 1,
      minHistoryDays: 30,
    });
    expect(result.success).toBe(false);
  });
});

describe("PurchaseApprovalSchema", () => {
  const base = {
    recommendationId: "rec-1",
    approver: "Dueña",
    decidedAt: "2026-10-21T14:30:00Z",
  };

  it("accepts an approval with units", () => {
    expect(
      PurchaseApprovalSchema.safeParse({ ...base, action: "APPROVE", approvedUnits: 6, reason: "" })
        .success,
    ).toBe(true);
  });

  it("requires a reason to adjust or reject", () => {
    expect(
      PurchaseApprovalSchema.safeParse({ ...base, action: "ADJUST", approvedUnits: 3, reason: "" })
        .success,
    ).toBe(false);
    expect(
      PurchaseApprovalSchema.safeParse({ ...base, action: "REJECT", approvedUnits: 0, reason: "" })
        .success,
    ).toBe(false);
  });

  it("a rejection cannot approve units", () => {
    expect(
      PurchaseApprovalSchema.safeParse({ ...base, action: "REJECT", approvedUnits: 2, reason: "x" })
        .success,
    ).toBe(false);
  });
});

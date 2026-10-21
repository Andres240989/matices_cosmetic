import { describe, expect, it } from "vitest";
import { parseIsoDate, parseNumber, parsePesosToMinor, parseUnits } from "@/ingestion/cell";

describe("parseNumber", () => {
  it.each([
    ["8625", 8625],
    ["8625.5", 8625.5],
    ["8625,50", 8625.5],
    ["-3", -3],
    [12, 12],
  ])("reads %s", (input, expected) => {
    expect(parseNumber(input)).toEqual({ ok: true, value: expected });
  });

  it.each(["9.200", "1.250.000", "$8625", "8625.505", "cinco", ""])("rejects %s", (input) => {
    expect(parseNumber(input).ok).toBe(false);
  });
});

describe("parseUnits", () => {
  it("accepts whole units and rejects fractions", () => {
    expect(parseUnits("3")).toEqual({ ok: true, value: 3 });
    expect(parseUnits(1.5).ok).toBe(false);
  });
});

describe("parsePesosToMinor", () => {
  it("stores pesos as integer centavos", () => {
    expect(parsePesosToMinor(8625)).toEqual({ ok: true, value: 862_500 });
    expect(parsePesosToMinor("2352,94")).toEqual({ ok: true, value: 235_294 });
  });

  it("rejects negative money", () => {
    expect(parsePesosToMinor("-1").ok).toBe(false);
  });
});

describe("parseIsoDate", () => {
  it("reads ISO, day-first and spreadsheet dates", () => {
    expect(parseIsoDate("2026-08-01")).toEqual({ ok: true, value: "2026-08-01" });
    expect(parseIsoDate("1/8/2026")).toEqual({ ok: true, value: "2026-08-01" });
    expect(parseIsoDate(new Date(Date.UTC(2026, 7, 31)))).toEqual({
      ok: true,
      value: "2026-08-31",
    });
  });

  it("rejects impossible or unknown dates", () => {
    expect(parseIsoDate("2026-09-31").ok).toBe(false);
    expect(parseIsoDate("agosto").ok).toBe(false);
    expect(parseIsoDate(46000).ok).toBe(false);
  });
});

import { describe, expect, it } from "vitest";
import { parseCsv } from "@/ingestion/parse-csv";

describe("parseCsv", () => {
  it("detects semicolons, as Excel in Spanish saves CSV", () => {
    expect(parseCsv("a;b\r\n1;2\r\n")).toEqual([
      ["a", "b"],
      ["1", "2"],
    ]);
  });

  it("handles quoted fields with delimiters, quotes and empty cells", () => {
    expect(parseCsv('codigo,producto,costo\n1,"TINTE ""AURA"", 60 ML",\n')).toEqual([
      ["codigo", "producto", "costo"],
      ["1", 'TINTE "AURA", 60 ML', null],
    ]);
  });

  it("ignores a byte order mark", () => {
    expect(parseCsv("﻿codigo\n1")[0]).toEqual(["codigo"]);
  });
});

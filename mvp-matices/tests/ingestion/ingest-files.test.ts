import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { ingestInventoryFiles, type InventoryFile } from "@/ingestion/ingest-files";

const SAMPLE_DIR = join(import.meta.dirname, "..", "..", "data", "sample");

function sample(fileName: string): InventoryFile {
  return { fileName, bytes: readFileSync(join(SAMPLE_DIR, fileName)) };
}

function csv(fileName: string, text: string): InventoryFile {
  return { fileName, bytes: new TextEncoder().encode(text) };
}

const HEADER =
  "periodo_inicio,periodo_fin,codigo,producto,inventario_inicial,inventario_final,unidades_vendidas,stock_hoy,costo_unitario";

describe("ingestInventoryFiles", () => {
  it("reads three consecutive months from one .xlsx", async () => {
    const result = await ingestInventoryFiles([
      sample("inventario-multiperiodo-2026-07-a-2026-09.xlsx"),
    ]);
    expect(result.issues).toEqual([]);
    expect(result.periods.map((p) => [p.periodStart, p.periodEnd, p.products.length])).toEqual([
      ["2026-07-01", "2026-07-31", 21],
      ["2026-08-01", "2026-08-31", 22],
      ["2026-09-01", "2026-09-30", 22],
    ]);
    expect(result.rowsRead).toBe(65);
    expect(result.rowsAccepted).toBe(65);
    const negro = result.periods[2]?.products.find((p) => p.productId === "1001");
    expect(negro).toMatchObject({
      openingStockUnits: 7,
      closingStockUnits: 2,
      soldUnits: 5,
      currentStockUnits: 0,
      unitCostMinor: 920_000,
      unitPriceMinor: 1_690_000,
    });
  });

  it("matches template headers regardless of capitals and accents", async () => {
    const result = await ingestInventoryFiles([sample("inventario-2026-08.csv")]);
    expect(result.issues).toEqual([]);
    expect(result.periods).toHaveLength(1);
    expect(result.rowsAccepted).toBe(22);
  });

  it("reports every bad row and keeps the good ones", async () => {
    const result = await ingestInventoryFiles([sample("con-errores-2026-09.csv")]);
    expect(result.rowsRead).toBe(16);
    expect(result.rowsAccepted).toBe(8);
    expect(result.issues.map((i) => [i.severity, i.rowNumber])).toEqual([
      ["REJECTED", 6],
      ["REJECTED", 7],
      ["REJECTED", 8],
      ["REJECTED", 9],
      ["REJECTED", 10],
      ["REJECTED", 11],
      ["REJECTED", 12],
      ["REJECTED", 13],
    ]);
    const messages = result.issues.map((i) => i.message);
    expect(messages[0]).toContain("codigo está vacío");
    expect(messages[1]).toContain('"cinco" no es un número');
    expect(messages[2]).toContain("no es un número entero");
    expect(messages[3]).toContain("costo_unitario está vacío");
    expect(messages[4]).toContain("no es una fecha válida");
    expect(messages[5]).toContain("stock_hoy está vacío");
    expect(messages[6]).toContain('"9.200" no es un número válido');
    expect(messages[7]).toContain("ya está en el periodo");
  });

  it("uses closing stock when there is no stock_hoy column, and says so", async () => {
    const result = await ingestInventoryFiles([
      csv(
        "sin-stock.csv",
        "periodo_inicio,periodo_fin,codigo,producto,inventario_inicial,inventario_final,unidades_vendidas,costo_unitario\n2026-08-01,2026-08-31,1,A,5,3,2,100\n",
      ),
    ]);
    expect(result.periods[0]?.products[0]?.currentStockUnits).toBe(3);
    expect(result.issues).toEqual([
      expect.objectContaining({
        severity: "NOTICE",
        message: expect.stringContaining("stock_hoy"),
      }),
    ]);
  });

  it("rejects the same product twice in one period across files", async () => {
    const row = "2026-08-01,2026-08-31,1,A,5,3,2,3,100";
    const result = await ingestInventoryFiles([
      csv("a.csv", `${HEADER}\n${row}\n`),
      csv("b.csv", `${HEADER}\n${row}\n`),
    ]);
    expect(result.rowsAccepted).toBe(1);
    expect(result.issues[0]).toMatchObject({ fileName: "b.csv", rowNumber: 2 });
    expect(result.issues[0]?.message).toContain("a.csv, fila 2");
  });

  it("rejects files that are not the template, and keeps reading the others", async () => {
    const result = await ingestInventoryFiles([
      csv("otro.csv", "Ítem,INV 1 AUG,INV 31 AUG,VENTAS\nX,1,1,0\n"),
      { fileName: "rotacion.numbers", bytes: new Uint8Array([1, 2, 3]) },
      { fileName: "roto.xlsx", bytes: new Uint8Array([1, 2, 3]) },
      sample("plantilla-matices.csv"),
    ]);
    expect(result.issues.map((i) => i.fileName)).toEqual([
      "otro.csv",
      "rotacion.numbers",
      "roto.xlsx",
    ]);
    expect(result.issues[0]?.message).toContain("periodo_inicio");
    expect(result.rowsAccepted).toBe(1);
  });
});

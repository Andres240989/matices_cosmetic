import type { IsoDate } from "@/contracts/dates";
import { ProductPeriodSchema, type ProductPeriod } from "@/contracts/product";
import {
  cellText,
  isBlank,
  parseIsoDate,
  parsePesosToMinor,
  parseUnits,
  type Cell,
  type Parsed,
} from "./cell";
import { TEMPLATE_COLUMNS, type ColumnMap, type InventoryField } from "./detect-columns";

export type ParsedRow = {
  rowNumber: number;
  periodStart: IsoDate;
  periodEnd: IsoDate;
  product: ProductPeriod;
};

export type RowResult = { ok: true; row: ParsedRow } | { ok: false; errors: string[] };

function requiredText(cell: Cell | undefined): Parsed<string> {
  const text = cellText(cell);
  return text === "" ? { ok: false, error: "está vacío" } : { ok: true, value: text };
}

function optional<T>(parse: (cell: Cell | undefined) => Parsed<T>, fallback: T) {
  return (cell: Cell | undefined): Parsed<T> =>
    isBlank(cell) ? { ok: true, value: fallback } : parse(cell);
}

/** Validates one data row. Every problem in the row is collected, so the report lists them all. */
export function parseInventoryRow(row: Cell[], rowNumber: number, columns: ColumnMap): RowResult {
  const errors: string[] = [];
  const read = <T>(field: InventoryField, parse: (cell: Cell | undefined) => Parsed<T>) => {
    const parsed = parse(row[columns[field] as number]);
    if (parsed.ok) return parsed.value;
    errors.push(`${TEMPLATE_COLUMNS[field]} ${parsed.error}`);
    return undefined;
  };
  const isPresent = (field: InventoryField) => columns[field] !== undefined;

  const periodStart = read("periodStart", parseIsoDate);
  const periodEnd = read("periodEnd", parseIsoDate);
  const closingStockUnits = read("closingStockUnits", parseUnits);
  const candidate = {
    productId: read("productId", requiredText),
    name: read("name", requiredText),
    openingStockUnits: read("openingStockUnits", parseUnits),
    closingStockUnits,
    soldUnits: read("soldUnits", parseUnits),
    currentStockUnits: isPresent("currentStockUnits")
      ? read("currentStockUnits", parseUnits)
      : closingStockUnits,
    inTransitUnits: isPresent("inTransitUnits")
      ? read("inTransitUnits", optional(parseUnits, 0))
      : 0,
    unitCostMinor: read("unitCostMinor", parsePesosToMinor),
    unitPriceMinor: isPresent("unitPriceMinor")
      ? read("unitPriceMinor", optional<number | null>(parsePesosToMinor, null))
      : null,
  };
  if (periodStart && periodEnd && periodStart > periodEnd) {
    errors.push("periodo_inicio es posterior a periodo_fin");
  }
  if (errors.length > 0 || !periodStart || !periodEnd) return { ok: false, errors };

  const product = ProductPeriodSchema.safeParse(candidate);
  if (!product.success) return { ok: false, errors: product.error.issues.map((i) => i.message) };
  return { ok: true, row: { rowNumber, periodStart, periodEnd, product: product.data } };
}

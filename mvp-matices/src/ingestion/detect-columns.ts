import { cellText, type Cell } from "./cell";

export type InventoryField =
  | "periodStart"
  | "periodEnd"
  | "productId"
  | "name"
  | "openingStockUnits"
  | "closingStockUnits"
  | "soldUnits"
  | "currentStockUnits"
  | "inTransitUnits"
  | "unitCostMinor"
  | "unitPriceMinor";

export type ColumnMap = Partial<Record<InventoryField, number>>;

/** Column names of the Matices template, in the order the template lists them. */
export const TEMPLATE_COLUMNS: Record<InventoryField, string> = {
  periodStart: "periodo_inicio",
  periodEnd: "periodo_fin",
  productId: "codigo",
  name: "producto",
  openingStockUnits: "inventario_inicial",
  closingStockUnits: "inventario_final",
  soldUnits: "unidades_vendidas",
  currentStockUnits: "stock_hoy",
  inTransitUnits: "en_transito",
  unitCostMinor: "costo_unitario",
  unitPriceMinor: "precio_venta",
};

export const REQUIRED_FIELDS: InventoryField[] = [
  "periodStart",
  "periodEnd",
  "productId",
  "name",
  "openingStockUnits",
  "closingStockUnits",
  "soldUnits",
  "unitCostMinor",
];

/** `Periodo inicio`, `PERIODO_INICIO` and `periodo_inicio` all read as `periodo inicio`. */
export function normalizeHeader(cell: Cell | undefined): string {
  return cellText(cell)
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function mapRow(row: Cell[]): ColumnMap {
  const headers = row.map(normalizeHeader);
  const columns: ColumnMap = {};
  for (const [field, name] of Object.entries(TEMPLATE_COLUMNS) as [InventoryField, string][]) {
    const index = headers.indexOf(normalizeHeader(name));
    if (index >= 0) columns[field] = index;
  }
  return columns;
}

export type HeaderDetection = { headerRowIndex: number; columns: ColumnMap };

/** Looks for the header row in the first 15 rows: the first one with every required template column. */
export function detectHeader(rows: Cell[][]): HeaderDetection | null {
  for (let index = 0; index < Math.min(rows.length, 15); index += 1) {
    const columns = mapRow(rows[index] ?? []);
    if (REQUIRED_FIELDS.every((field) => columns[field] !== undefined)) {
      return { headerRowIndex: index, columns };
    }
  }
  return null;
}

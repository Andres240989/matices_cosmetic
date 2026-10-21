import { toPeriodKey } from "@/contracts/analysis";
import type { IngestionIssue, IngestionResult, LoadedPeriod } from "@/contracts/ingestion";
import { isBlank } from "./cell";
import { REQUIRED_FIELDS, TEMPLATE_COLUMNS, detectHeader } from "./detect-columns";
import { parseInventoryRow, type ParsedRow } from "./parse-inventory-rows";
import { readRows } from "./read-rows";

export type InventoryFile = { fileName: string; bytes: Uint8Array };

type FileRow = { fileName: string; row: ParsedRow };

const REQUIRED_COLUMNS = REQUIRED_FIELDS.map((field) => TEMPLATE_COLUMNS[field]).join(", ");

function issue(fileName: string, rowNumber: number | null, message: string): IngestionIssue {
  return { severity: "REJECTED", fileName, rowNumber, message };
}

async function readFile(file: InventoryFile) {
  const rows = await readRows(file.fileName, file.bytes);
  if (!rows.ok)
    return { accepted: [], issues: [issue(file.fileName, null, rows.error)], rowsRead: 0 };
  const header = detectHeader(rows.value);
  if (!header) {
    const message = `No tiene las columnas obligatorias de la plantilla Matices: ${REQUIRED_COLUMNS}.`;
    return { accepted: [], issues: [issue(file.fileName, null, message)], rowsRead: 0 };
  }

  const accepted: FileRow[] = [];
  const issues: IngestionIssue[] = [];
  if (header.columns.currentStockUnits === undefined) {
    issues.push({
      severity: "NOTICE",
      fileName: file.fileName,
      rowNumber: null,
      message: "No hay columna stock_hoy: se usa el inventario final del periodo.",
    });
  }
  let rowsRead = 0;
  rows.value.slice(header.headerRowIndex + 1).forEach((cells, offset) => {
    if (cells.every((cell) => isBlank(cell))) return;
    rowsRead += 1;
    const rowNumber = header.headerRowIndex + offset + 2;
    const result = parseInventoryRow(cells, rowNumber, header.columns);
    if (result.ok) accepted.push({ fileName: file.fileName, row: result.row });
    else
      issues.push(issue(file.fileName, rowNumber, `Fila rechazada: ${result.errors.join("; ")}.`));
  });
  return { accepted, issues, rowsRead };
}

/** Groups rows into periods. The same product twice in one period keeps the first and reports the rest. */
function groupPeriods(rows: FileRow[]) {
  const periods = new Map<string, LoadedPeriod>();
  const firstSeen = new Map<string, FileRow>();
  const issues: IngestionIssue[] = [];
  for (const item of rows) {
    const { periodStart, periodEnd, product } = item.row;
    const key = toPeriodKey({ periodStart, periodEnd });
    const first = firstSeen.get(`${key}|${product.productId}`);
    if (first) {
      issues.push(
        issue(
          item.fileName,
          item.row.rowNumber,
          `Fila rechazada: el código ${product.productId} ya está en el periodo ${periodStart} a ${periodEnd} (${first.fileName}, fila ${first.row.rowNumber}).`,
        ),
      );
      continue;
    }
    firstSeen.set(`${key}|${product.productId}`, item);
    const period = periods.get(key) ?? { periodStart, periodEnd, products: [] };
    period.products.push(product);
    periods.set(key, period);
  }
  const loaded = [...periods.values()].sort((a, b) => a.periodStart.localeCompare(b.periodStart));
  return { loaded, issues };
}

/** Reads every file into periods. A bad file or row is reported and never stops the others. */
export async function ingestInventoryFiles(files: InventoryFile[]): Promise<IngestionResult> {
  const issues: IngestionIssue[] = [];
  const accepted: FileRow[] = [];
  let rowsRead = 0;
  for (const file of files) {
    const result = await readFile(file);
    issues.push(...result.issues);
    accepted.push(...result.accepted);
    rowsRead += result.rowsRead;
  }
  const grouped = groupPeriods(accepted);
  issues.push(...grouped.issues);
  return {
    periods: grouped.loaded,
    issues,
    rowsRead,
    rowsAccepted: grouped.loaded.reduce((sum, p) => sum + p.products.length, 0),
  };
}

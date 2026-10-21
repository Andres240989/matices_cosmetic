import { IsoDateSchema, type IsoDate } from "@/contracts/dates";

/** A spreadsheet cell as both readers (xlsx and csv) deliver it. */
export type Cell = string | number | boolean | Date | null;

export type Parsed<T> = { ok: true; value: T } | { ok: false; error: string };

export function isBlank(cell: Cell | undefined): boolean {
  return cell === null || cell === undefined || (typeof cell === "string" && cell.trim() === "");
}

export function cellText(cell: Cell | undefined): string {
  if (cell === null || cell === undefined) return "";
  if (cell instanceof Date) return cell.toISOString().slice(0, 10);
  return String(cell).trim();
}

/** Plain numbers only: `8625`, `8625.5` or `8625,50`. Thousands separators are rejected, never guessed. */
const PLAIN_NUMBER = /^-?\d+([.,]\d{1,2})?$/;

export function parseNumber(cell: Cell | undefined): Parsed<number> {
  if (typeof cell === "number") {
    return Number.isFinite(cell)
      ? { ok: true, value: cell }
      : { ok: false, error: "no es un número" };
  }
  const text = cellText(cell);
  if (text === "") return { ok: false, error: "está vacío" };
  if (!PLAIN_NUMBER.test(text)) {
    return {
      ok: false,
      error: `"${text}" no es un número válido (sin separador de miles ni símbolos)`,
    };
  }
  return { ok: true, value: Number(text.replace(",", ".")) };
}

export function parseUnits(cell: Cell | undefined): Parsed<number> {
  const parsed = parseNumber(cell);
  if (!parsed.ok) return parsed;
  return Number.isInteger(parsed.value)
    ? parsed
    : { ok: false, error: `${parsed.value} no es un número entero de unidades` };
}

/** Pesos as typed in the file, to integer centavos. */
export function parsePesosToMinor(cell: Cell | undefined): Parsed<number> {
  const parsed = parseNumber(cell);
  if (!parsed.ok) return parsed;
  if (parsed.value < 0) return { ok: false, error: "no puede ser negativo" };
  return { ok: true, value: Math.round(parsed.value * 100) };
}

const ISO = /^(\d{4})-(\d{1,2})-(\d{1,2})$/;
const DAY_FIRST = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/;

export function parseIsoDate(cell: Cell | undefined): Parsed<IsoDate> {
  if (cell instanceof Date) return { ok: true, value: cell.toISOString().slice(0, 10) };
  const text = cellText(cell);
  if (text === "") return { ok: false, error: "está vacía" };
  const iso = ISO.exec(text);
  const dayFirst = DAY_FIRST.exec(text);
  const parts = iso
    ? [iso[1], iso[2], iso[3]]
    : dayFirst
      ? [dayFirst[3], dayFirst[2], dayFirst[1]]
      : null;
  const candidate = parts
    ? `${parts[0]}-${(parts[1] as string).padStart(2, "0")}-${(parts[2] as string).padStart(2, "0")}`
    : text;
  const result = IsoDateSchema.safeParse(candidate);
  return result.success
    ? { ok: true, value: result.data }
    : { ok: false, error: `"${text}" no es una fecha válida (use AAAA-MM-DD o DD/MM/AAAA)` };
}

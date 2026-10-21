import { readSheet } from "read-excel-file/node";
import type { Cell, Parsed } from "./cell";
import { parseCsv } from "./parse-csv";

/** Reads the first sheet of an .xlsx, or a UTF-8 .csv. */
export async function readRows(fileName: string, bytes: Uint8Array): Promise<Parsed<Cell[][]>> {
  const extension = fileName.toLowerCase().split(".").pop();
  if (extension === "csv") return { ok: true, value: parseCsv(new TextDecoder().decode(bytes)) };
  if (extension !== "xlsx") {
    return {
      ok: false,
      error: "Formato no soportado: carga la plantilla Matices en .xlsx o .csv.",
    };
  }
  try {
    return { ok: true, value: (await readSheet(Buffer.from(bytes))) as unknown as Cell[][] };
  } catch {
    return { ok: false, error: "No se pudo leer el archivo: no parece un .xlsx válido." };
  }
}

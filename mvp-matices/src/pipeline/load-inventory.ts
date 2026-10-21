import { INGESTION_LIMITS, type IngestionResult } from "@/contracts/ingestion";
import { ingestInventoryFiles, type InventoryFile } from "@/ingestion/ingest-files";

export class InputLimitError extends Error {}

/** Checks the upload limits, then reads the files. */
export async function loadInventory(files: InventoryFile[]): Promise<IngestionResult> {
  if (files.length === 0) throw new InputLimitError("Selecciona al menos un archivo.");
  if (files.length > INGESTION_LIMITS.maxFiles) {
    throw new InputLimitError(`Máximo ${INGESTION_LIMITS.maxFiles} archivos por carga.`);
  }
  const tooBig = files.find((f) => f.bytes.byteLength > INGESTION_LIMITS.maxFileBytes);
  if (tooBig) throw new InputLimitError(`${tooBig.fileName} supera el máximo de 5 MB.`);
  return ingestInventoryFiles(files);
}

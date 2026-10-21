import { findUploadLimitError, type IngestionResult } from "@/contracts/ingestion";
import { ingestInventoryFiles, type InventoryFile } from "@/ingestion/ingest-files";

export class InputLimitError extends Error {}

/** Checks the upload limits, then reads the files. */
export async function loadInventory(files: InventoryFile[]): Promise<IngestionResult> {
  const limitError = findUploadLimitError(
    files.map((f) => ({ name: f.fileName, size: f.bytes.byteLength })),
  );
  if (limitError) throw new InputLimitError(limitError);
  return ingestInventoryFiles(files);
}

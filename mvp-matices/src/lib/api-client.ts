import type { AnalysisRequest, AnalysisResult } from "@/contracts/analysis";
import type { IngestionResult } from "@/contracts/ingestion";

/** Errors from the platform (for example 413 from Vercel) may come without a JSON body. */
async function readJson<T>(response: Response): Promise<T> {
  const body = await response.json().catch(() => null);
  if (!response.ok || body === null) {
    throw new Error(body?.message ?? `El servidor respondió con un error (${response.status}).`);
  }
  return body as T;
}

export async function uploadInventoryFiles(files: File[]): Promise<IngestionResult> {
  const form = new FormData();
  for (const file of files) form.append("files", file);
  return readJson(await fetch("/api/ingest", { method: "POST", body: form }));
}

export async function requestAnalysis(request: AnalysisRequest): Promise<AnalysisResult> {
  return readJson(
    await fetch("/api/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(request),
    }),
  );
}

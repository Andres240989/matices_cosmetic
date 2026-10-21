import type { AnalysisRequest, AnalysisResult } from "@/contracts/analysis";
import type { IngestionResult } from "@/contracts/ingestion";

async function readJson<T>(response: Response): Promise<T> {
  const body = await response.json();
  if (!response.ok) throw new Error(body.message ?? "Error inesperado del servidor.");
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

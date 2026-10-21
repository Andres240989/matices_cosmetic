"use client";

import { useState } from "react";
import {
  INGESTION_LIMITS,
  findUploadLimitError,
  type IngestionResult,
} from "@/contracts/ingestion";
import { uploadInventoryFiles } from "@/lib/api-client";
import { formatPeriod } from "@/lib/format";
import { Section } from "./section";

type Props = { result: IngestionResult | null; onLoaded: (result: IngestionResult) => void };

export function UploadSection({ result, onLoaded }: Props) {
  const [files, setFiles] = useState<File[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    const limitError = findUploadLimitError(files);
    if (limitError) {
      setError(limitError);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      onLoaded(await uploadInventoryFiles(files));
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudieron leer los archivos.");
    } finally {
      setIsLoading(false);
    }
  }

  const rejected = result?.issues.filter((i) => i.severity === "REJECTED") ?? [];
  const notices = result?.issues.filter((i) => i.severity === "NOTICE") ?? [];

  return (
    <Section step={1} title="Cargar datos">
      <p className="mb-3 text-sm text-ink-2">
        Usa la plantilla Matices (.xlsx o .csv). Puedes cargar varios archivos y varios periodos a
        la vez; hasta {INGESTION_LIMITS.maxFiles} archivos y 4 MB en total.{" "}
        <a className="text-accent underline" href="/plantilla-matices.xlsx" download>
          Descargar plantilla
        </a>
      </p>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <input
          type="file"
          multiple
          accept=".xlsx,.csv"
          onChange={(e) => setFiles([...(e.target.files ?? [])])}
          className="text-sm file:mr-3 file:rounded-md file:border file:border-line file:bg-page file:px-3 file:py-1.5 file:text-ink"
        />
        <button
          type="button"
          onClick={load}
          disabled={files.length === 0 || isLoading}
          className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-white disabled:opacity-40"
        >
          {isLoading ? "Leyendo…" : "Leer archivos"}
        </button>
      </div>
      {error && <p className="mt-3 text-sm text-critical">{error}</p>}

      {result && (
        <div className="mt-5 space-y-3 text-sm">
          <p>
            <strong>{result.rowsAccepted}</strong> filas cargadas de {result.rowsRead} leídas
            {rejected.length > 0 && (
              <>
                {" · "}
                <strong className="text-critical">{rejected.length}</strong> con problemas
              </>
            )}
            .
          </p>
          {result.periods.length > 0 && (
            <ul className="flex flex-wrap gap-2">
              {result.periods.map((p) => (
                <li
                  key={p.periodStart + p.periodEnd}
                  className="rounded-full border border-line px-3 py-1 text-ink-2"
                >
                  {formatPeriod(p.periodStart, p.periodEnd)} · {p.products.length} productos
                </li>
              ))}
            </ul>
          )}
          {notices.map((n, i) => (
            <p key={i} className="text-ink-2">
              Aviso ({n.fileName}): {n.message}
            </p>
          ))}
          {rejected.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="text-muted">
                  <tr>
                    <th className="py-1 pr-4 font-medium">Archivo</th>
                    <th className="py-1 pr-4 font-medium">Fila</th>
                    <th className="py-1 font-medium">Motivo</th>
                  </tr>
                </thead>
                <tbody>
                  {rejected.map((issue, i) => (
                    <tr key={i} className="border-t border-line align-top">
                      <td className="py-1.5 pr-4">{issue.fileName}</td>
                      <td className="tabular py-1.5 pr-4">{issue.rowNumber ?? "—"}</td>
                      <td className="py-1.5">{issue.message}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </Section>
  );
}

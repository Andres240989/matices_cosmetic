"use client";

import { Fragment, useState } from "react";
import type { AnalysisResult } from "@/contracts/analysis";
import type { RecommendationOutcome } from "@/contracts/recommendation";
import { buildRecommendationsCsv } from "@/lib/export-csv";
import { OUTCOME_LABELS, displayProductCode, formatDecimal, formatPesos } from "@/lib/format";
import { OutcomeBadge } from "./outcome-badge";

type Filter = RecommendationOutcome | "ALL";

const FILTERS: Filter[] = ["ALL", "ORDER_NOW", "WATCH", "SUFFICIENT"];

function downloadCsv(result: AnalysisResult) {
  const blob = new Blob([buildRecommendationsCsv(result)], { type: "text/csv;charset=utf-8" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `matices-compra-sugerida-${result.evaluatedPeriod.asOf}.csv`;
  link.click();
  URL.revokeObjectURL(link.href);
}

const NUMBER_CELL = "tabular py-2 pr-3 text-right";

export function RecommendationsTable({ result }: { result: AnalysisResult }) {
  const [filter, setFilter] = useState<Filter>("ALL");
  const [query, setQuery] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);
  const products = new Map(result.evaluatedPeriod.products.map((p) => [p.productId, p]));
  const text = query.trim().toLowerCase();
  const rows = result.recommendations.filter(
    (r) =>
      (filter === "ALL" || r.outcome === filter) &&
      (text === "" || r.name.toLowerCase().includes(text) || r.productId.includes(text)),
  );

  return (
    <div>
      <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          {FILTERS.map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              className={`rounded-full border px-3 py-1 text-sm ${filter === f ? "border-accent bg-accent text-white" : "border-line"}`}
            >
              {f === "ALL" ? "Todos" : OUTCOME_LABELS[f]}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            type="search"
            placeholder="Buscar código o producto"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="min-w-0 flex-1 rounded-md border border-line bg-page px-2 py-1.5 text-sm"
          />
          <button
            type="button"
            onClick={() => downloadCsv(result)}
            className="rounded-md border border-line px-3 py-1.5 text-sm whitespace-nowrap"
          >
            Exportar CSV
          </button>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[1100px] text-sm">
          <thead className="text-left text-xs text-muted">
            <tr className="border-b border-axis">
              <th className="py-2 pr-3 font-medium">Estado</th>
              <th className="py-2 pr-3 font-medium">Producto</th>
              <th className="py-2 pr-3 text-right font-medium">Inv. inicial</th>
              <th className="py-2 pr-3 text-right font-medium">Inv. final</th>
              <th className="py-2 pr-3 text-right font-medium">Inv. promedio</th>
              <th className="py-2 pr-3 text-right font-medium">Vendido</th>
              <th className="py-2 pr-3 text-right font-medium">Rotación</th>
              <th className="py-2 pr-3 text-right font-medium">Días inv.</th>
              <th className="py-2 pr-3 text-right font-medium">Disponible</th>
              <th className="py-2 pr-3 text-right font-medium">Punto de pedido</th>
              <th className="py-2 pr-3 text-right font-medium">Nivel objetivo</th>
              <th className="py-2 pr-3 text-right font-medium">Compra sugerida</th>
              <th className="py-2 text-right font-medium">Valor a costo</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const p = products.get(r.productId);
              const isReference = r.outcome !== "ORDER_NOW" && r.suggestedPurchaseUnits > 0;
              const purchaseClass = isReference ? "text-muted" : "font-semibold";
              return (
                <Fragment key={r.productId}>
                  <tr
                    className="cursor-pointer border-b border-line hover:bg-page"
                    onClick={() => setOpenId(openId === r.productId ? null : r.productId)}
                  >
                    <td className="py-2 pr-3">
                      <OutcomeBadge outcome={r.outcome} />
                    </td>
                    <td className="py-2 pr-3">
                      <span className="block max-w-72 truncate" title={r.name}>
                        {r.name}
                      </span>
                      <span className="text-xs text-muted">
                        {p ? displayProductCode(p) || "Sin código" : r.productId}
                      </span>
                    </td>
                    <td className={NUMBER_CELL}>{p?.openingStockUnits}</td>
                    <td className={NUMBER_CELL}>{p?.closingStockUnits}</td>
                    <td className={NUMBER_CELL}>{formatDecimal(r.metrics.averageStockUnits, 1)}</td>
                    <td className={NUMBER_CELL}>{p?.soldUnits}</td>
                    <td className={NUMBER_CELL}>{formatDecimal(r.metrics.rotation)}</td>
                    <td className={NUMBER_CELL}>{formatDecimal(r.metrics.daysOfInventory, 0)}</td>
                    <td className={NUMBER_CELL}>{r.metrics.availableUnits}</td>
                    <td className={NUMBER_CELL}>{r.metrics.reorderPointUnits}</td>
                    <td className={NUMBER_CELL}>{r.metrics.targetLevelUnits}</td>
                    <td className={`${NUMBER_CELL} ${purchaseClass}`}>
                      {r.suggestedPurchaseUnits}
                      {isReference && <span className="ml-1 text-xs">(ref.)</span>}
                    </td>
                    <td className={`tabular py-2 text-right ${purchaseClass}`}>
                      {formatPesos(r.suggestedPurchaseMinor)}
                    </td>
                  </tr>
                  {openId === r.productId && (
                    <tr className="border-b border-line bg-page">
                      <td colSpan={13} className="px-3 py-3">
                        <p>{r.explanation}</p>
                        <p className="mt-1 text-xs text-muted">
                          Reglas v{r.rulesConfigVersion} ·{" "}
                          {r.ruleResults
                            .map((rule) => `${rule.ruleId}: ${rule.reasonCode}`)
                            .join(" · ")}
                        </p>
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="mt-2 text-xs text-muted">
        Clic en una fila para ver la explicación. «ref.»: compra sugerida de un producto en Vigilar;
        se muestra como referencia y no suma al total.
      </p>
    </div>
  );
}

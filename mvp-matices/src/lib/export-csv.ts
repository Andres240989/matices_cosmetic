import type { AnalysisResult } from "@/contracts/analysis";
import { OUTCOME_LABELS } from "./format";

const HEADER = [
  "estado",
  "codigo",
  "producto",
  "inventario_inicial",
  "inventario_final",
  "inventario_promedio",
  "unidades_vendidas",
  "rotacion",
  "dias_inventario",
  "disponible",
  "punto_pedido",
  "nivel_objetivo",
  "compra_sugerida_unidades",
  "compra_sugerida_pesos",
  "explicacion",
];

function cell(value: string | number | null): string {
  const text = value === null ? "" : String(value);
  return /[;"\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

/** Semicolon CSV with a byte order mark, so Excel in Spanish opens it in columns with accents intact. */
export function buildRecommendationsCsv(result: AnalysisResult): string {
  const products = new Map(result.evaluatedPeriod.products.map((p) => [p.productId, p]));
  const rows = result.recommendations.map((r) => {
    const p = products.get(r.productId);
    return [
      OUTCOME_LABELS[r.outcome],
      r.productId,
      r.name,
      p?.openingStockUnits ?? null,
      p?.closingStockUnits ?? null,
      r.metrics.averageStockUnits,
      p?.soldUnits ?? null,
      r.metrics.rotation === null ? null : r.metrics.rotation.toFixed(2).replace(".", ","),
      r.metrics.daysOfInventory === null ? null : Math.round(r.metrics.daysOfInventory),
      r.metrics.availableUnits,
      r.metrics.reorderPointUnits,
      r.metrics.targetLevelUnits,
      r.suggestedPurchaseUnits,
      Math.round(r.suggestedPurchaseMinor / 100),
      r.explanation,
    ].map(cell);
  });
  return "﻿" + [HEADER, ...rows].map((row) => row.join(";")).join("\r\n") + "\r\n";
}

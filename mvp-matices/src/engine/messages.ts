import type { RecommendationOutcome, RuleResult } from "@/contracts/recommendation";

const pesos = new Intl.NumberFormat("es-CO", {
  style: "currency",
  currency: "COP",
  maximumFractionDigits: 0,
});

export function formatPesos(minor: number): string {
  return pesos.format(minor / 100);
}

function num(value: unknown): number {
  return typeof value === "number" ? value : 0;
}

function messageFor(result: RuleResult): string {
  const v = result.values;
  switch (result.reasonCode) {
    case "NEGATIVE_QUANTITY":
      return "Hay cantidades negativas en los datos; corrígelas antes de decidir una compra.";
    case "ZERO_COST":
      return "El costo unitario es cero; sin costo no se puede valorar el pedido.";
    case "SHORT_HISTORY":
      return `Solo hay ${num(v.periodDays)} días de historial y se necesitan al menos ${num(v.minHistoryDays)} para estimar la demanda.`;
    case "AT_REORDER_POINT":
      return `Hay ${num(v.availableUnits)} unidades disponibles y el punto de pedido es ${num(v.reorderPointUnits)}: se agotaría antes de que llegue el próximo pedido.`;
    case "BELOW_TARGET":
      return `Hay ${num(v.availableUnits)} unidades y el nivel objetivo es ${num(v.targetLevelUnits)}: conviene pedir en el próximo ciclo.`;
    case "STAGNANT_CAPITAL":
      return `No tuvo ventas en el periodo y hay ${num(v.currentStockUnits)} unidades paradas (${formatPesos(num(v.stagnantCapitalMinor))} a costo).`;
    default:
      return "";
  }
}

const HEADLINE: Record<RecommendationOutcome, string> = {
  ORDER_NOW: "Pedir ya.",
  WATCH: "Vigilar.",
  SUFFICIENT: "Stock suficiente.",
};

/** Builds the explanation from templates. The decision never comes from here: this only narrates it. */
export function explainRecommendation(
  outcome: RecommendationOutcome,
  results: RuleResult[],
  suggestedUnits: number,
  suggestedMinor: number,
): string {
  const reasons = results
    .filter((r) => r.outcome !== "OK" || r.reasonCode === "STAGNANT_CAPITAL")
    .map(messageFor)
    .filter((text) => text.length > 0);
  const purchase =
    outcome === "ORDER_NOW"
      ? [`Compra sugerida: ${suggestedUnits} unidades (${formatPesos(suggestedMinor)} a costo).`]
      : [];
  const fallback =
    reasons.length === 0 ? ["Cubre la demanda esperada hasta el próximo pedido."] : [];
  return [HEADLINE[outcome], ...reasons, ...fallback, ...purchase].join(" ");
}

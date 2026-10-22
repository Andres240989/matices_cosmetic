import type { RecommendationOutcome } from "@/contracts/recommendation";

const pesos = new Intl.NumberFormat("es-CO", {
  style: "currency",
  currency: "COP",
  maximumFractionDigits: 0,
});

export function formatPesos(minor: number): string {
  return pesos.format(minor / 100);
}

export function formatDecimal(value: number | null, digits = 2): string {
  if (value === null) return "—";
  return value.toLocaleString("es-CO", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}

export function formatPercent(ratio: number): string {
  return ratio.toLocaleString("es-CO", { style: "percent", maximumFractionDigits: 0 });
}

export const OUTCOME_LABELS: Record<RecommendationOutcome, string> = {
  ORDER_NOW: "Pedir ya",
  WATCH: "Vigilar",
  SUFFICIENT: "Stock suficiente",
};

/** Products without a code in the file show an empty code: Matices never invents one. */
export function displayProductCode(product: { productId: string; isProductIdFromName: boolean }) {
  return product.isProductIdFromName ? "" : product.productId;
}

export function formatPeriod(periodStart: string, periodEnd: string): string {
  return `${periodStart} a ${periodEnd}`;
}

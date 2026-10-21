import {
  CONSOLIDATED_BASIS,
  toPeriodKey,
  type AnalysisRequest,
  type AnalysisResult,
  type DemandBasis,
  type DemandBasisOption,
  type ExcludedProduct,
} from "@/contracts/analysis";
import type { LoadedPeriod } from "@/contracts/ingestion";
import { consolidatePeriods, sortPeriods } from "./consolidate-periods";
import { evaluatePortfolio } from "./evaluate-portfolio";
import { computePortfolioRotation } from "./portfolio-rotation";

type Basis = { period: LoadedPeriod; excludedProducts: ExcludedProduct[] };

function listBases(sorted: LoadedPeriod[]): Map<DemandBasis, Basis> {
  const bases = new Map<DemandBasis, Basis>();
  const consolidated = consolidatePeriods(sorted);
  if (consolidated) bases.set(CONSOLIDATED_BASIS, consolidated);
  for (const period of [...sorted].reverse()) {
    bases.set(toPeriodKey(period), { period, excludedProducts: [] });
  }
  return bases;
}

/**
 * Evaluates the chosen basis of demand: one loaded period, or every consecutive period merged.
 * Without a choice, the consolidated window is used when it exists, otherwise the latest period.
 * Throws when the basis does not exist or `asOf` is before the latest period ends.
 */
export function analyzePeriods(request: AnalysisRequest): AnalysisResult {
  const sorted = sortPeriods(request.periods);
  const bases = listBases(sorted);
  const basis = request.basis ?? (bases.keys().next().value as DemandBasis);
  const chosen = bases.get(basis);
  if (!chosen) throw new Error(`La base de demanda ${basis} no existe en los periodos cargados.`);

  const latestEnd = sorted.reduce((max, p) => (p.periodEnd > max ? p.periodEnd : max), "");
  if (request.asOf < latestEnd) {
    throw new Error(
      `La fecha de análisis (${request.asOf}) no puede ser anterior al fin del último periodo (${latestEnd}).`,
    );
  }

  const evaluatedPeriod = { ...chosen.period, asOf: request.asOf };
  const { recommendations, summary } = evaluatePortfolio(evaluatedPeriod, request.rulesConfig);
  const basisOptions: DemandBasisOption[] = [...bases].map(([key, value]) => ({
    basis: key,
    periodStart: value.period.periodStart,
    periodEnd: value.period.periodEnd,
  }));

  return {
    basis,
    basisOptions,
    evaluatedPeriod,
    recommendations,
    summary,
    periodRotations: sorted.map((period) => ({
      periodStart: period.periodStart,
      periodEnd: period.periodEnd,
      rotation: computePortfolioRotation(period.products),
    })),
    excludedProducts: chosen.excludedProducts,
  };
}

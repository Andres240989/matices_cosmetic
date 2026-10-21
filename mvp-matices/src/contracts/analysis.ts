import { z } from "zod";
import { IsoDateSchema } from "./dates";
import { LoadedPeriodSchema } from "./ingestion";
import { InventoryPeriodSchema } from "./product";
import { PortfolioSummarySchema, RecommendationSchema } from "./recommendation";
import { RulesConfigSchema } from "./rules-config";

/** Basis of demand: one loaded period (`<periodStart>_<periodEnd>`) or all consecutive periods merged. */
export const CONSOLIDATED_BASIS = "CONSOLIDATED";
export const DemandBasisSchema = z.union([
  z.literal(CONSOLIDATED_BASIS),
  z.string().regex(/^\d{4}-\d{2}-\d{2}_\d{4}-\d{2}-\d{2}$/),
]);
export type DemandBasis = z.infer<typeof DemandBasisSchema>;

export function toPeriodKey(period: { periodStart: string; periodEnd: string }): string {
  return `${period.periodStart}_${period.periodEnd}`;
}

export const AnalysisRequestSchema = z.object({
  periods: z.array(LoadedPeriodSchema).min(1),
  asOf: IsoDateSchema,
  rulesConfig: RulesConfigSchema,
  basis: DemandBasisSchema.optional(),
});
export type AnalysisRequest = z.infer<typeof AnalysisRequestSchema>;

export const DemandBasisOptionSchema = z.object({
  basis: DemandBasisSchema,
  periodStart: IsoDateSchema,
  periodEnd: IsoDateSchema,
});
export type DemandBasisOption = z.infer<typeof DemandBasisOptionSchema>;

/** Rotation of the whole portfolio in one period, weighted at cost. */
export const PeriodRotationSchema = z.object({
  periodStart: IsoDateSchema,
  periodEnd: IsoDateSchema,
  /** `null` when the portfolio had no average stock in the period. */
  rotation: z.number().nullable(),
});
export type PeriodRotation = z.infer<typeof PeriodRotationSchema>;

export const ExcludedProductSchema = z.object({
  productId: z.string().min(1),
  name: z.string().min(1),
  /** Spanish, shown as is. */
  reason: z.string().min(1),
});
export type ExcludedProduct = z.infer<typeof ExcludedProductSchema>;

export const AnalysisResultSchema = z.object({
  basis: DemandBasisSchema,
  basisOptions: z.array(DemandBasisOptionSchema).min(1),
  /** The period the engine evaluated, with the analysis date. */
  evaluatedPeriod: InventoryPeriodSchema,
  recommendations: z.array(RecommendationSchema),
  summary: PortfolioSummarySchema,
  periodRotations: z.array(PeriodRotationSchema),
  excludedProducts: z.array(ExcludedProductSchema),
});
export type AnalysisResult = z.infer<typeof AnalysisResultSchema>;

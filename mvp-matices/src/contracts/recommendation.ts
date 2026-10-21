import { z } from "zod";
import { IsoDateSchema } from "./dates";
import { MinorUnitsSchema } from "./money";

export const RECOMMENDATION_OUTCOMES = ["ORDER_NOW", "WATCH", "SUFFICIENT"] as const;
export const RecommendationOutcomeSchema = z.enum(RECOMMENDATION_OUTCOMES);
export type RecommendationOutcome = z.infer<typeof RecommendationOutcomeSchema>;

export const RuleIdSchema = z.enum([
  "R1_DATA_QUALITY",
  "R2_REORDER_POINT",
  "R3_COVERAGE",
  "R4_STAGNATION",
]);
export type RuleId = z.infer<typeof RuleIdSchema>;

/** What one rule says: `OK` means "no objection", not "buy" or "do not buy". */
export const RuleOutcomeSchema = z.enum(["OK", "WATCH", "ORDER_NOW"]);
export type RuleOutcome = z.infer<typeof RuleOutcomeSchema>;

export const RuleResultSchema = z.object({
  ruleId: RuleIdSchema,
  outcome: RuleOutcomeSchema,
  reasonCode: z.string().min(1),
  /** The numbers the rule compared, so the explanation can quote them. */
  values: z.record(z.string(), z.union([z.number(), z.string(), z.null()])),
});
export type RuleResult = z.infer<typeof RuleResultSchema>;

export const RecommendationMetricsSchema = z.object({
  periodDays: z.number().int().positive(),
  dailyDemand: z.number().nonnegative(),
  rotation: z.number().nonnegative().nullable(),
  daysOfInventory: z.number().nonnegative().nullable(),
  marginRatio: z.number().nullable(),
  gmroiAnnualized: z.number().nullable(),
  targetLevelUnits: z.number().int().nonnegative(),
  reorderPointUnits: z.number().int().nonnegative(),
  availableUnits: z.number().int(),
  stagnantCapitalMinor: MinorUnitsSchema,
});
export type RecommendationMetrics = z.infer<typeof RecommendationMetricsSchema>;

export const RecommendationSchema = z.object({
  productId: z.string().min(1),
  name: z.string().min(1),
  outcome: RecommendationOutcomeSchema,
  ruleResults: z.array(RuleResultSchema).min(1),
  metrics: RecommendationMetricsSchema,
  suggestedPurchaseUnits: z.number().int().nonnegative(),
  suggestedPurchaseMinor: MinorUnitsSchema,
  /** Spanish sentence built from templates, never free text from a model. */
  explanation: z.string().min(1),
  rulesConfigVersion: z.number().int().positive(),
  asOf: IsoDateSchema,
});
export type Recommendation = z.infer<typeof RecommendationSchema>;

export const PortfolioSummarySchema = z.object({
  productCount: z.number().int().nonnegative(),
  orderNowCount: z.number().int().nonnegative(),
  watchCount: z.number().int().nonnegative(),
  sufficientCount: z.number().int().nonnegative(),
  orderNowUnits: z.number().int().nonnegative(),
  orderNowMinor: MinorUnitsSchema,
  stagnantCapitalMinor: MinorUnitsSchema,
  inventoryCostMinor: MinorUnitsSchema,
});
export type PortfolioSummary = z.infer<typeof PortfolioSummarySchema>;

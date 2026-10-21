import { z } from "zod";

/** Business rules the company configures. Every change creates a new `version`. */
export const RulesConfigSchema = z.object({
  version: z.number().int().positive(),
  /** Days between sending the purchase order and receiving the goods (6 to 10 today). */
  leadTimeDays: z.number().int().positive().max(180),
  /** Days between one purchase order and the next. */
  reviewPeriodDays: z.number().int().positive().max(180),
  /** Probability of not running out of stock during the horizon, e.g. 0.9. */
  serviceLevel: z.number().gt(0.5).lt(1),
  /** Below this many days of sales history the engine does not trust the demand estimate. */
  minHistoryDays: z.number().int().positive().max(365),
});
export type RulesConfig = z.infer<typeof RulesConfigSchema>;

export const DEFAULT_RULES_CONFIG: RulesConfig = {
  version: 1,
  leadTimeDays: 10,
  reviewPeriodDays: 30,
  serviceLevel: 0.9,
  minHistoryDays: 30,
};

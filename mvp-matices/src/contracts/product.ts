import { z } from "zod";
import { IsoDateSchema } from "./dates";
import { MinorUnitsSchema } from "./money";

/**
 * One product over one analysis period. Stock fields allow negative integers on purpose:
 * accounting systems do produce them, and rule R1 turns them into a WATCH instead of a crash.
 */
export const ProductPeriodSchema = z.object({
  productId: z.string().min(1),
  name: z.string().min(1),
  openingStockUnits: z.number().int(),
  closingStockUnits: z.number().int(),
  soldUnits: z.number().int(),
  /** Stock on the day of the analysis (`asOf`). */
  currentStockUnits: z.number().int(),
  /** Units already ordered and not yet received. */
  inTransitUnits: z.number().int().default(0),
  unitCostMinor: MinorUnitsSchema,
  /** `null` when the source has no sale price: profitability is then not computed. */
  unitPriceMinor: MinorUnitsSchema.nullable(),
});
export type ProductPeriod = z.infer<typeof ProductPeriodSchema>;

export const InventoryPeriodSchema = z
  .object({
    periodStart: IsoDateSchema,
    periodEnd: IsoDateSchema,
    asOf: IsoDateSchema,
    products: z.array(ProductPeriodSchema),
  })
  .refine((value) => value.periodStart <= value.periodEnd, {
    message: "periodStart must not be after periodEnd",
  })
  .refine((value) => value.asOf >= value.periodEnd, {
    message: "asOf must not be before periodEnd",
  });
export type InventoryPeriod = z.infer<typeof InventoryPeriodSchema>;

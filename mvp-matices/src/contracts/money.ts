import { z } from "zod";

/** Money is always an integer in minor units (centavos). Never a float. */
export const MinorUnitsSchema = z.number().int().nonnegative();
export type MinorUnits = z.infer<typeof MinorUnitsSchema>;

export const CURRENCY = "COP";

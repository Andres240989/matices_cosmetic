import { z } from "zod";
import { IsoDateSchema } from "./dates";
import { ProductPeriodSchema } from "./product";

export const INGESTION_LIMITS = { maxFiles: 10, maxFileBytes: 5 * 1024 * 1024 } as const;

/** One period as read from the files, before an analysis date is chosen. */
export const LoadedPeriodSchema = z
  .object({
    periodStart: IsoDateSchema,
    periodEnd: IsoDateSchema,
    products: z.array(ProductPeriodSchema).min(1),
  })
  .refine((value) => value.periodStart <= value.periodEnd, {
    message: "periodStart must not be after periodEnd",
  });
export type LoadedPeriod = z.infer<typeof LoadedPeriodSchema>;

/** `REJECTED`: the row was not loaded. `NOTICE`: the file was loaded with an assumption worth knowing. */
export const IngestionIssueSchema = z.object({
  severity: z.enum(["REJECTED", "NOTICE"]),
  fileName: z.string().min(1),
  /** 1-based row number as the spreadsheet shows it; `null` for issues about the whole file. */
  rowNumber: z.number().int().positive().nullable(),
  /** Spanish, shown as is on the load report. */
  message: z.string().min(1),
});
export type IngestionIssue = z.infer<typeof IngestionIssueSchema>;

export const IngestionResultSchema = z.object({
  periods: z.array(LoadedPeriodSchema),
  issues: z.array(IngestionIssueSchema),
  rowsRead: z.number().int().nonnegative(),
  rowsAccepted: z.number().int().nonnegative(),
});
export type IngestionResult = z.infer<typeof IngestionResultSchema>;

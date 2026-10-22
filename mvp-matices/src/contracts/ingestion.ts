import { z } from "zod";
import { IsoDateSchema } from "./dates";
import { ProductPeriodSchema } from "./product";

/** 4 MB in total stays under the 4.5 MB request body limit of Vercel functions. */
export const INGESTION_LIMITS = { maxFiles: 10, maxTotalBytes: 4 * 1024 * 1024 } as const;

/** Spanish message when an upload breaks the limits, `null` when it is fine. Shared by server and screen. */
export function findUploadLimitError(files: { name: string; size: number }[]): string | null {
  if (files.length === 0) return "Selecciona al menos un archivo.";
  if (files.length > INGESTION_LIMITS.maxFiles) {
    return `Máximo ${INGESTION_LIMITS.maxFiles} archivos por carga.`;
  }
  const totalBytes = files.reduce((sum, f) => sum + f.size, 0);
  if (totalBytes > INGESTION_LIMITS.maxTotalBytes) {
    return "Los archivos suman más de 4 MB: cárgalos en varias tandas.";
  }
  return null;
}

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

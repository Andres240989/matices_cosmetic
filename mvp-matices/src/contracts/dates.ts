import { z } from "zod";

const MS_PER_DAY = 86_400_000;

function toUtcDay(isoDate: string): number {
  const [year, month, day] = isoDate.split("-").map(Number);
  return Date.UTC(year as number, (month as number) - 1, day as number);
}

/** Calendar date `YYYY-MM-DD`. Rejects impossible dates such as `2026-02-31`. */
export const IsoDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .refine(
    (value) => {
      // Zod still runs this after the regex fails, so a non-date text must not throw here.
      const day = new Date(toUtcDay(value));
      return !Number.isNaN(day.getTime()) && day.toISOString().startsWith(value);
    },
    { message: "Not a real calendar date" },
  );
export type IsoDate = z.infer<typeof IsoDateSchema>;

/** Number of days from `start` to `end`, both included (1 Aug to 10 Oct = 71). */
export function countDaysInclusive(start: IsoDate, end: IsoDate): number {
  return Math.round((toUtcDay(end) - toUtcDay(start)) / MS_PER_DAY) + 1;
}

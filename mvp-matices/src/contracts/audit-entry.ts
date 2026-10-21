import { z } from "zod";

/** Append-only log. Each entry hashes the previous one, so editing history is detectable. */
export const AuditEntrySchema = z.object({
  sequence: z.number().int().nonnegative(),
  kind: z.enum(["RECOMMENDATION", "APPROVAL", "RULES_CHANGE"]),
  payload: z.record(z.string(), z.unknown()),
  previousHash: z.string().regex(/^[0-9a-f]{64}$/),
  hash: z.string().regex(/^[0-9a-f]{64}$/),
  /** ISO 8601 UTC timestamp. */
  createdAt: z.iso.datetime(),
});
export type AuditEntry = z.infer<typeof AuditEntrySchema>;

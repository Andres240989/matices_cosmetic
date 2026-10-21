import { z } from "zod";

/**
 * A person's decision on a recommendation. The tool never creates a purchase order by itself:
 * without an approval record there is no purchase.
 */
export const PurchaseApprovalSchema = z
  .object({
    recommendationId: z.string().min(1),
    action: z.enum(["APPROVE", "ADJUST", "REJECT"]),
    approvedUnits: z.number().int().nonnegative(),
    approver: z.string().min(1),
    reason: z.string(),
    /** ISO 8601 UTC timestamp, e.g. `2026-10-21T14:30:00Z`. */
    decidedAt: z.iso.datetime(),
  })
  .refine((value) => value.action !== "REJECT" || value.approvedUnits === 0, {
    message: "A rejection approves zero units",
  })
  .refine((value) => value.action === "REJECT" || value.approvedUnits > 0, {
    message: "An approval or adjustment needs at least one unit",
  })
  .refine((value) => value.action === "APPROVE" || value.reason.trim().length > 0, {
    message: "Adjusting or rejecting requires a reason",
  });
export type PurchaseApproval = z.infer<typeof PurchaseApprovalSchema>;

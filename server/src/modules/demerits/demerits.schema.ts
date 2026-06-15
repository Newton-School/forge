import { z } from "zod";

/** Issue a disciplinary demerit against a user. */
export const issueDemeritSchema = z.object({
  userId: z.string().min(1),
  reason: z.string().min(1).max(1000),
  points: z.coerce.number().int().min(1).max(100).default(1),
  policyRef: z.string().max(200).optional(),
  escalated: z.boolean().default(false),
});
export type IssueDemeritInput = z.infer<typeof issueDemeritSchema>;

/** Amend an existing demerit (reason / points / escalation / policy reference). */
export const updateDemeritSchema = z
  .object({
    reason: z.string().min(1).max(1000).optional(),
    points: z.coerce.number().int().min(1).max(100).optional(),
    policyRef: z.string().max(200).optional(),
    escalated: z.boolean().optional(),
  })
  .refine((d) => Object.keys(d).length > 0, { message: "Provide at least one field to update" });
export type UpdateDemeritInput = z.infer<typeof updateDemeritSchema>;

export const listDemeritsQuery = z.object({
  userId: z.string().optional(),
  escalated: z.coerce.boolean().optional(),
  take: z.coerce.number().int().min(1).max(200).default(100),
  skip: z.coerce.number().int().min(0).default(0),
});
export type ListDemeritsQuery = z.infer<typeof listDemeritsQuery>;

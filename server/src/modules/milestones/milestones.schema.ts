import { z } from "zod";

/** Create a project milestone. */
export const createMilestoneSchema = z.object({
  projectId: z.string().min(1),
  name: z.string().min(1).max(200),
  sequence: z.coerce.number().int().min(1).max(100),
  keyOutput: z.string().max(1000).optional(),
  dueAt: z.coerce.date().optional(),
});
export type CreateMilestoneInput = z.infer<typeof createMilestoneSchema>;

/**
 * Update a milestone. `completionPct` and `signOff` drive the derived status,
 * so callers don't set status directly.
 */
export const updateMilestoneSchema = z
  .object({
    name: z.string().min(1).max(200).optional(),
    keyOutput: z.string().max(1000).optional(),
    dueAt: z.coerce.date().optional(),
    completionPct: z.coerce.number().int().min(0).max(100).optional(),
    signOff: z.boolean().optional(),
  })
  .refine((d) => Object.keys(d).length > 0, { message: "Provide at least one field to update" });
export type UpdateMilestoneInput = z.infer<typeof updateMilestoneSchema>;

export const listMilestonesQuery = z.object({
  projectId: z.string().optional(),
  take: z.coerce.number().int().min(1).max(200).default(100),
  skip: z.coerce.number().int().min(0).default(0),
});
export type ListMilestonesQuery = z.infer<typeof listMilestonesQuery>;

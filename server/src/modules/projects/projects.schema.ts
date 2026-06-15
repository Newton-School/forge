import { z } from "zod";

/** Create a group or individual project under a team. */
export const createProjectSchema = z.object({
  teamId: z.string().min(1),
  type: z.enum(["GROUP", "INDIVIDUAL"]),
  name: z.string().min(1).max(200),
  ownerId: z.string().min(1).optional(), // required-ish for INDIVIDUAL; service validates
  problemStatement: z.string().max(4000).optional(),
});
export type CreateProjectInput = z.infer<typeof createProjectSchema>;

/** Faculty gate verdict on a project proposal (L-gate). */
export const proposalDecisionSchema = z.object({
  decision: z.enum(["APPROVED", "REVISE_RESUBMIT", "REJECTED"]),
  feedback: z.string().max(2000).optional(),
});
export type ProposalDecisionInput = z.infer<typeof proposalDecisionSchema>;

export const listProjectsQuery = z.object({
  teamId: z.string().optional(),
  type: z.enum(["GROUP", "INDIVIDUAL"]).optional(),
  take: z.coerce.number().int().min(1).max(200).default(100),
  skip: z.coerce.number().int().min(0).default(0),
});
export type ListProjectsQuery = z.infer<typeof listProjectsQuery>;

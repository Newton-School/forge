import { z } from "zod";

/** Submit a deliverable artifact for review under a project. */
export const submitDeliverableSchema = z.object({
  projectId: z.string().min(1),
  name: z.string().min(1).max(200).optional(),
  milestoneId: z.string().min(1).optional(),
  typeId: z.string().min(1).optional(),
  artifactUrl: z.string().url().max(2000),
});
export type SubmitDeliverableInput = z.infer<typeof submitDeliverableSchema>;

/** Mentor/teacher review verdict on a submitted deliverable. */
export const reviewDeliverableSchema = z.object({
  decision: z.enum(["APPROVED", "REJECTED"]),
  feedback: z.string().max(2000).optional(),
});
export type ReviewDeliverableInput = z.infer<typeof reviewDeliverableSchema>;

export const listDeliverablesQuery = z.object({
  projectId: z.string().optional(),
  reviewStatus: z.enum(["PENDING", "APPROVED", "REJECTED"]).optional(),
  take: z.coerce.number().int().min(1).max(200).default(100),
  skip: z.coerce.number().int().min(0).default(0),
});
export type ListDeliverablesQuery = z.infer<typeof listDeliverablesQuery>;

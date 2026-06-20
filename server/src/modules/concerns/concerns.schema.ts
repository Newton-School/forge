import { z } from "zod";

export const ConcernCategoryEnum = z.enum([
  "MENTOR", "MENTEE", "TEACHER", "TEAM_MEMBER",
  "DOMAIN_ISSUE", "TECHNICAL_ISSUE", "PROCESS_ISSUE", "OTHER",
]);
export const SeverityEnum = z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]);
export const ConcernStatusEnum = z.enum([
  "OPEN", "ACKNOWLEDGED", "IN_PROGRESS", "ESCALATED", "RESOLVED", "CLOSED", "REOPENED",
]);
export type ConcernStatus = z.infer<typeof ConcernStatusEnum>;

export const createConcernSchema = z.object({
  title: z.string().min(3).max(160),
  description: z.string().min(1).max(4000),
  category: ConcernCategoryEnum,
  severity: SeverityEnum.default("MEDIUM"),
  domainId: z.string().optional().nullable(),
  teamId: z.string().optional().nullable(),
  anonymous: z.boolean().default(false),
});
export type CreateConcernInput = z.infer<typeof createConcernSchema>;

export const transitionSchema = z.object({
  to: ConcernStatusEnum,
  note: z.string().max(2000).optional(),
});
export type TransitionInput = z.infer<typeof transitionSchema>;

export const listConcernsQuery = z.object({
  status: ConcernStatusEnum.optional(),
  domain: z.string().optional(), // domainId filter (further narrowed by scope)
  take: z.coerce.number().int().min(1).max(500).default(50),
  skip: z.coerce.number().int().min(0).default(0),
});
export type ListConcernsQuery = z.infer<typeof listConcernsQuery>;

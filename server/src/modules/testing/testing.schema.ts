import { z } from "zod";

export const domainSchema = z.enum(["AI", "ML", "DVA", "SDSE"]);

export const saveProgressSchema = z.object({
  status: z.enum(["NOT_STARTED", "IN_PROGRESS", "COMPLETED"]),
  done: z.array(z.string().max(120)).max(300),
  skipped: z.array(z.string().max(120)).max(300),
  current: z.coerce.number().int().min(0).max(500),
});
export type SaveProgressInput = z.infer<typeof saveProgressSchema>;

export const reportIssueSchema = z.object({
  domainKey: domainSchema,
  stepId: z.string().max(120).optional(),
  title: z.string().min(1).max(200),
  description: z.string().max(4000).optional(),
  severity: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]).default("MEDIUM"),
});
export type ReportIssueInput = z.infer<typeof reportIssueSchema>;

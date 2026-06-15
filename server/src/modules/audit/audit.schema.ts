import { z } from "zod";

/** Filters for reading the immutable audit log. */
export const listAuditQuery = z.object({
  entityType: z.string().max(100).optional(),
  entityId: z.string().max(100).optional(),
  actorId: z.string().max(100).optional(),
  action: z.string().max(100).optional(),
  take: z.coerce.number().int().min(1).max(200).default(100),
  skip: z.coerce.number().int().min(0).default(0),
});
export type ListAuditQuery = z.infer<typeof listAuditQuery>;

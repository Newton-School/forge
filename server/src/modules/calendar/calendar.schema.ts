import { z } from "zod";

export const createEventSchema = z.object({
  title: z.string().min(1).max(300),
  type: z.enum(["MENTOR_MEETING", "REVIEW", "DEADLINE", "MILESTONE", "EVENT"]),
  scopeType: z.enum(["GLOBAL", "DOMAIN", "TEAM", "PERSONAL"]).default("PERSONAL"),
  scopeId: z.string().min(1).optional(),
  startsAt: z.coerce.date(),
  endsAt: z.coerce.date().optional(),
  attendees: z.array(z.string().email()).max(100).optional(),
});
export type CreateEventInput = z.infer<typeof createEventSchema>;

export const listEventsQuery = z.object({
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
  take: z.coerce.number().int().min(1).max(500).default(200),
  skip: z.coerce.number().int().min(0).default(0),
});
export type ListEventsQuery = z.infer<typeof listEventsQuery>;

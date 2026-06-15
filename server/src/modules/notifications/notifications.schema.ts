import { z } from "zod";

export const listNotificationsQuery = z.object({
  unread: z.coerce.boolean().optional(),
  take: z.coerce.number().int().min(1).max(200).default(50),
  skip: z.coerce.number().int().min(0).default(0),
});
export type ListNotificationsQuery = z.infer<typeof listNotificationsQuery>;

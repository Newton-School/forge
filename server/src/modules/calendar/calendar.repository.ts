import { prisma } from "../../lib/db.js";
import type { Prisma } from "@prisma/client";
import type { CreateEventInput } from "./calendar.schema.js";

/** Data access for calendar events. Scope `where` is built by the service. */
export const calendarRepo = {
  create: (input: CreateEventInput, scopeId: string | null, externalEventId: string | null) =>
    prisma.calendarEvent.create({
      data: {
        title: input.title, type: input.type, scopeType: input.scopeType, scopeId,
        startsAt: input.startsAt, endsAt: input.endsAt ?? null,
        attendees: (input.attendees ?? undefined) as Prisma.InputJsonValue,
        externalEventId,
      },
    }),

  list: (where: Record<string, unknown>, take: number, skip: number) =>
    prisma.calendarEvent.findMany({ where, orderBy: { startsAt: "asc" }, take, skip }),
};

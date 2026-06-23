import { Errors } from "../../lib/errors.js";
import { audit } from "../../lib/audit.js";
import { logger } from "../../lib/logger.js";
import { effectiveScope } from "../../rbac/policy.js";
import type { AuthContext } from "../../rbac/types.js";
import { calendarRepo } from "./calendar.repository.js";
import { calendarProvider } from "./calendar.provider.js";
import { calendarReadWhere, canCreateEvent, type CalScope } from "./calendar.access.js";
import type { CreateEventInput, ListEventsQuery } from "./calendar.schema.js";

function calScope(ctx: AuthContext): CalScope {
  const s = effectiveScope(ctx);
  return { global: s.global, domainIds: s.domainIds, teamIds: s.teamIds, self: s.self };
}

export async function listEvents(ctx: AuthContext, q: ListEventsQuery) {
  const where: Record<string, unknown> = { ...calendarReadWhere(calScope(ctx), ctx.id) };
  if (q.from || q.to) {
    where.startsAt = { ...(q.from ? { gte: q.from } : {}), ...(q.to ? { lte: q.to } : {}) };
  }
  const dbEvents = await calendarRepo.list(where, q.take, q.skip);

  // Also surface the shared LCC Google Calendar (drive-wide, visible to everyone). Best-effort:
  // a Google read failure must never break the portal calendar — fall back to DB events only.
  let googleEvents: typeof dbEvents = [];
  const provider = calendarProvider();
  if (provider.name === "google") {
    try {
      const from = q.from ?? new Date(Date.now() - 7 * 86_400_000); // default window: last week → forward
      const ext = await provider.listEvents(from, q.to);
      googleEvents = ext.map((e) => ({
        id: `g_${e.externalId}`,
        scopeType: "GLOBAL",
        scopeId: null,
        title: e.title,
        type: "EVENT" as const,
        startsAt: e.startsAt,
        endsAt: e.endsAt,
        externalEventId: e.externalId,
        attendees: null,
      }));
    } catch (err) {
      logger.warn({ err }, "google calendar read failed — showing DB events only");
    }
  }

  // Merge, dropping any Google event we already mirrored into the DB (same externalEventId).
  const mirrored = new Set(dbEvents.map((e) => e.externalEventId).filter(Boolean));
  const merged = [...dbEvents, ...googleEvents.filter((g) => !mirrored.has(g.externalEventId))]
    .sort((a, b) => a.startsAt.getTime() - b.startsAt.getTime());
  return { items: merged };
}

export async function createEvent(ctx: AuthContext, input: CreateEventInput, ip?: string) {
  // PERSONAL events are always pinned to the creator.
  const scopeId = input.scopeType === "PERSONAL" ? ctx.id : input.scopeId ?? null;
  if (!canCreateEvent(calScope(ctx), input.scopeType, scopeId)) {
    throw Errors.forbidden("You cannot create an event for that scope");
  }

  // Best-effort external push — a calendar outage must not block creating the event.
  let externalEventId: string | null = null;
  try {
    const r = await calendarProvider().createEvent({
      title: input.title, startsAt: input.startsAt, endsAt: input.endsAt, attendees: input.attendees,
    });
    externalEventId = r.externalId;
  } catch (err) {
    logger.error({ err }, "calendar external push failed — saved locally only");
  }

  const event = await calendarRepo.create(input, scopeId, externalEventId);
  await audit(ctx, { action: "calendar:create", entityType: "CalendarEvent", entityId: event.id, after: { title: input.title, scopeType: input.scopeType, synced: externalEventId !== null }, ip });
  return event;
}

/** Integration status — which calendar provider is active. */
export function status() {
  return { provider: calendarProvider().name, googleConfigured: calendarProvider().name === "google" };
}

/** Live connectivity probe — confirms the provider can authenticate. */
export function check() {
  return calendarProvider().verify();
}

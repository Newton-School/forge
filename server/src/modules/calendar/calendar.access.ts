/**
 * Pure calendar visibility + create rules — no I/O, unit-tested.
 * Events carry a `scopeType` (GLOBAL | DOMAIN | TEAM | PERSONAL) and a `scopeId`
 * (the domain/team/user the event belongs to). GLOBAL events are drive-wide.
 */
export type EventScopeType = "GLOBAL" | "DOMAIN" | "TEAM" | "PERSONAL";

export interface CalScope {
  global: boolean;
  domainIds: string[];
  teamIds: string[];
  self: boolean;
}

/** Prisma `where` for the events a user may read. */
export function calendarReadWhere(s: CalScope, userId: string): Record<string, unknown> {
  if (s.global) return {};
  const or: Record<string, unknown>[] = [{ scopeType: "GLOBAL" }];
  if (s.domainIds.length) or.push({ scopeType: "DOMAIN", scopeId: { in: s.domainIds } });
  if (s.teamIds.length) or.push({ scopeType: "TEAM", scopeId: { in: s.teamIds } });
  if (s.self) or.push({ scopeType: "PERSONAL", scopeId: userId });
  return { OR: or };
}

/**
 * May this user create an event with the given scope?
 *  - PERSONAL: anyone (the service forces scopeId = the user).
 *  - GLOBAL: global roles only (Admin/LCC).
 *  - DOMAIN/TEAM: global, or the user owns that domain/team.
 */
export function canCreateEvent(s: CalScope, scopeType: EventScopeType, scopeId: string | null | undefined): boolean {
  switch (scopeType) {
    case "PERSONAL": return true;
    case "GLOBAL": return s.global;
    case "DOMAIN": return s.global || (!!scopeId && s.domainIds.includes(scopeId));
    case "TEAM": return s.global || (!!scopeId && s.teamIds.includes(scopeId));
  }
}

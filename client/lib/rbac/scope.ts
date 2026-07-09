import type { AuthUser, ScopeType } from "@/lib/types";

/**
 * Phase 3 query-scoping helper (shape designed now).
 * Returns the correct Prisma `where` fragment for the caller's highest
 * applicable scope, so services physically cannot return out-of-scope rows.
 *
 * Usage (Phase 3):
 *   prisma.team.findMany({ where: scopeWhere(ctx, {
 *     global: {},
 *     domain: { domain: { teacherId: ctx.userId } },
 *     team:   { mentorId: ctx.userId }, // the Student Mentor leads the team
 *     self:   { members: { some: { userId: ctx.userId } } },
 *   }) })
 */
export interface ScopeClauses<T = Record<string, unknown>> {
  global?: T;
  domain?: T;
  team?: T;
  self?: T;
}

const RANK: Record<ScopeType, number> = { GLOBAL: 3, DOMAIN: 2, TEAM: 1, SELF: 0 };

export function highestScope(user: AuthUser): ScopeType {
  return user.scopes
    .map((s) => s.type)
    .sort((a, b) => RANK[b] - RANK[a])[0] ?? "SELF";
}

export function scopeWhere<T extends Record<string, unknown>>(
  user: AuthUser,
  clauses: ScopeClauses<T>,
): T {
  switch (highestScope(user)) {
    case "GLOBAL":
      return (clauses.global ?? {}) as T;
    case "DOMAIN":
      return (clauses.domain ?? clauses.global ?? {}) as T;
    case "TEAM":
      return (clauses.team ?? clauses.self ?? {}) as T;
    default:
      return (clauses.self ?? {}) as T;
  }
}

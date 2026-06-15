import type { AuthContext } from "./types.js";
import { effectiveScope } from "./policy.js";

/**
 * Build a Prisma `where` fragment that restricts a query to what the user may see,
 * given how this entity exposes its domain/team/owner. This is the THIRD enforcement
 * layer (after route gate + policy) — even a logic bug elsewhere can't leak rows.
 *
 *   keys.domain — the field path to the row's domain id (e.g. { domainId: "in" })
 *   keys.team   — the field path to the row's team id
 *   keys.owner  — the field path to the owner user id
 */
export interface ScopeKeys {
  domainField?: string; // e.g. "domainId" or "domain.id"
  teamField?: string; // e.g. "teamId"
  ownerField?: string; // e.g. "raisedById"
}

export function scopeWhere(ctx: AuthContext, keys: ScopeKeys): Record<string, unknown> {
  const s = effectiveScope(ctx);
  if (s.global) return {}; // Admin/LCC see everything

  const or: Record<string, unknown>[] = [];
  if (keys.domainField && s.domainIds.length) or.push(nest(keys.domainField, { in: s.domainIds }));
  if (keys.teamField && s.teamIds.length) or.push(nest(keys.teamField, { in: s.teamIds }));
  if (keys.ownerField && s.self) or.push(nest(keys.ownerField, ctx.id));

  // No applicable scope → match nothing (deny-by-default).
  if (or.length === 0) return { id: "__never__" };
  return or.length === 1 ? or[0]! : { OR: or };
}

/** Turn "a.b" + value into { a: { b: value } }. */
function nest(path: string, value: unknown): Record<string, unknown> {
  const parts = path.split(".");
  return parts.reduceRight<Record<string, unknown>>((acc, key, i) => {
    return { [key]: i === parts.length - 1 ? value : acc };
  }, {} as Record<string, unknown>);
}

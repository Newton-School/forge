import type { AuthContext, Resource, RoleKey, ScopeType } from "./types.js";
import { ROLE_PERMISSIONS, type Permission } from "./permissions.js";

const RANK: Record<ScopeType, number> = { GLOBAL: 3, DOMAIN: 2, TEAM: 1, SELF: 0 };

/** Does a single grant's scope cover the requested resource? */
function grantCovers(
  grant: { scopeType: ScopeType; scopeId: string | null },
  ctx: AuthContext,
  resource?: Resource,
): boolean {
  if (!resource) return true;
  switch (grant.scopeType) {
    case "GLOBAL": return true;
    case "DOMAIN": return !!resource.domainId && resource.domainId === grant.scopeId;
    case "TEAM": return !!resource.teamId && resource.teamId === grant.scopeId;
    case "SELF": return resource.ownerId === ctx.id;
  }
}

/**
 * The single server-side authorization decision. A user is allowed iff one of
 * their role grants both (a) confers the permission and (b) has a scope that
 * covers the resource. Called on every protected request.
 */
export function can(
  ctx: AuthContext | null | undefined,
  action: Permission,
  resource?: Resource,
): boolean {
  if (!ctx) return false;
  // grants whose role confers the action, ordered by scope breadth
  const granting = ctx.roles
    .filter((g) => (ROLE_PERMISSIONS[g.role] ?? []).includes(action))
    .sort((a, b) => RANK[b.scopeType] - RANK[a.scopeType]);
  if (granting.length === 0) return false;
  return granting.some((g) => grantCovers(g, ctx, resource));
}

/** Effective access footprint for query scoping. */
export interface EffectiveScope {
  global: boolean;
  domainIds: string[];
  teamIds: string[];
  self: boolean;
}

/** Resolve, across all of a user's grants, what they can reach (for `scopeWhere`). */
export function effectiveScope(ctx: AuthContext): EffectiveScope {
  const out: EffectiveScope = { global: false, domainIds: [], teamIds: [], self: false };
  for (const g of ctx.roles) {
    if (g.scopeType === "GLOBAL") out.global = true;
    else if (g.scopeType === "DOMAIN" && g.scopeId) out.domainIds.push(g.scopeId);
    else if (g.scopeType === "TEAM" && g.scopeId) out.teamIds.push(g.scopeId);
    else if (g.scopeType === "SELF") out.self = true;
  }
  return out;
}

export function roleKeys(ctx: AuthContext): RoleKey[] {
  return [...new Set(ctx.roles.map((r) => r.role))];
}

export type { Permission };

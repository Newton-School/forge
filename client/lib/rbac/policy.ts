import type { AuthUser, Scope, ScopeType } from "@/lib/types";
import { ROLE_PERMISSIONS, type Permission } from "./permissions";

/** A resource being authorized against, with its scope ownership. */
export interface Resource {
  scopeType: ScopeType;
  domainId?: string;
  teamId?: string;
  ownerId?: string;
}

const SCOPE_RANK: Record<ScopeType, number> = {
  GLOBAL: 3,
  DOMAIN: 2,
  TEAM: 1,
  SELF: 0,
};

/** Does a held scope cover the requested resource? */
function scopeCovers(scope: Scope, user: AuthUser, resource?: Resource): boolean {
  if (!resource) return true;
  if (scope.type === "GLOBAL") return true;
  if (scope.type === "DOMAIN")
    return !!resource.domainId && resource.domainId === scope.id;
  if (scope.type === "TEAM")
    return !!resource.teamId && resource.teamId === scope.id;
  if (scope.type === "SELF") return resource.ownerId === user.id;
  return false;
}

/**
 * Authorization decision used by the UI to show/hide (a hint only — real enforcement
 * is server-side). The server owns the equivalent policy + scope-filtered DB queries.
 */
export function can(
  user: AuthUser | null | undefined,
  action: Permission,
  resource?: Resource,
): boolean {
  if (!user) return false;
  const grants = ROLE_PERMISSIONS[user.role] ?? [];
  if (!grants.includes(action)) return false;
  if (!resource) return true;
  // The user's highest scope that can satisfy the resource wins.
  return user.scopes
    .slice()
    .sort((a, b) => SCOPE_RANK[b.type] - SCOPE_RANK[a.type])
    .some((s) => scopeCovers(s, user, resource));
}

export type { Permission };

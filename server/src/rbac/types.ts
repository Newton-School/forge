/** Shared RBAC types — the server's authorization vocabulary. */
export type RoleKey = "ADMIN" | "LCC" | "TEACHER" | "MENTOR" | "MENTEE";
export type ScopeType = "GLOBAL" | "DOMAIN" | "TEAM" | "SELF";

/** A role grant scoped to a resource set. A user may hold several. */
export interface RoleGrant {
  role: RoleKey;
  scopeType: ScopeType;
  scopeId: string | null; // domain id / team id when scoped
}

/** The authenticated principal carried on every request (req.user). */
export interface AuthContext {
  id: string;
  email: string;
  fullName: string;
  roles: RoleGrant[];
}

/**
 * The resource an action targets, for scope checks. All fields are optional: a caller
 * supplies whatever locates the resource (domain / team / owner). `can()` matches these
 * against each of the user's role grants — see `grantCovers` in `policy.ts`.
 */
export interface Resource {
  domainId?: string | null;
  teamId?: string | null;
  ownerId?: string | null;
}

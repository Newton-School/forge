import type { RoleKey } from "./types.js";

/** resource:action permissions. Extend freely. */
export type Permission =
  | "user:read" | "user:create" | "user:import" | "user:update"
  | "invitation:read" | "invitation:send"
  | "role:assign"
  | "domain:read" | "domain:manage"
  | "team:read" | "team:manage"
  | "project:manage"
  | "config:edit"
  | "review:read"
  | "menteeUpdate:submit"
  | "mentorStatus:submit"
  | "weeklyReview:l3Submit" | "weeklyReview:l4Submit"
  | "gate:decide"
  | "mentorFeedback:submit"
  | "task:assign" | "task:updateOwn"
  | "deliverable:submit" | "deliverable:review"
  | "concern:read" | "concern:raise" | "concern:triage" | "concern:resolve"
  | "email:send" | "email:bulkSend" | "emailTemplate:manage" | "announcement:send"
  | "analytics:global" | "analytics:domain" | "analytics:team" | "analytics:self"
  | "report:generate"
  | "auditLog:read"
  | "integration:manage"
  | "demerit:manage";

/** Canonical role → granted permissions. Scope (which records) is enforced separately. */
export const ROLE_PERMISSIONS: Record<RoleKey, Permission[]> = {
  ADMIN: [
    "review:read",
    "user:read", "user:create", "user:import", "user:update", "role:assign",
    "invitation:read", "invitation:send",
    "domain:read", "domain:manage", "team:read", "team:manage", "project:manage", "config:edit",
    "mentorStatus:submit", "weeklyReview:l3Submit", "weeklyReview:l4Submit", "gate:decide",
    "task:assign", "deliverable:review", "concern:read", "concern:raise", "concern:triage",
    "concern:resolve", "email:send", "email:bulkSend", "emailTemplate:manage", "announcement:send",
    "analytics:global", "analytics:domain", "analytics:team", "analytics:self", "report:generate",
    "auditLog:read", "integration:manage", "demerit:manage",
  ],
  LCC: [
    "review:read",
    "user:read", "user:create", "user:update", "invitation:read", "invitation:send",
    "domain:read", "team:read", "team:manage", "project:manage", "config:edit",
    "concern:read", "concern:raise", "concern:triage", "concern:resolve",
    "email:send", "email:bulkSend", "emailTemplate:manage", "announcement:send",
    "analytics:global", "analytics:domain", "analytics:team", "analytics:self",
    "report:generate", "auditLog:read", "demerit:manage",
  ],
  TEACHER: [
    "review:read",
    "domain:read", "team:read", "team:manage", "project:manage", "config:edit",
    "weeklyReview:l4Submit", "gate:decide", "task:assign", "deliverable:review",
    "concern:read", "concern:raise", "concern:triage", "concern:resolve",
    "email:send", "announcement:send", "analytics:domain", "analytics:team",
    "analytics:self", "report:generate",
  ],
  MENTOR: [
    "review:read",
    "team:read", "project:manage", "mentorStatus:submit", "weeklyReview:l3Submit", "task:assign",
    "deliverable:submit", "deliverable:review", "concern:read", "concern:raise",
    "email:send", "announcement:send", "analytics:team", "analytics:self", "report:generate",
  ],
  MENTEE: [
    "review:read",
    "menteeUpdate:submit", "mentorFeedback:submit", "task:updateOwn", "deliverable:submit",
    "concern:read", "concern:raise", "analytics:self",
  ],
};

/** The union of permissions a user holds across all their role grants. */
export function permissionsFor(roles: RoleKey[]): Set<Permission> {
  const set = new Set<Permission>();
  for (const r of roles) for (const p of ROLE_PERMISSIONS[r] ?? []) set.add(p);
  return set;
}

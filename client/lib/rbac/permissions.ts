import type { RoleKey } from "@/lib/types";

/** resource:action permission strings. Extend freely — permissions are data-like. */
export type Permission =
  | "user:create"
  | "user:import"
  | "user:edit"
  | "role:assign"
  | "domain:manage"
  | "team:manage"
  | "config:edit"
  | "menteeUpdate:submit"
  | "mentorStatus:submit"
  | "weeklyReview:l3Submit"
  | "weeklyReview:l4Submit"
  | "gate:decide"
  | "mentorFeedback:submit"
  | "task:assign"
  | "task:updateOwn"
  | "deliverable:submit"
  | "deliverable:review"
  | "concern:raise"
  | "concern:triage"
  | "concern:resolve"
  | "email:bulkSend"
  | "email:send"
  | "emailTemplate:manage"
  | "announcement:send"
  | "analytics:global"
  | "analytics:domain"
  | "analytics:team"
  | "analytics:self"
  | "report:generate"
  | "auditLog:read"
  | "integration:manage"
  | "demerit:manage";

/** Canonical role → permission grants. Mirrors docs/security-rbac.md §2.4.
 *  Scope (which records) is enforced separately in scope.ts. */
export const ROLE_PERMISSIONS: Record<RoleKey, Permission[]> = {
  ADMIN: [
    "user:create", "user:import", "user:edit", "role:assign", "domain:manage",
    "team:manage", "config:edit", "mentorStatus:submit", "weeklyReview:l3Submit",
    "weeklyReview:l4Submit", "gate:decide", "task:assign", "deliverable:review",
    "concern:raise", "concern:triage", "concern:resolve", "email:bulkSend",
    "email:send", "emailTemplate:manage", "announcement:send", "analytics:global",
    "analytics:domain", "analytics:team", "analytics:self", "report:generate",
    "auditLog:read", "integration:manage", "demerit:manage",
  ],
  LCC: [
    "team:manage", "config:edit", "concern:raise", "concern:triage",
    "concern:resolve", "email:bulkSend", "email:send", "emailTemplate:manage",
    "announcement:send", "analytics:global", "analytics:domain", "analytics:team",
    "analytics:self", "report:generate", "auditLog:read", "demerit:manage",
  ],
  TEACHER: [
    "team:manage", "config:edit", "weeklyReview:l4Submit", "gate:decide",
    "task:assign", "deliverable:review", "concern:raise", "concern:triage",
    "concern:resolve", "email:bulkSend", "announcement:send", "analytics:domain",
    "analytics:team", "analytics:self", "report:generate",
  ],
  // The Student Mentor also leads the team (no separate Team Lead role):
  // mentee management + team delivery (board/issues/PRs, blockers, deliverables).
  MENTOR: [
    "mentorStatus:submit", "weeklyReview:l3Submit", "task:assign",
    "deliverable:review", "deliverable:submit", "concern:raise", "email:send",
    "announcement:send", "analytics:team", "analytics:self", "report:generate",
  ],
  MENTEE: [
    "menteeUpdate:submit", "mentorFeedback:submit", "task:updateOwn",
    "deliverable:submit", "concern:raise", "analytics:self",
  ],
};

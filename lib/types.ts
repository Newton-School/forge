// Shared domain types mirrored from prisma/schema.prisma.
// Phase 1 uses these for mock data + UI; Phase 3 aligns with generated Prisma types.

// The Student Mentor leads their team — there is no separate Team Lead role.
export type RoleKey =
  | "ADMIN"
  | "LCC"
  | "TEACHER"
  | "MENTOR"
  | "MENTEE";

export type ScopeType = "GLOBAL" | "DOMAIN" | "TEAM" | "SELF";

export type UserStatus = "INVITED" | "ACTIVE" | "SUSPENDED" | "DEACTIVATED";

export type WorkStatus =
  | "TODO"
  | "IN_PROGRESS"
  | "IN_REVIEW"
  | "DONE"
  | "RELEASED"
  | "BLOCKED";

export type MenteeStatusL2 =
  | "DOING_WELL"
  | "NEEDS_CONSISTENCY"
  | "NO_UPDATES_4PLUS";

export type MentorStatusL3 = "ON_TRACK" | "AT_RISK" | "NEEDS_DISCUSSION";

export type TeacherDecisionL4 = "CONTINUE" | "MONITOR" | "SCHEDULE_DISCUSSION";

export type AutoFlag =
  | "NONE"
  | "CONSISTENCY_GAP"
  | "REPEATED_BLOCKER"
  | "NO_UPDATES";

export type ConcernCategory =
  | "MENTOR"
  | "MENTEE"
  | "TEACHER"
  | "TEAM_MEMBER"
  | "DOMAIN_ISSUE"
  | "TECHNICAL_ISSUE"
  | "PROCESS_ISSUE"
  | "OTHER";

export type Severity = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export type ConcernStatus =
  | "OPEN"
  | "ACKNOWLEDGED"
  | "IN_PROGRESS"
  | "ESCALATED"
  | "RESOLVED"
  | "CLOSED"
  | "REOPENED";

export interface Scope {
  type: ScopeType;
  id?: string;
}

export interface AuthUser {
  id: string;
  fullName: string;
  email: string;
  role: RoleKey;
  scopes: Scope[];
  domainId?: string;
  /** A teacher may be assigned to multiple domains (keys, e.g. ["AI","ML"]). */
  domainKeys?: string[];
  teamId?: string;
  avatarColor?: string;
}

export interface DomainRef {
  id: string;
  key: string;
  name: string;
}

export interface TeamRef {
  id: string;
  name: string;
  alias: "POD" | "GROUP" | "TEAM" | "SQUAD";
  domainKey: string;
}

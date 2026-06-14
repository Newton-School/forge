import type {
  AutoFlag,
  ConcernStatus,
  MenteeStatusL2,
  MentorStatusL3,
  RoleKey,
  Severity,
  TeacherDecisionL4,
  WorkStatus,
} from "@/lib/types";

export type BadgeTone =
  | "success"
  | "warning"
  | "danger"
  | "info"
  | "neutral"
  | "primary";

export const ROLE_LABEL: Record<RoleKey, string> = {
  ADMIN: "Admin",
  LCC: "LCC",
  TEACHER: "Teacher",
  MENTOR: "Mentor",
  MENTEE: "Mentee",
};

export const L2_LABEL: Record<MenteeStatusL2, { text: string; tone: BadgeTone; dot: string }> = {
  DOING_WELL: { text: "Doing Well", tone: "success", dot: "🟢" },
  NEEDS_CONSISTENCY: { text: "Needs Consistency", tone: "warning", dot: "🟡" },
  NO_UPDATES_4PLUS: { text: "No Updates 4+ Days", tone: "danger", dot: "🔴" },
};

export const L3_LABEL: Record<MentorStatusL3, { text: string; tone: BadgeTone }> = {
  ON_TRACK: { text: "On Track", tone: "success" },
  AT_RISK: { text: "At Risk", tone: "warning" },
  NEEDS_DISCUSSION: { text: "Needs Discussion", tone: "danger" },
};

export const L4_LABEL: Record<TeacherDecisionL4, { text: string; tone: BadgeTone }> = {
  CONTINUE: { text: "Continue", tone: "success" },
  MONITOR: { text: "Monitor", tone: "warning" },
  SCHEDULE_DISCUSSION: { text: "Schedule Discussion", tone: "danger" },
};

export const FLAG_LABEL: Record<AutoFlag, { text: string; tone: BadgeTone }> = {
  NONE: { text: "—", tone: "neutral" },
  CONSISTENCY_GAP: { text: "Consistency Gap", tone: "warning" },
  REPEATED_BLOCKER: { text: "Repeated Blocker", tone: "warning" },
  NO_UPDATES: { text: "No Updates", tone: "danger" },
};

export const WORK_LABEL: Record<WorkStatus, { text: string; tone: BadgeTone }> = {
  TODO: { text: "To Do", tone: "neutral" },
  IN_PROGRESS: { text: "In Progress", tone: "info" },
  IN_REVIEW: { text: "In Review", tone: "primary" },
  DONE: { text: "Done", tone: "success" },
  RELEASED: { text: "Released", tone: "success" },
  BLOCKED: { text: "Blocked", tone: "danger" },
};

export const CONCERN_LABEL: Record<ConcernStatus, { text: string; tone: BadgeTone }> = {
  OPEN: { text: "Open", tone: "info" },
  ACKNOWLEDGED: { text: "Acknowledged", tone: "info" },
  IN_PROGRESS: { text: "In Progress", tone: "primary" },
  ESCALATED: { text: "Escalated", tone: "danger" },
  RESOLVED: { text: "Resolved", tone: "success" },
  CLOSED: { text: "Closed", tone: "neutral" },
  REOPENED: { text: "Reopened", tone: "warning" },
};

export const SEVERITY_LABEL: Record<Severity, { text: string; tone: BadgeTone }> = {
  LOW: { text: "Low", tone: "neutral" },
  MEDIUM: { text: "Medium", tone: "info" },
  HIGH: { text: "High", tone: "warning" },
  CRITICAL: { text: "Critical", tone: "danger" },
};

export const CONCERN_FLOW: ConcernStatus[] = [
  "OPEN",
  "ACKNOWLEDGED",
  "IN_PROGRESS",
  "ESCALATED",
  "RESOLVED",
  "CLOSED",
];

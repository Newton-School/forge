import type { ConcernStatus } from "./concerns.schema.js";

/** The concern lifecycle as an explicit state machine (pure & unit-testable). */
const TRANSITIONS: Record<ConcernStatus, ConcernStatus[]> = {
  OPEN: ["ACKNOWLEDGED", "ESCALATED"],
  ACKNOWLEDGED: ["IN_PROGRESS", "ESCALATED"],
  IN_PROGRESS: ["RESOLVED", "ESCALATED"],
  ESCALATED: ["IN_PROGRESS", "RESOLVED"],
  RESOLVED: ["CLOSED", "REOPENED"],
  REOPENED: ["IN_PROGRESS", "ESCALATED"],
  CLOSED: [], // terminal
};

export function canTransition(from: ConcernStatus, to: ConcernStatus): boolean {
  return TRANSITIONS[from]?.includes(to) ?? false;
}

export function allowedTransitions(from: ConcernStatus): ConcernStatus[] {
  return TRANSITIONS[from] ?? [];
}

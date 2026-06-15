/**
 * Pure review state machine for deliverables.
 * A deliverable is submitted as PENDING and reviewed exactly once into a terminal
 * state. Re-reviewing a terminal deliverable is rejected by the guard below.
 */
export type DeliverableReview = "PENDING" | "APPROVED" | "REJECTED";
export type ReviewDecision = "APPROVED" | "REJECTED";

/** Only a PENDING deliverable may be reviewed. */
export function canReview(current: DeliverableReview): boolean {
  return current === "PENDING";
}

/** The resulting status for a decision applied to a reviewable deliverable. */
export function applyReview(current: DeliverableReview, decision: ReviewDecision): DeliverableReview {
  if (!canReview(current)) {
    throw new Error(`Deliverable already ${current.toLowerCase()} — it cannot be reviewed again`);
  }
  return decision;
}

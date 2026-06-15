/**
 * Pure milestone progress rules — no I/O, fully unit-tested.
 * A milestone's status is derived from its completion percentage and sign-off:
 * a signed-off milestone is DONE; otherwise it tracks completion.
 */
export type WorkStatus = "TODO" | "IN_PROGRESS" | "IN_REVIEW" | "DONE" | "RELEASED" | "BLOCKED";

/** Clamp an arbitrary number to an integer percentage in [0, 100]. */
export function clampPct(n: number): number {
  if (Number.isNaN(n)) return 0;
  return Math.max(0, Math.min(100, Math.round(n)));
}

/** Derive the lifecycle status from completion + sign-off. */
export function deriveStatus(completionPct: number, signedOff: boolean): WorkStatus {
  if (signedOff) return "DONE";
  const pct = clampPct(completionPct);
  if (pct >= 100) return "IN_REVIEW"; // complete but awaiting faculty sign-off
  if (pct > 0) return "IN_PROGRESS";
  return "TODO";
}

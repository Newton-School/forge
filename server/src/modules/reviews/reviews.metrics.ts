/** Pure review metrics — no I/O, fully unit-testable. */

export type AutoFlag = "NONE" | "CONSISTENCY_GAP" | "REPEATED_BLOCKER" | "NO_UPDATES";

const BLANK = new Set(["", "-", "—", "none", "n/a"]);
export function hasBlocker(b: string | null | undefined): boolean {
  return !!b && !BLANK.has(b.trim().toLowerCase());
}

/** Count consecutive most-recent updates that report a blocker (updates newest-first). */
export function blockerStreak(updatesNewestFirst: { blocker?: string | null }[]): number {
  let n = 0;
  for (const u of updatesNewestFirst) {
    if (hasBlocker(u.blocker)) n++;
    else break;
  }
  return n;
}

export interface WeekStats {
  updatesThisWeek: number;
  blockerStreak: number;
  daysSinceUpdate: number;
}

/**
 * Derive the auto-flag from a mentee's week. Mirrors the drive's rules:
 *   🔴 NO_UPDATES        — no update for the inactivity threshold (default 5 days)
 *   REPEATED_BLOCKER     — same blocker across 3+ updates
 *   CONSISTENCY_GAP      — fewer than 3 updates this week
 * Highest-severity flag wins.
 */
export function computeAutoFlag(s: WeekStats, noUpdateDays = 5): AutoFlag {
  if (s.daysSinceUpdate >= noUpdateDays) return "NO_UPDATES";
  if (s.blockerStreak >= 3) return "REPEATED_BLOCKER";
  if (s.updatesThisWeek < 3) return "CONSISTENCY_GAP";
  return "NONE";
}

/** L2 colour status derived from activity (used when the mentor hasn't set one). */
export function deriveL2Status(s: { daysSinceUpdate: number; updatesThisWeek: number }):
  "DOING_WELL" | "NEEDS_CONSISTENCY" | "NO_UPDATES_4PLUS" {
  if (s.daysSinceUpdate >= 4) return "NO_UPDATES_4PLUS";
  if (s.updatesThisWeek < 3) return "NEEDS_CONSISTENCY";
  return "DOING_WELL";
}

/** Whole days between two instants (>= 0). */
export function daysBetween(now: Date, then: Date | null | undefined): number {
  if (!then) return Number.MAX_SAFE_INTEGER;
  return Math.max(0, Math.floor((now.getTime() - then.getTime()) / 86_400_000));
}

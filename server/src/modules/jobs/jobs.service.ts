import { audit } from "../../lib/audit.js";
import { logger } from "../../lib/logger.js";
import { jobsRepo } from "./jobs.repository.js";
import { emitNotification } from "../notifications/notifications.service.js";
import { blockerStreak, daysBetween } from "../reviews/reviews.metrics.js";
import { evaluateEscalations, type MenteeMetric } from "./jobs.logic.js";

const WINDOW_MS = 30 * 86_400_000; // look back 30 days for metrics
const WEEK_MS = 7 * 86_400_000;
const DEDUPE_MS = 24 * 3_600_000; // don't re-escalate the same rule to a user within 24h

export interface JobSummary {
  scanned: number;
  rules: number;
  outcomes: number;
  notified: number;
}

/**
 * Scan mentees, evaluate the configured escalation rules against each one's update
 * history, and emit notifications for fired rules (deduped per rule+user per 24h).
 * Pure decision-making lives in jobs.logic; this only loads data and applies effects.
 */
export async function runAutoFlagJob(now: Date): Promise<JobSummary> {
  const rules = await jobsRepo.activeRules();
  if (rules.length === 0) return { scanned: 0, rules: 0, outcomes: 0, notified: 0 };

  const since = new Date(now.getTime() - WINDOW_MS);
  const mentees = await jobsRepo.menteesWithContext(since);

  const metrics: MenteeMetric[] = mentees.map((u) => {
    const updates = u.menteeUpdates; // newest first
    const lastAt = updates[0]?.date ?? null;
    return {
      menteeId: u.id,
      domainId: u.teamMemberships[0]?.team.domainId ?? null,
      daysSinceUpdate: lastAt ? daysBetween(now, lastAt) : 999,
      blockerStreak: blockerStreak(updates),
      updatesThisWeek: updates.filter((x) => now.getTime() - x.date.getTime() <= WEEK_MS).length,
    };
  });

  const outcomes = evaluateEscalations(metrics, rules);
  const dedupeSince = new Date(now.getTime() - DEDUPE_MS);
  let notified = 0;

  for (const o of outcomes) {
    if (await jobsRepo.recentEscalationExists(o.menteeId, o.ruleId, dedupeSince)) continue;
    await emitNotification(o.menteeId, `ESCALATION:${o.ruleId}`, {
      rule: o.ruleName, action: o.action, severity: o.severity, targetRole: o.targetRole,
    });
    await audit(null, {
      action: `job:escalation:${o.action.toLowerCase()}`, entityType: "EscalationRule", entityId: o.ruleId,
      after: { menteeId: o.menteeId, rule: o.ruleName, severity: o.severity },
    });
    notified += 1;
  }

  const summary: JobSummary = { scanned: mentees.length, rules: rules.length, outcomes: outcomes.length, notified };
  logger.info(summary, "auto-flag job complete");
  return summary;
}

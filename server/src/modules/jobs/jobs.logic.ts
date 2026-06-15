/**
 * Pure escalation evaluation — no I/O, unit-tested. Given per-mentee metrics and the
 * configured escalation rules, decide which rules fire. The runner (service) loads the
 * data, calls this, then applies the outcomes (notify / escalate / flag).
 */
export type ThresholdUnit = "days" | "updates" | "hours";
export type EscalationAction = "FLAG" | "NOTIFY" | "ESCALATE";

export interface MenteeMetric {
  menteeId: string;
  domainId: string | null;
  daysSinceUpdate: number; // 999 when never updated
  blockerStreak: number; // consecutive newest updates carrying a blocker
  updatesThisWeek: number;
}

export interface EscalationRuleLite {
  id: string;
  name: string;
  thresholdValue: number;
  thresholdUnit: ThresholdUnit;
  action: EscalationAction;
  severity: string | null;
  targetRole: string | null;
  domainId: string | null; // null = all domains
}

export interface Outcome {
  menteeId: string;
  ruleId: string;
  ruleName: string;
  action: EscalationAction;
  severity: string | null;
  targetRole: string | null;
}

/** The metric value a rule compares against, derived from its threshold unit. */
export function ruleMetricValue(rule: EscalationRuleLite, m: MenteeMetric): number {
  switch (rule.thresholdUnit) {
    case "days": return m.daysSinceUpdate;
    case "hours": return m.daysSinceUpdate * 24;
    case "updates": return m.blockerStreak;
  }
}

/** A rule applies to a mentee when it's all-domain or matches the mentee's domain. */
function ruleCoversDomain(rule: EscalationRuleLite, m: MenteeMetric): boolean {
  return rule.domainId === null || rule.domainId === m.domainId;
}

/** Evaluate every mentee against every applicable rule; emit an outcome when it fires. */
export function evaluateEscalations(mentees: MenteeMetric[], rules: EscalationRuleLite[]): Outcome[] {
  const out: Outcome[] = [];
  for (const m of mentees) {
    for (const rule of rules) {
      if (!ruleCoversDomain(rule, m)) continue;
      if (ruleMetricValue(rule, m) >= rule.thresholdValue) {
        out.push({ menteeId: m.menteeId, ruleId: rule.id, ruleName: rule.name, action: rule.action, severity: rule.severity, targetRole: rule.targetRole });
      }
    }
  }
  return out;
}

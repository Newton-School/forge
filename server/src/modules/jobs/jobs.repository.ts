import { prisma } from "../../lib/db.js";
import type { EscalationRuleLite } from "./jobs.logic.js";

/** Data access for the auto-flag / escalation runner. */
export const jobsRepo = {
  /** Active-drive escalation rules, mapped to the pure-logic shape. */
  activeRules: async (): Promise<EscalationRuleLite[]> => {
    const rules = await prisma.escalationRule.findMany({ where: { drive: { active: true } } });
    return rules.map((r) => ({
      id: r.id, name: r.name, thresholdValue: r.thresholdValue,
      thresholdUnit: (r.thresholdUnit as EscalationRuleLite["thresholdUnit"]) ?? "days",
      action: (r.action as EscalationRuleLite["action"]) ?? "FLAG",
      severity: r.severity ?? null, targetRole: r.targetRole ?? null, domainId: r.domainId ?? null,
    }));
  },

  /** Mentees (by role) with their recent updates and primary domain, for metric computation. */
  menteesWithContext: (since: Date) =>
    prisma.user.findMany({
      where: { status: "ACTIVE", roles: { some: { role: "MENTEE" } } },
      select: {
        id: true,
        menteeUpdates: { where: { date: { gte: since } }, orderBy: { date: "desc" }, select: { date: true, blocker: true } },
        teamMemberships: { select: { team: { select: { domainId: true, mentorId: true } } }, take: 1 },
      },
    }),

  /** Whether we already escalated this rule to this user inside the dedupe window. */
  recentEscalationExists: async (userId: string, ruleId: string, since: Date): Promise<boolean> => {
    const n = await prisma.notification.findFirst({
      where: { userId, type: `ESCALATION:${ruleId}`, createdAt: { gte: since } },
      select: { id: true },
    });
    return n !== null;
  },
};

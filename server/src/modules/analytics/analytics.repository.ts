import { prisma } from "../../lib/db.js";

/** Read access for analytics rollups. The service passes scope `where` fragments. */
export const analyticsRepo = {
  domains: (where: Record<string, unknown>) =>
    prisma.domain.findMany({
      where: { active: true, ...where },
      select: { id: true, key: true, name: true, teachers: { select: { fullName: true }, take: 1 } },
      orderBy: { name: "asc" },
    }),

  /** Milestone completion samples with their team + domain, for averaging into rollups. */
  milestoneStats: (where: Record<string, unknown>) =>
    prisma.milestone.findMany({
      where,
      select: { completionPct: true, project: { select: { teamId: true, team: { select: { domainId: true } } } } },
    }),

  /** At-risk weekly-review counts grouped by domain. */
  atRiskByDomain: (where: Record<string, unknown>) =>
    prisma.weeklyReview.groupBy({
      by: ["domainId"],
      where: { ...where, mentorStatus: { in: ["AT_RISK", "NEEDS_DISCUSSION"] } },
      _count: { _all: true },
    }),

  teams: (where: Record<string, unknown>) =>
    prisma.team.findMany({
      where,
      select: {
        id: true, name: true, alias: true, domainId: true, mentorId: true, githubRepoUrl: true,
        mentor: { select: { fullName: true } },
        domain: { select: { key: true } },
        _count: { select: { members: true } },
      },
      orderBy: { name: "asc" },
    }),

  countOpenConcerns: (where: Record<string, unknown>) =>
    prisma.concern.count({ where: { ...where, status: { notIn: ["RESOLVED", "CLOSED"] } } }),

  countAtRiskReviews: (where: Record<string, unknown>) =>
    prisma.weeklyReview.count({ where: { ...where, mentorStatus: { in: ["AT_RISK", "NEEDS_DISCUSSION"] } } }),

  countPendingDeliverables: (where: Record<string, unknown>) =>
    prisma.deliverable.count({ where: { ...where, reviewStatus: "PENDING" } }),

  countEscalatedConcerns: (where: Record<string, unknown>) =>
    prisma.concern.count({ where: { ...where, status: "ESCALATED" } }),

  countBlockedTasks: (where: Record<string, unknown>) =>
    prisma.task.count({ where: { ...where, status: "BLOCKED" } }),

  /** Onboarding signal: how many provisioned users have activated — scope-filtered by the caller. */
  userStatusCounts: (where: Record<string, unknown> = {}) =>
    prisma.user.groupBy({ by: ["status"], where: { deletedAt: null, ...where }, _count: { _all: true } }),

  /** Distinct mentees who logged an update since `since` (weekly-compliance numerator), in scope. */
  recentUpdaterCount: async (since: Date, where: Record<string, unknown> = {}): Promise<number> =>
    (await prisma.menteeUpdate.findMany({ where: { ...where, date: { gte: since } }, distinct: ["userId"], select: { userId: true } })).length,
};

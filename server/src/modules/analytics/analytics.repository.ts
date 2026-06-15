import { prisma } from "../../lib/db.js";

/** Read access for analytics rollups. The service passes scope `where` fragments. */
export const analyticsRepo = {
  domains: (where: Record<string, unknown>) =>
    prisma.domain.findMany({
      where: { active: true, ...where },
      select: { id: true, key: true, name: true },
      orderBy: { name: "asc" },
    }),

  teams: (where: Record<string, unknown>) =>
    prisma.team.findMany({
      where,
      select: { id: true, name: true, domainId: true, mentorId: true, domain: { select: { key: true } }, _count: { select: { members: true } } },
      orderBy: { name: "asc" },
    }),

  countOpenConcerns: (where: Record<string, unknown>) =>
    prisma.concern.count({ where: { ...where, status: { notIn: ["RESOLVED", "CLOSED"] } } }),

  countAtRiskReviews: (where: Record<string, unknown>) =>
    prisma.weeklyReview.count({ where: { ...where, mentorStatus: { in: ["AT_RISK", "NEEDS_DISCUSSION"] } } }),

  countPendingDeliverables: (where: Record<string, unknown>) =>
    prisma.deliverable.count({ where: { ...where, reviewStatus: "PENDING" } }),
};

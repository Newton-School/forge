import { prisma } from "../../lib/db.js";
import type { Prisma, TestDomainStatus, RoleKey, ScopeType } from "@prisma/client";

export interface ProgressData {
  status: TestDomainStatus;
  done: string[];
  skipped: string[];
  current: number;
}

/** Data access for the Testing Portal (tester progress + reported issues). */
export const testingRepo = {
  progressForTester: (testerEmail: string) =>
    prisma.testingProgress.findMany({ where: { testerEmail } }),

  upsertProgress: (testerEmail: string, domainKey: string, data: ProgressData) =>
    prisma.testingProgress.upsert({
      where: { testerEmail_domainKey: { testerEmail, domainKey } },
      update: data,
      create: { testerEmail, domainKey, ...data },
    }),

  createIssue: (data: Prisma.TestIssueUncheckedCreateInput) => prisma.testIssue.create({ data }),

  issuesForTester: (testerEmail: string) =>
    prisma.testIssue.findMany({ where: { testerEmail }, orderBy: { createdAt: "desc" }, take: 500 }),

  allIssues: () => prisma.testIssue.findMany({ orderBy: { createdAt: "desc" }, take: 500 }),

  allProgress: () => prisma.testingProgress.findMany({ orderBy: { updatedAt: "desc" } }),

  /** All guided test plans with their ordered steps (the DB-backed test script). */
  allPlans: () =>
    prisma.testPlan.findMany({
      orderBy: { domainKey: "asc" },
      include: { steps: { orderBy: { seq: "asc" } } },
    }),

  /** How many steps a domain's plan has — used to compute domain status server-side. */
  planStepCount: (domainKey: string) => prisma.testPlanStep.count({ where: { plan: { domainKey } } }),

  /** The REAL provisioned environment for a domain: the test team + members + repos, and the
   *  domain-scoped teacher(s). Returns team=null when the domain isn't currently provisioned. */
  environmentFor: (domainId: string, teamId: string) =>
    Promise.all([
      prisma.team.findUnique({
        where: { id: teamId },
        include: {
          members: { include: { user: { select: { fullName: true, email: true } } } },
          repositories: { select: { fullName: true } },
        },
      }),
      prisma.user.findMany({
        where: { roles: { some: { role: "TEACHER", scopeType: "DOMAIN", scopeId: domainId } } },
        select: { fullName: true, email: true },
      }),
    ]).then(([team, teachers]) => ({ team, teachers })),

  // ── Provisioning (idempotent upserts) — used when the Testing Admin starts a domain ──
  domainByKey: (key: string) => prisma.domain.findFirst({ where: { key } }),

  upsertTeam: (id: string, domainId: string, name: string) =>
    prisma.team.upsert({ where: { id }, update: { name, domainId }, create: { id, domainId, name } }),

  setTeamMentor: (id: string, mentorId: string) =>
    prisma.team.update({ where: { id }, data: { mentorId } }),

  /** Upsert a tester account; returns whether it was newly created (drives invite-once). */
  ensureUser: async (email: string, fullName: string): Promise<{ id: string; email: string; fullName: string; created: boolean }> => {
    const existing = await prisma.user.findUnique({ where: { email }, select: { id: true, email: true, fullName: true } });
    if (existing) return { ...existing, created: false };
    const created = await prisma.user.create({ data: { email, fullName, status: "INVITED" }, select: { id: true, email: true, fullName: true } });
    return { ...created, created: true };
  },

  // Find-or-create rather than upsert: the compound-unique `where` can't target a null
  // scopeId (Prisma types it non-null), and SELF-scoped mentee grants have scopeId = null.
  ensureRole: async (userId: string, role: RoleKey, scopeType: ScopeType, scopeId: string | null) => {
    const existing = await prisma.userRole.findFirst({ where: { userId, role, scopeType, scopeId } });
    return existing ?? prisma.userRole.create({ data: { userId, role, scopeType, scopeId } });
  },

  ensureMember: (teamId: string, userId: string, memberRole: string) =>
    prisma.teamMember.upsert({
      where: { teamId_userId: { teamId, userId } },
      update: { memberRole },
      create: { teamId, userId, memberRole },
    }),

  /** Ids of any provisioned tester accounts that currently exist (by roster email). */
  testerIds: (emails: string[]) =>
    prisma.user.findMany({ where: { email: { in: emails } }, select: { id: true, email: true } }),

  /** Which of the candidate test-team ids actually exist right now. */
  existingTestTeams: (ids: string[]) =>
    prisma.team.findMany({ where: { id: { in: ids } }, select: { id: true } }),

  /**
   * Tear down a provisioned testing environment: delete the given test teams and tester
   * users plus all data hanging off them, in FK-safe order, inside one transaction. Keeps
   * everything else (seeded Admin/LCC, domains, drive) and the TestingProgress/TestIssue
   * report (those are keyed by email, never deleted here). Returns the count of users removed.
   */
  teardown: (userIds: string[], teamIds: string[]) =>
    prisma.$transaction(async (tx) => {
      if (teamIds.length) {
        const projects = await tx.project.findMany({ where: { teamId: { in: teamIds } }, select: { id: true } });
        const projectIds = projects.map((p) => p.id);
        if (projectIds.length) {
          await tx.deliverable.deleteMany({ where: { projectId: { in: projectIds } } });
          await tx.task.deleteMany({ where: { projectId: { in: projectIds } } });
          await tx.milestone.deleteMany({ where: { projectId: { in: projectIds } } });
        }
        await tx.project.deleteMany({ where: { teamId: { in: teamIds } } });
      }
      if (userIds.length) {
        // Required-FK children that would otherwise block the user delete.
        await tx.concern.deleteMany({ where: { raisedById: { in: userIds } } }); // cascades ConcernEvent
        await tx.demerit.deleteMany({ where: { userId: { in: userIds } } });
        await tx.menteeUpdate.deleteMany({ where: { userId: { in: userIds } } });
        // Soft-referenced "their data" (no FK, but logically theirs).
        await tx.skillAssessment.deleteMany({ where: { userId: { in: userIds } } });
        await tx.attendance.deleteMany({ where: { userId: { in: userIds } } });
        await tx.weeklyReview.deleteMany({ where: { OR: [{ menteeId: { in: userIds } }, { mentorId: { in: userIds } }] } });
        await tx.mentorStatus.deleteMany({ where: { OR: [{ menteeId: { in: userIds } }, { mentorId: { in: userIds } }] } });
        await tx.mentorFeedback.deleteMany({ where: { OR: [{ menteeId: { in: userIds } }, { mentorId: { in: userIds } }] } });
        await tx.mentorshipLog.deleteMany({ where: { OR: [{ menteeId: { in: userIds } }, { mentorId: { in: userIds } }] } });
      }
      if (teamIds.length || userIds.length) {
        await tx.githubActivity.deleteMany({ where: { OR: [{ teamId: { in: teamIds } }, { userId: { in: userIds } }] } });
        await tx.discordActivity.deleteMany({ where: { OR: [{ teamId: { in: teamIds } }, { userId: { in: userIds } }] } });
      }
      // Team delete cascades TeamMember + Repository (+ repo branches/releases/collaborators).
      if (teamIds.length) await tx.team.deleteMany({ where: { id: { in: teamIds } } });
      // User delete cascades UserRole, Invitation, PasswordReset, Notification; nulls AuditLog.actor.
      const del = userIds.length ? await tx.user.deleteMany({ where: { id: { in: userIds } } }) : { count: 0 };
      return del.count;
    }),
};

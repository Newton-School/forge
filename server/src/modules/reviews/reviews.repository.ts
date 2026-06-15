import { prisma } from "../../lib/db.js";
import type { MentorStatusInput, SubmitUpdateInput, WeeklyReviewInput } from "./reviews.schema.js";

/** Data access for the L1–L4 review loop. Scope `where` is passed in by the service. */
export const reviewsRepo = {
  // ── teams / mentees ───────────────────────────────────────────────
  /** The first team a user belongs to (a mentee's team context for L1). */
  primaryTeamId: async (userId: string): Promise<string | null> => {
    const m = await prisma.teamMember.findFirst({ where: { userId }, select: { teamId: true } });
    return m?.teamId ?? null;
  },
  mentorTeamIds: async (mentorId: string): Promise<string[]> => {
    const teams = await prisma.team.findMany({ where: { mentorId }, select: { id: true } });
    return teams.map((t) => t.id);
  },
  menteesOfMentor: (mentorId: string) =>
    prisma.teamMember.findMany({
      where: { team: { mentorId } },
      select: {
        teamId: true,
        user: { select: { id: true, fullName: true, email: true } },
        team: { select: { name: true, domainId: true } },
      },
    }),

  // ── L1: mentee updates ────────────────────────────────────────────
  createUpdate: (userId: string, teamId: string | null, input: SubmitUpdateInput) =>
    prisma.menteeUpdate.create({
      data: {
        userId, teamId,
        workedOn: input.workedOn, learning: input.learning,
        blocker: input.blocker ?? null, nextGoal: input.nextGoal,
      },
    }),
  listUpdates: (where: Record<string, unknown>, take: number, skip: number) =>
    prisma.menteeUpdate.findMany({ where, orderBy: { date: "desc" }, take, skip }),
  updatesForMentee: (menteeId: string, since?: Date) =>
    prisma.menteeUpdate.findMany({
      where: { userId: menteeId, ...(since ? { date: { gte: since } } : {}) },
      orderBy: { date: "desc" },
      select: { date: true, blocker: true },
    }),

  // ── L2: mentor status ─────────────────────────────────────────────
  createMentorStatus: (
    menteeId: string,
    mentorId: string,
    input: MentorStatusInput,
    metrics: { updatesThisWeek: number; lastUpdateAt: Date | null; blockerStreak: number; daysSinceUpdate: number },
  ) =>
    prisma.mentorStatus.create({
      data: {
        menteeId, mentorId,
        statusL2: input.statusL2, comment: input.comment ?? null, actionNeeded: input.actionNeeded ?? null,
        updatesThisWeek: metrics.updatesThisWeek, lastUpdateAt: metrics.lastUpdateAt,
        blockerStreak: metrics.blockerStreak, daysSinceUpdate: metrics.daysSinceUpdate,
      },
    }),

  // ── L3 / L4: weekly review ────────────────────────────────────────
  upsertWeekly: (
    input: WeeklyReviewInput,
    mentorId: string,
    domainId: string | null,
    autoFlag: "NONE" | "CONSISTENCY_GAP" | "REPEATED_BLOCKER" | "NO_UPDATES",
  ) =>
    prisma.weeklyReview.upsert({
      where: { weekNo_menteeId: { weekNo: input.weekNo, menteeId: input.menteeId } },
      create: {
        weekNo: input.weekNo, menteeId: input.menteeId, mentorId, domainId,
        progressSummary: input.progressSummary, strength: input.strength,
        improvementArea: input.improvementArea, mentorStatus: input.mentorStatus, autoFlag,
      },
      update: {
        progressSummary: input.progressSummary, strength: input.strength,
        improvementArea: input.improvementArea, mentorStatus: input.mentorStatus, autoFlag,
      },
    }),
  listWeekly: (where: Record<string, unknown>, take: number, skip: number) =>
    prisma.weeklyReview.findMany({ where, orderBy: [{ weekNo: "desc" }, { createdAt: "desc" }], take, skip }),
  findWeeklyById: (id: string) => prisma.weeklyReview.findUnique({ where: { id } }),
  setTeacherDecision: (
    id: string,
    teacherId: string,
    decision: "CONTINUE" | "MONITOR" | "SCHEDULE_DISCUSSION",
    notes: string | undefined,
  ) =>
    prisma.weeklyReview.update({
      where: { id },
      data: { teacherId, teacherDecision: decision, teacherNotes: notes ?? null, l4CompletedAt: new Date() },
    }),
};

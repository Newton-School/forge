import { Errors } from "../../lib/errors.js";
import { audit } from "../../lib/audit.js";
import { effectiveScope } from "../../rbac/policy.js";
import type { AuthContext } from "../../rbac/types.js";
import { reviewsRepo } from "./reviews.repository.js";
import { blockerStreak, computeAutoFlag, daysBetween } from "./reviews.metrics.js";
import type {
  ListUpdatesQuery, ListWeeklyQuery, MentorStatusInput, SubmitUpdateInput, TeacherDecisionInput, WeeklyReviewInput,
} from "./reviews.schema.js";

const WEEK_MS = 7 * 86_400_000;

// ── scope helpers (entity relations differ, so built explicitly) ──────────────
function updatesScope(ctx: AuthContext): Record<string, unknown> {
  const s = effectiveScope(ctx);
  if (s.global) return {};
  const or: Record<string, unknown>[] = [];
  if (s.domainIds.length) or.push({ team: { domainId: { in: s.domainIds } } });
  if (s.teamIds.length) or.push({ teamId: { in: s.teamIds } });
  if (s.self) or.push({ userId: ctx.id });
  return or.length ? (or.length === 1 ? or[0]! : { OR: or }) : { id: "__never__" };
}
function weeklyScope(ctx: AuthContext): Record<string, unknown> {
  const s = effectiveScope(ctx);
  if (s.global) return {};
  const or: Record<string, unknown>[] = [];
  if (s.domainIds.length) or.push({ domainId: { in: s.domainIds } });
  if (s.teamIds.length) or.push({ mentorId: ctx.id }); // mentor sees their own reviews
  if (s.self) or.push({ menteeId: ctx.id });
  return or.length ? (or.length === 1 ? or[0]! : { OR: or }) : { id: "__never__" };
}

// ── L1: mentee update ─────────────────────────────────────────────────────────
export async function submitUpdate(ctx: AuthContext, input: SubmitUpdateInput, ip?: string) {
  const teamId = await reviewsRepo.primaryTeamId(ctx.id);
  const update = await reviewsRepo.createUpdate(ctx.id, teamId, input);
  await audit(ctx, { action: "menteeUpdate:submit", entityType: "MenteeUpdate", entityId: update.id, ip });
  return update;
}

export async function listUpdates(ctx: AuthContext, q: ListUpdatesQuery) {
  const where = { ...updatesScope(ctx), ...(q.menteeId ? { userId: q.menteeId } : {}) };
  const rows = await reviewsRepo.listUpdates(where, q.take, q.skip);
  return { items: rows };
}

// ── metrics for one mentee ──────────────────────────────────────────────────
async function menteeMetrics(menteeId: string, now = new Date()) {
  const recent = await reviewsRepo.updatesForMentee(menteeId, new Date(now.getTime() - 4 * WEEK_MS));
  const week = recent.filter((u) => now.getTime() - u.date.getTime() <= WEEK_MS);
  const lastUpdateAt = recent[0]?.date ?? null;
  return {
    updatesThisWeek: week.length,
    lastUpdateAt,
    blockerStreak: blockerStreak(recent),
    daysSinceUpdate: lastUpdateAt ? daysBetween(now, lastUpdateAt) : 999,
  };
}

// ── mentor dashboard (computed L2 table) ────────────────────────────────────
async function assertMyMentee(ctx: AuthContext, menteeId: string) {
  const teamIds = await reviewsRepo.mentorTeamIds(ctx.id);
  const mentees = await reviewsRepo.menteesOfMentor(ctx.id);
  void teamIds;
  if (!mentees.some((m) => m.user.id === menteeId)) {
    throw Errors.forbidden("That mentee is not on a team you mentor");
  }
}

export async function mentorDashboard(ctx: AuthContext) {
  const mentees = await reviewsRepo.menteesOfMentor(ctx.id);
  const rows = await Promise.all(
    mentees.map(async (m) => {
      const metrics = await menteeMetrics(m.user.id);
      return {
        menteeId: m.user.id, name: m.user.fullName, teamId: m.teamId, teamName: m.team.name,
        updatesThisWeek: metrics.updatesThisWeek,
        lastUpdateAt: metrics.lastUpdateAt,
        blockerStreak: metrics.blockerStreak,
        daysSinceUpdate: metrics.daysSinceUpdate,
      };
    }),
  );
  return { items: rows };
}

// ── L2: mentor status ───────────────────────────────────────────────────────
export async function submitMentorStatus(ctx: AuthContext, input: MentorStatusInput, ip?: string) {
  await assertMyMentee(ctx, input.menteeId);
  const metrics = await menteeMetrics(input.menteeId);
  const row = await reviewsRepo.createMentorStatus(input.menteeId, ctx.id, input, metrics);
  await audit(ctx, { action: "mentorStatus:submit", entityType: "MentorStatus", entityId: row.id, after: { statusL2: input.statusL2 }, ip });
  return row;
}

// ── L3: weekly review (mentor) ──────────────────────────────────────────────
export async function upsertWeekly(ctx: AuthContext, input: WeeklyReviewInput, ip?: string) {
  await assertMyMentee(ctx, input.menteeId);
  const mentees = await reviewsRepo.menteesOfMentor(ctx.id);
  const domainId = mentees.find((m) => m.user.id === input.menteeId)?.team.domainId ?? null;
  const metrics = await menteeMetrics(input.menteeId);
  const autoFlag = computeAutoFlag(metrics);
  const row = await reviewsRepo.upsertWeekly(input, ctx.id, domainId, autoFlag);
  await audit(ctx, { action: "weeklyReview:l3Submit", entityType: "WeeklyReview", entityId: row.id, after: { weekNo: input.weekNo, mentorStatus: input.mentorStatus, autoFlag }, ip });
  return row;
}

export async function listWeekly(ctx: AuthContext, q: ListWeeklyQuery) {
  const where = { ...weeklyScope(ctx), ...(q.weekNo ? { weekNo: q.weekNo } : {}) };
  const rows = await reviewsRepo.listWeekly(where, q.take, q.skip);
  return { items: rows };
}

// ── L4: teacher decision ────────────────────────────────────────────────────
export async function setTeacherDecision(ctx: AuthContext, id: string, input: TeacherDecisionInput, ip?: string) {
  const review = await reviewsRepo.findWeeklyById(id);
  if (!review) throw Errors.notFound("Weekly review not found");
  const s = effectiveScope(ctx);
  if (!s.global && !(review.domainId && s.domainIds.includes(review.domainId))) {
    throw Errors.forbidden("This review is outside your domain");
  }
  const row = await reviewsRepo.setTeacherDecision(id, ctx.id, input.decision, input.notes);
  await audit(ctx, { action: "weeklyReview:l4Submit", entityType: "WeeklyReview", entityId: id, after: { decision: input.decision }, ip });
  return row;
}

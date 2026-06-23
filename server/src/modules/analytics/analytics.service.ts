import { scopeWhere } from "../../rbac/scope.js";
import { effectiveScope } from "../../rbac/policy.js";
import type { AuthContext } from "../../rbac/types.js";
import { analyticsRepo } from "./analytics.repository.js";
import { rollupDomains, totals, avgCompletionBy, statusFromCompletion, percent, type TeamRow } from "./analytics.logic.js";

const WEEK_MS = 7 * 86_400_000;

// ── scope fragments (each entity exposes domain/team/owner differently) ─────────
const domainScope = (ctx: AuthContext) => scopeWhere(ctx, { domainField: "id" });
const teamScope = (ctx: AuthContext) => scopeWhere(ctx, { domainField: "domainId", teamField: "id" });
const concernScope = (ctx: AuthContext) =>
  scopeWhere(ctx, { domainField: "domainId", teamField: "teamId", ownerField: "raisedById" });
const reviewScope = (ctx: AuthContext) => scopeWhere(ctx, { domainField: "domainId", ownerField: "menteeId" });
const deliverableScope = (ctx: AuthContext) =>
  scopeWhere(ctx, { domainField: "project.team.domainId", teamField: "project.teamId" });
// A mentee update exposes domain via its team relation; owner is the updating user.
const updateScope = (ctx: AuthContext) =>
  scopeWhere(ctx, { domainField: "team.domainId", teamField: "teamId", ownerField: "userId" });
// User rows expose scope through team MEMBERSHIP (needs `some`, which scopeWhere can't express).
function userScope(ctx: AuthContext): Record<string, unknown> {
  const s = effectiveScope(ctx);
  if (s.global) return {};
  const or: Record<string, unknown>[] = [];
  if (s.domainIds.length) or.push({ teamMemberships: { some: { team: { domainId: { in: s.domainIds } } } } });
  if (s.teamIds.length) or.push({ teamMemberships: { some: { teamId: { in: s.teamIds } } } });
  if (s.self) or.push({ id: ctx.id });
  return or.length ? (or.length === 1 ? or[0]! : { OR: or }) : { id: "__never__" };
}

async function loadRollups(ctx: AuthContext) {
  const [domains, teams] = await Promise.all([
    analyticsRepo.domains(domainScope(ctx)),
    analyticsRepo.teams(teamScope(ctx)),
  ]);
  const teamRows: TeamRow[] = teams.map((t) => ({ domainId: t.domainId, members: t._count.members, hasMentor: t.mentorId !== null }));
  return { domains, teams, rollups: rollupDomains(domains, teamRows) };
}

/** Headline KPIs + at-risk signals + the drive-health snapshot for the current scope. */
export async function overview(ctx: AuthContext) {
  const { rollups, teams } = await loadRollups(ctx);
  const t = totals(rollups);
  const since = new Date(Date.now() - WEEK_MS);
  const [ms, openConcerns, atRiskReviews, pendingDeliverables, escalated, blocked, statusCounts, recentUpdaters] =
    await Promise.all([
      analyticsRepo.milestoneStats(deliverableScope(ctx)),
      analyticsRepo.countOpenConcerns(concernScope(ctx)),
      analyticsRepo.countAtRiskReviews(reviewScope(ctx)),
      analyticsRepo.countPendingDeliverables(deliverableScope(ctx)),
      analyticsRepo.countEscalatedConcerns(concernScope(ctx)),
      analyticsRepo.countBlockedTasks(deliverableScope(ctx)),
      analyticsRepo.userStatusCounts(userScope(ctx)),
      analyticsRepo.recentUpdaterCount(since, updateScope(ctx)),
    ]);

  const compByTeam = avgCompletionBy(ms, (m) => m.project?.teamId);
  const teamCompletions = teams.map((tm) => compByTeam.get(tm.id) ?? 0);
  const completionRate = teamCompletions.length
    ? Math.round(teamCompletions.reduce((a, b) => a + b, 0) / teamCompletions.length)
    : 0;
  const inactiveTeams = teamCompletions.filter((c) => statusFromCompletion(c) === "AT_RISK").length;
  const totalUsers = statusCounts.reduce((s, r) => s + r._count._all, 0);
  const activeUsers = statusCounts.find((r) => r.status === "ACTIVE")?._count._all ?? 0;

  return {
    totals: t,
    signals: { openConcerns, atRiskReviews, pendingDeliverables },
    // Drive-health snapshot — every field computed from live data (no historical trend series).
    health: {
      totalStudents: t.students,
      totalMentors: t.mentors,
      totalTeams: t.teams,
      totalDomains: t.domains,
      completionRate,
      activeBlockers: blocked,
      openConcerns,
      escalatedConcerns: escalated,
      inactiveTeams,
      delayedDeliverables: pendingDeliverables,
      weeklyUpdateCompliance: percent(recentUpdaters, t.students),
      onboardingComplete: percent(activeUsers, totalUsers),
    },
  };
}

/** Per-domain rollup: teams / students / mentors + completion / atRisk / teacher. */
export async function byDomain(ctx: AuthContext) {
  const { domains, rollups } = await loadRollups(ctx);
  const [ms, atRisk] = await Promise.all([
    analyticsRepo.milestoneStats(deliverableScope(ctx)),
    analyticsRepo.atRiskByDomain(reviewScope(ctx)),
  ]);
  const compByDomain = avgCompletionBy(ms, (m) => m.project?.team?.domainId);
  const atRiskMap = new Map(atRisk.map((r) => [r.domainId, r._count._all]));
  const teacherByDomain = new Map(domains.map((d) => [d.id, d.teachers[0]?.fullName ?? "—"]));
  return {
    items: rollups.map((r) => ({
      ...r,
      teacher: teacherByDomain.get(r.id) ?? "—",
      completion: compByDomain.get(r.id) ?? 0,
      atRisk: atRiskMap.get(r.id) ?? 0,
    })),
  };
}

/** Per-team rollup: members + mentor + completion + derived status + teacher. */
export async function byTeam(ctx: AuthContext) {
  const [teams, ms, domains] = await Promise.all([
    analyticsRepo.teams(teamScope(ctx)),
    analyticsRepo.milestoneStats(deliverableScope(ctx)),
    analyticsRepo.domains(domainScope(ctx)),
  ]);
  const compByTeam = avgCompletionBy(ms, (m) => m.project?.teamId);
  const teacherByDomain = new Map(domains.map((d) => [d.id, d.teachers[0]?.fullName ?? "—"]));
  return {
    items: teams.map((t) => {
      const completion = compByTeam.get(t.id) ?? 0;
      return {
        id: t.id, name: t.name, alias: t.alias, domainId: t.domainId, domainKey: t.domain?.key ?? null,
        mentor: t.mentor?.fullName ?? null, teacher: teacherByDomain.get(t.domainId) ?? "—",
        members: t._count.members, hasMentor: t.mentorId !== null, repo: t.githubRepoUrl,
        completion, status: statusFromCompletion(completion),
      };
    }),
  };
}

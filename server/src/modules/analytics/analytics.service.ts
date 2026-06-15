import { scopeWhere } from "../../rbac/scope.js";
import type { AuthContext } from "../../rbac/types.js";
import { analyticsRepo } from "./analytics.repository.js";
import { rollupDomains, totals, type TeamRow } from "./analytics.logic.js";

// ── scope fragments (each entity exposes domain/team/owner differently) ─────────
const domainScope = (ctx: AuthContext) => scopeWhere(ctx, { domainField: "id" });
const teamScope = (ctx: AuthContext) => scopeWhere(ctx, { domainField: "domainId", teamField: "id" });
const concernScope = (ctx: AuthContext) =>
  scopeWhere(ctx, { domainField: "domainId", teamField: "teamId", ownerField: "raisedById" });
const reviewScope = (ctx: AuthContext) => scopeWhere(ctx, { domainField: "domainId", ownerField: "menteeId" });
const deliverableScope = (ctx: AuthContext) =>
  scopeWhere(ctx, { domainField: "project.team.domainId", teamField: "project.teamId" });

async function loadRollups(ctx: AuthContext) {
  const [domains, teams] = await Promise.all([
    analyticsRepo.domains(domainScope(ctx)),
    analyticsRepo.teams(teamScope(ctx)),
  ]);
  const teamRows: TeamRow[] = teams.map((t) => ({ domainId: t.domainId, members: t._count.members, hasMentor: t.mentorId !== null }));
  return { domains, teams, rollups: rollupDomains(domains, teamRows) };
}

/** Headline KPIs + at-risk signals for the current scope. */
export async function overview(ctx: AuthContext) {
  const [{ rollups }, openConcerns, atRiskReviews, pendingDeliverables] = await Promise.all([
    loadRollups(ctx),
    analyticsRepo.countOpenConcerns(concernScope(ctx)),
    analyticsRepo.countAtRiskReviews(reviewScope(ctx)),
    analyticsRepo.countPendingDeliverables(deliverableScope(ctx)),
  ]);
  return {
    totals: totals(rollups),
    signals: { openConcerns, atRiskReviews, pendingDeliverables },
  };
}

/** Per-domain rollup (teams / students / mentors). */
export async function byDomain(ctx: AuthContext) {
  const { rollups } = await loadRollups(ctx);
  return { items: rollups };
}

/** Per-team rollup (member count, mentor presence). */
export async function byTeam(ctx: AuthContext) {
  const teams = await analyticsRepo.teams(teamScope(ctx));
  return {
    items: teams.map((t) => ({
      id: t.id, name: t.name, domainId: t.domainId, domainKey: t.domain?.key ?? null,
      members: t._count.members, hasMentor: t.mentorId !== null,
    })),
  };
}

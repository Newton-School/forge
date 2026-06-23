import { env, githubWebhookConfigured, githubOAuthConfigured } from "../../config/env.js";
import { Errors } from "../../lib/errors.js";
import { logger } from "../../lib/logger.js";
import { effectiveScope } from "../../rbac/policy.js";
import type { AuthContext } from "../../rbac/types.js";
import { githubRepo } from "./github.repository.js";
import { repoStore } from "./repo.store.js";
import { normalizeEvent, verifyGithubSignature } from "./github.webhook.js";

const isLead = (memberRole: string) => /maintainer|lead/i.test(memberRole);

type TeamGraphRow = NonNullable<Awaited<ReturnType<typeof repoStore.teamGraph>>>;

/** Shape one team's roster + repo summaries into the team-first DTO. */
function mapTeamGraph(t: TeamGraphRow) {
  const lead = t.members.find((m) => isLead(m.memberRole));
  return {
    id: t.id,
    name: t.name,
    domainKey: t.domain?.key ?? null,
    repoModel: t.domain?.githubRepoModel ?? "SHARED",
    mentor: t.mentor ? { name: t.mentor.fullName, login: t.mentor.githubUsername } : null,
    teamLead: lead ? { userId: lead.user.id, name: lead.user.fullName, login: lead.user.githubUsername } : null,
    members: t.members.map((m) => ({
      userId: m.user.id, name: m.user.fullName, login: m.user.githubUsername,
      role: isLead(m.memberRole) ? "TeamLead" : "Mentee",
    })),
    repos: t.repositories.map((r) => ({
      name: r.name, fullName: r.fullName, owner: r.owner, ownerUserId: r.ownerUserId,
      ownerRole: r.ownerRole === "OWNER" ? "owner" : r.ownerRole === "MAINTAINER" ? "maintainer" : "collaborator",
      visibility: r.visibility === "PRIVATE" ? "private" : "public",
      hasIssues: r.hasIssues, description: r.description, defaultBranch: r.defaultBranch,
      collaborators: r._count.collaborators, branches: r._count.branches, releases: r._count.releases,
    })),
  };
}

/**
 * Team-first GitHub graph for a domain (scope-filtered): every team with its mentor,
 * student team-lead, members, and repo summaries + the domain's repo model. Backs the
 * Domain → Teams → Repository → Students navigation; per-repo detail is a separate call.
 */
export async function domainTeamGraph(ctx: AuthContext, domainKey: string) {
  const s = effectiveScope(ctx);
  let where: Record<string, unknown> = {};
  if (!s.global) {
    const or: Record<string, unknown>[] = [];
    if (s.domainIds.length) or.push({ domainId: { in: s.domainIds } });
    if (s.teamIds.length) or.push({ id: { in: s.teamIds } });
    where = or.length ? { OR: or } : { id: "__never__" };
  }
  const teams = await repoStore.teamGraphForDomain(domainKey, where);
  return {
    domainKey,
    repoModel: teams[0]?.domain?.githubRepoModel ?? "SHARED",
    teams: teams.map(mapTeamGraph),
  };
}

/** A single team's roster + repo summaries (team-detail + repo-detail context). */
export async function teamGraph(ctx: AuthContext, teamId: string) {
  await assertTeamAccess(ctx, teamId);
  const t = await repoStore.teamGraph(teamId);
  return t ? mapTeamGraph(t) : null;
}

export interface WebhookResult {
  event: string;
  recorded: number;
}

/**
 * Verify and ingest a GitHub webhook. Throws `forbidden` on a bad/missing signature
 * so the route returns 401/403 and GitHub retries. Each normalized activity is
 * attributed to a team (by repo) and user (by login) and upserted idempotently.
 */
export async function ingestWebhook(
  eventName: string | undefined,
  signature: string | undefined,
  deliveryId: string | undefined,
  rawBody: Buffer | undefined,
  parsedBody: unknown,
): Promise<WebhookResult> {
  if (!githubWebhookConfigured) throw Errors.badRequest("GitHub webhooks are not configured");
  if (!rawBody) throw Errors.badRequest("Missing request body");
  if (!verifyGithubSignature(rawBody, signature, env.GITHUB_WEBHOOK_SECRET!)) {
    throw Errors.forbidden("Invalid webhook signature");
  }
  if (!eventName || eventName === "ping") return { event: eventName ?? "ping", recorded: 0 };

  const activities = normalizeEvent(eventName, parsedBody, deliveryId ?? "");
  let recorded = 0;
  for (const a of activities) {
    const [teamId, userId] = await Promise.all([
      githubRepo.teamIdByRepo(a.repo),
      githubRepo.userIdByLogin(a.githubLogin),
    ]);
    await githubRepo.upsertActivity(a, teamId, userId);
    recorded += 1;
  }
  logger.info({ event: eventName, recorded }, "github webhook ingested");
  return { event: eventName, recorded };
}

/** Visibility filter: activity is reachable by team (mentor), domain's teams (teacher), or self. */
async function activityScope(ctx: AuthContext): Promise<Record<string, unknown>> {
  const s = effectiveScope(ctx);
  if (s.global) return {};
  const teamIds = new Set(s.teamIds);
  if (s.domainIds.length) {
    for (const id of await githubRepo.teamIdsInDomains(s.domainIds)) teamIds.add(id);
  }
  const or: Record<string, unknown>[] = [];
  if (teamIds.size) or.push({ teamId: { in: [...teamIds] } });
  if (s.self) or.push({ userId: ctx.id });
  return or.length ? (or.length === 1 ? or[0]! : { OR: or }) : { id: "__never__" };
}

/** Scope-filtered read of recorded GitHub activity, shaped for the UI feed. */
export async function listActivity(ctx: AuthContext, q: { teamId?: string; take: number; skip: number }) {
  // AND the ?teamId filter WITH the scope — spreading it would overwrite a single-team scope and
  // leak another team's activity. AND can only narrow within scope.
  const where = { AND: [await activityScope(ctx), ...(q.teamId ? [{ teamId: q.teamId }] : [])] };
  const rows = await githubRepo.list(where, q.take, q.skip);
  const userIds = [...new Set(rows.map((a) => a.userId).filter(Boolean) as string[])];
  const teamIds = [...new Set(rows.map((a) => a.teamId).filter(Boolean) as string[])];
  const [users, teams] = await Promise.all([githubRepo.userNames(userIds), githubRepo.teamNames(teamIds)]);
  const userOf = new Map(users.map((u) => [u.id, u.fullName ?? u.githubUsername ?? "—"]));
  const teamOf = new Map(teams.map((t) => [t.id, t.name]));
  const items = rows.map((a) => ({
    id: a.id,
    type: a.type,
    title: a.title ?? "",
    author: a.userId ? userOf.get(a.userId) ?? "—" : "—",
    repo: a.teamId ? teamOf.get(a.teamId) ?? "—" : "—",
    state: a.state ?? "",
    occurredAt: a.occurredAt,
  }));
  return { items };
}

/**
 * Pure team-isolation rule: a user may reach a team's GitHub data iff they are global
 * (Admin/LCC), a teacher of the team's domain, the team's mentor, or a member of the team.
 * Membership is the key addition — a mentee's role grant is SELF-scoped, so team access
 * comes from belonging to the team, not from a TEAM-scoped grant.
 */
export function teamAccessAllowed(
  scope: { global: boolean; domainIds: string[]; teamIds: string[] },
  team: { id: string; domainId: string; mentorId: string | null; members: { userId: string }[] },
  userId: string,
): boolean {
  return (
    scope.global ||
    scope.domainIds.includes(team.domainId) ||
    scope.teamIds.includes(team.id) ||
    team.mentorId === userId ||
    team.members.some((m) => m.userId === userId)
  );
}

/** Authorize a team-scoped GitHub read (route gate is permission-only; this adds the scope). */
export async function assertTeamAccess(ctx: AuthContext, teamId: string): Promise<void> {
  const team = await githubRepo.teamAccess(teamId);
  if (!team) throw Errors.notFound("Team not found");
  if (!teamAccessAllowed(effectiveScope(ctx), team, ctx.id)) {
    throw Errors.forbidden("You don't have access to this team's repository");
  }
}

/**
 * Authorize an AI org-wide read (the shared-org dashboards): the caller must be able to see the
 * AI domain — global, an AI-domain grant (teacher), or membership of any AI team (mentor/mentee,
 * whose grant is SELF-only so isn't in effectiveScope). Closes the cross-domain leak where an
 * ML/DVA/SDSE user could read the whole AI org.
 */
export async function assertAiOrgAccess(ctx: AuthContext): Promise<void> {
  const s = effectiveScope(ctx);
  if (s.global) return;
  const aiDomainId = await githubRepo.domainIdByKey("AI");
  if (aiDomainId && s.domainIds.includes(aiDomainId)) return;
  if (aiDomainId && (await githubRepo.userInDomain(ctx.id, aiDomainId))) return;
  throw Errors.forbidden("This view is limited to the AI domain.");
}

/**
 * Authorize a single-repo read: if the repo maps to a team, use team access; otherwise it's an
 * unmapped AI org repo, so fall back to AI-domain access. Never an open read by arbitrary name.
 */
export async function assertRepoAccess(ctx: AuthContext, repo: string): Promise<void> {
  const teamId = await githubRepo.teamIdByRepo(repo);
  if (teamId) return assertTeamAccess(ctx, teamId);
  return assertAiOrgAccess(ctx);
}

/** Integration status for the admin connections view. */
export function status() {
  return {
    provider: "GITHUB",
    webhookConfigured: githubWebhookConfigured,
    apiTokenConfigured: Boolean(env.GITHUB_API_TOKEN),
    oauthConfigured: githubOAuthConfigured,
  };
}

import { env, githubWebhookConfigured, githubOAuthConfigured } from "../../config/env.js";
import { Errors } from "../../lib/errors.js";
import { logger } from "../../lib/logger.js";
import { effectiveScope } from "../../rbac/policy.js";
import type { AuthContext } from "../../rbac/types.js";
import { githubRepo } from "./github.repository.js";
import { normalizeEvent, verifyGithubSignature } from "./github.webhook.js";

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

/** Scope-filtered read of recorded GitHub activity. */
export async function listActivity(ctx: AuthContext, q: { teamId?: string; take: number; skip: number }) {
  const where = { ...(await activityScope(ctx)), ...(q.teamId ? { teamId: q.teamId } : {}) };
  return { items: await githubRepo.list(where, q.take, q.skip) };
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

/** Integration status for the admin connections view. */
export function status() {
  return {
    provider: "GITHUB",
    webhookConfigured: githubWebhookConfigured,
    apiTokenConfigured: Boolean(env.GITHUB_API_TOKEN),
    oauthConfigured: githubOAuthConfigured,
  };
}

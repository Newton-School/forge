import { env, githubWebhookConfigured } from "../../config/env.js";
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

/** Integration status for the admin connections view. */
export function status() {
  return {
    provider: "GITHUB",
    webhookConfigured: githubWebhookConfigured,
    apiTokenConfigured: Boolean(env.GITHUB_API_TOKEN),
  };
}

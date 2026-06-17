import { env } from "../../config/env.js";
import { Errors } from "../../lib/errors.js";
import { logger } from "../../lib/logger.js";
import { fetchWithRetry } from "../../lib/http.js";

/**
 * Programmatic repo-webhook creation for ML/SDSE (no org). Given a connecting
 * mentor's OAuth token (carrying admin:repo_hook), the server registers the same
 * webhook the AI org uses — one payload URL, the shared secret, the four events —
 * so the mentor never opens repo → Settings → Webhooks. Idempotent: it skips a repo
 * that already has our hook.
 */
const API = "https://api.github.com";
// Covers the repository dashboards: code, PRs/reviews, issues, branch create/delete,
// releases, and collaborator changes (repository mode reads all of these).
const EVENTS = [
  "push", "pull_request", "pull_request_review", "issues",
  "create", "delete", "release", "member",
] as const;

/** The public URL GitHub POSTs events to — derived from the server's OAuth origin. */
export function webhookPayloadUrl(): string {
  return `${new URL(env.GITHUB_OAUTH_REDIRECT_URI).origin}/api/integrations/github/webhook`;
}

/** Parse "owner/repo" from a full github.com URL or a bare "owner/repo" string. */
export function parseRepo(input: string): { owner: string; repo: string } {
  const cleaned = input
    .trim()
    .replace(/^https?:\/\/github\.com\//i, "")
    .replace(/\.git$/i, "")
    .replace(/\/+$/, "");
  const m = cleaned.match(/^([\w.-]+)\/([\w.-]+)$/);
  if (!m) throw Errors.badRequest("Enter the repo as owner/repo or its github.com URL");
  return { owner: m[1]!, repo: m[2]! };
}

function authHeaders(token: string): Record<string, string> {
  return {
    Authorization: `Bearer ${token}`,
    Accept: "application/vnd.github+json",
    "User-Agent": "forge-server",
    "X-GitHub-Api-Version": "2022-11-28",
  };
}

export interface HookResult {
  created: boolean; // false = an existing hook already pointed at us
  id?: number;
}

/**
 * Idempotently ensure a Forge webhook exists on owner/repo using the connecting
 * user's token. Requires GITHUB_WEBHOOK_SECRET (shared with the AI org) and the
 * token's admin:repo_hook scope (the mentor has admin on the repo).
 */
export async function ensureRepoWebhook(
  token: string,
  owner: string,
  repo: string,
): Promise<HookResult> {
  if (!env.GITHUB_WEBHOOK_SECRET) {
    throw Errors.badRequest("GITHUB_WEBHOOK_SECRET is not configured");
  }
  const payloadUrl = webhookPayloadUrl();
  const base = `${API}/repos/${owner}/${repo}/hooks`;

  // (1) Idempotency — is our hook already wired? (GET is safely retried.)
  const listRes = await fetchWithRetry(base, { headers: authHeaders(token) });
  if (listRes.status === 404) {
    throw Errors.notFound("Repo not found, or you don't have admin access to it");
  }
  if (listRes.ok) {
    const hooks = (await listRes.json()) as { id: number; config?: { url?: string } }[];
    const existing = hooks.find((h) => h.config?.url === payloadUrl);
    if (existing) {
      logger.info({ owner, repo, id: existing.id }, "repo webhook already present — skipped");
      return { created: false, id: existing.id };
    }
  }

  // (2) Create. No retry on the POST: a duplicate would 422 (GitHub dedupes), and we
  // don't want to risk a second hook on a lost-response retry.
  const res = await fetchWithRetry(
    base,
    {
      method: "POST",
      headers: { ...authHeaders(token), "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "web",
        active: true,
        events: EVENTS,
        config: {
          url: payloadUrl,
          content_type: "json",
          secret: env.GITHUB_WEBHOOK_SECRET,
          insecure_ssl: "0",
        },
      }),
    },
    { retries: 0 },
  );
  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as { message?: string } | null;
    logger.error({ status: res.status, owner, repo, msg: body?.message }, "repo webhook create failed");
    if (res.status === 403 || res.status === 404) {
      throw Errors.forbidden("You need admin on the repo to add a webhook");
    }
    if (res.status === 422) {
      // A non-Forge hook with the same URL, or config rejected — treat as already wired.
      return { created: false };
    }
    throw Errors.badRequest("Could not create the repo webhook");
  }
  const created = (await res.json()) as { id: number };
  logger.info({ owner, repo, id: created.id }, "repo webhook created");
  return { created: true, id: created.id };
}

/**
 * Invite the Forge machine reader as a READ collaborator so the server can durably read
 * the repo (and list collaborators, which needs push-level access even on public repos).
 * Best-effort + idempotent: GitHub returns 201 (invite), 204 (already a collaborator), or
 * an error we swallow — repository mode still works on public repos without it.
 */
export async function ensureReadCollaborator(token: string, owner: string, repo: string, reader: string): Promise<boolean> {
  if (!reader || reader.toLowerCase() === owner.toLowerCase()) return false;
  try {
    const res = await fetchWithRetry(
      `${API}/repos/${owner}/${repo}/collaborators/${reader}`,
      { method: "PUT", headers: { ...authHeaders(token), "Content-Type": "application/json" }, body: JSON.stringify({ permission: "pull" }) },
      { retries: 0 },
    );
    if (res.ok || res.status === 204) {
      logger.info({ owner, repo, reader, status: res.status }, "read collaborator ensured");
      return true;
    }
    logger.warn({ owner, repo, reader, status: res.status }, "could not add read collaborator (continuing)");
    return false;
  } catch (err) {
    logger.warn({ err, owner, repo, reader }, "read collaborator add failed (continuing)");
    return false;
  }
}

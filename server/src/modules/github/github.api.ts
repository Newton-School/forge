import { env } from "../../config/env.js";
import { Errors } from "../../lib/errors.js";
import { logger } from "../../lib/logger.js";
import { fetchWithRetry } from "../../lib/http.js";

/**
 * Read-through GitHub REST client (Phase 2). Authenticates with GITHUB_API_TOKEN and
 * reads the AI-domain org (GITHUB_ORG). No SDK — just fetch + the documented endpoints.
 * Persistence/caching is Phase 3; for now the read service calls these directly.
 */
const BASE = "https://api.github.com";
const PAGE_CAP = 5; // up to 500 items per resource — plenty for a teaching org

export const githubApiConfigured = () => Boolean(env.GITHUB_API_TOKEN);

function headers() {
  return {
    Authorization: `Bearer ${env.GITHUB_API_TOKEN}`,
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
    "User-Agent": "forge-server",
  };
}

async function gh<T>(path: string): Promise<T> {
  if (!githubApiConfigured()) throw Errors.badRequest("GitHub API token is not configured");
  let res: Response;
  try {
    res = await fetchWithRetry(`${BASE}${path}`, { headers: headers() });
  } catch (err) {
    logger.error({ err, path }, "github api request failed (network)");
    throw Errors.badRequest("GitHub request failed");
  }
  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as { message?: string } | null;
    logger.error({ status: res.status, path, msg: body?.message }, "github api error");
    if (res.status === 404) throw Errors.notFound("GitHub resource not found (check org/repo + token access)");
    if (res.status === 403) throw Errors.forbidden(body?.message ?? "GitHub token forbidden for this resource");
    throw Errors.badRequest("GitHub request failed");
  }
  return (await res.json()) as T;
}

/** Follow `Link: rel="next"` pagination up to PAGE_CAP pages. */
async function ghPaged<T>(path: string): Promise<T[]> {
  if (!githubApiConfigured()) throw Errors.badRequest("GitHub API token is not configured");
  const out: T[] = [];
  let url: string | null = `${BASE}${path}${path.includes("?") ? "&" : "?"}per_page=100`;
  for (let i = 0; i < PAGE_CAP && url; i++) {
    const res: Response = await fetchWithRetry(url, { headers: headers() });
    if (!res.ok) {
      const body = (await res.json().catch(() => null)) as { message?: string } | null;
      if (res.status === 403) throw Errors.forbidden(body?.message ?? "GitHub token forbidden");
      if (res.status === 404) throw Errors.notFound("GitHub resource not found");
      throw Errors.badRequest("GitHub request failed");
    }
    out.push(...((await res.json()) as T[]));
    const link = res.headers.get("link") ?? "";
    const next = link.split(",").find((p) => p.includes('rel="next"'));
    url = next ? next.slice(next.indexOf("<") + 1, next.indexOf(">")) : null;
  }
  return out;
}

// ── Minimal shapes of what we consume (GitHub returns much more) ───────────────
export interface GhOrg { login: string; name: string | null; public_repos: number; total_private_repos?: number; }
export interface GhRepo { id: number; name: string; full_name: string; private: boolean; description: string | null; default_branch: string; topics: string[]; open_issues_count: number; }
export interface GhUser { login: string; id: number; }
export interface GhMilestone { number: number; title: string; state: "open" | "closed"; open_issues: number; closed_issues: number; due_on: string | null; }
export interface GhIssue { number: number; title: string; body: string | null; state: "open" | "closed"; labels: { name: string }[]; user: GhUser | null; assignees: GhUser[]; milestone: GhMilestone | null; pull_request?: unknown; created_at: string; html_url: string; }
export interface GhPull { number: number; title: string; state: "open" | "closed"; merged_at: string | null; user: GhUser | null; additions?: number; deletions?: number; commits?: number; created_at: string; html_url: string; body: string | null; }
export interface GhReview { id: number; user: GhUser | null; state: string; body: string | null; submitted_at: string | null; }
export interface GhCommit { sha: string; commit: { message: string; author: { name: string; date: string } | null }; author: GhUser | null; }
export interface GhTeam { id: number; slug: string; name: string; }

const org = () => env.GITHUB_ORG;

export const githubApi = {
  getOrg: () => gh<GhOrg>(`/orgs/${org()}`),
  listRepos: () => ghPaged<GhRepo>(`/orgs/${org()}/repos?type=all`),
  getRepo: (repo: string) => gh<GhRepo>(`/repos/${org()}/${repo}`),
  listMembers: () => ghPaged<GhUser>(`/orgs/${org()}/members`),
  listTeams: () => ghPaged<GhTeam>(`/orgs/${org()}/teams`),
  listTeamMembers: (slug: string) => ghPaged<GhUser>(`/orgs/${org()}/teams/${slug}/members`),
  listTeamRepos: (slug: string) => ghPaged<GhRepo>(`/orgs/${org()}/teams/${slug}/repos`),

  listMilestones: (repo: string) => ghPaged<GhMilestone>(`/repos/${org()}/${repo}/milestones?state=all`),
  // The issues endpoint includes PRs — callers filter on `pull_request`.
  listIssues: (repo: string) => ghPaged<GhIssue>(`/repos/${org()}/${repo}/issues?state=all`),
  listPulls: (repo: string) => ghPaged<GhPull>(`/repos/${org()}/${repo}/pulls?state=all`),
  getPull: (repo: string, number: number) => gh<GhPull>(`/repos/${org()}/${repo}/pulls/${number}`),
  listPullReviews: (repo: string, number: number) => ghPaged<GhReview>(`/repos/${org()}/${repo}/pulls/${number}/reviews`),
  listCommits: (repo: string) => ghPaged<GhCommit>(`/repos/${org()}/${repo}/commits`),

  /** Connectivity probe for the integration status endpoint. */
  ping: async (): Promise<{ ok: boolean; org: string; repos?: number; message?: string }> => {
    try {
      const o = await githubApi.getOrg();
      return { ok: true, org: o.login, repos: o.public_repos + (o.total_private_repos ?? 0) };
    } catch (err) {
      return { ok: false, org: org(), message: err instanceof Error ? err.message : "unreachable" };
    }
  },
};

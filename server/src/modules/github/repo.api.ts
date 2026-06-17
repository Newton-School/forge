import { env } from "../../config/env.js";
import { Errors } from "../../lib/errors.js";
import { logger } from "../../lib/logger.js";
import { fetchWithRetry } from "../../lib/http.js";

/**
 * Repository-mode read client (ML/DVA/SDSE) — reads a single PUBLIC repository owned by
 * a team lead or mentor. The AI org token is owner-scoped and cannot read student-owned
 * repos, so this client reads the public API: unauthenticated by default, or with the
 * optional machine reader token (GITHUB_READER_TOKEN) for a higher rate limit and to list
 * collaborators on repos where the reader is a collaborator. No org assumptions.
 */
const BASE = "https://api.github.com";
const PAGE_CAP = 3; // up to 300 items per resource — plenty for a team repo

function headers(): Record<string, string> {
  const h: Record<string, string> = {
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
    "User-Agent": "forge-server",
  };
  if (env.GITHUB_READER_TOKEN) h.Authorization = `Bearer ${env.GITHUB_READER_TOKEN}`;
  return h;
}

async function gh<T>(path: string): Promise<T> {
  let res: Response;
  try {
    res = await fetchWithRetry(`${BASE}${path}`, { headers: headers() });
  } catch (err) {
    logger.error({ err, path }, "repo api request failed (network)");
    throw Errors.badRequest("GitHub request failed");
  }
  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as { message?: string } | null;
    logger.error({ status: res.status, path, msg: body?.message }, "repo api error");
    if (res.status === 404) throw Errors.notFound("Repository not found, or it is private (repository mode requires a public repo)");
    if (res.status === 403) throw Errors.forbidden(body?.message ?? "GitHub forbidden (rate limit or access)");
    throw Errors.badRequest("GitHub request failed");
  }
  return (await res.json()) as T;
}

/** Follow `Link: rel="next"` pagination up to PAGE_CAP pages. */
async function ghPaged<T>(path: string): Promise<T[]> {
  const out: T[] = [];
  let url: string | null = `${BASE}${path}${path.includes("?") ? "&" : "?"}per_page=100`;
  for (let i = 0; i < PAGE_CAP && url; i++) {
    const res: Response = await fetchWithRetry(url, { headers: headers() });
    if (!res.ok) {
      if (res.status === 404) throw Errors.notFound("Repository not found or private");
      if (res.status === 403) throw Errors.forbidden("GitHub forbidden (rate limit or access)");
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
export interface GhRepoDetail {
  name: string;
  full_name: string;
  private: boolean;
  description: string | null;
  default_branch: string;
  topics: string[];
  owner: { login: string; type: string };
  open_issues_count: number;
  has_issues: boolean;
  pushed_at: string;
  created_at: string;
}
export interface GhCollaborator {
  login: string;
  permissions?: { admin: boolean; maintain?: boolean; push: boolean; pull: boolean };
  role_name?: string;
}
export interface GhContributor { login: string; contributions: number; }
export interface GhCommitItem { sha: string; commit: { message: string; author: { date: string } }; author: { login: string } | null; }
export interface GhPullItem {
  number: number; title: string; state: "open" | "closed"; merged_at: string | null;
  user: { login: string } | null; additions?: number; deletions?: number; commits?: number;
  created_at: string; requested_reviewers?: { login: string }[];
}
export interface GhBranch { name: string; protected: boolean; commit: { sha: string }; }
export interface GhRelease { tag_name: string; name: string | null; published_at: string; author: { login: string } | null; body: string | null; prerelease: boolean; }
export interface GhEvent { type: string; actor: { login: string }; created_at: string; payload: Record<string, unknown>; }
export interface GhIssueItem { number: number; title: string; state: "open" | "closed"; labels: { name: string }[]; assignee: { login: string } | null; created_at: string; pull_request?: unknown; }
export interface GhMilestone { title: string; state: "open" | "closed"; open_issues: number; closed_issues: number; due_on: string | null; }

const enc = (s: string) => encodeURIComponent(s);

/** Read-through accessors for one public repository (owner/repo). */
export const repoApi = {
  getRepo: (o: string, r: string) => gh<GhRepoDetail>(`/repos/${enc(o)}/${enc(r)}`),
  listCollaborators: (o: string, r: string) => ghPaged<GhCollaborator>(`/repos/${enc(o)}/${enc(r)}/collaborators?affiliation=all`),
  listContributors: (o: string, r: string) => ghPaged<GhContributor>(`/repos/${enc(o)}/${enc(r)}/contributors`),
  listCommits: (o: string, r: string) => ghPaged<GhCommitItem>(`/repos/${enc(o)}/${enc(r)}/commits`),
  listPulls: (o: string, r: string) => ghPaged<GhPullItem>(`/repos/${enc(o)}/${enc(r)}/pulls?state=all&sort=updated&direction=desc`),
  listBranches: (o: string, r: string) => ghPaged<GhBranch>(`/repos/${enc(o)}/${enc(r)}/branches`),
  listReleases: (o: string, r: string) => ghPaged<GhRelease>(`/repos/${enc(o)}/${enc(r)}/releases`),
  listEvents: (o: string, r: string) => gh<GhEvent[]>(`/repos/${enc(o)}/${enc(r)}/events`),
  listIssues: (o: string, r: string) => ghPaged<GhIssueItem>(`/repos/${enc(o)}/${enc(r)}/issues?state=all`),
  listMilestones: (o: string, r: string) => ghPaged<GhMilestone>(`/repos/${enc(o)}/${enc(r)}/milestones?state=all`),
};

export const repoReaderAuthed = () => Boolean(env.GITHUB_READER_TOKEN);

/**
 * List collaborators using a specific token (the repo OWNER's, at connect time). Listing
 * collaborators needs write access, which the read-only reader token lacks — so this is
 * called once during connect with the owner's token and the result is persisted.
 */
export async function listCollaboratorsWithToken(token: string, owner: string, repo: string): Promise<GhCollaborator[]> {
  const res = await fetchWithRetry(
    `${BASE}/repos/${enc(owner)}/${enc(repo)}/collaborators?affiliation=all&per_page=100`,
    { headers: { ...headers(), Authorization: `Bearer ${token}` } },
  );
  if (!res.ok) throw Errors.forbidden("Cannot list collaborators with the provided token");
  return (await res.json()) as GhCollaborator[];
}

import {
  repoApi, repoReaderAuthed,
  type GhRepoDetail, type GhCollaborator, type GhContributor, type GhCommitItem,
  type GhPullItem, type GhBranch, type GhRelease, type GhEvent, type GhIssueItem, type GhMilestone,
} from "./repo.api.js";
import { repoStore } from "./repo.store.js";

/**
 * Repository-mode read service (Phase 2) — turns live GitHub responses for a single public
 * repo into the shapes the portal's repository dashboards render. Read-through (no
 * persistence yet; that's Phase 3). Mappers are pure + exported so they're unit-testable
 * without the network.
 */

export interface RepoOverviewDto {
  owner: string;
  repo: string;
  fullName: string;
  description: string | null;
  visibility: "public" | "private";
  defaultBranch: string;
  topics: string[];
  hasIssues: boolean;
  openIssues: number;
  pushedAt: string;
  createdAt: string;
}
export interface CollaboratorDto { login: string; permission: "admin" | "write" | "read"; repoRole: "owner" | "maintainer" | "collaborator"; }
export interface ContributorDto { login: string; commits: number; }
export interface CommitDto { sha: string; login: string | null; message: string; when: string; }
export interface PullDto { number: number; title: string; state: "open" | "merged" | "closed"; authorLogin: string | null; additions: number; deletions: number; commits: number; reviewers: string[]; createdAt: string; mergedAt: string | null; }
export interface BranchDto { name: string; protected: boolean; sha: string; }
export interface ReleaseDto { tag: string; name: string; publishedAt: string; author: string | null; notes: string; prerelease: boolean; }
export interface ActivityDto { kind: "commit" | "pr_opened" | "pr_merged" | "release" | "branch" | "other"; who: string; what: string; when: string; }
export interface IssueDto { number: number; title: string; state: "open" | "closed"; labels: string[]; assignee: string | null; createdAt: string; }
export interface MilestoneDto { title: string; progress: number; dueAt: string; state: "open" | "closed"; }

// ── Pure mappers ──────────────────────────────────────────────────────────────────
export function toOverview(d: GhRepoDetail, owner: string, repo: string): RepoOverviewDto {
  return {
    owner, repo,
    fullName: d.full_name,
    description: d.description,
    visibility: d.private ? "private" : "public",
    defaultBranch: d.default_branch,
    topics: d.topics ?? [],
    hasIssues: d.has_issues,
    openIssues: d.open_issues_count,
    pushedAt: d.pushed_at,
    createdAt: d.created_at,
  };
}

export function toCollaborator(c: GhCollaborator, ownerLogin: string): CollaboratorDto {
  const p = c.permissions;
  const permission: CollaboratorDto["permission"] = p?.admin ? "admin" : p?.push ? "write" : "read";
  const repoRole: CollaboratorDto["repoRole"] =
    c.login === ownerLogin ? "owner" : p?.admin || p?.maintain ? "maintainer" : "collaborator";
  return { login: c.login, permission, repoRole };
}

export function toPull(p: GhPullItem): PullDto {
  return {
    number: p.number,
    title: p.title,
    state: p.merged_at ? "merged" : p.state,
    authorLogin: p.user?.login ?? null,
    additions: p.additions ?? 0,
    deletions: p.deletions ?? 0,
    commits: p.commits ?? 0,
    reviewers: (p.requested_reviewers ?? []).map((r) => r.login),
    createdAt: p.created_at,
    mergedAt: p.merged_at,
  };
}

export const toCommit = (c: GhCommitItem): CommitDto => ({
  sha: c.sha.slice(0, 7), login: c.author?.login ?? null, message: c.commit.message.split("\n")[0]!, when: c.commit.author.date,
});
export const toBranch = (b: GhBranch): BranchDto => ({ name: b.name, protected: b.protected, sha: b.commit.sha.slice(0, 7) });
export const toRelease = (r: GhRelease): ReleaseDto => ({
  tag: r.tag_name, name: r.name ?? r.tag_name, publishedAt: r.published_at, author: r.author?.login ?? null, notes: r.body ?? "", prerelease: r.prerelease,
});
export const toContributor = (c: GhContributor): ContributorDto => ({ login: c.login, commits: c.contributions });
/** Issues only (the issues endpoint also returns PRs — those carry a `pull_request` field). */
export const issuesOnly = (items: GhIssueItem[]): IssueDto[] =>
  items.filter((i) => !i.pull_request).map((i) => ({
    number: i.number, title: i.title, state: i.state, labels: i.labels.map((l) => l.name), assignee: i.assignee?.login ?? null, createdAt: i.created_at,
  }));
export function toMilestone(m: GhMilestone): MilestoneDto {
  const total = m.open_issues + m.closed_issues;
  return { title: m.title, progress: total ? Math.round((m.closed_issues / total) * 100) : m.state === "closed" ? 100 : 0, dueAt: m.due_on ?? "", state: m.state };
}

/** Map a repo's public event stream into a normalized activity feed. */
export function eventsToActivity(events: GhEvent[]): ActivityDto[] {
  return events
    .map((e): ActivityDto | null => {
      const who = e.actor?.login ?? "someone";
      switch (e.type) {
        case "PushEvent": {
          const n = (e.payload.commits as unknown[] | undefined)?.length ?? 0;
          return { kind: "commit", who, what: `pushed ${n} commit${n === 1 ? "" : "s"}`, when: e.created_at };
        }
        case "PullRequestEvent": {
          const action = e.payload.action as string;
          const pr = e.payload.pull_request as { number: number; title: string; merged?: boolean } | undefined;
          if (action === "closed" && pr?.merged) return { kind: "pr_merged", who, what: `merged #${pr.number} ${pr.title}`, when: e.created_at };
          if (action === "opened" && pr) return { kind: "pr_opened", who, what: `opened #${pr.number} ${pr.title}`, when: e.created_at };
          return null;
        }
        case "ReleaseEvent": {
          const rel = e.payload.release as { tag_name: string } | undefined;
          return { kind: "release", who, what: `released ${rel?.tag_name ?? ""}`.trim(), when: e.created_at };
        }
        case "CreateEvent":
        case "DeleteEvent": {
          const ref = e.payload.ref as string | undefined;
          const verb = e.type === "CreateEvent" ? "created" : "deleted";
          return { kind: "branch", who, what: `${verb} ${e.payload.ref_type} ${ref ?? ""}`.trim(), when: e.created_at };
        }
        default:
          return null;
      }
    })
    .filter((x): x is ActivityDto => x !== null);
}

export interface RepoStatsDto {
  commits: number; pulls: number; mergedPulls: number; openPulls: number;
  contributors: number; branches: number; releases: number; openIssues: number;
}

export interface RepoDashboardDto {
  overview: RepoOverviewDto;
  stats: RepoStatsDto;
  collaborators: CollaboratorDto[];
  contributors: ContributorDto[];
  commits: CommitDto[];
  pulls: PullDto[];
  branches: BranchDto[];
  releases: ReleaseDto[];
  issues: IssueDto[];
  milestones: MilestoneDto[];
  activity: ActivityDto[];
  readerAuthed: boolean;
  /** Team context (present on the team-scoped dashboard). */
  team?: { id: string; name: string; domainKey: string | null };
}

// ── Service (read-through) ──────────────────────────────────────────────────────
export const repoRead = {
  overview: async (o: string, r: string): Promise<RepoOverviewDto> => toOverview(await repoApi.getRepo(o, r), o, r),

  collaborators: async (o: string, r: string): Promise<CollaboratorDto[]> => {
    const [repo, cols] = await Promise.all([repoApi.getRepo(o, r), repoApi.listCollaborators(o, r).catch(() => [])]);
    return cols.map((c) => toCollaborator(c, repo.owner.login));
  },

  contributors: async (o: string, r: string) => (await repoApi.listContributors(o, r)).map(toContributor),
  commits: async (o: string, r: string) => (await repoApi.listCommits(o, r)).map(toCommit),
  pulls: async (o: string, r: string) => (await repoApi.listPulls(o, r)).map(toPull),
  branches: async (o: string, r: string) => (await repoApi.listBranches(o, r)).map(toBranch),
  releases: async (o: string, r: string) => (await repoApi.listReleases(o, r)).map(toRelease),
  activity: async (o: string, r: string) => eventsToActivity(await repoApi.listEvents(o, r).catch(() => [])),

  /**
   * DB-backed dashboard for a team's connected repo: collaborators / branches / releases
   * come from the DB (synced at connect with the owner's token — solving the collaborators
   * gap and saving API calls); commits / PRs / contributors / activity are read live for
   * freshness. Returns null when the team's repo hasn't been synced yet.
   */
  teamDashboard: async (teamId: string): Promise<RepoDashboardDto | null> => {
    const stored = await repoStore.byTeam(teamId);
    if (!stored) return null;
    const o = stored.owner, r = stored.name;
    const [repo, contributors, commits, pulls, events, issues, milestones, teamCtx] = await Promise.all([
      repoApi.getRepo(o, r),
      repoApi.listContributors(o, r).catch(() => [] as GhContributor[]),
      repoApi.listCommits(o, r),
      repoApi.listPulls(o, r),
      repoApi.listEvents(o, r).catch(() => [] as GhEvent[]),
      repoApi.listIssues(o, r).catch(() => [] as GhIssueItem[]),
      repoApi.listMilestones(o, r).catch(() => [] as GhMilestone[]),
      repoStore.teamContext(teamId),
    ]);
    const overview = toOverview(repo, o, r);
    const mappedPulls = pulls.map(toPull);
    const collaborators: CollaboratorDto[] = stored.collaborators.map((c) => ({
      login: c.login,
      permission: c.permission === "ADMIN" ? "admin" : c.permission === "WRITE" ? "write" : "read",
      repoRole: c.repoRole === "OWNER" ? "owner" : c.repoRole === "MAINTAINER" ? "maintainer" : "collaborator",
    }));
    const branches: BranchDto[] = stored.branches.map((b) => ({ name: b.name, protected: b.protected, sha: b.sha }));
    const releases: ReleaseDto[] = stored.releases.map((r2) => ({
      tag: r2.tag, name: r2.name, publishedAt: r2.publishedAt.toISOString(), author: r2.author, notes: r2.notes ?? "", prerelease: false,
    }));
    return {
      overview,
      stats: {
        commits: commits.length,
        pulls: mappedPulls.length,
        mergedPulls: mappedPulls.filter((p) => p.state === "merged").length,
        openPulls: mappedPulls.filter((p) => p.state === "open").length,
        contributors: contributors.length,
        branches: branches.length,
        releases: releases.length,
        openIssues: overview.openIssues,
      },
      collaborators,
      contributors: contributors.map(toContributor),
      commits: commits.map(toCommit),
      pulls: mappedPulls,
      branches,
      releases,
      issues: issuesOnly(issues),
      milestones: milestones.map(toMilestone),
      activity: eventsToActivity(events),
      readerAuthed: repoReaderAuthed(),
      team: teamCtx ? { id: teamCtx.id, name: teamCtx.name, domainKey: teamCtx.domain?.key ?? null } : undefined,
    };
  },

  /** One call returns the full repository dashboard. Collaborator/event reads degrade gracefully. */
  dashboard: async (o: string, r: string): Promise<RepoDashboardDto> => {
    const [repo, cols, contributors, commits, pulls, branches, releases, events] = await Promise.all([
      repoApi.getRepo(o, r),
      repoApi.listCollaborators(o, r).catch(() => [] as GhCollaborator[]),
      repoApi.listContributors(o, r).catch(() => [] as GhContributor[]),
      repoApi.listCommits(o, r),
      repoApi.listPulls(o, r),
      repoApi.listBranches(o, r),
      repoApi.listReleases(o, r).catch(() => [] as GhRelease[]),
      repoApi.listEvents(o, r).catch(() => [] as GhEvent[]),
    ]);
    const [issues, milestones] = await Promise.all([
      repoApi.listIssues(o, r).catch(() => [] as GhIssueItem[]),
      repoApi.listMilestones(o, r).catch(() => [] as GhMilestone[]),
    ]);
    const overview = toOverview(repo, o, r);
    const mappedPulls = pulls.map(toPull);
    return {
      overview,
      stats: {
        commits: commits.length,
        pulls: mappedPulls.length,
        mergedPulls: mappedPulls.filter((p) => p.state === "merged").length,
        openPulls: mappedPulls.filter((p) => p.state === "open").length,
        contributors: contributors.length,
        branches: branches.length,
        releases: releases.length,
        openIssues: overview.openIssues,
      },
      collaborators: cols.map((c) => toCollaborator(c, repo.owner.login)),
      contributors: contributors.map(toContributor),
      commits: commits.map(toCommit),
      pulls: mappedPulls,
      branches: branches.map(toBranch),
      releases: releases.map(toRelease),
      issues: issuesOnly(issues),
      milestones: milestones.map(toMilestone),
      activity: eventsToActivity(events),
      readerAuthed: repoReaderAuthed(),
    };
  },
};

import { githubApi, type GhIssue } from "./github.api.js";

/**
 * Read/normalize service (Phase 2) — turns live GitHub responses into the AI-domain
 * shapes the portal renders. Read-through (no persistence yet; that's Phase 3).
 *
 * The org `newton-school-ai` follows a `<project>_<teamN>` repo convention (e.g.
 * `hireflow-ai_1/_2/_3`), so projects and teams are derived from repo names when the
 * GitHub Teams API isn't granted yet. When `Members: Read-only` is added, team
 * membership (mentor + students) is layered on via `teams()`.
 */

export interface RepoSummary {
  name: string;
  fullName: string;
  private: boolean;
  description: string | null;
  defaultBranch: string;
  openIssues: number; // GitHub's count (issues + PRs)
  projectKey: string;
  teamIndex: number;
}

export interface ProjectSummary {
  key: string;
  name: string;
  repos: RepoSummary[];
  teamCount: number;
}

export interface GhTeamDto {
  slug: string;
  name: string;
  repo: string | null; // the team's primary repo (group teams own exactly one)
  repos: string[];
  mentor: string | null; // primary mentor (a faculty member on the team)
  mentors: string[];
  students: string[]; // team members minus faculty
}

export interface RosterResult {
  source: "github" | "derived";
  reason?: string;
  faculty: string[]; // mentor pool (members of the "faculty" team)
  teams: GhTeamDto[];
}

// Teams that represent the mentor/faculty pool rather than a student group.
const FACULTY_TEAM = /faculty|mentor|staff|teacher/i;

/** "hireflow-ai_1" → { key: "hireflow-ai", team: 1 }. Falls back to the whole name. */
export function deriveProject(name: string): { key: string; team: number } {
  const m = name.match(/^(.*)_(\d+)$/);
  return m ? { key: m[1]!, team: Number(m[2]) } : { key: name, team: 1 };
}

function toSummary(r: Awaited<ReturnType<typeof githubApi.listRepos>>[number]): RepoSummary {
  const p = deriveProject(r.name);
  return {
    name: r.name, fullName: r.full_name, private: r.private, description: r.description,
    defaultBranch: r.default_branch, openIssues: r.open_issues_count, projectKey: p.key, teamIndex: p.team,
  };
}

const onlyIssues = (items: GhIssue[]) => items.filter((i) => !i.pull_request);

/**
 * Process-level read-through cache. The AI org's GitHub data is shared (not per-user), and the
 * aggregates fan out to dozens of API calls, so we memoize each result for a short TTL and dedupe
 * concurrent callers by caching the in-flight Promise. Failures are NOT cached (deleted on reject)
 * so a transient GitHub error retries on the next request.
 */
const CACHE_TTL_MS = 60_000;
const _cache = new Map<string, { at: number; val: Promise<unknown> }>();
function cached<T>(key: string, fn: () => Promise<T>): Promise<T> {
  const now = Date.now();
  const hit = _cache.get(key);
  if (hit && now - hit.at < CACHE_TTL_MS) return hit.val as Promise<T>;
  const val = fn().catch((err) => { _cache.delete(key); throw err; });
  _cache.set(key, { at: now, val });
  return val as Promise<T>;
}

export const githubRead = {
  /** Org headline — cheap: a single repo listing (counts are on each repo). */
  orgOverview: async () => {
    const [org, repos] = await Promise.all([githubApi.getOrg(), githubApi.listRepos()]);
    const summaries = repos.map(toSummary);
    const projects = new Set(summaries.map((s) => s.projectKey));
    return {
      login: org.login,
      name: org.name,
      repos: summaries.length,
      projects: projects.size,
      teams: summaries.length, // one repo == one team's workspace
      openIssuesApprox: summaries.reduce((n, s) => n + s.openIssues, 0),
      repoList: summaries,
    };
  },

  /**
   * Org-level analytics — the headline dashboard. Aggregates per-repo reads (issues, PRs,
   * commits, contributors) into org totals + a per-team row for the comparison table. One pass
   * over the org's repos; cost scales with repo count (a handful for the AI domain).
   */
  orgAnalytics: () => cached("orgAnalytics", async () => {
    const [org, repos] = await Promise.all([githubApi.getOrg(), githubApi.listRepos()]);
    const summaries = repos.map(toSummary);
    const details = await Promise.all(summaries.map(async (r) => ({ s: r, d: await githubRead.repoDetail(r.name) })));

    const contributors = new Set<string>();
    let commits = 0, openIssues = 0, closedIssues = 0, prs = 0, mergedPrs = 0, openPrs = 0;
    const teamRows = details.map(({ s, d }) => {
      d.contributors.forEach((c) => contributors.add(c));
      const oi = d.issues.filter((i) => i.state === "open").length;
      const ci = d.issues.filter((i) => i.state === "closed").length;
      const merged = d.pulls.filter((p) => p.state === "merged").length;
      const open = d.pulls.filter((p) => p.state === "open").length;
      commits += d.commits; openIssues += oi; closedIssues += ci; prs += d.pulls.length; mergedPrs += merged; openPrs += open;
      return {
        repo: s.name, fullName: s.fullName, project: s.projectKey, teamIndex: s.teamIndex,
        description: s.description, commits: d.commits, contributors: d.contributors.length,
        openIssues: oi, closedIssues: ci, prs: d.pulls.length, mergedPrs: merged, openPrs: open,
      };
    });

    return {
      login: org.login, name: org.name,
      repos: summaries.length, teams: summaries.length, projects: new Set(summaries.map((s) => s.projectKey)).size,
      contributors: contributors.size, commits, openIssues, closedIssues, prs, mergedPrs, openPrs,
      teamRows: teamRows.sort((a, b) => a.project.localeCompare(b.project) || a.teamIndex - b.teamIndex),
    };
  }),

  /**
   * Org-wide per-contributor leaderboard — the "student contributions" view. Aggregates each
   * login's commits / issues / PRs (raised + merged) across every repo, with how many repos they
   * touched and their PR acceptance rate. Real attribution, populates as students contribute.
   */
  orgContributors: () => cached("orgContributors", async () => {
    const repos = (await githubApi.listRepos()).map(toSummary);
    const perRepo = await Promise.all(repos.map((r) => githubRead.repoContributors(r.name)));
    type Agg = { login: string; commits: number; issuesOpened: number; prsRaised: number; prsMerged: number; repos: number };
    const map = new Map<string, Agg>();
    for (const list of perRepo) {
      for (const s of list) {
        let a = map.get(s.login);
        if (!a) { a = { login: s.login, commits: 0, issuesOpened: 0, prsRaised: 0, prsMerged: 0, repos: 0 }; map.set(s.login, a); }
        a.commits += s.commits; a.issuesOpened += s.issuesOpened; a.prsRaised += s.prsRaised; a.prsMerged += s.prsMerged; a.repos += 1;
      }
    }
    return [...map.values()]
      .map((s) => ({ ...s, acceptanceRate: s.prsRaised ? Math.round((s.prsMerged / s.prsRaised) * 100) : 0 }))
      .sort((a, b) => b.commits + b.prsRaised - (a.commits + a.prsRaised));
  }),

  /** Repos grouped into projects (each project = N team-repos). */
  projects: async (): Promise<ProjectSummary[]> => {
    const repos = (await githubApi.listRepos()).map(toSummary);
    const byKey = new Map<string, RepoSummary[]>();
    for (const r of repos) byKey.set(r.projectKey, [...(byKey.get(r.projectKey) ?? []), r]);
    return [...byKey.entries()]
      .map(([key, rs]) => ({ key, name: key, repos: rs.sort((a, b) => a.teamIndex - b.teamIndex), teamCount: rs.length }))
      .sort((a, b) => a.key.localeCompare(b.key));
  },

  /** Full detail for one repo — issues, PRs, milestones, commits, contributors. */
  repoDetail: (repo: string) => cached(`repoDetail:${repo}`, async () => {
    const [issuesRaw, pulls, milestones, commits] = await Promise.all([
      githubApi.listIssues(repo),
      githubApi.listPulls(repo),
      githubApi.listMilestones(repo),
      githubApi.listCommits(repo),
    ]);
    const issues = onlyIssues(issuesRaw);
    // Contributors derived from real activity (works without the Teams API).
    const contributors = new Map<string, number>();
    for (const c of commits) { const l = c.author?.login; if (l) contributors.set(l, (contributors.get(l) ?? 0) + 1); }
    for (const p of pulls) { const l = p.user?.login; if (l) contributors.set(l, (contributors.get(l) ?? 0) + 0); }

    return {
      repo,
      issues: issues.map((i) => ({
        number: i.number, title: i.title, state: i.state, labels: i.labels.map((l) => l.name),
        author: i.user?.login ?? null, assignees: i.assignees.map((a) => a.login),
        milestone: i.milestone?.title ?? null, url: i.html_url, createdAt: i.created_at,
      })),
      pulls: pulls.map((p) => ({
        number: p.number, title: p.title,
        state: p.merged_at ? "merged" : p.state === "closed" ? "rejected" : "open",
        author: p.user?.login ?? null, additions: p.additions ?? 0, deletions: p.deletions ?? 0,
        url: p.html_url, createdAt: p.created_at, mergedAt: p.merged_at,
      })),
      milestones: milestones.map((m) => ({
        number: m.number, title: m.title, state: m.state,
        progress: m.open_issues + m.closed_issues > 0 ? Math.round((m.closed_issues / (m.open_issues + m.closed_issues)) * 100) : 0,
        dueAt: m.due_on,
      })),
      commits: commits.length,
      // Recent commit history (newest first; GitHub returns commits in reverse-chronological order).
      commitList: commits.slice(0, 30).map((c) => ({
        sha: c.sha.slice(0, 7),
        message: (c.commit.message ?? "").split("\n")[0]!.slice(0, 140),
        author: c.author?.login ?? c.commit.author?.name ?? null,
        date: c.commit.author?.date ?? null,
      })),
      contributors: [...contributors.keys()],
    };
  }),

  /**
   * Per-contributor analytics for a repo, derived from real activity (commits, PRs,
   * issues) — works without org Teams/Members. This is the primary source of
   * student attribution; it populates as students actually commit and raise PRs.
   */
  repoContributors: (repo: string) => cached(`repoContributors:${repo}`, async () => {
    const [issuesRaw, pulls, commits] = await Promise.all([
      githubApi.listIssues(repo), githubApi.listPulls(repo), githubApi.listCommits(repo),
    ]);
    const issues = onlyIssues(issuesRaw);
    type Stat = { login: string; commits: number; issuesOpened: number; prsRaised: number; prsMerged: number };
    const map = new Map<string, Stat>();
    const stat = (login?: string | null) => {
      if (!login) return null;
      let s = map.get(login);
      if (!s) { s = { login, commits: 0, issuesOpened: 0, prsRaised: 0, prsMerged: 0 }; map.set(login, s); }
      return s;
    };
    for (const c of commits) { const s = stat(c.author?.login); if (s) s.commits++; }
    for (const i of issues) { const s = stat(i.user?.login); if (s) s.issuesOpened++; }
    for (const p of pulls) { const s = stat(p.user?.login); if (s) { s.prsRaised++; if (p.merged_at) s.prsMerged++; } }
    return [...map.values()]
      .map((s) => ({ ...s, acceptanceRate: s.prsRaised ? Math.round((s.prsMerged / s.prsRaised) * 100) : 0 }))
      .sort((a, b) => b.commits + b.prsRaised - (a.commits + a.prsRaised));
  }),

  /** Per-repo (team) analytics rolled from the same reads. */
  repoAnalytics: async (repo: string) => {
    const d = await githubRead.repoDetail(repo);
    const merged = d.pulls.filter((p) => p.state === "merged").length;
    const decided = d.pulls.filter((p) => p.state !== "open").length;
    const ms = d.milestones;
    return {
      repo, projectKey: deriveProject(repo).key, teamIndex: deriveProject(repo).team,
      openIssues: d.issues.filter((i) => i.state === "open").length,
      closedIssues: d.issues.filter((i) => i.state === "closed").length,
      prs: d.pulls.length, mergedPrs: merged, prMergeRate: decided ? Math.round((merged / decided) * 100) : 0,
      commits: d.commits, contributors: d.contributors.length,
      milestoneProgress: ms.length ? Math.round(ms.reduce((s, m) => s + m.progress, 0) / ms.length) : 0,
    };
  },

  /** Compare the team-repos of one project (the teacher's project-comparison lens). */
  projectComparison: async (projectKey: string) => {
    const repos = (await githubApi.listRepos()).map(toSummary).filter((r) => r.projectKey === projectKey);
    const teams = await Promise.all(repos.map((r) => githubRead.repoAnalytics(r.name)));
    return { projectKey, teams: teams.sort((a, b) => a.teamIndex - b.teamIndex) };
  },

  /**
   * Team rosters (mentor + students per repo) from native GitHub Teams. The org models
   * a `faculty` team (the mentor pool) plus one `group-N` team per repo containing the
   * faculty + its students. We separate them so each student team gets a mentor, its
   * students (members minus faculty), and its repo. Degrades to a repo-derived
   * structure if the token can't read Teams (no 500s).
   */
  teams: async (): Promise<RosterResult> => {
    try {
      const ghTeams = await githubApi.listTeams();
      if (ghTeams.length) {
        const detailed = await Promise.all(ghTeams.map(async (t) => ({
          slug: t.slug, name: t.name,
          members: (await githubApi.listTeamMembers(t.slug)).map((m) => m.login),
          repos: (await githubApi.listTeamRepos(t.slug)).map((r) => r.name),
        })));
        const faculty = detailed.find((t) => FACULTY_TEAM.test(t.slug) || FACULTY_TEAM.test(t.name));
        const facultySet = new Set(faculty?.members ?? []);
        const teams: GhTeamDto[] = detailed
          .filter((t) => t !== faculty)
          .map((t) => {
            const mentors = t.members.filter((m) => facultySet.has(m));
            return {
              slug: t.slug, name: t.name,
              repo: t.repos[0] ?? null, repos: t.repos,
              mentor: mentors[0] ?? null, mentors,
              students: t.members.filter((m) => !facultySet.has(m)),
            };
          });
        return { source: "github", faculty: faculty?.members ?? [], teams };
      }
    } catch {
      // permission missing → fall through to derived
    }
    const repos = (await githubApi.listRepos()).map(toSummary);
    return {
      source: "derived",
      reason: "GitHub Teams not readable (token needs Organization → Members: Read-only, or no Teams exist yet)",
      faculty: [],
      teams: repos.map((r) => ({ slug: r.name, name: `${r.projectKey} · team ${r.teamIndex}`, repo: r.name, repos: [r.name], mentor: null, mentors: [], students: [] })),
    };
  },
};

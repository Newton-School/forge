/**
 * Mock GitHub data — REPOSITORY-based mode (presentation).
 *
 * ML / DVA / SDSE don't use a GitHub Organization. A Team Lead or Mentor OWNS a single
 * repository and students are COLLABORATORS — the repository is the source of truth.
 * Issues are OPTIONAL here (work flows through tasks/deliverables/milestones); a repo may
 * or may not use them. This file seeds one connected repo per non-AI domain and derives all
 * analytics from base arrays, mirroring the org-mode shapes in `github.ts`. Surfaced via
 * `@/lib/api`. Kept separate from the org model so the two modes never contradict.
 */

export type RepoVisibility = "public" | "private";
export type RepoRole = "owner" | "maintainer" | "collaborator";
export type PortalRole = "Team Lead" | "Mentor" | "Mentee";

export interface MockCollaborator {
  login: string;
  name: string;
  repoRole: RepoRole;
  permission: "admin" | "write" | "read";
  portalRole: PortalRole;
  isStudent: boolean;
  color: string;
}

export interface MockRepoCommit {
  sha: string;
  authorLogin: string;
  message: string;
  additions: number;
  deletions: number;
  when: string;
}

export interface MockRepoPR {
  number: number;
  authorLogin: string;
  title: string;
  state: "open" | "merged" | "closed";
  additions: number;
  deletions: number;
  commits: number;
  reviewers: string[];
  reviewState: "approved" | "changes_requested" | "pending" | "none";
  createdAt: string;
  mergedAt?: string;
}

export interface MockRepoBranch {
  name: string;
  protected: boolean;
  ahead: number;
  behind: number;
  lastCommit: string;
  author: string;
  updatedAt: string;
}

export interface MockRepoRelease {
  tag: string;
  name: string;
  publishedAt: string;
  author: string;
  notes: string;
}

export interface MockRepoIssue {
  number: number;
  title: string;
  state: "open" | "closed";
  labels: string[];
  assignee?: string;
  createdAt: string;
}

export interface MockRepoMilestone {
  title: string;
  progress: number; // 0–100
  dueAt: string;
  state: "open" | "closed";
}

/** A single connected repository — the unit of GitHub integration for non-AI domains. */
export interface RepoConnection {
  domainKey: string;
  team: string;
  repoName: string;
  fullName: string;
  description: string;
  defaultBranch: string;
  visibility: RepoVisibility;
  topics: string[];
  createdAt: string;
  updatedAt: string;
  ownerLogin: string;
  ownerRole: "Team Lead" | "Mentor";
  hasIssues: boolean;
  collaborators: MockCollaborator[];
  commits: MockRepoCommit[];
  prs: MockRepoPR[];
  branches: MockRepoBranch[];
  releases: MockRepoRelease[];
  issues: MockRepoIssue[]; // empty when !hasIssues
  milestones: MockRepoMilestone[];
  /** The mentee-view subject for the demo (a student collaborator's login). */
  demoMentee: string;
}

// ── ML — Insight Squad · Team-Lead-owned · USES issues ───────────────────────────────
const ML: RepoConnection = {
  domainKey: "ML",
  team: "Insight Squad",
  repoName: "insight-forecaster",
  fullName: "rohit-sen/insight-forecaster",
  description: "Sales forecasting + interactive insight dashboard for the ML drive.",
  defaultBranch: "main",
  visibility: "public",
  topics: ["ml", "forecasting", "streamlit"],
  createdAt: "2026-05-18",
  updatedAt: "2026-06-16",
  ownerLogin: "rohit-sen",
  ownerRole: "Team Lead",
  hasIssues: true,
  collaborators: [
    { login: "rohit-sen", name: "Rohit Sen", repoRole: "owner", permission: "admin", portalRole: "Team Lead", isStudent: true, color: "#4f46e5" },
    { login: "neha-g", name: "Neha Gupta", repoRole: "maintainer", permission: "write", portalRole: "Mentor", isStudent: false, color: "#0ea5e9" },
    { login: "lakshmi-m", name: "Lakshmi Menon", repoRole: "collaborator", permission: "write", portalRole: "Mentee", isStudent: true, color: "#059669" },
    { login: "rajan-m", name: "Rajan Mehta", repoRole: "collaborator", permission: "write", portalRole: "Mentee", isStudent: true, color: "#d97706" },
    { login: "divya-r", name: "Divya Rao", repoRole: "collaborator", permission: "write", portalRole: "Mentee", isStudent: true, color: "#db2777" },
  ],
  commits: [
    { sha: "a1f2e30", authorLogin: "rohit-sen", message: "chore: scaffold project + CI", additions: 180, deletions: 0, when: "2026-05-20" },
    { sha: "b2a3d41", authorLogin: "lakshmi-m", message: "feat: data loader + cleaning", additions: 210, deletions: 14, when: "2026-06-04" },
    { sha: "c3b4e52", authorLogin: "rajan-m", message: "feat: baseline ARIMA model", additions: 160, deletions: 8, when: "2026-06-09" },
    { sha: "d4c5f63", authorLogin: "divya-r", message: "feat: streamlit dashboard shell", additions: 140, deletions: 3, when: "2026-06-12" },
    { sha: "e5d6a74", authorLogin: "lakshmi-m", message: "feat: feature engineering (lags, rolling)", additions: 120, deletions: 22, when: "2026-06-14" },
    { sha: "f6e7b85", authorLogin: "rohit-sen", message: "refactor: split pipeline into stages", additions: 90, deletions: 60, when: "2026-06-15" },
    { sha: "a7f8c96", authorLogin: "rajan-m", message: "feat: SHAP explanations panel", additions: 110, deletions: 5, when: "2026-06-16" },
  ],
  prs: [
    { number: 12, authorLogin: "lakshmi-m", title: "Data loader + cleaning pipeline", state: "merged", additions: 210, deletions: 14, commits: 4, reviewers: ["rohit-sen"], reviewState: "approved", createdAt: "2026-06-03", mergedAt: "2026-06-04" },
    { number: 15, authorLogin: "rajan-m", title: "Baseline ARIMA forecaster", state: "merged", additions: 160, deletions: 8, commits: 3, reviewers: ["neha-g"], reviewState: "approved", createdAt: "2026-06-08", mergedAt: "2026-06-09" },
    { number: 18, authorLogin: "divya-r", title: "Dashboard shell + layout", state: "open", additions: 140, deletions: 3, commits: 2, reviewers: ["rohit-sen"], reviewState: "pending", createdAt: "2026-06-12" },
    { number: 21, authorLogin: "rajan-m", title: "SHAP explanations panel", state: "open", additions: 110, deletions: 5, commits: 2, reviewers: ["neha-g"], reviewState: "changes_requested", createdAt: "2026-06-16" },
  ],
  branches: [
    { name: "main", protected: true, ahead: 0, behind: 0, lastCommit: "refactor: split pipeline into stages", author: "rohit-sen", updatedAt: "2026-06-15" },
    { name: "feat/dashboard", protected: false, ahead: 4, behind: 1, lastCommit: "feat: streamlit dashboard shell", author: "divya-r", updatedAt: "2026-06-12" },
    { name: "feat/shap", protected: false, ahead: 2, behind: 3, lastCommit: "feat: SHAP explanations panel", author: "rajan-m", updatedAt: "2026-06-16" },
  ],
  releases: [
    { tag: "v0.1.0", name: "M1 — Data Pipeline", publishedAt: "2026-06-05", author: "rohit-sen", notes: "Cleaned dataset + loader; reproducible pipeline." },
    { tag: "v0.2.0", name: "M2 — Baseline Model", publishedAt: "2026-06-10", author: "rohit-sen", notes: "ARIMA baseline beating the naive forecast." },
  ],
  issues: [
    { number: 22, title: "Add holiday calendar as a feature", state: "open", labels: ["feature", "data"], assignee: "lakshmi-m", createdAt: "2026-06-13" },
    { number: 23, title: "Dashboard: add date-range filter", state: "open", labels: ["dashboard"], assignee: "divya-r", createdAt: "2026-06-14" },
    { number: 19, title: "Pipeline fails on missing weeks", state: "closed", labels: ["bug"], assignee: "lakshmi-m", createdAt: "2026-06-06" },
  ],
  milestones: [
    { title: "M1 — Data Pipeline", progress: 100, dueAt: "2026-06-05", state: "closed" },
    { title: "M2 — Forecast + Dashboard", progress: 62, dueAt: "2026-06-24", state: "open" },
  ],
  demoMentee: "lakshmi-m",
};

// ── DVA — Dashboard Crew · Mentor-owned · NO issues (drive-tracked) ───────────────────
const DVA: RepoConnection = {
  domainKey: "DVA",
  team: "Dashboard Crew",
  repoName: "viz-stories",
  fullName: "ananya-bose/viz-stories",
  description: "Data-storytelling dashboards and visual analytics for the DVA drive.",
  defaultBranch: "main",
  visibility: "public",
  topics: ["d3", "dataviz", "analytics"],
  createdAt: "2026-05-22",
  updatedAt: "2026-06-15",
  ownerLogin: "ananya-bose",
  ownerRole: "Mentor",
  hasIssues: false,
  collaborators: [
    { login: "ananya-bose", name: "Ananya Bose", repoRole: "owner", permission: "admin", portalRole: "Mentor", isStudent: false, color: "#4f46e5" },
    { login: "kabir-s", name: "Kabir Singh", repoRole: "maintainer", permission: "write", portalRole: "Team Lead", isStudent: true, color: "#0ea5e9" },
    { login: "ishita-b", name: "Ishita Bose", repoRole: "collaborator", permission: "write", portalRole: "Mentee", isStudent: true, color: "#059669" },
    { login: "tara-s", name: "Tara Singh", repoRole: "collaborator", permission: "write", portalRole: "Mentee", isStudent: true, color: "#d97706" },
  ],
  commits: [
    { sha: "11a22b3", authorLogin: "ananya-bose", message: "chore: repo + design tokens", additions: 150, deletions: 0, when: "2026-05-24" },
    { sha: "22b33c4", authorLogin: "kabir-s", message: "feat: CSV → chart data adapter", additions: 130, deletions: 6, when: "2026-06-05" },
    { sha: "33c44d5", authorLogin: "ishita-b", message: "feat: bar + line chart components", additions: 200, deletions: 10, when: "2026-06-10" },
    { sha: "44d55e6", authorLogin: "tara-s", message: "feat: choropleth map", additions: 170, deletions: 4, when: "2026-06-13" },
    { sha: "55e66f7", authorLogin: "ishita-b", message: "feat: story scrollytelling layout", additions: 160, deletions: 18, when: "2026-06-15" },
  ],
  prs: [
    { number: 8, authorLogin: "kabir-s", title: "CSV → chart data adapter", state: "merged", additions: 130, deletions: 6, commits: 3, reviewers: ["ananya-bose"], reviewState: "approved", createdAt: "2026-06-04", mergedAt: "2026-06-05" },
    { number: 11, authorLogin: "ishita-b", title: "Reusable bar + line charts", state: "merged", additions: 200, deletions: 10, commits: 4, reviewers: ["ananya-bose"], reviewState: "approved", createdAt: "2026-06-09", mergedAt: "2026-06-10" },
    { number: 14, authorLogin: "tara-s", title: "Choropleth map component", state: "open", additions: 170, deletions: 4, commits: 2, reviewers: ["ananya-bose"], reviewState: "pending", createdAt: "2026-06-13" },
    { number: 16, authorLogin: "ishita-b", title: "Scrollytelling story layout", state: "open", additions: 160, deletions: 18, commits: 3, reviewers: ["kabir-s"], reviewState: "pending", createdAt: "2026-06-15" },
  ],
  branches: [
    { name: "main", protected: true, ahead: 0, behind: 0, lastCommit: "feat: story scrollytelling layout", author: "ishita-b", updatedAt: "2026-06-15" },
    { name: "feat/map", protected: false, ahead: 2, behind: 0, lastCommit: "feat: choropleth map", author: "tara-s", updatedAt: "2026-06-13" },
  ],
  releases: [
    { tag: "v0.1.0", name: "Chart toolkit", publishedAt: "2026-06-11", author: "ananya-bose", notes: "Reusable D3 chart components + data adapter." },
  ],
  issues: [],
  milestones: [
    { title: "M1 — Chart Toolkit", progress: 100, dueAt: "2026-06-11", state: "closed" },
    { title: "M2 — Data Story", progress: 45, dueAt: "2026-06-26", state: "open" },
  ],
  demoMentee: "ishita-b",
};

// ── SDSE — Shipyard · Mentor-owned · NO issues ───────────────────────────────────────
const SDSE: RepoConnection = {
  domainKey: "SDSE",
  team: "Shipyard Team",
  repoName: "shipyard",
  fullName: "ishaan-roy/shipyard",
  description: "Internal deployment console for the SDSE drive — services, builds, releases.",
  defaultBranch: "main",
  visibility: "public",
  topics: ["nextjs", "node", "devops"],
  createdAt: "2026-05-15",
  updatedAt: "2026-06-16",
  ownerLogin: "ishaan-roy",
  ownerRole: "Mentor",
  hasIssues: false,
  collaborators: [
    { login: "ishaan-roy", name: "Ishaan Roy", repoRole: "owner", permission: "admin", portalRole: "Mentor", isStudent: false, color: "#4f46e5" },
    { login: "aniket", name: "Aniket Sharma", repoRole: "maintainer", permission: "write", portalRole: "Team Lead", isStudent: true, color: "#0ea5e9" },
    { login: "priyak", name: "Priya Kulkarni", repoRole: "collaborator", permission: "write", portalRole: "Mentee", isStudent: true, color: "#059669" },
    { login: "rohan-d", name: "Rohan Das", repoRole: "collaborator", permission: "read", portalRole: "Mentee", isStudent: true, color: "#d97706" },
  ],
  commits: [
    { sha: "90aa11b", authorLogin: "ishaan-roy", message: "chore: monorepo + lint/test CI", additions: 220, deletions: 0, when: "2026-05-18" },
    { sha: "91bb22c", authorLogin: "aniket", message: "feat: service registry API", additions: 240, deletions: 12, when: "2026-06-06" },
    { sha: "92cc33d", authorLogin: "priyak", message: "feat: build status board UI", additions: 180, deletions: 9, when: "2026-06-11" },
    { sha: "93dd44e", authorLogin: "aniket", message: "feat: release rollback action", additions: 130, deletions: 16, when: "2026-06-15" },
    { sha: "94ee55f", authorLogin: "priyak", message: "fix: board flicker on poll", additions: 30, deletions: 24, when: "2026-06-16" },
  ],
  prs: [
    { number: 31, authorLogin: "aniket", title: "Service registry API", state: "merged", additions: 240, deletions: 12, commits: 5, reviewers: ["ishaan-roy"], reviewState: "approved", createdAt: "2026-06-05", mergedAt: "2026-06-06" },
    { number: 34, authorLogin: "priyak", title: "Build status board", state: "merged", additions: 180, deletions: 9, commits: 4, reviewers: ["ishaan-roy"], reviewState: "approved", createdAt: "2026-06-10", mergedAt: "2026-06-11" },
    { number: 37, authorLogin: "aniket", title: "Release rollback action", state: "open", additions: 130, deletions: 16, commits: 3, reviewers: ["ishaan-roy"], reviewState: "changes_requested", createdAt: "2026-06-15" },
  ],
  branches: [
    { name: "main", protected: true, ahead: 0, behind: 0, lastCommit: "fix: board flicker on poll", author: "priyak", updatedAt: "2026-06-16" },
    { name: "feat/rollback", protected: false, ahead: 3, behind: 2, lastCommit: "feat: release rollback action", author: "aniket", updatedAt: "2026-06-15" },
  ],
  releases: [
    { tag: "v0.1.0", name: "Service registry", publishedAt: "2026-06-07", author: "ishaan-roy", notes: "Register + list services with health." },
    { tag: "v0.2.0", name: "Status board", publishedAt: "2026-06-12", author: "ishaan-roy", notes: "Live build status board." },
  ],
  issues: [],
  milestones: [
    { title: "M1 — Registry + Board", progress: 100, dueAt: "2026-06-12", state: "closed" },
    { title: "M2 — Releases + Rollback", progress: 40, dueAt: "2026-06-27", state: "open" },
  ],
  demoMentee: "priyak",
};

export const REPO_CONNECTIONS: Record<string, RepoConnection> = { ML, DVA, SDSE };

/** The connected repo for a domain (undefined for AI, which is org-driven). */
export function repoConnectionFor(domainKey: string): RepoConnection | undefined {
  return REPO_CONNECTIONS[domainKey];
}

export function allRepoConnections(): RepoConnection[] {
  return Object.values(REPO_CONNECTIONS);
}

export interface RepoStats {
  commits: number;
  prs: number;
  mergedPrs: number;
  openPrs: number;
  contributors: number;
  branches: number;
  releases: number;
  openIssues: number;
  closedIssues: number;
  additions: number;
  deletions: number;
}

export function repoStats(conn: RepoConnection): RepoStats {
  return {
    commits: conn.commits.length,
    prs: conn.prs.length,
    mergedPrs: conn.prs.filter((p) => p.state === "merged").length,
    openPrs: conn.prs.filter((p) => p.state === "open").length,
    contributors: new Set(conn.commits.map((c) => c.authorLogin)).size,
    branches: conn.branches.length,
    releases: conn.releases.length,
    openIssues: conn.issues.filter((i) => i.state === "open").length,
    closedIssues: conn.issues.filter((i) => i.state === "closed").length,
    additions: conn.commits.reduce((s, c) => s + c.additions, 0),
    deletions: conn.commits.reduce((s, c) => s + c.deletions, 0),
  };
}

export interface ContributorStat {
  login: string;
  name: string;
  portalRole: PortalRole;
  isStudent: boolean;
  color: string;
  commits: number;
  additions: number;
  deletions: number;
  prs: number;
  mergedPrs: number;
  openPrs: number;
  reviews: number;
  lastActive: string;
}

/** Per-collaborator contribution analytics, derived from commits + PRs + reviews. */
export function repoContributors(conn: RepoConnection): ContributorStat[] {
  return conn.collaborators
    .map((c) => {
      const commits = conn.commits.filter((x) => x.authorLogin === c.login);
      const prs = conn.prs.filter((x) => x.authorLogin === c.login);
      const reviews = conn.prs.filter((x) => x.reviewers.includes(c.login)).length;
      const dates = [...commits.map((x) => x.when), ...prs.map((x) => x.mergedAt ?? x.createdAt)].sort();
      return {
        login: c.login,
        name: c.name,
        portalRole: c.portalRole,
        isStudent: c.isStudent,
        color: c.color,
        commits: commits.length,
        additions: commits.reduce((s, x) => s + x.additions, 0),
        deletions: commits.reduce((s, x) => s + x.deletions, 0),
        prs: prs.length,
        mergedPrs: prs.filter((x) => x.state === "merged").length,
        openPrs: prs.filter((x) => x.state === "open").length,
        reviews,
        lastActive: dates.length ? dates[dates.length - 1]! : conn.createdAt,
      };
    })
    .sort((a, b) => b.commits + b.prs - (a.commits + a.prs));
}

export function contributorStat(conn: RepoConnection, login: string): ContributorStat | undefined {
  return repoContributors(conn).find((c) => c.login === login);
}

export type RepoActivityKind = "commit" | "pr_opened" | "pr_merged" | "release";
export interface RepoActivityItem {
  kind: RepoActivityKind;
  who: string;
  what: string;
  when: string;
}

/** A unified, newest-first activity feed for a repo (commits + PR events + releases). */
export function repoActivity(conn: RepoConnection, limit = 12): RepoActivityItem[] {
  const nameOf = (login: string) => conn.collaborators.find((c) => c.login === login)?.name ?? login;
  const items: RepoActivityItem[] = [
    ...conn.commits.map((c) => ({ kind: "commit" as const, who: nameOf(c.authorLogin), what: c.message, when: c.when })),
    ...conn.prs.map((p) =>
      p.state === "merged"
        ? { kind: "pr_merged" as const, who: nameOf(p.authorLogin), what: `merged #${p.number} ${p.title}`, when: p.mergedAt ?? p.createdAt }
        : { kind: "pr_opened" as const, who: nameOf(p.authorLogin), what: `opened #${p.number} ${p.title}`, when: p.createdAt },
    ),
    ...conn.releases.map((r) => ({ kind: "release" as const, who: nameOf(r.author), what: `released ${r.tag} — ${r.name}`, when: r.publishedAt })),
  ];
  return items.sort((a, b) => (a.when < b.when ? 1 : -1)).slice(0, limit);
}

/** Teacher rollup — every non-AI domain repo with its headline stats. */
export function domainRepoAnalytics(): { conn: RepoConnection; stats: RepoStats }[] {
  return allRepoConnections().map((conn) => ({ conn, stats: repoStats(conn) }));
}

// ── Live wire contract (mirrors the server's RepoDashboardDto) + mapper ───────────────
/** The server's repository-dashboard payload (`GET /teams/:id/repo/dashboard`). */
export interface RepoDashboardDto {
  overview: { owner: string; repo: string; fullName: string; description: string | null; visibility: RepoVisibility; defaultBranch: string; topics: string[]; hasIssues: boolean; openIssues: number; pushedAt: string; createdAt: string };
  collaborators: { login: string; permission: "admin" | "write" | "read"; repoRole: RepoRole }[];
  commits: { sha: string; login: string | null; message: string; when: string }[];
  pulls: { number: number; authorLogin: string | null; title: string; state: "open" | "merged" | "closed"; additions: number; deletions: number; commits: number; reviewers: string[]; reviewState: MockRepoPR["reviewState"]; createdAt: string; mergedAt: string | null }[];
  branches: { name: string; protected: boolean; sha: string }[];
  releases: { tag: string; name: string; publishedAt: string; author: string | null; notes: string }[];
  issues: { number: number; title: string; state: "open" | "closed"; labels: string[]; assignee: string | null; createdAt: string }[];
  milestones: MockRepoMilestone[];
  team?: { id: string; name: string; domainKey: string | null };
}

const PALETTE = ["#4f46e5", "#0ea5e9", "#059669", "#d97706", "#db2777", "#7c3aed"];
const portalFromRepoRole = (r: RepoRole): PortalRole => (r === "collaborator" ? "Mentee" : "Mentor");

/**
 * Map the server dashboard payload to the `RepoConnection` shape the views render. Some
 * cosmetic fields aren't in the API (real names, avatar colors, commit line counts) and
 * are filled best-effort — refined once the production session resolves usernames.
 */
export function dashboardDtoToConnection(dto: RepoDashboardDto, opts: { domain: string; selfLogin?: string }): RepoConnection {
  const ov = dto.overview;
  return {
    domainKey: dto.team?.domainKey ?? opts.domain,
    team: dto.team?.name ?? ov.repo,
    repoName: ov.repo,
    fullName: ov.fullName,
    description: ov.description ?? "",
    defaultBranch: ov.defaultBranch,
    visibility: ov.visibility,
    topics: ov.topics,
    createdAt: ov.createdAt,
    updatedAt: ov.pushedAt,
    ownerLogin: ov.owner,
    ownerRole: "Mentor",
    hasIssues: ov.hasIssues,
    collaborators: dto.collaborators.map((c, i) => ({
      login: c.login, name: c.login,
      repoRole: c.repoRole, permission: c.permission,
      portalRole: portalFromRepoRole(c.repoRole), isStudent: c.repoRole === "collaborator",
      color: PALETTE[i % PALETTE.length]!,
    })),
    commits: dto.commits.map((c) => ({ sha: c.sha, authorLogin: c.login ?? "", message: c.message, additions: 0, deletions: 0, when: c.when })),
    prs: dto.pulls.map((p) => ({ number: p.number, authorLogin: p.authorLogin ?? "", title: p.title, state: p.state, additions: p.additions, deletions: p.deletions, commits: p.commits, reviewers: p.reviewers, reviewState: p.reviewState, createdAt: p.createdAt, mergedAt: p.mergedAt ?? undefined })),
    branches: dto.branches.map((b) => ({ name: b.name, protected: b.protected, ahead: 0, behind: 0, lastCommit: b.sha, author: "", updatedAt: ov.pushedAt })),
    releases: dto.releases.map((r) => ({ tag: r.tag, name: r.name, publishedAt: r.publishedAt, author: r.author ?? "", notes: r.notes })),
    issues: dto.issues.map((i) => ({ number: i.number, title: i.title, state: i.state, labels: i.labels, assignee: i.assignee ?? undefined, createdAt: i.createdAt })),
    milestones: dto.milestones,
    demoMentee: opts.selfLogin ?? dto.collaborators.find((c) => c.repoRole === "collaborator")?.login ?? "",
  };
}

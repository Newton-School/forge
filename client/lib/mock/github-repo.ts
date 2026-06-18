/**
 * Mock GitHub data — REPOSITORY-based mode (presentation), TEAM-CENTRIC.
 *
 * The non-AI domains don't use a GitHub Organization, but they are still navigated
 * team-first: Domain → Team → Repository → Students → Contributions → Progress. The repo
 * structure is DOMAIN-ADAPTIVE:
 *   • ML   → PER-STUDENT: each student owns a fully independent repo (own commits / PRs /
 *            branches / releases). The team is a discussion + grouping layer, not a shared
 *            codebase. The team view compares the students' independent repos side-by-side.
 *   • DVA  → SHARED: the team collaborates in one shared repo (data-storytelling / analytics).
 *   • SDSE → SHARED: the team collaborates in one shared repo (engineering).
 *   • AI   → org-mode (see github.ts) — untouched here.
 *
 * A `RepoConnection` is the repo unit (shared repo, or one per-student repo). Teams group
 * them with mentor / team-lead / members context. Surfaced via `@/lib/api`.
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

export interface MockRepoDeliverable {
  name: string;
  type: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  submittedBy: string;
  submittedAt: string;
}

/** A single repository — the unit of GitHub integration (shared team repo, or a student's repo). */
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
  deliverables: MockRepoDeliverable[];
  /** The mentee-view subject for the demo (a student collaborator's login). */
  demoMentee: string;
}

// ─────────────────────── Team-centric layer ───────────────────────

/** How a domain structures its repositories. AI is org-mode; non-AI is shared or per-student. */
export type RepoModel = "org" | "shared" | "per-student";

export function repoModelFor(domainKey: string): RepoModel {
  if (domainKey === "AI") return "org";
  if (domainKey === "ML") return "per-student";
  return "shared"; // DVA, SDSE
}

export interface TeamPerson {
  login: string;
  name: string;
  role: "Mentor" | "TeamLead" | "Mentee";
  color: string;
}

/** A team: mentor + student team-lead + members, and either one shared repo or per-student repos. */
export interface RepoTeam {
  id: string;
  name: string;
  domainKey: string;
  repoModel: RepoModel;
  mentor: TeamPerson;
  teamLead: TeamPerson;
  members: TeamPerson[]; // students (includes the team lead)
  /** Shared model → 1 repo. Per-student model → one independent repo per student. */
  repos: RepoConnection[];
}

const PALETTE = ["#4f46e5", "#0ea5e9", "#059669", "#d97706", "#db2777", "#7c3aed", "#0891b2"];

const portalRoleOf = (p: TeamPerson): PortalRole =>
  p.role === "TeamLead" ? "Team Lead" : p.role === "Mentor" ? "Mentor" : "Mentee";

function collab(p: TeamPerson, repoRole: RepoRole, permission: "admin" | "write" | "read"): MockCollaborator {
  return { login: p.login, name: p.name, repoRole, permission, portalRole: portalRoleOf(p), isStudent: p.role !== "Mentor", color: p.color };
}

// ── ML — per-student independent repos ───────────────────────────────────────────────
/** Build one student's fully independent ML repo (own commits / PRs / branches / releases). */
function mlStudentRepo(student: TeamPerson, mentor: TeamPerson, teamName: string, i: number): RepoConnection {
  const d = (day: number) => `2026-06-${String(day).padStart(2, "0")}`;
  const repoName = `${student.login}-forecast`;
  const commits: MockRepoCommit[] = [
    { sha: `${student.login}01`, authorLogin: student.login, message: "chore: scaffold notebook + env", additions: 110 + i * 6, deletions: 0, when: d(2 + i) },
    { sha: `${student.login}02`, authorLogin: student.login, message: "feat: EDA + data cleaning", additions: 160 + i * 4, deletions: 12, when: d(6 + i) },
    { sha: `${student.login}03`, authorLogin: student.login, message: "feat: baseline forecaster", additions: 150, deletions: 8, when: d(9 + i) },
    { sha: `${student.login}04`, authorLogin: student.login, message: "feat: feature engineering", additions: 120, deletions: 20, when: d(12 + (i % 3)) },
    { sha: `${student.login}05`, authorLogin: student.login, message: "feat: evaluation + plots", additions: 90, deletions: 6, when: d(14 + (i % 2)) },
  ].slice(0, 4 + (i % 2)); // 4–5 commits, varied per student
  const prs: MockRepoPR[] = [
    { number: 3, authorLogin: student.login, title: "Baseline forecaster", state: "merged", additions: 150, deletions: 8, commits: 3, reviewers: [mentor.login], reviewState: "approved", createdAt: d(8 + i), mergedAt: d(9 + i) },
    { number: 6, authorLogin: student.login, title: "Feature engineering + tuning", state: "open", additions: 120, deletions: 20, commits: 2, reviewers: [mentor.login], reviewState: i % 2 === 0 ? "pending" : "changes_requested", createdAt: d(13 + (i % 3)) },
  ];
  const branches: MockRepoBranch[] = [
    { name: "main", protected: true, ahead: 0, behind: 0, lastCommit: "feat: evaluation + plots", author: student.login, updatedAt: d(14 + (i % 2)) },
    { name: "feat/tuning", protected: false, ahead: 2 + (i % 2), behind: i % 3, lastCommit: "feat: feature engineering", author: student.login, updatedAt: d(12 + (i % 3)) },
  ];
  const releases: MockRepoRelease[] = [
    { tag: "v0.1.0", name: "M1 — Baseline", publishedAt: d(10 + i), author: student.login, notes: "Baseline forecaster beating the naive model." },
  ];
  const milestones: MockRepoMilestone[] = [
    { title: "M1 — Baseline", progress: 100, dueAt: d(10), state: "closed" },
    { title: "M2 — Tuned model + report", progress: 45 + i * 12, dueAt: "2026-06-26", state: "open" },
  ];
  const deliverables: MockRepoDeliverable[] = [
    { name: "Baseline notebook", type: "Notebook", status: "APPROVED", submittedBy: student.name, submittedAt: d(10 + i) },
    { name: "Model report v1", type: "Report", status: i % 2 === 0 ? "PENDING" : "APPROVED", submittedBy: student.name, submittedAt: d(14 + (i % 2)) },
  ];
  return {
    domainKey: "ML",
    team: teamName,
    repoName,
    fullName: `${student.login}/${repoName}`,
    description: `${student.name.split(" ")[0]}'s individual forecasting project (${teamName}).`,
    defaultBranch: "main",
    visibility: "public",
    topics: ["ml", "forecasting"],
    createdAt: "2026-05-20",
    updatedAt: d(14 + (i % 2)),
    ownerLogin: student.login,
    ownerRole: "Team Lead",
    hasIssues: false,
    collaborators: [collab(student, "owner", "admin"), collab(mentor, "maintainer", "write")],
    commits,
    prs,
    branches,
    releases,
    issues: [],
    milestones,
    deliverables,
    demoMentee: student.login,
  };
}

function mlTeam(opts: { id: string; name: string; mentor: TeamPerson; lead: TeamPerson; others: TeamPerson[] }): RepoTeam {
  const members = [opts.lead, ...opts.others];
  return {
    id: opts.id,
    name: opts.name,
    domainKey: "ML",
    repoModel: "per-student",
    mentor: opts.mentor,
    teamLead: opts.lead,
    members,
    repos: members.map((s, i) => mlStudentRepo(s, opts.mentor, opts.name, i)),
  };
}

const ML_TEAMS: RepoTeam[] = [
  mlTeam({
    id: "ml-insight",
    name: "Insight Squad",
    mentor: { login: "neha-g", name: "Neha Gupta", role: "Mentor", color: PALETTE[1]! },
    lead: { login: "rohit-sen", name: "Rohit Sen", role: "TeamLead", color: PALETTE[0]! },
    others: [
      { login: "lakshmi-m", name: "Lakshmi Menon", role: "Mentee", color: PALETTE[2]! },
      { login: "rajan-m", name: "Rajan Mehta", role: "Mentee", color: PALETTE[3]! },
      { login: "divya-r", name: "Divya Rao", role: "Mentee", color: PALETTE[4]! },
    ],
  }),
  mlTeam({
    id: "ml-vision",
    name: "Vision Pod",
    mentor: { login: "arvind-k", name: "Arvind Kumar", role: "Mentor", color: PALETTE[5]! },
    lead: { login: "meera-j", name: "Meera Joshi", role: "TeamLead", color: PALETTE[0]! },
    others: [
      { login: "sahil-p", name: "Sahil Patel", role: "Mentee", color: PALETTE[2]! },
      { login: "ananya-d", name: "Ananya Das", role: "Mentee", color: PALETTE[6]! },
    ],
  }),
];

// ── DVA + SDSE — shared team repos ────────────────────────────────────────────────────
function sharedTeam(opts: {
  id: string; domainKey: string; name: string; mentor: TeamPerson; lead: TeamPerson; others: TeamPerson[]; repo: RepoConnection;
}): RepoTeam {
  return {
    id: opts.id,
    name: opts.name,
    domainKey: opts.domainKey,
    repoModel: "shared",
    mentor: opts.mentor,
    teamLead: opts.lead,
    members: [opts.lead, ...opts.others],
    repos: [opts.repo],
  };
}

// DVA team 1 — Dashboard Crew (mentor-owned shared repo, no issues)
const DVA_PEOPLE = {
  mentor: { login: "ananya-bose", name: "Ananya Bose", role: "Mentor" as const, color: PALETTE[0]! },
  lead: { login: "kabir-s", name: "Kabir Singh", role: "TeamLead" as const, color: PALETTE[1]! },
  ishita: { login: "ishita-b", name: "Ishita Bose", role: "Mentee" as const, color: PALETTE[2]! },
  tara: { login: "tara-s", name: "Tara Singh", role: "Mentee" as const, color: PALETTE[3]! },
};
const DVA_REPO: RepoConnection = {
  domainKey: "DVA", team: "Dashboard Crew", repoName: "viz-stories", fullName: "ananya-bose/viz-stories",
  description: "Data-storytelling dashboards and visual analytics for the DVA drive.",
  defaultBranch: "main", visibility: "public", topics: ["d3", "dataviz", "analytics"],
  createdAt: "2026-05-22", updatedAt: "2026-06-15", ownerLogin: "ananya-bose", ownerRole: "Mentor", hasIssues: false,
  collaborators: [
    collab(DVA_PEOPLE.mentor, "owner", "admin"),
    collab(DVA_PEOPLE.lead, "maintainer", "write"),
    collab(DVA_PEOPLE.ishita, "collaborator", "write"),
    collab(DVA_PEOPLE.tara, "collaborator", "write"),
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
  releases: [{ tag: "v0.1.0", name: "Chart toolkit", publishedAt: "2026-06-11", author: "ananya-bose", notes: "Reusable D3 chart components + data adapter." }],
  issues: [],
  milestones: [
    { title: "M1 — Chart Toolkit", progress: 100, dueAt: "2026-06-11", state: "closed" },
    { title: "M2 — Data Story", progress: 45, dueAt: "2026-06-26", state: "open" },
  ],
  deliverables: [
    { name: "Chart toolkit", type: "Library", status: "APPROVED", submittedBy: "Kabir Singh", submittedAt: "2026-06-11" },
    { name: "Data story draft", type: "Dashboard", status: "PENDING", submittedBy: "Ishita Bose", submittedAt: "2026-06-15" },
  ],
  demoMentee: "ishita-b",
};

const DVA_REPO2: RepoConnection = {
  domainKey: "DVA", team: "Signal Studio", repoName: "signal-board", fullName: "meghna-r/signal-board",
  description: "Real-time signal monitoring dashboards for the DVA drive.",
  defaultBranch: "main", visibility: "public", topics: ["dataviz", "realtime"],
  createdAt: "2026-05-25", updatedAt: "2026-06-14", ownerLogin: "meghna-r", ownerRole: "Mentor", hasIssues: false,
  collaborators: [
    collab({ login: "meghna-r", name: "Meghna Rao", role: "Mentor", color: PALETTE[0]! }, "owner", "admin"),
    collab({ login: "dev-k", name: "Dev Kapoor", role: "TeamLead", color: PALETTE[1]! }, "maintainer", "write"),
    collab({ login: "nisha-v", name: "Nisha Verma", role: "Mentee", color: PALETTE[2]! }, "collaborator", "write"),
  ],
  commits: [
    { sha: "aa11", authorLogin: "dev-k", message: "feat: websocket data feed", additions: 140, deletions: 4, when: "2026-06-06" },
    { sha: "bb22", authorLogin: "nisha-v", message: "feat: live line chart", additions: 120, deletions: 8, when: "2026-06-12" },
    { sha: "cc33", authorLogin: "dev-k", message: "feat: alert thresholds", additions: 90, deletions: 10, when: "2026-06-14" },
  ],
  prs: [
    { number: 5, authorLogin: "dev-k", title: "Websocket data feed", state: "merged", additions: 140, deletions: 4, commits: 3, reviewers: ["meghna-r"], reviewState: "approved", createdAt: "2026-06-05", mergedAt: "2026-06-06" },
    { number: 9, authorLogin: "nisha-v", title: "Live line chart", state: "open", additions: 120, deletions: 8, commits: 2, reviewers: ["meghna-r"], reviewState: "pending", createdAt: "2026-06-12" },
  ],
  branches: [{ name: "main", protected: true, ahead: 0, behind: 0, lastCommit: "feat: alert thresholds", author: "dev-k", updatedAt: "2026-06-14" }],
  releases: [],
  issues: [],
  milestones: [{ title: "M1 — Live feed", progress: 70, dueAt: "2026-06-22", state: "open" }],
  deliverables: [{ name: "Live dashboard demo", type: "Dashboard", status: "PENDING", submittedBy: "Dev Kapoor", submittedAt: "2026-06-14" }],
  demoMentee: "nisha-v",
};

const DVA_TEAMS: RepoTeam[] = [
  sharedTeam({ id: "dva-crew", domainKey: "DVA", name: "Dashboard Crew", mentor: DVA_PEOPLE.mentor, lead: DVA_PEOPLE.lead, others: [DVA_PEOPLE.ishita, DVA_PEOPLE.tara], repo: DVA_REPO }),
  sharedTeam({
    id: "dva-signal", domainKey: "DVA", name: "Signal Studio",
    mentor: { login: "meghna-r", name: "Meghna Rao", role: "Mentor", color: PALETTE[0]! },
    lead: { login: "dev-k", name: "Dev Kapoor", role: "TeamLead", color: PALETTE[1]! },
    others: [{ login: "nisha-v", name: "Nisha Verma", role: "Mentee", color: PALETTE[2]! }],
    repo: DVA_REPO2,
  }),
];

// SDSE team 1 — Shipyard (mentor-owned shared repo)
const SDSE_PEOPLE = {
  mentor: { login: "ishaan-roy", name: "Ishaan Roy", role: "Mentor" as const, color: PALETTE[0]! },
  lead: { login: "aniket", name: "Aniket Sharma", role: "TeamLead" as const, color: PALETTE[1]! },
  priya: { login: "priyak", name: "Priya Kulkarni", role: "Mentee" as const, color: PALETTE[2]! },
  rohan: { login: "rohan-d", name: "Rohan Das", role: "Mentee" as const, color: PALETTE[3]! },
};
const SDSE_REPO: RepoConnection = {
  domainKey: "SDSE", team: "Shipyard Team", repoName: "shipyard", fullName: "ishaan-roy/shipyard",
  description: "Internal deployment console for the SDSE drive — services, builds, releases.",
  defaultBranch: "main", visibility: "public", topics: ["nextjs", "node", "devops"],
  createdAt: "2026-05-15", updatedAt: "2026-06-16", ownerLogin: "ishaan-roy", ownerRole: "Mentor", hasIssues: false,
  collaborators: [
    collab(SDSE_PEOPLE.mentor, "owner", "admin"),
    collab(SDSE_PEOPLE.lead, "maintainer", "write"),
    collab(SDSE_PEOPLE.priya, "collaborator", "write"),
    collab(SDSE_PEOPLE.rohan, "collaborator", "read"),
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
  deliverables: [
    { name: "Service registry", type: "Service", status: "APPROVED", submittedBy: "Aniket Sharma", submittedAt: "2026-06-07" },
    { name: "Rollback runbook", type: "Doc", status: "PENDING", submittedBy: "Aniket Sharma", submittedAt: "2026-06-15" },
  ],
  demoMentee: "priyak",
};

const SDSE_REPO2: RepoConnection = {
  domainKey: "SDSE", team: "Platform Pod", repoName: "gatewayx", fullName: "vikram-n/gatewayx",
  description: "API gateway + auth service for the SDSE drive.",
  defaultBranch: "main", visibility: "public", topics: ["go", "gateway", "auth"],
  createdAt: "2026-05-19", updatedAt: "2026-06-15", ownerLogin: "vikram-n", ownerRole: "Mentor", hasIssues: false,
  collaborators: [
    collab({ login: "vikram-n", name: "Vikram Nair", role: "Mentor", color: PALETTE[0]! }, "owner", "admin"),
    collab({ login: "zoya-h", name: "Zoya Hassan", role: "TeamLead", color: PALETTE[1]! }, "maintainer", "write"),
    collab({ login: "arnav-t", name: "Arnav Trivedi", role: "Mentee", color: PALETTE[2]! }, "collaborator", "write"),
  ],
  commits: [
    { sha: "dd11", authorLogin: "zoya-h", message: "feat: gateway routing", additions: 200, deletions: 5, when: "2026-06-07" },
    { sha: "ee22", authorLogin: "arnav-t", message: "feat: JWT auth middleware", additions: 150, deletions: 12, when: "2026-06-13" },
  ],
  prs: [
    { number: 4, authorLogin: "zoya-h", title: "Gateway routing", state: "merged", additions: 200, deletions: 5, commits: 4, reviewers: ["vikram-n"], reviewState: "approved", createdAt: "2026-06-06", mergedAt: "2026-06-07" },
    { number: 7, authorLogin: "arnav-t", title: "JWT auth middleware", state: "open", additions: 150, deletions: 12, commits: 2, reviewers: ["vikram-n"], reviewState: "pending", createdAt: "2026-06-13" },
  ],
  branches: [{ name: "main", protected: true, ahead: 0, behind: 0, lastCommit: "feat: JWT auth middleware", author: "arnav-t", updatedAt: "2026-06-15" }],
  releases: [{ tag: "v0.1.0", name: "Gateway routing", publishedAt: "2026-06-08", author: "vikram-n", notes: "Routing + health checks." }],
  issues: [],
  milestones: [{ title: "M1 — Gateway + Auth", progress: 60, dueAt: "2026-06-24", state: "open" }],
  deliverables: [{ name: "Gateway service", type: "Service", status: "APPROVED", submittedBy: "Zoya Hassan", submittedAt: "2026-06-08" }],
  demoMentee: "arnav-t",
};

const SDSE_TEAMS: RepoTeam[] = [
  sharedTeam({ id: "sdse-shipyard", domainKey: "SDSE", name: "Shipyard Team", mentor: SDSE_PEOPLE.mentor, lead: SDSE_PEOPLE.lead, others: [SDSE_PEOPLE.priya, SDSE_PEOPLE.rohan], repo: SDSE_REPO }),
  sharedTeam({
    id: "sdse-platform", domainKey: "SDSE", name: "Platform Pod",
    mentor: { login: "vikram-n", name: "Vikram Nair", role: "Mentor", color: PALETTE[0]! },
    lead: { login: "zoya-h", name: "Zoya Hassan", role: "TeamLead", color: PALETTE[1]! },
    others: [{ login: "arnav-t", name: "Arnav Trivedi", role: "Mentee", color: PALETTE[2]! }],
    repo: SDSE_REPO2,
  }),
];

const TEAMS_BY_DOMAIN: Record<string, RepoTeam[]> = { ML: ML_TEAMS, DVA: DVA_TEAMS, SDSE: SDSE_TEAMS };
const ALL_TEAMS: RepoTeam[] = [...ML_TEAMS, ...DVA_TEAMS, ...SDSE_TEAMS];

// ─────────────────────── Team-first selectors ───────────────────────

/** Teams for a non-AI domain (empty for AI / unknown). */
export function teamsForDomain(domainKey: string): RepoTeam[] {
  return TEAMS_BY_DOMAIN[domainKey] ?? [];
}

export function teamById(id: string): RepoTeam | undefined {
  return ALL_TEAMS.find((t) => t.id === id);
}

export function allRepoTeams(): RepoTeam[] {
  return ALL_TEAMS;
}

/** Every repo for a team (1 for shared, N for per-student). */
export function teamReposOf(team: RepoTeam): RepoConnection[] {
  return team.repos;
}

/** A student's own repo within a per-student team. */
export function repoOfStudent(team: RepoTeam, login: string): RepoConnection | undefined {
  return team.repos.find((r) => r.ownerLogin === login);
}

/** Find a repo (by name) within a team — used by the repository detail route. */
export function teamRepoByName(team: RepoTeam, repoName: string): RepoConnection | undefined {
  return team.repos.find((r) => r.repoName === repoName);
}

/** A team's primary repo (shared repo, or the team-lead's repo for per-student). */
export function primaryRepoOf(team: RepoTeam): RepoConnection {
  return team.repos.find((r) => r.ownerLogin === team.teamLead.login) ?? team.repos[0]!;
}

export interface TeamRollup {
  team: RepoTeam;
  repos: number;
  commits: number;
  prs: number;
  mergedPrs: number;
  openPrs: number;
  members: number;
  milestoneProgress: number; // avg across repos' open milestones
  lastActive: string;
}

function avg(ns: number[]): number {
  return ns.length ? Math.round(ns.reduce((a, b) => a + b, 0) / ns.length) : 0;
}

/** Headline rollup for one team (aggregated across its repo(s)). */
export function teamRollup(team: RepoTeam): TeamRollup {
  const repos = team.repos;
  const commits = repos.reduce((s, r) => s + r.commits.length, 0);
  const prs = repos.flatMap((r) => r.prs);
  const dates = repos.flatMap((r) => r.commits.map((c) => c.when)).sort();
  const progresses = repos.flatMap((r) => r.milestones).map((m) => m.progress);
  return {
    team,
    repos: repos.length,
    commits,
    prs: prs.length,
    mergedPrs: prs.filter((p) => p.state === "merged").length,
    openPrs: prs.filter((p) => p.state === "open").length,
    members: team.members.length,
    milestoneProgress: avg(progresses),
    lastActive: dates.length ? dates[dates.length - 1]! : "—",
  };
}

/** Teacher rollup — every team in a domain with headline stats. */
export function domainTeamRollup(domainKey: string): TeamRollup[] {
  return teamsForDomain(domainKey).map(teamRollup);
}

/**
 * DB-available team summary (repos / members / branches / releases / collaborators) — the
 * metrics shown at the grid + overview level. Works identically for mock (full data) and
 * production (count-only summaries), where commits/PRs load lazily at the repo detail.
 */
export function teamSummary(team: RepoTeam) {
  const repos = team.repos;
  return {
    repos: repos.length,
    members: team.members.length,
    branches: repos.reduce((s, r) => s + r.branches.length, 0),
    releases: repos.reduce((s, r) => s + r.releases.length, 0),
    collaborators: repos.reduce((s, r) => s + r.collaborators.length, 0),
  };
}

/** Per-student repo summary within a per-student team (DB-available: branches/releases). */
export function teamStudentRepoSummaries(team: RepoTeam) {
  return team.members.map((person) => {
    const repo = repoOfStudent(team, person.login);
    return {
      person,
      repoName: repo?.repoName ?? "—",
      branches: repo?.branches.length ?? 0,
      releases: repo?.releases.length ?? 0,
      visibility: repo?.visibility ?? "public",
    };
  });
}

/** Merged, newest-first activity across a team's repo(s). */
export function teamActivity(team: RepoTeam, limit = 12): RepoActivityItem[] {
  return team.repos
    .flatMap((r) => repoActivity(r, limit))
    .sort((a, b) => (a.when < b.when ? 1 : -1))
    .slice(0, limit);
}

/** Per-student contribution summary within a team (their own repo for ML, their slice for shared). */
export interface StudentContribution {
  person: TeamPerson;
  repoName: string;
  commits: number;
  prs: number;
  mergedPrs: number;
  openPrs: number;
  additions: number;
  deletions: number;
  milestoneProgress: number;
  lastActive: string;
}

export function teamStudentContributions(team: RepoTeam): StudentContribution[] {
  const students = team.members; // mentees + team lead
  if (team.repoModel === "per-student") {
    return students.map((p) => {
      const repo = repoOfStudent(team, p.login);
      const s = repo ? repoStats(repo) : undefined;
      const dates = repo ? repo.commits.map((c) => c.when).sort() : [];
      return {
        person: p,
        repoName: repo?.repoName ?? "—",
        commits: s?.commits ?? 0,
        prs: s?.prs ?? 0,
        mergedPrs: s?.mergedPrs ?? 0,
        openPrs: s?.openPrs ?? 0,
        additions: s?.additions ?? 0,
        deletions: s?.deletions ?? 0,
        milestoneProgress: repo ? avg(repo.milestones.map((m) => m.progress)) : 0,
        lastActive: dates.length ? dates[dates.length - 1]! : "—",
      };
    });
  }
  // shared repo: each student's slice of the one repo
  const repo = primaryRepoOf(team);
  return students.map((p) => {
    const cs = contributorStat(repo, p.login);
    return {
      person: p,
      repoName: repo.repoName,
      commits: cs?.commits ?? 0,
      prs: cs?.prs ?? 0,
      mergedPrs: cs?.mergedPrs ?? 0,
      openPrs: cs?.openPrs ?? 0,
      additions: cs?.additions ?? 0,
      deletions: cs?.deletions ?? 0,
      milestoneProgress: avg(repo.milestones.map((m) => m.progress)),
      lastActive: cs?.lastActive ?? "—",
    };
  });
}

// ─────────────────────── Repo-level selectors (reused by blocks/views) ───────────────────────

export const REPO_CONNECTIONS: Record<string, RepoConnection> = { ML: primaryRepoOf(ML_TEAMS[0]!), DVA: DVA_REPO, SDSE: SDSE_REPO };

/** Legacy shim: a representative repo for a domain (the first team's primary repo). */
export function repoConnectionFor(domainKey: string): RepoConnection | undefined {
  const teams = teamsForDomain(domainKey);
  return teams.length ? primaryRepoOf(teams[0]!) : undefined;
}

export function allRepoConnections(): RepoConnection[] {
  return ALL_TEAMS.flatMap((t) => t.repos);
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

/** Teacher rollup — every non-AI domain repo with its headline stats (legacy, kept for compat). */
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
    deliverables: [],
    demoMentee: opts.selfLogin ?? dto.collaborators.find((c) => c.repoRole === "collaborator")?.login ?? "",
  };
}

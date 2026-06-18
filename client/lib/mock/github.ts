/**
 * Mock GitHub data — the AI Domain's source of truth (presentation mode).
 *
 * The AI Domain is a teacher-owned GitHub Organization: teams own repos, issues are
 * the unit of work, multiple students attempt one issue (each raising a PR), and the
 * mentor reviews PRs + evaluates *learning* before merging — which drives milestones.
 *
 * Base arrays are minimal and self-consistent; all counts/analytics are DERIVED by the
 * selectors at the bottom so nothing contradicts. Kept separate from `data.ts` (the
 * drive model used by ML/SDSE), surfaced to the UI through `@/lib/api`.
 */

// ── People (org members) ────────────────────────────────────────────────────────
export interface MockGhPerson {
  id: string;
  name: string;
  login: string; // GitHub handle
  role: "TEACHER" | "MENTOR" | "MENTEE";
  teamId?: string;
  color: string; // avatar tint
}

export const GH_PEOPLE: MockGhPerson[] = [
  { id: "u-teacher", name: "Bipul Kumar", login: "bipulk", role: "TEACHER", color: "#4f46e5" },
  // Team Alpha
  { id: "u-aryan", name: "Aryan Sharma", login: "aryan-s", role: "MENTOR", teamId: "t-alpha", color: "#0ea5e9" },
  { id: "u-sneha", name: "Sneha Iyer", login: "sneha-iyer", role: "MENTEE", teamId: "t-alpha", color: "#059669" },
  { id: "u-rohan", name: "Rohan Das", login: "rohan-d", role: "MENTEE", teamId: "t-alpha", color: "#d97706" },
  { id: "u-aniket", name: "Aniket Sharma", login: "aniket", role: "MENTEE", teamId: "t-alpha", color: "#db2777" },
  { id: "u-priya", name: "Priya Kulkarni", login: "priyak", role: "MENTEE", teamId: "t-alpha", color: "#7c3aed" },
  // Team Beta
  { id: "u-neha", name: "Neha Gupta", login: "neha-g", role: "MENTOR", teamId: "t-beta", color: "#0ea5e9" },
  { id: "u-rajan", name: "Rajan Mehta", login: "rajan-m", role: "MENTEE", teamId: "t-beta", color: "#059669" },
  { id: "u-divya", name: "Divya Rao", login: "divya-r", role: "MENTEE", teamId: "t-beta", color: "#d97706" },
  { id: "u-arjun", name: "Arjun Nair", login: "arjun-n", role: "MENTEE", teamId: "t-beta", color: "#db2777" },
  // Team Gamma
  { id: "u-kabir", name: "Kabir Singh", login: "kabir-s", role: "MENTOR", teamId: "t-gamma", color: "#0ea5e9" },
  { id: "u-kavya", name: "Kavya Reddy", login: "kavya-r", role: "MENTEE", teamId: "t-gamma", color: "#059669" },
  { id: "u-ishan", name: "Ishan Verma", login: "ishan-v", role: "MENTEE", teamId: "t-gamma", color: "#d97706" },
  { id: "u-meera", name: "Meera Joshi", login: "meera-j", role: "MENTEE", teamId: "t-gamma", color: "#db2777" },
];

// ── Organization ────────────────────────────────────────────────────────────────
export interface MockOrg {
  id: string;
  login: string;
  name: string;
  domainKey: string;
  teacherId: string;
}
export const GH_ORG: MockOrg = {
  id: "org-ai",
  login: "rishihood-ai",
  name: "Rishihood AI Domain",
  domainKey: "AI",
  teacherId: "u-teacher",
};

/**
 * Who the dev preview "is" in the AI org. The role switcher's MENTOR/MENTEE map to
 * these GitHub identities so the Mentor/Mentee screens have a concrete subject.
 * (Both are on Team Alpha, so the demo tells one coherent story.)
 */
export const DEMO = { teamId: "t-alpha", mentorId: "u-aryan", menteeId: "u-sneha" };

// ── Teams (GitHub team = mentor + students + repo) ───────────────────────────────
export interface MockGhTeam {
  id: string;
  slug: string;
  name: string;
  mentorId: string;
  studentIds: string[];
  repoId: string;
}
export const GH_TEAMS: MockGhTeam[] = [
  { id: "t-alpha", slug: "team-alpha", name: "Team Alpha", mentorId: "u-aryan", studentIds: ["u-sneha", "u-rohan", "u-aniket", "u-priya"], repoId: "r-resume" },
  { id: "t-beta", slug: "team-beta", name: "Team Beta", mentorId: "u-neha", studentIds: ["u-rajan", "u-divya", "u-arjun"], repoId: "r-forecast" },
  { id: "t-gamma", slug: "team-gamma", name: "Team Gamma", mentorId: "u-kabir", studentIds: ["u-kavya", "u-ishan", "u-meera"], repoId: "r-engage" },
];

// ── Repositories ─────────────────────────────────────────────────────────────────
export interface MockRepo {
  id: string;
  name: string;
  fullName: string;
  teamIds: string[];
  description: string;
  defaultBranch: string;
  topics: string[];
  docs: { readme: boolean; devGuide: boolean; contributing: boolean; podGuide: boolean; setup: boolean };
}
export const GH_REPOS: MockRepo[] = [
  { id: "r-resume", name: "resume-intel", fullName: "rishihood-ai/resume-intel", teamIds: ["t-alpha"], description: "AI résumé analyzer — parses, scores and suggests improvements.", defaultBranch: "main", topics: ["nlp", "fastapi", "react"], docs: { readme: true, devGuide: true, contributing: true, podGuide: true, setup: true } },
  { id: "r-forecast", name: "forecast-lab", fullName: "rishihood-ai/forecast-lab", teamIds: ["t-beta"], description: "Time-series sales forecasting with explainable models.", defaultBranch: "main", topics: ["ml", "pandas", "timeseries"], docs: { readme: true, devGuide: true, contributing: true, podGuide: false, setup: true } },
  { id: "r-engage", name: "engage-iq", fullName: "rishihood-ai/engage-iq", teamIds: ["t-gamma"], description: "Real-time engagement scoring from session signals.", defaultBranch: "main", topics: ["cv", "realtime", "react"], docs: { readme: true, devGuide: false, contributing: true, podGuide: true, setup: true } },
];

// ── Projects (assigned to 1..N teams — never assume one) ─────────────────────────
export interface MockProject {
  id: string;
  name: string;
  overview: string;
  objective: string;
  teamIds: string[];
  repoIds: string[];
  status: "ACTIVE" | "PLANNING" | "DONE";
}
export const GH_PROJECTS: MockProject[] = [
  { id: "p-resume", name: "Resume Intelligence", overview: "An assistant that reads a résumé and gives structured, actionable feedback.", objective: "Ship a working parser + scorer with a clean React UI by Milestone 2.", teamIds: ["t-alpha"], repoIds: ["r-resume"], status: "ACTIVE" },
  { id: "p-forecast", name: "Sales Forecaster", overview: "Forecast weekly sales with models a non-expert can interpret.", objective: "Beat the naive baseline on PR-AUC and explain every prediction.", teamIds: ["t-beta"], repoIds: ["r-forecast"], status: "ACTIVE" },
  // Multi-team project — all three teams collaborate for the internal hackathon.
  { id: "p-copilot", name: "Campus Copilot (Hackathon)", overview: "A shared hackathon build — each team owns a slice and they integrate.", objective: "Three teams, one product: ingestion (Beta), scoring (Gamma), UX (Alpha).", teamIds: ["t-alpha", "t-beta", "t-gamma"], repoIds: ["r-resume", "r-forecast", "r-engage"], status: "ACTIVE" },
];

// ── Milestones ────────────────────────────────────────────────────────────────────
export interface MockGhMilestone {
  id: string;
  repoId: string;
  title: string;
  progress: number; // 0–100
  dueAt: string;
  state: "open" | "closed";
}
export const GH_MILESTONES: MockGhMilestone[] = [
  { id: "m-a1", repoId: "r-resume", title: "M1 — Core Parser", progress: 100, dueAt: "2026-06-11", state: "closed" },
  { id: "m-a2", repoId: "r-resume", title: "M2 — Scoring + UI", progress: 65, dueAt: "2026-06-22", state: "open" },
  { id: "m-b1", repoId: "r-forecast", title: "M1 — Data Pipeline", progress: 100, dueAt: "2026-06-11", state: "closed" },
  { id: "m-b2", repoId: "r-forecast", title: "M2 — Baseline Model", progress: 48, dueAt: "2026-06-22", state: "open" },
  { id: "m-c1", repoId: "r-engage", title: "M1 — Signal Capture", progress: 80, dueAt: "2026-06-22", state: "open" },
];

// ── Issues (the unit of work) ──────────────────────────────────────────────────────
export interface MockIssue {
  id: string;
  number: number;
  repoId: string;
  title: string;
  body: string;
  state: "open" | "closed";
  labels: string[];
  milestoneId?: string;
  createdAt: string;
}
export const GH_ISSUES: MockIssue[] = [
  { id: "i-1", number: 42, repoId: "r-resume", title: "Implement résumé section parser", body: "Parse a PDF résumé into structured sections (experience, education, skills). Open to the whole team — raise a PR against your branch.", state: "open", labels: ["good first issue", "parser"], milestoneId: "m-a2", createdAt: "2026-06-12" },
  { id: "i-2", number: 43, repoId: "r-resume", title: "Score résumé against a job description", body: "Given parsed sections + a JD, return a 0–100 match with reasons.", state: "open", labels: ["scoring"], milestoneId: "m-a2", createdAt: "2026-06-13" },
  { id: "i-3", number: 18, repoId: "r-resume", title: "Set up CI (lint + test)", body: "GitHub Actions: lint and run tests on PR.", state: "closed", labels: ["infra"], milestoneId: "m-a1", createdAt: "2026-06-08" },
  { id: "i-4", number: 27, repoId: "r-forecast", title: "Build the data-cleaning pipeline", body: "Load, clean and resample the sales dataset.", state: "closed", labels: ["data"], milestoneId: "m-b1", createdAt: "2026-06-09" },
  { id: "i-5", number: 31, repoId: "r-forecast", title: "Train an explainable baseline", body: "Fit a baseline forecaster and surface feature attributions.", state: "open", labels: ["model"], milestoneId: "m-b2", createdAt: "2026-06-14" },
  { id: "i-6", number: 12, repoId: "r-engage", title: "Capture engagement signals", body: "Stream face-mesh + interaction events into a scorer.", state: "open", labels: ["cv", "realtime"], milestoneId: "m-c1", createdAt: "2026-06-13" },
];

// ── Issue attempts (who picked up an issue) ───────────────────────────────────────
export interface MockIssueAttempt {
  issueId: string;
  studentId: string;
  status: "attempting" | "pr_raised" | "merged" | "rejected";
}
export const GH_ATTEMPTS: MockIssueAttempt[] = [
  // Flagship fan-out: 4 students attempt issue #42, 1 merged, 2 rejected, 1 still attempting.
  { issueId: "i-1", studentId: "u-sneha", status: "merged" },
  { issueId: "i-1", studentId: "u-rohan", status: "rejected" },
  { issueId: "i-1", studentId: "u-aniket", status: "rejected" },
  { issueId: "i-1", studentId: "u-priya", status: "attempting" },
  { issueId: "i-2", studentId: "u-sneha", status: "pr_raised" },
  { issueId: "i-2", studentId: "u-priya", status: "pr_raised" },
  { issueId: "i-3", studentId: "u-aniket", status: "merged" },
  { issueId: "i-4", studentId: "u-rajan", status: "merged" },
  { issueId: "i-5", studentId: "u-divya", status: "pr_raised" },
  { issueId: "i-5", studentId: "u-arjun", status: "rejected" },
  { issueId: "i-6", studentId: "u-kavya", status: "pr_raised" },
  { issueId: "i-6", studentId: "u-ishan", status: "attempting" },
];

// ── Pull requests (one issue → many PRs) ──────────────────────────────────────────
export interface MockPR {
  id: string;
  number: number;
  repoId: string;
  issueId: string;
  authorId: string;
  title: string;
  state: "open" | "merged" | "rejected";
  additions: number;
  deletions: number;
  commits: number;
  createdAt: string;
  mergedAt?: string;
  rejectionReason?: string;
}
export const GH_PRS: MockPR[] = [
  { id: "pr-1", number: 101, repoId: "r-resume", issueId: "i-1", authorId: "u-sneha", title: "Parser: PDF → sections via layout heuristics", state: "merged", additions: 240, deletions: 12, commits: 6, createdAt: "2026-06-13", mergedAt: "2026-06-14" },
  { id: "pr-2", number: 102, repoId: "r-resume", issueId: "i-1", authorId: "u-rohan", title: "Parser: regex-based section split", state: "rejected", additions: 90, deletions: 4, commits: 2, createdAt: "2026-06-13", rejectionReason: "Regex approach breaks on multi-column résumés; couldn't explain the failure modes." },
  { id: "pr-3", number: 103, repoId: "r-resume", issueId: "i-1", authorId: "u-aniket", title: "Parser: naive line-by-line", state: "rejected", additions: 60, deletions: 2, commits: 1, createdAt: "2026-06-13", rejectionReason: "No tests; could not explain why headings were detected. Resubmit with reasoning." },
  { id: "pr-4", number: 104, repoId: "r-resume", issueId: "i-2", authorId: "u-sneha", title: "Scoring v1: cosine match + reasons", state: "open", additions: 180, deletions: 8, commits: 4, createdAt: "2026-06-15" },
  { id: "pr-5", number: 105, repoId: "r-resume", issueId: "i-2", authorId: "u-priya", title: "Scoring: keyword overlap", state: "open", additions: 70, deletions: 1, commits: 2, createdAt: "2026-06-15" },
  { id: "pr-6", number: 60, repoId: "r-resume", issueId: "i-3", authorId: "u-aniket", title: "CI: lint + pytest on PR", state: "merged", additions: 45, deletions: 0, commits: 2, createdAt: "2026-06-09", mergedAt: "2026-06-10" },
  { id: "pr-7", number: 88, repoId: "r-forecast", issueId: "i-4", authorId: "u-rajan", title: "Pipeline: clean + resample", state: "merged", additions: 210, deletions: 20, commits: 5, createdAt: "2026-06-10", mergedAt: "2026-06-11" },
  { id: "pr-8", number: 91, repoId: "r-forecast", issueId: "i-5", authorId: "u-divya", title: "Baseline: gradient boosting + SHAP", state: "open", additions: 160, deletions: 6, commits: 3, createdAt: "2026-06-15" },
  { id: "pr-9", number: 92, repoId: "r-forecast", issueId: "i-5", authorId: "u-arjun", title: "Baseline: linear model", state: "rejected", additions: 50, deletions: 0, commits: 1, createdAt: "2026-06-14", rejectionReason: "Below baseline PR-AUC; no explanation of residuals." },
  { id: "pr-10", number: 33, repoId: "r-engage", issueId: "i-6", authorId: "u-kavya", title: "Signal capture: face-mesh stream", state: "open", additions: 140, deletions: 4, commits: 3, createdAt: "2026-06-15" },
];

// ── Reviews (mentor PR review + learning evaluation, kept historically) ────────────
export interface MockReview {
  id: string;
  prId: string;
  reviewerId: string; // mentor
  decision: "approved" | "changes_requested" | "rejected";
  understanding: number; // 1–5
  explanation: number; // 1–5
  technicalDepth: number; // 1–5
  notes: string;
  createdAt: string;
}
export const GH_REVIEWS: MockReview[] = [
  { id: "rv-1", prId: "pr-1", reviewerId: "u-aryan", decision: "approved", understanding: 5, explanation: 5, technicalDepth: 4, notes: "Can explain the layout-heuristic clearly and why it beats regex. Strong tests.", createdAt: "2026-06-14" },
  { id: "rv-2", prId: "pr-2", reviewerId: "u-aryan", decision: "rejected", understanding: 3, explanation: 2, technicalDepth: 2, notes: "Could not explain multi-column failure. Understands strings, not document structure yet.", createdAt: "2026-06-14" },
  { id: "rv-3", prId: "pr-3", reviewerId: "u-aryan", decision: "changes_requested", understanding: 2, explanation: 2, technicalDepth: 1, notes: "No tests, no reasoning for heading detection. Pair on testing then resubmit.", createdAt: "2026-06-14" },
  { id: "rv-4", prId: "pr-6", reviewerId: "u-aryan", decision: "approved", understanding: 4, explanation: 4, technicalDepth: 3, notes: "Solid CI. Could articulate the lint/test split well.", createdAt: "2026-06-10" },
  { id: "rv-5", prId: "pr-7", reviewerId: "u-neha", decision: "approved", understanding: 5, explanation: 4, technicalDepth: 4, notes: "Clean pipeline; explained resampling choice and edge cases.", createdAt: "2026-06-11" },
  { id: "rv-6", prId: "pr-9", reviewerId: "u-neha", decision: "rejected", understanding: 3, explanation: 3, technicalDepth: 2, notes: "Linear model under baseline; couldn't explain residual structure. Try boosting + SHAP.", createdAt: "2026-06-14" },
];

// ── Commits ────────────────────────────────────────────────────────────────────────
export interface MockCommit {
  id: string;
  repoId: string;
  authorId: string;
  message: string;
  sha: string;
  when: string;
}
export const GH_COMMITS: MockCommit[] = [
  { id: "c1", repoId: "r-resume", authorId: "u-sneha", message: "feat: layout-based section detection", sha: "a1b2c3d", when: "2026-06-14" },
  { id: "c2", repoId: "r-resume", authorId: "u-sneha", message: "test: parser fixtures for 2-column", sha: "b2c3d4e", when: "2026-06-14" },
  { id: "c3", repoId: "r-resume", authorId: "u-aniket", message: "ci: add pytest workflow", sha: "c3d4e5f", when: "2026-06-09" },
  { id: "c4", repoId: "r-resume", authorId: "u-priya", message: "wip: keyword scoring", sha: "d4e5f6a", when: "2026-06-15" },
  { id: "c5", repoId: "r-forecast", authorId: "u-rajan", message: "feat: clean + resample sales", sha: "e5f6a7b", when: "2026-06-11" },
  { id: "c6", repoId: "r-forecast", authorId: "u-divya", message: "feat: gbm baseline + shap", sha: "f6a7b8c", when: "2026-06-15" },
  { id: "c7", repoId: "r-engage", authorId: "u-kavya", message: "feat: face-mesh capture", sha: "a7b8c9d", when: "2026-06-15" },
  { id: "c8", repoId: "r-engage", authorId: "u-ishan", message: "docs: setup notes", sha: "b8c9d0e", when: "2026-06-13" },
];

// ── Lookups ────────────────────────────────────────────────────────────────────────
export const ghPerson = (id: string) => GH_PEOPLE.find((p) => p.id === id);
export const ghTeam = (id: string) => GH_TEAMS.find((t) => t.id === id);
export const ghRepo = (id: string) => GH_REPOS.find((r) => r.id === id);
export const ghIssue = (id: string) => GH_ISSUES.find((i) => i.id === id);
export const ghPR = (id: string) => GH_PRS.find((p) => p.id === id);
export const personName = (id: string) => ghPerson(id)?.name ?? id;

export const teamOfRepo = (repoId: string) => GH_TEAMS.find((t) => t.repoId === repoId);
export const reviewForPR = (prId: string) => GH_REVIEWS.find((rv) => rv.prId === prId);
export const prsForIssue = (issueId: string) => GH_PRS.filter((p) => p.issueId === issueId);
export const attemptsForIssue = (issueId: string) => GH_ATTEMPTS.filter((a) => a.issueId === issueId);
export const issuesForRepo = (repoId: string) => GH_ISSUES.filter((i) => i.repoId === repoId);
export const prsForRepo = (repoId: string) => GH_PRS.filter((p) => p.repoId === repoId);
export const milestonesForRepo = (repoId: string) => GH_MILESTONES.filter((m) => m.repoId === repoId);
export const teamsForProject = (p: MockProject) => p.teamIds.map(ghTeam).filter(Boolean) as MockGhTeam[];

const pct = (part: number, whole: number) => (whole <= 0 ? 0 : Math.round((part / whole) * 100));

// ── Analytics rollups (DERIVED — never hardcoded) ──────────────────────────────────
export interface OrgAnalytics {
  repos: number; teams: number; contributors: number; commits: number; prs: number;
  openIssues: number; closedIssues: number; mergedPrs: number; openPrs: number;
}
export function orgAnalytics(): OrgAnalytics {
  return {
    repos: GH_REPOS.length,
    teams: GH_TEAMS.length,
    contributors: GH_PEOPLE.filter((p) => p.role === "MENTEE").length,
    commits: GH_COMMITS.length,
    prs: GH_PRS.length,
    openIssues: GH_ISSUES.filter((i) => i.state === "open").length,
    closedIssues: GH_ISSUES.filter((i) => i.state === "closed").length,
    mergedPrs: GH_PRS.filter((p) => p.state === "merged").length,
    openPrs: GH_PRS.filter((p) => p.state === "open").length,
  };
}

export interface TeamAnalytics {
  teamId: string; teamName: string; repoId: string; repoName: string;
  mentorId: string; mentorName: string; members: number;
  openIssues: number; closedIssues: number; commits: number;
  prs: number; mergedPrs: number; prMergeRate: number; milestoneProgress: number;
}
export function teamAnalytics(teamId: string): TeamAnalytics {
  const t = ghTeam(teamId)!;
  const repo = ghRepo(t.repoId)!;
  const issues = issuesForRepo(t.repoId);
  const prs = prsForRepo(t.repoId);
  const merged = prs.filter((p) => p.state === "merged").length;
  const decided = prs.filter((p) => p.state !== "open").length;
  const ms = milestonesForRepo(t.repoId);
  return {
    teamId, teamName: t.name, repoId: repo.id, repoName: repo.name,
    mentorId: t.mentorId, mentorName: personName(t.mentorId), members: t.studentIds.length,
    openIssues: issues.filter((i) => i.state === "open").length,
    closedIssues: issues.filter((i) => i.state === "closed").length,
    commits: GH_COMMITS.filter((c) => c.repoId === t.repoId).length,
    prs: prs.length, mergedPrs: merged, prMergeRate: pct(merged, decided),
    milestoneProgress: ms.length ? Math.round(ms.reduce((s, m) => s + m.progress, 0) / ms.length) : 0,
  };
}
export const allTeamAnalytics = () => GH_TEAMS.map((t) => teamAnalytics(t.id));

export interface StudentAnalytics {
  userId: string; name: string; login: string; teamId: string;
  repoId: string; repoName: string;
  issuesAttempted: number; issuesSolved: number; prsRaised: number; prsMerged: number;
  acceptanceRate: number; commits: number; reviewsReceived: number;
  avgUnderstanding: number; avgExplanation: number; avgTechnical: number;
}
export function studentAnalytics(userId: string): StudentAnalytics {
  const p = ghPerson(userId)!;
  // A student's repo is their team's repo.
  const team = p.teamId ? ghTeam(p.teamId) : undefined;
  const repo = team ? ghRepo(team.repoId) : undefined;
  const attempts = GH_ATTEMPTS.filter((a) => a.studentId === userId);
  const prs = GH_PRS.filter((pr) => pr.authorId === userId);
  const merged = prs.filter((pr) => pr.state === "merged").length;
  const decided = prs.filter((pr) => pr.state !== "open").length;
  const reviews = GH_REVIEWS.filter((rv) => prs.some((pr) => pr.id === rv.prId));
  const avg = (sel: (r: MockReview) => number) => (reviews.length ? +(reviews.reduce((s, r) => s + sel(r), 0) / reviews.length).toFixed(1) : 0);
  return {
    userId, name: p.name, login: p.login, teamId: p.teamId ?? "",
    repoId: repo?.id ?? "", repoName: repo?.name ?? "",
    issuesAttempted: attempts.length,
    issuesSolved: attempts.filter((a) => a.status === "merged").length,
    prsRaised: prs.length, prsMerged: merged, acceptanceRate: pct(merged, decided),
    commits: GH_COMMITS.filter((c) => c.authorId === userId).length,
    reviewsReceived: reviews.length,
    avgUnderstanding: avg((r) => r.understanding),
    avgExplanation: avg((r) => r.explanation),
    avgTechnical: avg((r) => r.technicalDepth),
  };
}
export const studentsOfTeam = (teamId: string) => (ghTeam(teamId)?.studentIds ?? []).map(studentAnalytics);

export interface MentorAnalytics {
  userId: string; name: string; teamId: string; teamName: string;
  reviewsCompleted: number; prsReviewed: number; teamCommits: number;
  teamMergeRate: number; teamHealth: "Healthy" | "Watch" | "At risk";
}
export function mentorAnalytics(userId: string): MentorAnalytics {
  const team = GH_TEAMS.find((t) => t.mentorId === userId)!;
  const ta = teamAnalytics(team.id);
  const reviews = GH_REVIEWS.filter((rv) => rv.reviewerId === userId);
  const health = ta.milestoneProgress >= 70 ? "Healthy" : ta.milestoneProgress >= 50 ? "Watch" : "At risk";
  return {
    userId, name: personName(userId), teamId: team.id, teamName: team.name,
    reviewsCompleted: reviews.length, prsReviewed: new Set(reviews.map((r) => r.prId)).size,
    teamCommits: ta.commits, teamMergeRate: ta.prMergeRate, teamHealth: health,
  };
}
export const allMentorAnalytics = () => GH_TEAMS.map((t) => mentorAnalytics(t.mentorId));

/** Recent org activity feed (commits + PR events), newest first. */
export interface GhActivityItem { id: string; kind: "commit" | "pr_opened" | "pr_merged" | "pr_rejected" | "review"; who: string; what: string; repo: string; when: string; }
export function orgActivity(limit = 12): GhActivityItem[] {
  const items: GhActivityItem[] = [];
  for (const c of GH_COMMITS) items.push({ id: c.id, kind: "commit", who: personName(c.authorId), what: c.message, repo: ghRepo(c.repoId)!.name, when: c.when });
  for (const p of GH_PRS) {
    const repo = ghRepo(p.repoId)!.name;
    if (p.state === "merged") items.push({ id: p.id + "-m", kind: "pr_merged", who: personName(p.authorId), what: `#${p.number} ${p.title}`, repo, when: p.mergedAt ?? p.createdAt });
    else if (p.state === "rejected") items.push({ id: p.id + "-r", kind: "pr_rejected", who: personName(p.authorId), what: `#${p.number} ${p.title}`, repo, when: p.createdAt });
    else items.push({ id: p.id + "-o", kind: "pr_opened", who: personName(p.authorId), what: `#${p.number} ${p.title}`, repo, when: p.createdAt });
  }
  return items.sort((a, b) => (a.when < b.when ? 1 : -1)).slice(0, limit);
}

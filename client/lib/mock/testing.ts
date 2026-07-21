/**
 * Tester Experience & Domain Validation — PRESENTATION-MODE mock data.
 *
 * No backend / DB / Prisma / sync / email. Everything here is fixture data so authorized
 * testers can validate every workflow, screen, integration, role and domain before any
 * production implementation. Progress (Resume) is persisted client-side in localStorage
 * (see components/testing) — in production this would be server-persisted per tester.
 */

export type DomainKey = "AI" | "ML" | "DVA" | "SDSE";
export type TestRole = "Admin" | "LCC" | "Teacher" | "Mentor" | "Team Lead" | "Mentee";
export type Severity = "Low" | "Medium" | "High" | "Critical";
export type DomainStatus = "not_started" | "in_progress" | "completed";

/** The only accounts allowed into the Testing Portal (gated by email). */
export interface Tester {
  email: string;
  name: string;
  role: TestRole; // the role this tester primarily validates as
  isAdmin: boolean; // the Testing Admin controls the whole testing environment
}

export const TESTING_ADMIN_EMAIL = "admin@example.test";
/** Issue reports are emailed here in production (mocked in presentation). */
export const ISSUE_REPORT_EMAIL = TESTING_ADMIN_EMAIL;

export const TESTERS: Tester[] = [
  { email: "admin@example.test", name: "the Admin", role: "Admin", isAdmin: true },
  { email: "lcc@example.test", name: "the LCC", role: "LCC", isAdmin: false },
  { email: "teacher@example.test", name: "the Teacher", role: "Teacher", isAdmin: false },
  { email: "mentor1@example.test", name: "the Primary Mentor", role: "Mentor", isAdmin: false },
  { email: "mentor2@example.test", name: "the Co-Mentor", role: "Team Lead", isAdmin: false },
  { email: "mentee1@example.test", name: "Mentee 1", role: "Mentee", isAdmin: false },
  { email: "mentee2@example.test", name: "Mentee 2", role: "Mentee", isAdmin: false },
];

export function isTester(email: string | undefined): boolean {
  return !!email && TESTERS.some((t) => t.email.toLowerCase() === email.toLowerCase());
}
export function testerByEmail(email: string | undefined): Tester | undefined {
  return TESTERS.find((t) => t.email.toLowerCase() === (email ?? "").toLowerCase());
}

// ── Domain environment simulation (uses the real tester accounts) ─────────────────────
export interface EnvPerson { name: string; email: string; role: TestRole }
export interface EnvTeam { name: string; mentor: string; lead: string; members: string[]; repos: string[] }
export interface DomainEnvironment {
  teachers: EnvPerson[];
  mentors: EnvPerson[];
  teamLeads: EnvPerson[];
  students: EnvPerson[];
  teams: EnvTeam[];
  repositories: string[];
  milestones: string[];
  deliverables: string[];
}

const P = (name: string, email: string, role: TestRole): EnvPerson => ({ name, email, role });
// Real tester accounts mapped onto the demo roster.
const TEACHER = P("the Teacher", "teacher@example.test", "Teacher");
const MENTOR = P("the Primary Mentor", "mentor1@example.test", "Mentor");
const LEAD = P("the Co-Mentor", "mentor2@example.test", "Team Lead");
const STU1 = P("Mentee 1", "mentee1@example.test", "Mentee");
const STU2 = P("Mentee 2", "mentee2@example.test", "Mentee");

function environment(domain: DomainKey): DomainEnvironment {
  const base = { teachers: [TEACHER], mentors: [MENTOR], teamLeads: [LEAD], students: [STU1, STU2] };
  if (domain === "AI") {
    return {
      ...base,
      teams: [
        { name: "AI Group 07", mentor: MENTOR.name, lead: LEAD.name, members: [LEAD.name, STU1.name, STU2.name], repos: ["newton-school-ai/engageiq-ai_1"] },
        { name: "AI Group 03", mentor: MENTOR.name, lead: LEAD.name, members: [STU1.name, STU2.name], repos: ["newton-school-ai/hireflow-ai_2"] },
      ],
      repositories: ["newton-school-ai/engageiq-ai_1", "newton-school-ai/hireflow-ai_2"],
      milestones: ["M1 — Proposal", "M2 — Milestone 1", "M3 — Panel"],
      deliverables: ["Project proposal", "Demo video", "Final report"],
    };
  }
  if (domain === "ML") {
    return {
      ...base,
      teams: [
        { name: "Insight Squad", mentor: MENTOR.name, lead: LEAD.name, members: [LEAD.name, STU1.name, STU2.name], repos: ["comentor/forecast", "mentee1/forecast", "mentee2/forecast"] },
      ],
      repositories: ["comentor/forecast", "mentee1/forecast", "mentee2/forecast"],
      milestones: ["M1 — Baseline", "M2 — Tuned model + report"],
      deliverables: ["Baseline notebook", "Model report v1", "Final model + writeup"],
    };
  }
  if (domain === "DVA") {
    return {
      ...base,
      teams: [
        { name: "Dashboard Crew", mentor: MENTOR.name, lead: LEAD.name, members: [LEAD.name, STU1.name, STU2.name], repos: ["dva-team/viz-stories"] },
      ],
      repositories: ["dva-team/viz-stories"],
      milestones: ["M1 — Chart toolkit", "M2 — Data story"],
      deliverables: ["Chart toolkit", "Data story dashboard", "Analytics project"],
    };
  }
  return {
    ...base,
    teams: [
      { name: "Shipyard Team", mentor: MENTOR.name, lead: LEAD.name, members: [LEAD.name, STU1.name, STU2.name], repos: ["sdse-team/shipyard"] },
    ],
    repositories: ["sdse-team/shipyard"],
    milestones: ["M1 — Registry + Board", "M2 — Releases + Rollback"],
    deliverables: ["Service registry", "Deployment console", "Engineering writeup"],
  };
}

// ── Guided test steps ─────────────────────────────────────────────────────────────────
export interface TestStep {
  id: string;
  group: string; // checklist category
  role: TestRole; // act as this role
  title: string;
  instruction: string; // Current Step — what to do
  expected: string; // Expected Result
  success: string; // Success Criteria
}

// People — name the actor in every step so it's never ambiguous (mirrors the server seed).
const P_ADMIN = "the Admin";
const P_LCC = "the LCC";
const P_TEACHER = "the Teacher";
const P_MENTOR1 = "the Primary Mentor (team lead)";
const P_MENTOR2 = "the Co-Mentor";
const P_MENTEE1 = "Mentee 1";
const P_MENTEE2 = "Mentee 2";
const P_ORG = "newton-school-ai";

/** Common steps (same workflow validation across every domain), person-specific. */
function commonSteps(domain: DomainKey): TestStep[] {
  const s = (id: string, group: string, role: TestRole, title: string, instruction: string, expected: string, success: string): TestStep =>
    ({ id: `${domain}-${id}`, group, role, title, instruction, expected, success });
  return [
    s("um-create", "User Management", "Admin", "Admin creates a user",
      `Sign in as ${P_ADMIN}. Sidebar → Users (/admin/users) → "Create User". Enter a name, an @example.test email, Role = Mentee, choose ${domain}, click Create.`,
      "The user is created with status Invited and an onboarding invitation is generated.",
      "New user shows as Invited; a Pending invitation appears."),
    s("um-role", "User Management", "Admin", "Admin assigns a role + domain",
      `As ${P_ADMIN}, on /admin/users open that user → Edit. Change Role to Teacher, add a second domain, Save. Check Roles (/admin/roles).`,
      "The role/domain assignment is saved and shown.",
      "User shows updated role + domains."),
    s("um-invite", "User Management", "Admin", "Onboarding email is sent",
      `As ${P_ADMIN}, open Invitations (/admin/invitations) and confirm the invitation shows Sent.`,
      "Invitation status is Pending → Sent with a timestamp.",
      "Invitation shows Sent to the correct email."),
    s("um-access", "User Management", "LCC", "LCC verifies onboarding",
      `Sign in as ${P_LCC}. Open Onboarding (/lcc/onboarding) and Invitations (/lcc/invitations); confirm the user's role/domain/status.`,
      "The user appears with correct role/domain and onboarding status.",
      "LCC can see the invited user and its state."),
    s("ts-team", "Team Setup", "Admin", "Verify the testing team + members",
      `As ${P_ADMIN}, open Teams (/admin/teams) → "${domain} Testing Team". Confirm Mentor = the Primary Mentor; members = the Co-Mentor, Mentee 1, Mentee 2.`,
      "The team exists with the Primary Mentor as mentor and the Co-Mentor/Mentee 1/Mentee 2 as members.",
      "Team roster matches the provisioned roster."),
    s("ts-teacher", "Team Setup", "Teacher", "Teacher sees the team",
      `Sign in as ${P_TEACHER}. Teams (/teacher/teams) → "${domain} Testing Team". Confirm mentor, both mentees (Mentee 1, Mentee 2) and co-mentor (the Co-Mentor).`,
      "Teacher's team view shows the same roster.",
      "Teacher sees the full team with correct roles."),
    s("t-overview", "Teacher", "Teacher", "Domain dashboard",
      `As ${P_TEACHER}, open Domain Overview (/teacher). Read the tiles: teams, students, completion %, at-risk for ${domain}.`,
      "Dashboard renders rollups for teams/students/completion/at-risk.",
      "Tiles show numbers (no errors)."),
    s("t-students", "Teacher", "Teacher", "Student tracking",
      `As ${P_TEACHER}, open Students (/teacher/students). Confirm Mentee 1 and Mentee 2 with team + status.`,
      "Both mentees appear with team + status.",
      "Mentee 1 and Mentee 2 are visible."),
    s("t-reviews", "Teacher", "Teacher", "Reviews & gates (L4)",
      `As ${P_TEACHER}, open Reviews & Gates (/teacher/reviews). Open a pending review and record the teacher decision.`,
      "The L4 review form opens; the decision can be recorded.",
      "A teacher decision can be saved."),
    s("t-analytics", "Teacher", "Teacher", "Domain analytics",
      `As ${P_TEACHER}, open Analytics (/teacher/analytics). Confirm the charts render for ${domain}.`,
      "Analytics render without errors.",
      "Analytics page loads with data."),
    s("m-review1", "Mentor", "Mentor", "the Primary Mentor reviews Mentee 1",
      `Sign in as ${P_MENTOR1}. Reviews (/mentor/reviews) → for MENTEE 1 submit an L3 weekly review (summary, strength, improvement, status). Save.`,
      "Mentee 1's L3 weekly review is saved.",
      "A saved L3 review exists for Mentee 1 by the Primary Mentor."),
    s("m-mentees", "Mentor", "Mentor", "the Primary Mentor reviews mentee performance",
      `As ${P_MENTOR1}, open My Mentees (/mentor/mentees). Confirm BOTH Mentee 1 and Mentee 2 with L2 status, last update, blockers.`,
      "Both mentees show per-mentee status (L2) + updates.",
      "Mentee 1 and Mentee 2 both appear."),
    s("m-board", "Mentor", "Mentor", "the Primary Mentor checks Issues & PRs",
      `As ${P_MENTOR1}, open Issues & PRs (/mentor/board) and Blockers (/mentor/blockers).`,
      "Team issues/PRs and blockers render.",
      "The board shows the team's GitHub activity."),
    s("m-review2", "Mentor", "Mentor", "the Co-Mentor reviews Mentee 2",
      `Sign in as ${P_MENTOR2}. Confirm they ALSO have the mentor views for the same team. Reviews (/mentor/reviews) → submit an L3 review for MENTEE 2. Save.`,
      "The Co-Mentor can access the team and save a review for Mentee 2.",
      "A saved L3 review exists for Mentee 2 by the Co-Mentor — two mentors on one team."),
    s("me-update", "Mentee", "Mentee", "Mentee 1 submits a bi-daily update",
      `Sign in as ${P_MENTEE1}. On the Dashboard (/mentee) submit a bi-daily update (worked on, learned, blocker, next goal).`,
      "Mentee 1's update is recorded (L1).",
      "The update appears in Mentee 1's history."),
    s("me-tasks", "Mentee", "Mentee", "Mentee 1 works tasks & deliverables",
      `As ${P_MENTEE1}, Tasks (/mentee/tasks) → move a task to In Progress; Deliverables (/mentee/deliverables) → submit a deliverable with an artifact URL.`,
      "Task status updates and the deliverable is submitted.",
      "A task is In Progress and a deliverable exists for Mentee 1."),
    s("me-milestones", "Mentee", "Mentee", "Mentee 2 checks milestones & feedback",
      `Sign in as ${P_MENTEE2}. Milestones (/mentee/milestones) → confirm progress; Feedback (/mentee/feedback) → submit 360° mentor feedback.`,
      "Milestone progress shows and feedback can be submitted.",
      "Mentee 2 sees milestones and submits feedback."),
    s("cn-raise", "Concerns & Demerits", "Mentee", "Mentee 1 raises a concern",
      `As ${P_MENTEE1}, raise a concern (category, title, description, severity) and submit.`,
      "A concern ticket is created (CON-…).",
      "The concern appears OPEN."),
    s("cn-resolve", "Concerns & Demerits", "LCC", "LCC resolves it + issues a demerit",
      `Sign in as ${P_LCC}. Concerns (/lcc/concerns) → assign Mentee 1's concern, move to Resolved with a note. Demerits (/lcc/demerits) → issue a demerit to a mentee.`,
      "The concern is Resolved and a demerit is recorded.",
      "Concern shows Resolved; a demerit row exists."),
    s("dc-connect", "Discord Integration", "Admin", "Connect Discord",
      `As ${P_ADMIN}, Connections (/connections) → Connect Discord → authorize. Confirm Connected.`,
      "A connected Discord server is shown.",
      "Discord shows Connected."),
    s("dc-verify", "Discord Integration", "Mentor", "Validate Discord activity",
      `As ${P_MENTOR1}, confirm recent Discord activity for the team is reflected.`,
      "Recent Discord activity is visible.",
      "Discord activity appears for the team."),
    s("cal-connect", "Calendar Integration", "LCC", "Connect Google Calendar",
      `Sign in as ${P_LCC}. Connections (/connections) → Connect Google Calendar → authorize.`,
      "A connected calendar is shown.",
      "Calendar shows Connected."),
    s("cal-event", "Calendar Integration", "LCC", "Create an event + check visibility",
      `As ${P_LCC}, Calendar (/calendar) → create an event for the ${domain} Testing Team. Then as ${P_MENTEE1} confirm Mentee 1 sees it on /calendar.`,
      "The event is created and visible to the team member.",
      "Mentee 1 sees the event the LCC created."),
    s("nt-mentee", "Notifications", "Mentee", "Mentee 1 checks notifications",
      `As ${P_MENTEE1}, Notifications (/notifications) → confirm the list + unread count.`,
      "Notifications + unread count render.",
      "Mentee 1 sees notifications with an unread count."),
    s("nt-mentor", "Notifications", "Mentor", "the Primary Mentor checks reminders",
      `As ${P_MENTOR1}, Notifications (/notifications) → confirm reminder-type notifications.`,
      "Reminder notifications are present.",
      "The Primary Mentor sees reminder notifications."),
  ];
}

/** Domain-specific GitHub steps — real setup (create repos, collaborators, org) + validation. */
function githubSteps(domain: DomainKey): TestStep[] {
  const g = (id: string, group: string, role: TestRole, title: string, instruction: string, expected: string, success: string): TestStep =>
    ({ id: `${domain}-gh-${id}`, group, role, title, instruction, expected, success });

  if (domain === "AI") {
    return [
      g("org-team", "GitHub Setup", "Admin", "Create the org team on GitHub",
        `On GitHub.com, in the org "${P_ORG}": Teams → New team → name it "AI Group 07". (AI = everything lives in the ORG.)`,
        "The org team exists in GitHub.", "AI Group 07 is visible under the org's Teams."),
      g("org-repo", "GitHub Setup", "Admin", "Create the shared org repo + give the team access",
        `On GitHub.com, create a repo inside the org (e.g. ${P_ORG}/engageiq-ai) → Settings → Collaborators and teams → add "AI Group 07" with Write access.`,
        "A shared org repo exists and the team has Write access.", "The org repo lists AI Group 07 with Write."),
      g("org-members", "GitHub Setup", "Admin", "Add the testers to the org team",
        `On GitHub.com, AI Group 07 → Members → add the GitHub accounts of the Primary Mentor, the Co-Mentor, Mentee 1 and Mentee 2.`,
        "All four testers are members of the org team.", "The Primary Mentor, the Co-Mentor, Mentee 1, Mentee 2 are in AI Group 07."),
      g("connect", "GitHub Setup", "Admin", "Connect the org in the app + sync",
        `In the app as ${P_ADMIN}, Integrations (/admin/integrations) → confirm "${P_ORG}" is connected; trigger a sync.`,
        "The org is connected and a sync pulls teams + repos.", "The app shows the org connected and synced."),
      g("issues-prs", "GitHub Setup", "Mentee", "Create an issue + PR in the org repo",
        `On GitHub.com, as ${P_MENTEE1} open an Issue and a PR in ${P_ORG}/engageiq-ai. As ${P_MENTEE2}, open one more.`,
        "Issues and PRs exist in the org repo from both mentees.", "At least one issue and one PR exist in the org repo."),
      g("teacher-org", "GitHub Validation", "Teacher", "Teacher org dashboard",
        `Sign in as ${P_TEACHER}. GitHub → Org Dashboard (/teacher/github). Then Teams (/teacher/github/teams) → AI Group 07 → its repo.`,
        "Org dashboard renders team + repo metrics; the shared repo opens.", "Teacher sees the org dashboard and the shared repo."),
      g("mentor-issues", "GitHub Validation", "Mentor", "Mentor reviews org issues & PRs",
        `As ${P_MENTOR1}, Issues (/mentor/github/issues) and Pull Requests (/mentor/github/pulls). Open the PR review.`,
        "Open issues and PRs (incl. review state) are shown.", "The created issue + PR are visible to the mentor."),
      g("contrib", "GitHub Validation", "Teacher", "Per-student contributions",
        `As ${P_TEACHER}, Student Contributions (/teacher/github/students). Confirm Mentee 1's and Mentee 2's commits/PRs are counted separately.`,
        "Per-student contribution analytics display.", "Mentee 1 and Mentee 2 show distinct counts."),
    ];
  }

  if (domain === "ML") {
    return [
      g("repos", "GitHub Setup", "Mentee", "Each student creates their OWN repo",
        `ML = every student works in a SEPARATE repo. On GitHub.com: as ${P_MENTEE1} create "mentee1-forecast"; as ${P_MENTEE2} create "mentee2-forecast"; as ${P_MENTOR2} create "comentor-forecast".`,
        "Three independent student repos exist.", "mentee1-forecast, mentee2-forecast, comentor-forecast all exist."),
      g("collab", "GitHub Setup", "Mentee", "Add the mentor as collaborator on each repo",
        `On GitHub.com, on EACH of the three repos: Settings → Collaborators → add ${P_MENTOR1}'s account with Write access.`,
        "The Primary Mentor has Write access to all three repos.", "Each student repo lists the Primary Mentor as collaborator."),
      g("connect", "GitHub Setup", "Mentee", "Each student connects their repo in the app",
        `In the app, sign in as ${P_MENTEE1} → Connections (/connections) → Connect GitHub. Repeat for ${P_MENTEE2} and ${P_MENTOR2}. Each repo shows under My Repository (/mentee/github).`,
        "Each student's repo is linked to their account.", "mentee1-forecast shows for Mentee 1, mentee2-forecast for Mentee 2."),
      g("activity", "GitHub Setup", "Mentee", "Generate independent activity",
        `On GitHub.com, as ${P_MENTEE1} push a commit + PR in mentee1-forecast ONLY. As ${P_MENTEE2}, a different commit + PR in mentee2-forecast.`,
        "Each repo has its OWN commits/PRs (no overlap).", "Mentee 1's and Mentee 2's repos show independent activity."),
      g("teacher-grid", "GitHub Validation", "Teacher", "Teacher sees the per-student grid",
        `Sign in as ${P_TEACHER}. GitHub → Teams (/teacher/github/teams) → the ML team. Confirm the PER-STUDENT grid lists mentee1-forecast, mentee2-forecast, comentor-forecast.`,
        "The team view shows one independent repo per student.", "Three separate student repos are listed."),
      g("student-repo", "GitHub Validation", "Mentee", "Drill into one student's repo",
        `As ${P_MENTEE1}, My Repository (/mentee/github). Confirm it shows ONLY Mentee 1's repo — none of Mentee 2's.`,
        "The repo shows only that student's activity.", "Mentee 1's view contains only mentee1-forecast."),
      g("compare", "GitHub Validation", "Teacher", "Compare students side by side",
        `As ${P_TEACHER}, Student Contributions (/teacher/github/students). Compare Mentee 1 vs Mentee 2 — counts differ (separate repos).`,
        "Students can be compared; counts are independent.", "Mentee 1 and Mentee 2 show distinct metrics."),
    ];
  }

  const repoName = domain === "DVA" ? "dva-team/viz-stories" : "sdse-team/shipyard";
  const emphasis = domain === "DVA" ? "data-storytelling dashboards" : "the deployment console / engineering work";
  return [
    g("repo", "GitHub Setup", "Mentor", "Create ONE shared team repo",
      `${domain} = the whole team shares ONE repo. On GitHub.com, as ${P_MENTOR1}, create "${repoName}" for ${emphasis}.`,
      "A single shared repo exists for the team.", `${repoName} exists on GitHub.`),
    g("collab", "GitHub Setup", "Mentor", "Add the whole team as collaborators",
      `On GitHub.com, ${repoName} → Settings → Collaborators → add ${P_MENTOR2}, ${P_MENTEE1} and ${P_MENTEE2} with Write access.`,
      "The Co-Mentor, Mentee 1 and Mentee 2 all have Write access.", "The shared repo lists all members as collaborators."),
    g("connect", "GitHub Setup", "Mentor", "Connect the shared repo in the app",
      `In the app as ${P_MENTOR1}, Connections (/connections) → Connect GitHub, then confirm the repo under Repository (/mentor/github/repo).`,
      "The shared repo is linked to the team.", `${repoName} shows under the mentor's Repository view.`),
    g("activity", "GitHub Setup", "Mentee", "Team generates shared-repo activity",
      `On GitHub.com, in ${repoName}: as ${P_MENTEE1} push a commit + PR; as ${P_MENTEE2} another commit + PR; as ${P_MENTOR2} review a PR.`,
      "The shared repo has commits/PRs from multiple members.", "Multiple members' contributions exist in the one repo."),
    g("teacher", "GitHub Validation", "Teacher", "Teacher sees the shared repo with team context",
      `Sign in as ${P_TEACHER}. GitHub → Teams (/teacher/github/teams) → the ${domain} team. Confirm the SHARED repo with members, branches, releases, activity.`,
      "The team view shows the single shared repo with context.", "The shared repo renders with members + activity."),
    g("deliverables", "GitHub Validation", "Mentor", "Deliverables + progress",
      `As ${P_MENTOR1}, Repository (/mentor/github/repo) → repo detail → Progress. Confirm deliverables and milestones.`,
      "Deliverables and milestones are tracked.", "Deliverables + milestones show for the shared repo."),
    g("contrib", "GitHub Validation", "Mentor", "Per-student contributions to the shared repo",
      `As ${P_MENTOR1}, Student Performance (/mentor/github/students). Confirm each member's contribution to the ONE repo (Mentee 1 vs Mentee 2 vs the Co-Mentor).`,
      "Per-member contributions to the shared repo are shown.", "Each member's share is visible."),
  ];
}

export interface DomainTestPlan {
  domainKey: DomainKey;
  name: string;
  model: string;
  environment: DomainEnvironment;
  steps: TestStep[];
}

const DOMAIN_NAMES: Record<DomainKey, string> = {
  AI: "Artificial Intelligence",
  ML: "Machine Learning",
  DVA: "Data Visualisation & Analytics",
  SDSE: "Software Dev & Systems Eng",
};
const DOMAIN_MODELS: Record<DomainKey, string> = {
  AI: "GitHub Organization → org teams → shared org repos → org issues/PRs",
  ML: "One INDEPENDENT GitHub repo per student (separate commits/PRs/branches)",
  DVA: "One SHARED team repo → deliverables + analytics projects",
  SDSE: "One SHARED team repo → deliverables + engineering work",
};

export const DOMAIN_KEYS: DomainKey[] = ["AI", "ML", "DVA", "SDSE"];

const GROUP_ORDER = [
  "User Management", "Team Setup", "GitHub Setup", "Teacher", "Mentor", "Mentee",
  "GitHub Validation", "Concerns & Demerits", "Discord Integration", "Calendar Integration", "Notifications",
];

export function testPlanFor(domain: DomainKey): DomainTestPlan {
  const steps = [...commonSteps(domain), ...githubSteps(domain)].sort((a, b) => GROUP_ORDER.indexOf(a.group) - GROUP_ORDER.indexOf(b.group));
  return { domainKey: domain, name: DOMAIN_NAMES[domain], model: DOMAIN_MODELS[domain], environment: environment(domain), steps };
}

export const TEST_PLANS: Record<DomainKey, DomainTestPlan> = {
  AI: testPlanFor("AI"),
  ML: testPlanFor("ML"),
  DVA: testPlanFor("DVA"),
  SDSE: testPlanFor("SDSE"),
};

export const SEVERITIES: Severity[] = ["Low", "Medium", "High", "Critical"];

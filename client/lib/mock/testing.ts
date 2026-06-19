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

export const TESTING_ADMIN_EMAIL = "shaik.tajuddin2024@nst.rishihood.edu.in";
/** Issue reports are emailed here in production (mocked in presentation). */
export const ISSUE_REPORT_EMAIL = TESTING_ADMIN_EMAIL;

export const TESTERS: Tester[] = [
  { email: "shaik.tajuddin2024@nst.rishihood.edu.in", name: "Shaik Tajuddin", role: "Admin", isAdmin: true },
  { email: "learnercareercouncil@nst.rishihood.edu.in", name: "Learner Career Council", role: "LCC", isAdmin: false },
  { email: "abhinav.choudhary2024@nst.rishihood.edu.in", name: "Abhinav Choudhary", role: "Teacher", isAdmin: false },
  { email: "aniket.pathak2024@nst.rishihood.edu.in", name: "Aniket Pathak", role: "Mentor", isAdmin: false },
  { email: "anwesha.adhikari2024@nst.rishihood.edu.in", name: "Anwesha Adhikari", role: "Team Lead", isAdmin: false },
  { email: "khushi.2024@nst.rishihood.edu.in", name: "Khushi", role: "Mentee", isAdmin: false },
  { email: "nikith.s2024@nst.rishihood.edu.in", name: "Nikith S", role: "Mentee", isAdmin: false },
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
const TEACHER = P("Abhinav Choudhary", "abhinav.choudhary2024@nst.rishihood.edu.in", "Teacher");
const MENTOR = P("Aniket Pathak", "aniket.pathak2024@nst.rishihood.edu.in", "Mentor");
const LEAD = P("Anwesha Adhikari", "anwesha.adhikari2024@nst.rishihood.edu.in", "Team Lead");
const STU1 = P("Khushi", "khushi.2024@nst.rishihood.edu.in", "Mentee");
const STU2 = P("Nikith S", "nikith.s2024@nst.rishihood.edu.in", "Mentee");

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
        { name: "Insight Squad", mentor: MENTOR.name, lead: LEAD.name, members: [LEAD.name, STU1.name, STU2.name], repos: ["anwesha/forecast", "khushi/forecast", "nikith/forecast"] },
      ],
      repositories: ["anwesha/forecast", "khushi/forecast", "nikith/forecast"],
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

/** Domain-specific GitHub validation steps (the experience differs per domain). */
function githubSteps(domain: DomainKey): TestStep[] {
  const g = (id: string, title: string, instruction: string, expected: string, success: string, role: TestRole = "Mentor"): TestStep =>
    ({ id: `${domain}-gh-${id}`, group: "GitHub Integration", role, title, instruction, expected, success });
  if (domain === "AI") {
    return [
      g("org", "Organization overview", "As Teacher, open GitHub → Domain Dashboard for AI.", "The organization overview shows teams, repositories and contribution analytics.", "Org dashboard renders with team + repo metrics.", "Teacher"),
      g("teams", "Team & repository views", "Open a team, then its shared repository.", "Team view shows members and the shared org repo with issues/PRs.", "Shared repo + issues + PRs are visible."),
      g("contrib", "Contribution analytics", "Open Student Contributions for the team.", "Per-student commits/PRs/reviews are shown.", "Contribution analytics display correctly.", "Teacher"),
      g("review", "Pull request reviews", "As Mentor, open Pull Requests and a PR's review.", "Open/merged PRs + review state are shown.", "PR review workflow is clear."),
    ];
  }
  if (domain === "ML") {
    return [
      g("teams", "Teams → students", "As Teacher, open GitHub → Teams → Insight Squad.", "The team overview shows the per-student repository grid.", "Per-student repos are listed, one per student.", "Teacher"),
      g("student", "Student repository tracking", "Open a student's individual repository.", "That student's independent repo shows their own commits/PRs/branches/progress.", "Individual student repo activity is correct."),
      g("compare", "Compare students", "Return to the team and compare students side-by-side.", "Students can be compared on contributions + progress.", "Student-level comparison works.", "Teacher"),
    ];
  }
  if (domain === "DVA") {
    return [
      g("repo", "Shared repository", "As Teacher, open GitHub → Teams → Dashboard Crew.", "The team's shared repository is shown with full team context.", "Shared repo + team context render.", "Teacher"),
      g("deliverables", "Deliverables + analytics", "Open the repository detail → Progress.", "Deliverables and analytics projects are tracked alongside milestones.", "Deliverables + analytics are visible."),
      g("contrib", "Contribution monitoring", "Open Student Contributions.", "Per-student contributions to the shared repo are shown.", "Contribution monitoring works.", "Mentor"),
    ];
  }
  return [
    g("repo", "Shared engineering repo", "As Teacher, open GitHub → Teams → Shipyard Team.", "The shared team repository renders with branches, releases and activity.", "Shared repo + engineering activity render.", "Teacher"),
    g("deliverables", "Team deliverables", "Open the repository detail → Progress.", "Engineering deliverables + milestones are tracked.", "Deliverables + milestones are visible."),
    g("contrib", "Contribution monitoring", "Open Student Contributions.", "Per-student engineering contributions are shown.", "Contribution monitoring works.", "Mentor"),
  ];
}

/** Steps shared across all domains (role + integration validation). */
function commonSteps(domain: DomainKey): TestStep[] {
  const s = (id: string, group: string, role: TestRole, title: string, instruction: string, expected: string, success: string): TestStep =>
    ({ id: `${domain}-${id}`, group, role, title, instruction, expected, success });
  return [
    // User management (Admin / LCC)
    s("um-invite", "User Management", "Admin", "Invite a user", "As Admin, go to Users → Create User and invite a tester.", "An invitation is created and shown as Pending.", "Invitation appears in the invitations list."),
    s("um-role", "User Management", "Admin", "Assign a role", "Assign a role + domain when creating/editing the user.", "The role and domain are saved on the user.", "User shows the assigned role + domain."),
    s("um-access", "User Management", "LCC", "Verify access", "As LCC, open Onboarding and confirm the invited user + status.", "The user appears with the correct role and onboarding status.", "Access + onboarding status are correct."),
    // Teacher
    s("t-analytics", "Teacher", "Teacher", "Domain analytics", "As Teacher, open the domain dashboard + analytics.", "Domain rollups (teams, students, completion, at-risk) are shown.", "Domain analytics render correctly."),
    s("t-track", "Teacher", "Teacher", "Team & progress tracking", "Open Teams and a team's progress.", "Team progress, milestones and reviews are visible.", "Team + progress tracking works."),
    // Mentor
    s("m-reviews", "Mentor", "Mentor", "Weekly reviews", "As Mentor, open Reviews and submit/inspect a weekly review.", "The L3 weekly review form + history are shown.", "Review workflow is clear."),
    s("m-mentees", "Mentor", "Mentor", "Mentee performance", "Open Mentees / Student Performance.", "Per-mentee status (L2), updates and contributions are shown.", "Mentee monitoring works."),
    // Team Lead
    s("tl-team", "Team Lead", "Team Lead", "Team management", "As Team Lead, open the team and review members + deliverables.", "Team members, deliverables and repository are shown.", "Team management view works."),
    s("tl-repo", "Team Lead", "Team Lead", "Repository monitoring", "Open the team repository and review activity.", "Repository activity + branches + collaborators render.", "Repository monitoring works."),
    // Mentee
    s("me-tasks", "Mentee", "Mentee", "Tasks & milestones", "As Mentee, open Tasks and Milestones.", "Assigned tasks + milestone progress are shown.", "Tasks + milestones render correctly."),
    s("me-submit", "Mentee", "Mentee", "Submissions & updates", "Submit a bi-daily update and a deliverable.", "The update + deliverable are recorded (mock).", "Submission workflow is clear."),
    s("me-repo", "Mentee", "Mentee", "My repository", "Open My Repository in GitHub.", "Your repository/contributions are shown for this domain.", "Mentee repository view works."),
    // Discord
    s("dc-connect", "Discord Integration", "Admin", "Connect server", "Open Connections → Discord and connect a server (mock).", "A connected Discord server is shown.", "Discord connection state renders."),
    s("dc-sync", "Discord Integration", "Mentor", "Validate sync", "Open the Discord activity/connection view.", "Recent Discord activity is reflected (mock).", "Discord sync view works."),
    // Calendar
    s("cal-connect", "Calendar Integration", "LCC", "Connect calendar", "Open Connections → Calendar and connect (mock).", "A connected calendar is shown.", "Calendar connection renders."),
    s("cal-event", "Calendar Integration", "LCC", "Create event + visibility", "Create an event and verify it appears for the team.", "The event shows on the calendar with the right scope.", "Event creation + visibility work."),
    // Notifications
    s("nt-verify", "Notifications", "Mentee", "Verify notifications", "Open Notifications and review the list + unread count.", "Notifications + unread count are shown.", "Notifications render correctly."),
    s("nt-reminder", "Notifications", "Mentor", "Reminder workflow", "Review a reminder-type notification.", "Reminder notifications are present (mock).", "Reminder workflow is clear."),
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
  AI: "Organization → teams → shared repos → issues/PRs/reviews",
  ML: "Team → students → individual repositories",
  DVA: "Team → shared repository → deliverables + analytics projects",
  SDSE: "Team → shared repository → deliverables + engineering work",
};

export const DOMAIN_KEYS: DomainKey[] = ["AI", "ML", "DVA", "SDSE"];

export function testPlanFor(domain: DomainKey): DomainTestPlan {
  // Order: onboarding → teacher → mentor → GitHub (domain-specific) → team lead → mentee → integrations → notifications
  const common = commonSteps(domain);
  const gh = githubSteps(domain);
  const order = (g: string) => ["User Management", "Teacher", "Mentor", "GitHub Integration", "Team Lead", "Mentee", "Discord Integration", "Calendar Integration", "Notifications"].indexOf(g);
  const steps = [...common, ...gh].sort((a, b) => order(a.group) - order(b.group));
  return { domainKey: domain, name: DOMAIN_NAMES[domain], model: DOMAIN_MODELS[domain], environment: environment(domain), steps };
}

export const TEST_PLANS: Record<DomainKey, DomainTestPlan> = {
  AI: testPlanFor("AI"),
  ML: testPlanFor("ML"),
  DVA: testPlanFor("DVA"),
  SDSE: testPlanFor("SDSE"),
};

export const SEVERITIES: Severity[] = ["Low", "Medium", "High", "Critical"];

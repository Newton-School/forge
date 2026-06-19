/**
 * Canonical guided test-plan content — the source the DB is seeded from. After seeding, the
 * plans live in TestPlan/TestPlanStep and can be edited there without a redeploy; this module
 * only provides the initial content and the idempotent seeder.
 *
 * The mock client roster used a "Team Lead" role, but Forge has no Team Lead (the Mentor leads
 * the team), so those steps are authored here with the real MENTOR role.
 */
import type { PrismaClient } from "@prisma/client";

type DomainKey = "AI" | "ML" | "DVA" | "SDSE";

export interface PlanStepSeed {
  stepKey: string; group: string; role: string;
  title: string; instruction: string; expected: string; success: string;
}
export interface PlanSeed { domainKey: DomainKey; name: string; model: string; steps: PlanStepSeed[] }

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

/** Domain-specific GitHub validation steps (the experience differs per domain). */
function githubSteps(domain: DomainKey): PlanStepSeed[] {
  const g = (id: string, title: string, instruction: string, expected: string, success: string, role = "Mentor"): PlanStepSeed =>
    ({ stepKey: `${domain}-gh-${id}`, group: "GitHub Integration", role, title, instruction, expected, success });
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
function commonSteps(domain: DomainKey): PlanStepSeed[] {
  const s = (id: string, group: string, role: string, title: string, instruction: string, expected: string, success: string): PlanStepSeed =>
    ({ stepKey: `${domain}-${id}`, group, role, title, instruction, expected, success });
  return [
    s("um-invite", "User Management", "Admin", "Invite a user", "As Admin, go to Users → Create User and invite a tester.", "An invitation is created and shown as Pending.", "Invitation appears in the invitations list."),
    s("um-role", "User Management", "Admin", "Assign a role", "Assign a role + domain when creating/editing the user.", "The role and domain are saved on the user.", "User shows the assigned role + domain."),
    s("um-access", "User Management", "LCC", "Verify access", "As LCC, open Onboarding and confirm the invited user + status.", "The user appears with the correct role and onboarding status.", "Access + onboarding status are correct."),
    s("t-analytics", "Teacher", "Teacher", "Domain analytics", "As Teacher, open the domain dashboard + analytics.", "Domain rollups (teams, students, completion, at-risk) are shown.", "Domain analytics render correctly."),
    s("t-track", "Teacher", "Teacher", "Team & progress tracking", "Open Teams and a team's progress.", "Team progress, milestones and reviews are visible.", "Team + progress tracking works."),
    s("m-reviews", "Mentor", "Mentor", "Weekly reviews", "As Mentor, open Reviews and submit/inspect a weekly review.", "The L3 weekly review form + history are shown.", "Review workflow is clear."),
    s("m-mentees", "Mentor", "Mentor", "Mentee performance", "Open Mentees / Student Performance.", "Per-mentee status (L2), updates and contributions are shown.", "Mentee monitoring works."),
    // "Team Lead" in the old mock → the real MENTOR role (the Student Mentor leads the team).
    s("tl-team", "Team Delivery", "Mentor", "Team management", "As the team's Mentor (team lead), open the team and review members + deliverables.", "Team members, deliverables and repository are shown.", "Team management view works."),
    s("tl-repo", "Team Delivery", "Mentor", "Repository monitoring", "Open the team repository and review activity.", "Repository activity + branches + collaborators render.", "Repository monitoring works."),
    s("me-tasks", "Mentee", "Mentee", "Tasks & milestones", "As Mentee, open Tasks and Milestones.", "Assigned tasks + milestone progress are shown.", "Tasks + milestones render correctly."),
    s("me-submit", "Mentee", "Mentee", "Submissions & updates", "Submit a bi-daily update and a deliverable.", "The update + deliverable are recorded.", "Submission workflow is clear."),
    s("me-repo", "Mentee", "Mentee", "My repository", "Open My Repository in GitHub.", "Your repository/contributions are shown for this domain.", "Mentee repository view works."),
    s("dc-connect", "Discord Integration", "Admin", "Connect server", "Open Connections → Discord and connect a server.", "A connected Discord server is shown.", "Discord connection state renders."),
    s("dc-sync", "Discord Integration", "Mentor", "Validate sync", "Open the Discord activity/connection view.", "Recent Discord activity is reflected.", "Discord sync view works."),
    s("cal-connect", "Calendar Integration", "LCC", "Connect calendar", "Open Connections → Calendar and connect.", "A connected calendar is shown.", "Calendar connection renders."),
    s("cal-event", "Calendar Integration", "LCC", "Create event + visibility", "Create an event and verify it appears for the team.", "The event shows on the calendar with the right scope.", "Event creation + visibility work."),
    s("nt-verify", "Notifications", "Mentee", "Verify notifications", "Open Notifications and review the list + unread count.", "Notifications + unread count are shown.", "Notifications render correctly."),
    s("nt-reminder", "Notifications", "Mentor", "Reminder workflow", "Review a reminder-type notification.", "Reminder notifications are present.", "Reminder workflow is clear."),
  ];
}

const GROUP_ORDER = ["User Management", "Teacher", "Mentor", "GitHub Integration", "Team Delivery", "Mentee", "Discord Integration", "Calendar Integration", "Notifications"];

/** Build the ordered plan for one domain (common + GitHub steps, sorted by group). */
export function buildPlan(domain: DomainKey): PlanSeed {
  const steps = [...commonSteps(domain), ...githubSteps(domain)]
    .sort((a, b) => GROUP_ORDER.indexOf(a.group) - GROUP_ORDER.indexOf(b.group));
  return { domainKey: domain, name: DOMAIN_NAMES[domain], model: DOMAIN_MODELS[domain], steps };
}

export const TEST_PLAN_SEED: PlanSeed[] = (["AI", "ML", "DVA", "SDSE"] as DomainKey[]).map(buildPlan);

/**
 * Idempotently seed the test plans: upsert each plan and replace its steps. Safe to re-run —
 * it overwrites the canonical content while leaving any unrelated DB edits to other plans alone.
 */
export async function seedTestPlans(prisma: PrismaClient): Promise<number> {
  for (const plan of TEST_PLAN_SEED) {
    const row = await prisma.testPlan.upsert({
      where: { domainKey: plan.domainKey },
      update: { name: plan.name, model: plan.model },
      create: { domainKey: plan.domainKey, name: plan.name, model: plan.model },
    });
    // Replace steps wholesale so removed/renamed steps don't linger.
    await prisma.testPlanStep.deleteMany({ where: { planId: row.id } });
    await prisma.testPlanStep.createMany({
      data: plan.steps.map((s, i) => ({ planId: row.id, seq: i, ...s })),
    });
  }
  return TEST_PLAN_SEED.length;
}

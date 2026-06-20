/**
 * Canonical guided test-plan content — the source the DB is seeded from. After seeding, the
 * plans live in TestPlan/TestPlanStep and can be edited there without a redeploy; this module
 * only provides the initial content and the idempotent seeder.
 *
 * Steps are written to be followed literally ("guide a baby"): each names the EXACT person to
 * act as, the EXACT page to open, and the EXACT action to take. The fixed testers are:
 *   • Shaik Tajuddin      — Admin            (shaik.tajuddin2024@…)
 *   • Learner Career Cncl — LCC              (learnercareercouncil@…)
 *   • Abhinav Choudhary   — Teacher
 *   • Aniket Pathak       — Mentor (team lead; the team's primary mentor)
 *   • Anwesha Adhikari    — Mentor (co-mentor)   [the old "Team Lead" → MENTOR, no such role exists]
 *   • Khushi              — Mentee 1
 *   • Nikith S            — Mentee 2
 * The GitHub org is `newton-school-ai`.
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
  AI: "GitHub Organization → org teams → shared org repos → org issues/PRs",
  ML: "One INDEPENDENT GitHub repo per student (separate commits/PRs/branches)",
  DVA: "One SHARED team repo → deliverables + analytics projects",
  SDSE: "One SHARED team repo → deliverables + engineering work",
};

// People (name the actor in every step so a step is never ambiguous).
const ADMIN = "Shaik (Admin)";
const LCC = "the LCC account (Learner Career Council)";
const TEACHER = "Abhinav (Teacher)";
const MENTOR1 = "Aniket (Mentor — the team lead)";
const MENTOR2 = "Anwesha (Mentor — co-mentor)";
const MENTEE1 = "Khushi (Mentee 1)";
const MENTEE2 = "Nikith (Mentee 2)";
const ORG = "newton-school-ai";

/** Common steps (same workflow validation across every domain), person-specific. */
function commonSteps(domain: DomainKey): PlanStepSeed[] {
  const s = (id: string, group: string, role: string, title: string, instruction: string, expected: string, success: string): PlanStepSeed =>
    ({ stepKey: `${domain}-${id}`, group, role, title, instruction, expected, success });
  return [
    // ── User Management (Admin / LCC) ───────────────────────────────────────────────────
    s("um-create", "User Management", "Admin",
      "Admin creates a user",
      `Sign in as ${ADMIN}. Open the left sidebar → Users (/admin/users). Click "Create User" (top-right). Enter a name (e.g. "Test Mentee"), an @nst.rishihood.edu.in email, choose Role = Mentee, choose this domain (${domain}), then click Create.`,
      "The user is created with status Invited and an onboarding invitation is generated.",
      "The new user appears in the Users list as Invited, and a Pending row appears under Invitations."),
    s("um-role", "User Management", "Admin",
      "Admin assigns a role + domain",
      `Still as ${ADMIN}, on /admin/users open the user you just created → Edit. Change Role to Teacher and add a second domain. Save. Then open Roles (/admin/roles) to confirm the role mapping.`,
      "The role and domain assignment are saved and shown on the user.",
      "The user row shows the updated role + domains; /admin/roles reflects the grant."),
    s("um-invite", "User Management", "Admin",
      "Onboarding invitation email is sent",
      `As ${ADMIN}, open Invitations (/admin/invitations). Find the invitation for the user you created and confirm it shows Sent (the onboarding email is dispatched on create).`,
      "The invitation status is Pending → Sent with a timestamp.",
      "The invitation shows Sent and the recipient email is correct."),
    s("um-access", "User Management", "LCC",
      "LCC verifies onboarding",
      `Sign in as ${LCC}. Open Onboarding (/lcc/onboarding) and Invitations (/lcc/invitations). Find the same user and confirm their role, domain and onboarding status.`,
      "The user appears with the correct role/domain and an accurate onboarding status.",
      "LCC can see the invited user and its onboarding state."),

    // ── Team Setup — verify the auto-provisioned team (Start Testing created it) ─────────
    s("ts-team", "Team Setup", "Admin",
      "Verify the testing team + members",
      `As ${ADMIN}, open Teams (/admin/teams). Find "${domain} Testing Team" (auto-created when you started this domain). Open it and confirm: Mentor = Aniket; members = Anwesha, Khushi, Nikith.`,
      "The team exists with Aniket as mentor and Anwesha/Khushi/Nikith as members.",
      "Team roster matches the provisioned roster exactly."),
    s("ts-teacher", "Team Setup", "Teacher",
      "Teacher sees the team",
      `Sign in as ${TEACHER}. Open Teams (/teacher/teams) → open "${domain} Testing Team". Confirm the mentor, the two mentees (Khushi, Nikith), and the co-mentor (Anwesha) are all listed.`,
      "The teacher's team view shows the same roster.",
      "Teacher can see the full team with correct roles."),

    // ── Teacher workflow (Abhinav) ──────────────────────────────────────────────────────
    s("t-overview", "Teacher", "Teacher",
      "Domain dashboard",
      `As ${TEACHER}, open Domain Overview (/teacher). Read the rollup tiles: number of teams, students, completion %, and at-risk count for ${domain}.`,
      "The domain dashboard renders rollups for teams/students/completion/at-risk.",
      "Tiles show numbers (not errors) for this domain."),
    s("t-students", "Teacher", "Teacher",
      "Student tracking",
      `As ${TEACHER}, open Students (/teacher/students). Confirm Khushi and Nikith are listed with their team and status.`,
      "Both mentees appear with team + status.",
      "Khushi and Nikith are visible with correct team."),
    s("t-reviews", "Teacher", "Teacher",
      "Reviews & gates (L4)",
      `As ${TEACHER}, open Reviews & Gates (/teacher/reviews). Open a pending review and record the teacher decision (L4).`,
      "The L4 review form opens and the decision can be recorded.",
      "A teacher decision can be saved on a review."),
    s("t-analytics", "Teacher", "Teacher",
      "Domain analytics",
      `As ${TEACHER}, open Analytics (/teacher/analytics). Confirm the charts/tables render for ${domain}.`,
      "Analytics charts render without errors.",
      "Analytics page loads with data."),

    // ── Mentor workflow (Aniket = team lead, Anwesha = co-mentor) ───────────────────────
    s("m-review1", "Mentor", "Mentor",
      "Aniket submits a weekly review for Khushi",
      `Sign in as ${MENTOR1}. Open Reviews (/mentor/reviews). For KHUSHI, submit an L3 weekly review: progress summary, one strength, one improvement area, and a mentor status. Save.`,
      "Khushi's L3 weekly review is saved.",
      "A saved L3 review exists for Khushi by Aniket."),
    s("m-mentees", "Mentor", "Mentor",
      "Aniket reviews mentee performance",
      `As ${MENTOR1}, open My Mentees (/mentor/mentees). Confirm BOTH Khushi and Nikith are listed with their L2 status, last update and blocker streak.`,
      "Both mentees show per-mentee status (L2), updates and contributions.",
      "Khushi and Nikith both appear with status."),
    s("m-board", "Mentor", "Mentor",
      "Aniket checks Issues & PRs",
      `As ${MENTOR1}, open Issues & PRs (/mentor/board) and Blockers (/mentor/blockers). Confirm the team's GitHub issues/PRs and any flagged blockers are shown.`,
      "Team issues/PRs and blockers render.",
      "The board shows the team's GitHub activity."),
    s("m-review2", "Mentor", "Mentor",
      "Anwesha (co-mentor) submits a review for Nikith",
      `Sign in as ${MENTOR2}. Confirm she ALSO has the mentor views for the same team (she is a co-mentor). Open Reviews (/mentor/reviews) and submit an L3 weekly review for NIKITH. Save.`,
      "Anwesha can access the team's mentor area and save a review for Nikith.",
      "A saved L3 review exists for Nikith by Anwesha — proving two mentors on one team."),

    // ── Mentee workflow (Khushi = mentee 1, Nikith = mentee 2) ──────────────────────────
    s("me-update", "Mentee", "Mentee",
      "Khushi submits a bi-daily update",
      `Sign in as ${MENTEE1}. On the Dashboard (/mentee) submit a bi-daily update: what she worked on, what she learned, any blocker, and her next goal. Submit.`,
      "Khushi's update is recorded (L1).",
      "The update appears in Khushi's history."),
    s("me-tasks", "Mentee", "Mentee",
      "Khushi works tasks & deliverables",
      `As ${MENTEE1}, open Tasks (/mentee/tasks) — move a task to In Progress. Then Deliverables (/mentee/deliverables) — submit a deliverable with an artifact URL.`,
      "Task status updates and the deliverable is submitted.",
      "A task shows In Progress and a deliverable is recorded for Khushi."),
    s("me-milestones", "Mentee", "Mentee",
      "Nikith checks milestones & feedback",
      `Sign in as ${MENTEE2}. Open Milestones (/mentee/milestones) — confirm milestone progress. Then Feedback (/mentee/feedback) — submit 360° feedback about the mentor.`,
      "Milestone progress shows and feedback can be submitted.",
      "Nikith sees milestones and submits mentor feedback."),

    // ── Concerns & Demerits ─────────────────────────────────────────────────────────────
    s("cn-raise", "Concerns & Demerits", "Mentee",
      "Khushi raises a concern",
      `As ${MENTEE1}, raise a concern (Raise Concern action / Concerns) — pick a category, title and description, set severity, submit.`,
      "A concern ticket is created (CON-… number).",
      "The concern appears with an OPEN status."),
    s("cn-resolve", "Concerns & Demerits", "LCC",
      "LCC resolves the concern + issues a demerit",
      `Sign in as ${LCC}. Open Concerns (/lcc/concerns) — find Khushi's concern, assign it and move it to Resolved with a note. Then Demerits (/lcc/demerits) — issue a demerit to a mentee with a reason.`,
      "The concern transitions to Resolved and a demerit is recorded.",
      "Concern shows Resolved; a demerit row exists for the mentee."),

    // ── Discord ─────────────────────────────────────────────────────────────────────────
    s("dc-connect", "Discord Integration", "Admin",
      "Connect Discord",
      `As ${ADMIN}, open Connections (/connections). Click Connect Discord and authorize the server. Confirm it shows Connected.`,
      "A connected Discord server is shown.",
      "Discord shows Connected on the Connections page."),
    s("dc-verify", "Discord Integration", "Mentor",
      "Validate Discord activity",
      `As ${MENTOR1}, confirm recent Discord activity for the team is reflected (team/board views).`,
      "Recent Discord activity is visible.",
      "Discord activity appears for the team."),

    // ── Calendar ────────────────────────────────────────────────────────────────────────
    s("cal-connect", "Calendar Integration", "LCC",
      "Connect Google Calendar",
      `Sign in as ${LCC}. Open Connections (/connections) → Connect Google Calendar and authorize.`,
      "A connected calendar is shown.",
      "Calendar shows Connected."),
    s("cal-event", "Calendar Integration", "LCC",
      "Create an event + check visibility",
      `As ${LCC}, open Calendar (/calendar). Create an event scoped to the ${domain} Testing Team. Then sign in as ${MENTEE1} and confirm Khushi sees the event on /calendar.`,
      "The event is created and visible to the team member.",
      "Khushi sees the event the LCC created."),

    // ── Notifications ───────────────────────────────────────────────────────────────────
    s("nt-mentee", "Notifications", "Mentee",
      "Khushi checks notifications",
      `As ${MENTEE1}, open Notifications (/notifications). Confirm the list and the unread count (e.g. from the review/feedback above).`,
      "Notifications + unread count render.",
      "Khushi sees notifications with an unread count."),
    s("nt-mentor", "Notifications", "Mentor",
      "Aniket checks reminders",
      `As ${MENTOR1}, open Notifications (/notifications) and confirm reminder-type notifications are present.`,
      "Reminder notifications are present.",
      "Aniket sees reminder notifications."),
  ];
}

/** Domain-specific GitHub steps — the REAL setup (create repos, collaborators, org) + validation. */
function githubSteps(domain: DomainKey): PlanStepSeed[] {
  const g = (id: string, group: string, role: string, title: string, instruction: string, expected: string, success: string): PlanStepSeed =>
    ({ stepKey: `${domain}-gh-${id}`, group, role, title, instruction, expected, success });

  if (domain === "AI") {
    return [
      g("org-team", "GitHub Setup", "Admin",
        "Create the org team on GitHub",
        `On GitHub.com, in the org "${ORG}": Teams → New team → name it "AI Group 07". (AI domain = everything lives in the ORG.)`,
        "The org team exists in GitHub.",
        "AI Group 07 team is visible under the org's Teams."),
      g("org-repo", "GitHub Setup", "Admin",
        "Create the shared org repo + give the team access",
        `On GitHub.com, create a repo inside the org (e.g. ${ORG}/engageiq-ai). Open the repo → Settings → Collaborators and teams → add the "AI Group 07" team with Write access.`,
        "A shared org repo exists and the team has Write access.",
        "The org repo lists AI Group 07 with Write permission."),
      g("org-members", "GitHub Setup", "Admin",
        "Add the testers to the org team",
        `On GitHub.com, open AI Group 07 → Members → add the GitHub accounts of Aniket, Anwesha, Khushi and Nikith to the team.`,
        "All four testers are members of the org team.",
        "Aniket, Anwesha, Khushi, Nikith are in AI Group 07."),
      g("connect", "GitHub Setup", "Admin",
        "Connect the org in Forge + sync",
        `In Forge as ${ADMIN}, open Integrations (/admin/integrations) (or Connections) and confirm the "${ORG}" org is connected; trigger a sync.`,
        "The org is connected and a sync pulls teams + repos.",
        "Forge shows the org connected and synced."),
      g("issues-prs", "GitHub Setup", "Mentee",
        "Create an issue + PR in the org repo",
        `On GitHub.com, as ${MENTEE1}, open an Issue and a Pull Request in the org repo (${ORG}/engageiq-ai). As ${MENTEE2}, open one more.`,
        "Issues and PRs exist in the org repo from both mentees.",
        "At least one issue and one PR exist in the org repo."),
      g("teacher-org", "GitHub Validation", "Teacher",
        "Teacher org dashboard",
        `Sign in as ${TEACHER}. GitHub → Org Dashboard (/teacher/github). Confirm the org overview shows teams, repositories and contribution analytics. Then Teams (/teacher/github/teams) → open AI Group 07 → its repo.`,
        "Org dashboard renders team + repo metrics; the team's shared repo opens.",
        "Teacher sees the org dashboard and the shared repo with members."),
      g("mentor-issues", "GitHub Validation", "Mentor",
        "Mentor reviews org issues & PRs",
        `As ${MENTOR1}, open Issues (/mentor/github/issues) and Pull Requests (/mentor/github/pulls). Confirm the issue + PR you created appear; open the PR review.`,
        "Open issues and PRs (incl. review state) are shown.",
        "The created issue + PR are visible to the mentor."),
      g("contrib", "GitHub Validation", "Teacher",
        "Per-student contributions",
        `As ${TEACHER}, open Student Contributions (/teacher/github/students). Confirm Khushi's and Nikith's commits/PRs/reviews are counted separately.`,
        "Per-student contribution analytics display.",
        "Khushi and Nikith show distinct contribution counts."),
    ];
  }

  if (domain === "ML") {
    return [
      g("repos", "GitHub Setup", "Mentee",
        "Each student creates their OWN repo",
        `ML = every student works in a SEPARATE repo. On GitHub.com: as ${MENTEE1} create a repo "khushi-forecast"; as ${MENTEE2} create "nikith-forecast"; as ${MENTOR2} create "anwesha-forecast". (Three independent repos.)`,
        "Three independent student repos exist.",
        "khushi-forecast, nikith-forecast, anwesha-forecast all exist on GitHub."),
      g("collab", "GitHub Setup", "Mentee",
        "Add the mentor as collaborator on each repo",
        `On GitHub.com, on EACH of the three repos: Settings → Collaborators → add ${MENTOR1}'s GitHub account with Write access (so the mentor can review each student's repo).`,
        "Aniket has Write access to all three student repos.",
        "Each student repo lists Aniket as a collaborator."),
      g("connect", "GitHub Setup", "Mentee",
        "Each student connects their repo in Forge",
        `In Forge, sign in as ${MENTEE1} → Connections (/connections) → Connect GitHub → authorize. Repeat for ${MENTEE2} and ${MENTOR2}. Each student's repo then shows under My Repository (/mentee/github).`,
        "Each student's repo is linked to their Forge account.",
        "khushi-forecast shows for Khushi, nikith-forecast for Nikith, etc."),
      g("activity", "GitHub Setup", "Mentee",
        "Generate independent activity",
        `On GitHub.com, as ${MENTEE1}, push a commit and open a PR in khushi-forecast ONLY. As ${MENTEE2}, push a different commit + PR in nikith-forecast.`,
        "Each student repo has its OWN commits/PRs (no overlap).",
        "Khushi's and Nikith's repos show different, independent activity."),
      g("teacher-grid", "GitHub Validation", "Teacher",
        "Teacher sees the per-student repo grid",
        `Sign in as ${TEACHER}. GitHub → Teams (/teacher/github/teams) → open the ML team. Confirm the PER-STUDENT repository grid lists khushi-forecast, nikith-forecast, anwesha-forecast — one card per student.`,
        "The team view shows one independent repo per student.",
        "Three separate student repos are listed for the team."),
      g("student-repo", "GitHub Validation", "Mentee",
        "Drill into one student's repo",
        `As ${MENTEE1}, open My Repository (/mentee/github). Confirm it shows ONLY Khushi's repo — her commits, PRs, branches, milestones — and none of Nikith's.`,
        "The student repo shows only that student's independent activity.",
        "Khushi's view contains only khushi-forecast activity."),
      g("compare", "GitHub Validation", "Teacher",
        "Compare students side by side",
        `As ${TEACHER}, open Student Contributions (/teacher/github/students). Compare Khushi vs Nikith — confirm their commit/PR counts differ (separate repos).`,
        "Students can be compared; counts are independent.",
        "Khushi and Nikith show distinct, comparable metrics."),
    ];
  }

  // DVA + SDSE — one SHARED team repo
  const repoName = domain === "DVA" ? "dva-team/viz-stories" : "sdse-team/shipyard";
  const emphasis = domain === "DVA" ? "data-storytelling dashboards" : "the deployment console / engineering work";
  return [
    g("repo", "GitHub Setup", "Mentor",
      "Create ONE shared team repo",
      `${domain} = the whole team shares ONE repo. On GitHub.com, as ${MENTOR1}, create the shared repo "${repoName}" for ${emphasis}.`,
      "A single shared repo exists for the team.",
      `${repoName} exists on GitHub.`),
    g("collab", "GitHub Setup", "Mentor",
      "Add the whole team as collaborators",
      `On GitHub.com, open ${repoName} → Settings → Collaborators. Add ${MENTOR2}, ${MENTEE1} and ${MENTEE2} with Write access (the whole team works in this one repo).`,
      "Anwesha, Khushi and Nikith all have Write access to the shared repo.",
      "The shared repo lists all team members as collaborators."),
    g("connect", "GitHub Setup", "Mentor",
      "Connect the shared repo in Forge",
      `In Forge as ${MENTOR1}, open Connections (/connections) → Connect GitHub → authorize, then confirm the shared repo appears under Repository (/mentor/github/repo).`,
      "The shared repo is linked to the team in Forge.",
      `${repoName} shows under the mentor's Repository view.`),
    g("activity", "GitHub Setup", "Mentee",
      "Team generates shared-repo activity",
      `On GitHub.com, in ${repoName}: as ${MENTEE1} push a commit + open a PR; as ${MENTEE2} push another commit + PR; as ${MENTOR2} review a PR. (All in the ONE shared repo.)`,
      "The shared repo has commits/PRs from multiple members.",
      "Multiple members' contributions exist in the single shared repo."),
    g("teacher", "GitHub Validation", "Teacher",
      "Teacher sees the shared repo with team context",
      `Sign in as ${TEACHER}. GitHub → Teams (/teacher/github/teams) → open the ${domain} team. Confirm the SHARED repo shows with full team context (members, branches, releases, activity).`,
      "The team view shows the single shared repo with team context.",
      "The shared repo renders with members + activity."),
    g("deliverables", "GitHub Validation", "Mentor",
      "Deliverables + progress",
      `As ${MENTOR1}, open Repository (/mentor/github/repo) → the repo detail → Progress. Confirm deliverables and milestones are tracked for the shared repo.`,
      "Deliverables and milestones are tracked alongside the repo.",
      "Deliverables + milestones show for the shared repo."),
    g("contrib", "GitHub Validation", "Mentor",
      "Per-student contributions to the shared repo",
      `As ${MENTOR1}, open Student Performance (/mentor/github/students). Confirm each member's contribution to the ONE shared repo is attributed correctly (Khushi vs Nikith vs Anwesha).`,
      "Per-member contributions to the shared repo are shown.",
      "Each member's share of the shared-repo activity is visible."),
  ];
}

const GROUP_ORDER = [
  "User Management", "Team Setup", "GitHub Setup", "Teacher", "Mentor", "Mentee",
  "GitHub Validation", "Concerns & Demerits", "Discord Integration", "Calendar Integration", "Notifications",
];

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

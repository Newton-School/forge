import { Errors } from "../../lib/errors.js";
import { logger } from "../../lib/logger.js";
import { audit } from "../../lib/audit.js";
import type { AuthContext } from "../../rbac/types.js";
import { emailProvider } from "../email/email.provider.js";
import { buildIssueEmail } from "../email/issue-report.js";
import { inviteUser } from "../invitations/invitations.service.js";
import { testingRepo } from "./testing.repository.js";
import { isTester, isTestingAdmin, TESTING_ADMIN_EMAIL } from "./testing.allowlist.js";
import { TESTER_ROSTER, teamIdFor, teamNameFor, ROSTER_EMAILS, ALL_TEST_TEAM_IDS, ALL_DOMAIN_KEYS } from "./testing.roster.js";
import type { SaveProgressInput, ReportIssueInput } from "./testing.schema.js";

/** Gate: only the authorized tester allowlist may use the Testing Portal. */
export function assertTester(ctx: AuthContext): void {
  if (!isTester(ctx.email)) throw Errors.forbidden("Not an authorized tester");
}

export async function whoami(ctx: AuthContext) {
  return {
    email: ctx.email,
    name: ctx.fullName,
    role: ctx.roles[0]?.role ?? null, // primary RBAC role (real, from the session)
    isTester: isTester(ctx.email),
    isAdmin: isTestingAdmin(ctx.email),
  };
}

export async function getProgress(ctx: AuthContext) {
  assertTester(ctx);
  return { items: await testingRepo.progressForTester(ctx.email.toLowerCase()) };
}

export async function saveProgress(ctx: AuthContext, domainKey: string, data: SaveProgressInput) {
  assertTester(ctx);
  // Server is authoritative for status: derive it from done/skipped against the plan's real
  // step count (the client can't be trusted to know "completed"). Falls back to the client
  // value only if the plan isn't seeded yet.
  const total = await testingRepo.planStepCount(domainKey);
  const handled = new Set([...data.done, ...data.skipped]).size;
  const status = total > 0
    ? (handled >= total ? "COMPLETED" : handled > 0 || data.current > 0 ? "IN_PROGRESS" : "NOT_STARTED")
    : data.status;
  return testingRepo.upsertProgress(ctx.email.toLowerCase(), domainKey, {
    status,
    done: data.done,
    skipped: data.skipped,
    current: data.current,
  });
}

export async function reportIssue(ctx: AuthContext, input: ReportIssueInput) {
  assertTester(ctx);
  const issue = await testingRepo.createIssue({
    testerEmail: ctx.email.toLowerCase(),
    domainKey: input.domainKey,
    stepId: input.stepId ?? null,
    title: input.title,
    description: input.description ?? null,
    severity: input.severity,
  });
  // Best-effort branded notification to the Testing Admin — never block capture on email.
  const mail = buildIssueEmail({
    title: input.title,
    description: input.description,
    severity: input.severity,
    domainKey: input.domainKey,
    stepId: input.stepId,
    reporterEmail: ctx.email,
  });
  void emailProvider()
    .send({ to: [TESTING_ADMIN_EMAIL], subject: mail.subject, html: mail.html, text: mail.text })
    .catch((err) => logger.warn({ err }, "testing issue email failed (recorded anyway)"));
  return issue;
}

/** Gate shared by every destructive/provisioning testing action. */
function assertTestingAdmin(ctx: AuthContext, what: string): void {
  assertTester(ctx);
  if (!isTestingAdmin(ctx.email)) throw Errors.forbidden(`Only the Testing Admin can ${what}`);
}

/**
 * Reset ALL provisioned testing data: delete the roster users + their test teams and every
 * record hanging off them, keeping the seeded Admin/LCC, the domains/drive, and the
 * TestingProgress/TestIssue report. This is what enforces "one domain at a time" — it runs
 * before provisioning a new domain and on an explicit End Testing.
 */
async function resetProvisioned(ctx: AuthContext, ip?: string) {
  const [users, teams] = await Promise.all([
    testingRepo.testerIds(ROSTER_EMAILS),
    testingRepo.existingTestTeams(ALL_TEST_TEAM_IDS),
  ]);
  const userIds = users.map((u) => u.id);
  const teamIds = teams.map((t) => t.id);
  if (!userIds.length && !teamIds.length) return { removedUsers: 0, removedTeams: 0 };
  const removedUsers = await testingRepo.teardown(userIds, teamIds);
  await audit(ctx, {
    action: "testing:teardown", entityType: "Domain", entityId: "*",
    after: { removedUsers, teamIds, emails: users.map((u) => u.email) }, ip,
  });
  return { removedUsers, removedTeams: teamIds.length };
}

/** End Testing: tear down the active domain's environment without provisioning a new one. */
export async function endTesting(ctx: AuthContext, ip?: string) {
  assertTestingAdmin(ctx, "end testing");
  return resetProvisioned(ctx, ip);
}

/**
 * Provision a domain's real testing environment: upsert the fixed tester roster as real
 * users with their RBAC roles, the domain team + memberships, and send a Google-OAuth
 * onboarding invite to each NEWLY created account. Restricted to the Testing Admin.
 *
 * Single-domain-at-a-time: any previously provisioned domain is torn down FIRST, so the
 * roster is always re-created fresh for the new domain (and thus re-invited).
 */
export async function provisionDomain(ctx: AuthContext, domainKey: string, ip?: string) {
  assertTestingAdmin(ctx, "provision a domain");

  const domain = await testingRepo.domainByKey(domainKey);
  if (!domain) throw Errors.notFound(`Domain ${domainKey} not found — run the seed first`);

  // Enforce one-domain-at-a-time: clear whatever was provisioned before starting this one.
  const cleared = await resetProvisioned(ctx, ip);

  const teamId = teamIdFor(domainKey);
  const team = await testingRepo.upsertTeam(teamId, domain.id, teamNameFor(domainKey));

  const members: Array<{ email: string; role: string; created: boolean; invited: boolean }> = [];
  for (const m of TESTER_ROSTER) {
    const user = await testingRepo.ensureUser(m.email, m.fullName);
    const scopeId = m.scope === "DOMAIN" ? domain.id : m.scope === "TEAM" ? teamId : null;
    await testingRepo.ensureRole(user.id, m.role, m.scope, scopeId);
    if (m.memberRole) await testingRepo.ensureMember(teamId, user.id, m.memberRole);
    if (m.primaryMentor) await testingRepo.setTeamMentor(teamId, user.id);

    // Invite only freshly created accounts — avoids re-emailing real people on re-runs.
    let invited = false;
    if (user.created) {
      const labels = { role: m.roleLabel, domain: domain.name, team: m.scope === "DOMAIN" ? "—" : team.name };
      await inviteUser({ id: user.id, email: user.email, fullName: user.fullName }, labels, ctx, ip);
      invited = true;
    }
    members.push({ email: m.email, role: m.role, created: user.created, invited });
  }

  await audit(ctx, {
    action: "testing:provision", entityType: "Domain", entityId: domain.id,
    after: { domainKey, teamId, invited: members.filter((x) => x.invited).map((x) => x.email) }, ip,
  });
  return { domain: domainKey, teamId, cleared, members };
}

export async function listIssues(ctx: AuthContext) {
  assertTester(ctx);
  // The Testing Admin sees every report; other testers see only their own.
  const items = isTestingAdmin(ctx.email)
    ? await testingRepo.allIssues()
    : await testingRepo.issuesForTester(ctx.email.toLowerCase());
  return { items };
}

/** The DB-backed guided test plans (production source of the test script). */
export async function getPlans(ctx: AuthContext) {
  assertTester(ctx);
  const plans = await testingRepo.allPlans();
  return {
    items: plans.map((p) => ({
      domainKey: p.domainKey,
      name: p.name,
      model: p.model,
      steps: p.steps.map((s) => ({
        id: s.stepKey, group: s.group, role: s.role,
        title: s.title, instruction: s.instruction, expected: s.expected, success: s.success,
      })),
    })),
  };
}

/**
 * The REAL provisioned environment for a domain (production — no mock data). Returns the test
 * team, its members by role, repos, and the domain teacher. `provisioned:false` when the
 * domain hasn't been started yet.
 */
export async function getEnvironment(ctx: AuthContext, domainKey: string) {
  assertTester(ctx);
  const domain = await testingRepo.domainByKey(domainKey);
  if (!domain) throw Errors.notFound(`Domain ${domainKey} not found — run the seed first`);
  const { team, teachers } = await testingRepo.environmentFor(domain.id, teamIdFor(domainKey));
  if (!team) {
    return { provisioned: false, teachers: [], mentors: [], students: [], teams: [], repositories: [], milestones: [], deliverables: [] };
  }
  const byRole = (role: string) => team.members.filter((m) => m.memberRole === role).map((m) => m.user.fullName);
  return {
    provisioned: true,
    teachers: teachers.map((t) => t.fullName),
    mentors: byRole("Mentor"),
    students: byRole("Mentee"),
    teams: [team.name],
    repositories: team.repositories.map((r) => r.fullName),
    milestones: [], // not provisioned under the chosen scope — real data only, no mock fillers
    deliverables: [],
  };
}

/**
 * Persistent testing report — survives teardown (it's keyed by email, never deleted). Admin
 * sees every tester's progress + all issues; other testers see only their own. Rolls the
 * raw progress rows up into one status per domain plus an issue count.
 */
export async function getReport(ctx: AuthContext) {
  assertTester(ctx);
  const admin = isTestingAdmin(ctx.email);
  const email = ctx.email.toLowerCase();
  const [progress, issues] = await Promise.all([
    admin ? testingRepo.allProgress() : testingRepo.progressForTester(email),
    admin ? testingRepo.allIssues() : testingRepo.issuesForTester(email),
  ]);

  // COMPLETED wins over IN_PROGRESS wins over NOT_STARTED when several rows exist per domain.
  const rank = { COMPLETED: 3, IN_PROGRESS: 2, NOT_STARTED: 1 } as const;
  const summary = ALL_DOMAIN_KEYS.map((domainKey) => {
    const rows = progress.filter((p) => p.domainKey === domainKey);
    const status = rows.reduce<keyof typeof rank>(
      (best, r) => (rank[r.status] > rank[best] ? r.status : best), "NOT_STARTED");
    const updatedAt = rows.reduce<Date | null>((latest, r) => (!latest || r.updatedAt > latest ? r.updatedAt : latest), null);
    return { domainKey, status, issues: issues.filter((i) => i.domainKey === domainKey).length, updatedAt };
  });

  return { admin, summary, progress, issues };
}

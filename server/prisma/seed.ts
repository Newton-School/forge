/**
 * Seed the allowlist + a little reference data so Google login works end-to-end.
 * Idempotent (upserts). Run: npm run db:seed   (needs DATABASE_URL).
 *
 * Login only succeeds for emails seeded here (on the ALLOWED_HOSTED_DOMAIN).
 */
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

// Prisma 7: the client connects via a driver adapter. Seed uses the direct
// (non-pooled) URL when available, falling back to DATABASE_URL.
const adapter = new PrismaPg({
  connectionString: process.env.DIRECT_URL ?? process.env.DATABASE_URL,
});
const prisma = new PrismaClient({ adapter });
const DOMAIN = process.env.ALLOWED_HOSTED_DOMAIN ?? "rishihood.edu.in";

async function main() {
  const drive = await prisma.drive.upsert({
    where: { id: "drive-2026" },
    update: {},
    create: { id: "drive-2026", name: "Summer Profile Building Drive", year: 2026, active: true },
  });

  // Domain-adaptive GitHub repo model: AI = org + shared repos; ML = one repo per student;
  // DVA / SDSE = one shared team repo. Drives the team-first, domain-adaptive dashboards.
  const REPO_MODEL = { AI: "ORG", ML: "PER_STUDENT", DVA: "SHARED", SDSE: "SHARED" } as const;
  const domains = await Promise.all(
    [
      { id: "d-ai", key: "AI", name: "Artificial Intelligence" },
      { id: "d-ml", key: "ML", name: "Machine Learning" },
      { id: "d-sdse", key: "SDSE", name: "Software Dev & Systems Eng" },
      { id: "d-dva", key: "DVA", name: "Data Visualisation & Analytics" },
    ].map((d) =>
      prisma.domain.upsert({
        where: { id: d.id },
        update: { name: d.name, key: d.key, githubRepoModel: REPO_MODEL[d.key as keyof typeof REPO_MODEL] },
        create: { id: d.id, driveId: drive.id, key: d.key, name: d.name, githubRepoModel: REPO_MODEL[d.key as keyof typeof REPO_MODEL] },
      }),
    ),
  );

  type Seed = { email: string; fullName: string; role: "ADMIN" | "LCC" | "TEACHER" | "MENTOR" | "MENTEE"; scopeType: "GLOBAL" | "DOMAIN" | "TEAM" | "SELF"; scopeId?: string };
  const users: Seed[] = [
    { email: `admin@${DOMAIN}`, fullName: "Platform Admin", role: "ADMIN", scopeType: "GLOBAL" },
    { email: `lcc@${DOMAIN}`, fullName: "LCC Coordinator", role: "LCC", scopeType: "GLOBAL" },
    { email: `teacher@${DOMAIN}`, fullName: "Bipul Kumar", role: "TEACHER", scopeType: "DOMAIN", scopeId: "d-ai" },
    { email: `mentor@${DOMAIN}`, fullName: "Aryan Sharma", role: "MENTOR", scopeType: "TEAM", scopeId: "t-ai-07" },
    { email: `mentee@${DOMAIN}`, fullName: "Sneha Iyer", role: "MENTEE", scopeType: "SELF" },
  ];

  for (const u of users) {
    const user = await prisma.user.upsert({
      where: { email: u.email },
      update: { fullName: u.fullName, status: "ACTIVE" },
      create: { email: u.email, fullName: u.fullName, status: "ACTIVE" },
    });
    // ensure the role grant exists (unique on user+role+scopeType+scopeId)
    await prisma.userRole.upsert({
      where: {
        userId_role_scopeType_scopeId: {
          userId: user.id, role: u.role, scopeType: u.scopeType, scopeId: u.scopeId ?? null,
        },
      },
      update: {},
      create: { userId: user.id, role: u.role, scopeType: u.scopeType, scopeId: u.scopeId ?? null },
    });
  }

  // give the teacher a second domain (multi-domain teacher)
  const teacher = await prisma.user.findUnique({ where: { email: `teacher@${DOMAIN}` } });
  if (teacher) {
    await prisma.userRole.upsert({
      where: { userId_role_scopeType_scopeId: { userId: teacher.id, role: "TEACHER", scopeType: "DOMAIN", scopeId: "d-ml" } },
      update: {},
      create: { userId: teacher.id, role: "TEACHER", scopeType: "DOMAIN", scopeId: "d-ml" },
    });
  }

  // a team in AI led by the mentor
  const mentor = await prisma.user.findUnique({ where: { email: `mentor@${DOMAIN}` } });
  const mentee = await prisma.user.findUnique({ where: { email: `mentee@${DOMAIN}` } });
  if (mentor) {
    const team = await prisma.team.upsert({
      where: { id: "t-ai-07" },
      update: { mentorId: mentor.id },
      create: { id: "t-ai-07", domainId: "d-ai", name: "AI Group 07", alias: "GROUP", mentorId: mentor.id },
    });
    if (mentee) {
      await prisma.teamMember.upsert({
        where: { teamId_userId: { teamId: team.id, userId: mentee.id } },
        update: {},
        create: { teamId: team.id, userId: mentee.id, memberRole: "Mentee" },
      });
    }
  }

  // ── Non-AI domains: team-first GitHub structure (ML per-student, DVA/SDSE shared) ──────
  const ensureUser = (email: string, fullName: string, githubUsername: string) =>
    prisma.user.upsert({
      where: { email },
      update: { fullName, status: "ACTIVE", githubUsername },
      create: { email, fullName, status: "ACTIVE", githubUsername },
    });
  const ensureMember = (teamId: string, userId: string, memberRole: string) =>
    prisma.teamMember.upsert({ where: { teamId_userId: { teamId, userId } }, update: { memberRole }, create: { teamId, userId, memberRole } });
  const ensureSelfRole = (userId: string) =>
    prisma.userRole.upsert({
      where: { userId_role_scopeType_scopeId: { userId, role: "MENTEE", scopeType: "SELF", scopeId: null } },
      update: {}, create: { userId, role: "MENTEE", scopeType: "SELF" },
    });
  const ensureMentorRole = (userId: string, teamId: string) =>
    prisma.userRole.upsert({
      where: { userId_role_scopeType_scopeId: { userId, role: "MENTOR", scopeType: "TEAM", scopeId: teamId } },
      update: {}, create: { userId, role: "MENTOR", scopeType: "TEAM", scopeId: teamId },
    });
  const ensureRepo = (r: { teamId: string; ownerUserId: string | null; ownerRole: "OWNER" | "MAINTAINER" | "COLLABORATOR"; owner: string; name: string; fullName: string; description: string; hasIssues: boolean }) =>
    prisma.repository.upsert({
      where: { fullName: r.fullName },
      update: { teamId: r.teamId, ownerUserId: r.ownerUserId, ownerRole: r.ownerRole, owner: r.owner, name: r.name, description: r.description, hasIssues: r.hasIssues },
      create: { teamId: r.teamId, ownerUserId: r.ownerUserId, ownerRole: r.ownerRole, owner: r.owner, name: r.name, fullName: r.fullName, description: r.description, hasIssues: r.hasIssues, visibility: "PUBLIC", defaultBranch: "main", topics: [] },
    });

  // ML — Insight Squad (per-student repos: one independent repo per student)
  const mlMentor = await ensureUser(`neha.gupta@${DOMAIN}`, "Neha Gupta", "neha-g");
  const mlTeam = await prisma.team.upsert({
    where: { id: "t-ml-insight" }, update: { mentorId: mlMentor.id, name: "Insight Squad" },
    create: { id: "t-ml-insight", domainId: "d-ml", name: "Insight Squad", alias: "SQUAD", mentorId: mlMentor.id },
  });
  await ensureMentorRole(mlMentor.id, mlTeam.id);
  for (const s of [
    { email: `rohit.sen@${DOMAIN}`, name: "Rohit Sen", login: "rohit-sen", lead: true },
    { email: `lakshmi.menon@${DOMAIN}`, name: "Lakshmi Menon", login: "lakshmi-m", lead: false },
    { email: `rajan.mehta@${DOMAIN}`, name: "Rajan Mehta", login: "rajan-m", lead: false },
  ]) {
    const u = await ensureUser(s.email, s.name, s.login);
    await ensureSelfRole(u.id);
    await ensureMember(mlTeam.id, u.id, s.lead ? "Maintainer" : "Mentee");
    await ensureRepo({ teamId: mlTeam.id, ownerUserId: u.id, ownerRole: "OWNER", owner: s.login, name: `${s.login}-forecast`, fullName: `${s.login}/${s.login}-forecast`, description: `${s.name.split(" ")[0]}'s individual forecasting project.`, hasIssues: false });
  }

  // DVA — Dashboard Crew (shared team repo)
  const dvaMentor = await ensureUser(`ananya.bose@${DOMAIN}`, "Ananya Bose", "ananya-bose");
  const dvaTeam = await prisma.team.upsert({ where: { id: "t-dva-crew" }, update: { mentorId: dvaMentor.id }, create: { id: "t-dva-crew", domainId: "d-dva", name: "Dashboard Crew", alias: "TEAM", mentorId: dvaMentor.id } });
  await ensureMentorRole(dvaMentor.id, dvaTeam.id);
  for (const s of [{ email: `kabir.singh@${DOMAIN}`, name: "Kabir Singh", login: "kabir-s", lead: true }, { email: `ishita.b@${DOMAIN}`, name: "Ishita Bose", login: "ishita-b", lead: false }]) {
    const u = await ensureUser(s.email, s.name, s.login); await ensureSelfRole(u.id); await ensureMember(dvaTeam.id, u.id, s.lead ? "Maintainer" : "Mentee");
  }
  await ensureRepo({ teamId: dvaTeam.id, ownerUserId: null, ownerRole: "MAINTAINER", owner: "ananya-bose", name: "viz-stories", fullName: "ananya-bose/viz-stories", description: "Shared data-storytelling dashboards (DVA).", hasIssues: false });

  // SDSE — Shipyard Team (shared team repo)
  const sdseMentor = await ensureUser(`ishaan.roy@${DOMAIN}`, "Ishaan Roy", "ishaan-roy");
  const sdseTeam = await prisma.team.upsert({ where: { id: "t-sdse-shipyard" }, update: { mentorId: sdseMentor.id }, create: { id: "t-sdse-shipyard", domainId: "d-sdse", name: "Shipyard Team", alias: "TEAM", mentorId: sdseMentor.id } });
  await ensureMentorRole(sdseMentor.id, sdseTeam.id);
  for (const s of [{ email: `aniket.sharma@${DOMAIN}`, name: "Aniket Sharma", login: "aniket", lead: true }, { email: `priya.kulkarni@${DOMAIN}`, name: "Priya Kulkarni", login: "priyak", lead: false }]) {
    const u = await ensureUser(s.email, s.name, s.login); await ensureSelfRole(u.id); await ensureMember(sdseTeam.id, u.id, s.lead ? "Maintainer" : "Mentee");
  }
  await ensureRepo({ teamId: sdseTeam.id, ownerUserId: null, ownerRole: "MAINTAINER", owner: "ishaan-roy", name: "shipyard", fullName: "ishaan-roy/shipyard", description: "Shared deployment console (SDSE).", hasIssues: false });

  console.log(`Seeded drive, ${domains.length} domains (with repo models), users + non-AI teams/repos (allowlist on @${DOMAIN}).`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());

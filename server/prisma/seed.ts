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

  const domains = await Promise.all(
    [
      { id: "d-ai", key: "AI", name: "Artificial Intelligence" },
      { id: "d-ml", key: "ML", name: "Machine Learning" },
      { id: "d-sdse", key: "SDSE", name: "Software Dev & Systems Eng" },
    ].map((d) =>
      prisma.domain.upsert({
        where: { id: d.id },
        update: { name: d.name, key: d.key },
        create: { id: d.id, driveId: drive.id, key: d.key, name: d.name },
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

  console.log(`Seeded drive, ${domains.length} domains, ${users.length} users (allowlist on @${DOMAIN}).`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());

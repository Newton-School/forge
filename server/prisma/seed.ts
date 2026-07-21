/**
 * Seed the allowlist + structural reference data so Google login works end-to-end.
 * Idempotent (upserts). Run: npm run db:seed   (needs DATABASE_URL).
 *
 * Login only succeeds for emails seeded here. We seed ONLY the two real bootstrap
 * accounts — the Admin and the LCC — who then onboard everyone else in-app
 * (invite-only). No mock users, mock teams, or placeholder repos.
 */
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { seedTestPlans } from "../src/modules/testing/testing.plans.data.js";
import { env } from "../src/config/env.js";
import { testingPortalEnabled } from "../src/modules/testing/testing.config.js";

// Prisma 7: the client connects via a driver adapter. Seed uses the direct
// (non-pooled) URL when available, falling back to DATABASE_URL.
const adapter = new PrismaPg({
  connectionString: process.env.DIRECT_URL ?? process.env.DATABASE_URL,
});
const prisma = new PrismaClient({ adapter });

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

  // Bootstrap accounts come from env (no personal data in code). Everyone else is onboarded
  // in-app (invite-only). Unset => that account is not seeded.
  type Seed = { email: string; fullName: string; role: "ADMIN" | "LCC" };
  const users: Seed[] = [];
  if (env.BOOTSTRAP_ADMIN_EMAIL) users.push({ email: env.BOOTSTRAP_ADMIN_EMAIL, fullName: env.BOOTSTRAP_ADMIN_NAME, role: "ADMIN" });
  if (env.BOOTSTRAP_LCC_EMAIL) users.push({ email: env.BOOTSTRAP_LCC_EMAIL, fullName: env.BOOTSTRAP_LCC_NAME, role: "LCC" });
  if (users.length === 0) {
    console.warn("No BOOTSTRAP_ADMIN_EMAIL / BOOTSTRAP_LCC_EMAIL set — seeding no bootstrap users. Set them to provision the first Admin/LCC allowlist entries.");
  }

  for (const u of users) {
    const user = await prisma.user.upsert({
      where: { email: u.email },
      update: { fullName: u.fullName, status: "ACTIVE" },
      create: { email: u.email, fullName: u.fullName, status: "ACTIVE" },
    });
    // GLOBAL role grant. Find-or-create rather than upsert: the compound-unique `where` can't
    // target a null scopeId (Prisma types it non-null), and a GLOBAL grant has scopeId = null.
    const existingRole = await prisma.userRole.findFirst({
      where: { userId: user.id, role: u.role, scopeType: "GLOBAL", scopeId: null },
    });
    if (!existingRole) {
      await prisma.userRole.create({ data: { userId: user.id, role: u.role, scopeType: "GLOBAL" } });
    }
  }

  // Guided test plans belong to the Testing Portal — only seed them when it's enabled.
  const plans = testingPortalEnabled() ? await seedTestPlans(prisma) : 0;

  console.log(`Seeded drive, ${domains.length} domains (with repo models), ${users.length} bootstrap users (ADMIN + LCC), and ${plans} test plans.`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());

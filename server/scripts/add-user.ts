/**
 * Add (or update) an allowlisted Forge user, so a Newton login for that email is accepted.
 * Invite-only gate: a Newton login only succeeds if the email exists here.
 *
 *   npx tsx --env-file=.env scripts/add-user.ts <email> "<Full Name>" [ROLE]
 *
 * ROLE ∈ ADMIN | LCC | TEACHER | MENTOR | MENTEE  (default: ADMIN), granted at GLOBAL scope.
 * Example:
 *   npx tsx --env-file=.env scripts/add-user.ts jane@nst.rishihood.edu.in "Jane Doe" ADMIN
 */
import { PrismaClient, type RoleKey } from "@prisma/client";

const prisma = new PrismaClient();
const ROLES: RoleKey[] = ["ADMIN", "LCC", "TEACHER", "MENTOR", "MENTEE"];

async function main() {
  const [emailArg, fullName, roleArg = "ADMIN"] = process.argv.slice(2);
  if (!emailArg || !fullName) {
    console.error('Usage: add-user.ts <email> "<Full Name>" [ROLE]');
    process.exit(1);
  }
  const email = emailArg.toLowerCase();
  const role = roleArg.toUpperCase() as RoleKey;
  if (!ROLES.includes(role)) {
    console.error(`Invalid role "${roleArg}". One of: ${ROLES.join(", ")}`);
    process.exit(1);
  }

  const user = await prisma.user.upsert({
    where: { email },
    update: { fullName, status: "ACTIVE" },
    create: { email, fullName, status: "ACTIVE" },
  });

  // GLOBAL grant (scopeId = null) — find-or-create, mirroring prisma/seed.ts.
  const existing = await prisma.userRole.findFirst({
    where: { userId: user.id, role, scopeType: "GLOBAL", scopeId: null },
  });
  if (!existing) {
    await prisma.userRole.create({ data: { userId: user.id, role, scopeType: "GLOBAL" } });
  }

  console.log(`✅ ${email} is ACTIVE with ${role} (GLOBAL). Newton login for this email will now be accepted.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

import { prisma } from "../../lib/db.js";
import type { CreateDomainInput, CreateTeamInput } from "./org.schema.js";

/** Data access for domains, teams and membership. Scope `where` is built by callers. */
export const orgRepo = {
  activeDriveId: async (): Promise<string | null> => {
    const d = await prisma.drive.findFirst({ where: { active: true }, select: { id: true }, orderBy: { createdAt: "desc" } });
    return d?.id ?? null;
  },

  // ── Domains ─────────────────────────────────────────────────────────────────
  listDomains: (where: Record<string, unknown>) =>
    prisma.domain.findMany({
      where,
      select: { id: true, key: true, name: true, active: true, teachers: { select: { id: true, fullName: true } } },
      orderBy: { name: "asc" },
    }),
  domainKeyExists: async (key: string): Promise<boolean> =>
    (await prisma.domain.findFirst({ where: { key }, select: { id: true } })) !== null,
  createDomain: (driveId: string, input: CreateDomainInput) =>
    prisma.domain.create({ data: { driveId, key: input.key, name: input.name } }),
  findDomain: (id: string) => prisma.domain.findUnique({ where: { id }, select: { id: true } }),
  updateDomain: (id: string, data: Record<string, unknown>) => prisma.domain.update({ where: { id }, data }),

  // ── Teams ─────────────────────────────────────────────────────────────────
  listTeams: (where: Record<string, unknown>) =>
    prisma.team.findMany({
      where,
      select: {
        id: true, name: true, alias: true, domainId: true,
        mentor: { select: { id: true, fullName: true } },
        domain: { select: { key: true } },
        _count: { select: { members: true } },
      },
      orderBy: { name: "asc" },
    }),
  findTeam: (id: string) => prisma.team.findUnique({ where: { id }, select: { id: true, domainId: true } }),
  createTeam: (input: CreateTeamInput) =>
    prisma.team.create({
      data: {
        domainId: input.domainId, name: input.name, alias: input.alias,
        mentorId: input.mentorId ?? null,
        githubRepoUrl: input.githubRepoUrl ?? null,
        discordChannelId: input.discordChannelId ?? null,
      },
    }),
  updateTeam: (id: string, data: Record<string, unknown>) => prisma.team.update({ where: { id }, data }),

  // ── Membership ────────────────────────────────────────────────────────────
  userExists: async (userId: string): Promise<boolean> =>
    (await prisma.user.findUnique({ where: { id: userId }, select: { id: true } })) !== null,
  addMember: (teamId: string, userId: string, memberRole: string, squadId: string | null) =>
    prisma.teamMember.create({ data: { teamId, userId, memberRole, squadId } }),
  removeMember: (teamId: string, userId: string) =>
    prisma.teamMember.deleteMany({ where: { teamId, userId } }),
};

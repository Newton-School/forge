import { prisma } from "../../lib/db.js";
import type { ScopeType } from "../../rbac/types.js";
import type { AssignRoleInput, CreateUserInput, ListUsersQuery } from "./users.schema.js";

const withRoles = { roles: true } as const;

export interface DerivedScope {
  scopeType: ScopeType;
  scopeId: string | null;
}

/** Team membership role label for a Forge role (TeamMember.memberRole is a free string). */
function memberRoleFor(role: CreateUserInput["role"]): string {
  if (role === "MENTOR") return "Mentor";
  if (role === "MENTEE") return "Mentee";
  return role.charAt(0) + role.slice(1).toLowerCase();
}

/** Data access for users — the only place these queries live (swappable, testable). */
export const usersRepo = {
  list: (q: ListUsersQuery) =>
    prisma.user.findMany({
      where: { deletedAt: null, ...(q.status ? { status: q.status } : {}) },
      include: withRoles,
      orderBy: { createdAt: "desc" },
      take: q.take,
      skip: q.skip,
    }),

  count: (q: ListUsersQuery) =>
    prisma.user.count({ where: { deletedAt: null, ...(q.status ? { status: q.status } : {}) } }),

  findById: (id: string) => prisma.user.findFirst({ where: { id, deletedAt: null }, include: withRoles }),

  findByEmail: (email: string) => prisma.user.findUnique({ where: { email } }),

  create: (input: CreateUserInput, scope: DerivedScope, teamId: string | null, createdById: string | null) =>
    prisma.user.create({
      data: {
        email: input.email,
        fullName: input.fullName,
        status: input.status,
        createdById,
        roles: { create: { role: input.role, scopeType: scope.scopeType, scopeId: scope.scopeId } },
        // A team assignment also creates the membership row (mentor/mentee on the team).
        ...(teamId ? { teamMemberships: { create: { teamId, memberRole: memberRoleFor(input.role) } } } : {}),
      },
      include: withRoles,
    }),

  /** The first team a user mentors — used to place a mentee on their mentor's team. */
  mentorTeamId: async (mentorId: string): Promise<string | null> => {
    const t = await prisma.team.findFirst({ where: { mentorId }, select: { id: true } });
    return t?.id ?? null;
  },

  /** Domain + team labels resolved from ids (onboarding email). */
  labelsFor: async (domainId: string | null, teamId: string | null): Promise<{ domain: string; team: string }> => {
    let domain = "—", team = "—";
    if (teamId) {
      const t = await prisma.team.findUnique({ where: { id: teamId }, select: { name: true, domain: { select: { name: true } } } });
      if (t) { team = t.name; domain = t.domain?.name ?? domain; }
    }
    if (domainId && domain === "—") {
      const d = await prisma.domain.findUnique({ where: { id: domainId }, select: { name: true } });
      domain = d?.name ?? domain;
    }
    return { domain, team };
  },

  update: (id: string, data: { fullName?: string; status?: CreateUserInput["status"] }) =>
    prisma.user.update({ where: { id }, data, include: withRoles }),

  addRole: (userId: string, r: AssignRoleInput) =>
    prisma.userRole.create({ data: { userId, role: r.role, scopeType: r.scopeType, scopeId: r.scopeId ?? null } }),
};

export type UserWithRoles = Awaited<ReturnType<typeof usersRepo.findById>>;

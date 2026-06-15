import { prisma } from "../../lib/db.js";
import type { AssignRoleInput, CreateUserInput, ListUsersQuery } from "./users.schema.js";

const withRoles = { roles: true } as const;

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

  create: (input: CreateUserInput, createdById: string | null) =>
    prisma.user.create({
      data: {
        email: input.email,
        fullName: input.fullName,
        status: input.status,
        createdById,
        roles: { create: { role: input.role, scopeType: input.scopeType, scopeId: input.scopeId ?? null } },
      },
      include: withRoles,
    }),

  update: (id: string, data: { fullName?: string; status?: CreateUserInput["status"] }) =>
    prisma.user.update({ where: { id }, data, include: withRoles }),

  addRole: (userId: string, r: AssignRoleInput) =>
    prisma.userRole.create({ data: { userId, role: r.role, scopeType: r.scopeType, scopeId: r.scopeId ?? null } }),
};

export type UserWithRoles = Awaited<ReturnType<typeof usersRepo.findById>>;

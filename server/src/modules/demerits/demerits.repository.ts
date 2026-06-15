import { prisma } from "../../lib/db.js";
import type { IssueDemeritInput, UpdateDemeritInput } from "./demerits.schema.js";

/** Data access for demerits. Scope `where` is built by the service. */
export const demeritsRepo = {
  list: (where: Record<string, unknown>, take: number, skip: number) =>
    prisma.demerit.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take,
      skip,
      include: { user: { select: { id: true, fullName: true, email: true } } },
    }),

  /** Find one demerit constrained by the caller's scope (out-of-scope → null). */
  findInScope: (where: Record<string, unknown>) => prisma.demerit.findFirst({ where }),

  /** Does the target user exist? (validate the subject before issuing) */
  userExists: async (userId: string): Promise<boolean> => {
    const u = await prisma.user.findUnique({ where: { id: userId }, select: { id: true } });
    return u !== null;
  },

  create: (input: IssueDemeritInput, issuedById: string) =>
    prisma.demerit.create({
      data: {
        userId: input.userId,
        reason: input.reason,
        points: input.points,
        policyRef: input.policyRef ?? null,
        escalated: input.escalated,
        issuedById,
      },
    }),

  update: (id: string, input: UpdateDemeritInput) =>
    prisma.demerit.update({
      where: { id },
      data: {
        ...(input.reason !== undefined ? { reason: input.reason } : {}),
        ...(input.points !== undefined ? { points: input.points } : {}),
        ...(input.policyRef !== undefined ? { policyRef: input.policyRef } : {}),
        ...(input.escalated !== undefined ? { escalated: input.escalated } : {}),
      },
    }),
};

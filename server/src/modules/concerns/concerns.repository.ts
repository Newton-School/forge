import { prisma } from "../../lib/db.js";
import type { CreateConcernInput } from "./concerns.schema.js";

const withEvents = { events: { orderBy: { at: "asc" as const } } } as const;

/** Data access for concerns. Callers pass a scope `where` from rbac/scopeWhere. */
export const concernsRepo = {
  list: (where: Record<string, unknown>, take: number, skip: number) =>
    prisma.concern.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        raisedBy: { select: { fullName: true, roles: { select: { role: true }, take: 1 } } },
        assignedTo: { select: { fullName: true } },
      },
      take,
      skip,
    }),

  /** Resolve domain keys for the bare domainId column on concerns. */
  domainKeys: (ids: string[]) =>
    prisma.domain.findMany({ where: { id: { in: ids } }, select: { id: true, key: true } }),

  count: (where: Record<string, unknown>) => prisma.concern.count({ where }),

  /** The caller's own team ids + the domains those teams belong to — to validate concern targets. */
  callerMemberships: async (userId: string): Promise<{ teamIds: string[]; domainIds: string[] }> => {
    const rows = await prisma.teamMember.findMany({
      where: { userId },
      select: { teamId: true, team: { select: { domainId: true } } },
    });
    return {
      teamIds: rows.map((r) => r.teamId),
      domainIds: [...new Set(rows.map((r) => r.team.domainId))],
    };
  },

  findById: (id: string) => prisma.concern.findUnique({ where: { id }, include: withEvents }),

  create: (input: CreateConcernInput, raisedById: string) =>
    prisma.concern.create({
      data: {
        raisedById,
        category: input.category,
        title: input.title,
        description: input.description,
        severity: input.severity,
        domainId: input.domainId ?? null,
        teamId: input.teamId ?? null,
        anonymous: input.anonymous,
        status: "OPEN",
        events: { create: { actorId: raisedById, toStatus: "OPEN", note: "Concern raised" } },
      },
      include: withEvents,
    }),

  transition: (
    id: string,
    to: string,
    fromStatus: string,
    actorId: string,
    note: string | undefined,
    extra: { resolutionNote?: string | null; resolvedAt?: Date | null },
  ) =>
    prisma.concern.update({
      where: { id },
      data: {
        status: to as never,
        resolutionNote: extra.resolutionNote ?? undefined,
        resolvedAt: extra.resolvedAt ?? undefined,
        events: { create: { actorId, fromStatus: fromStatus as never, toStatus: to as never, note } },
      },
      include: withEvents,
    }),
};

export type ConcernWithEvents = NonNullable<Awaited<ReturnType<typeof concernsRepo.findById>>>;

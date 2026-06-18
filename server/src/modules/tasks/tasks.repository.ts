import { prisma } from "../../lib/db.js";
import type { CreateTaskInput, UpdateTaskInput } from "./tasks.schema.js";

/** Data access for tasks. Scope `where` is built by the service. */
export const tasksRepo = {
  list: (where: Record<string, unknown>, take: number, skip: number) =>
    prisma.task.findMany({
      where,
      orderBy: [{ status: "asc" }, { assignedAt: "desc" }],
      include: { project: { select: { name: true } } },
      take,
      skip,
    }),

  /** Resolve display names for assignee/assignedBy ids (those columns have no Prisma relation). */
  userNames: (ids: string[]) =>
    prisma.user.findMany({ where: { id: { in: ids } }, select: { id: true, fullName: true } }),

  findById: (id: string) =>
    prisma.task.findUnique({
      where: { id },
      include: { project: { select: { id: true, teamId: true, team: { select: { domainId: true } } } } },
    }),

  /** The project a task would attach to, with its team for scope checks. */
  projectForScope: (projectId: string) =>
    prisma.project.findUnique({
      where: { id: projectId },
      select: { id: true, teamId: true, team: { select: { domainId: true } } },
    }),

  /** Is the user a member of the project's team? (assignee validation) */
  isTeamMember: async (teamId: string, userId: string): Promise<boolean> => {
    const m = await prisma.teamMember.findFirst({ where: { teamId, userId }, select: { id: true } });
    return m !== null;
  },

  create: (input: CreateTaskInput, assignedById: string) =>
    prisma.task.create({
      data: {
        projectId: input.projectId,
        milestoneId: input.milestoneId ?? null,
        title: input.title,
        description: input.description ?? null,
        assigneeId: input.assigneeId ?? null,
        assignedById,
        dueAt: input.dueAt ?? null,
      },
    }),

  update: (id: string, input: UpdateTaskInput) =>
    prisma.task.update({
      where: { id },
      data: {
        ...(input.title !== undefined ? { title: input.title } : {}),
        ...(input.description !== undefined ? { description: input.description } : {}),
        ...(input.status !== undefined ? { status: input.status } : {}),
        ...(input.progressPct !== undefined ? { progressPct: input.progressPct } : {}),
        ...(input.nextAction !== undefined ? { nextAction: input.nextAction } : {}),
        ...(input.dueAt !== undefined ? { dueAt: input.dueAt } : {}),
      },
    }),
};

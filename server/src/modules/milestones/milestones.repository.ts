import { prisma } from "../../lib/db.js";
import type { WorkStatus } from "./milestones.logic.js";
import type { CreateMilestoneInput } from "./milestones.schema.js";

/** Data access for milestones. Scope `where` is built by the service. */
export const milestonesRepo = {
  list: (where: Record<string, unknown>, take: number, skip: number) =>
    prisma.milestone.findMany({
      where,
      orderBy: { sequence: "asc" },
      include: { phase: { select: { name: true } } },
      take,
      skip,
    }),

  findById: (id: string) =>
    prisma.milestone.findUnique({
      where: { id },
      include: { project: { select: { id: true, teamId: true, team: { select: { domainId: true } } } } },
    }),

  projectForScope: (projectId: string) =>
    prisma.project.findUnique({
      where: { id: projectId },
      select: { id: true, teamId: true, team: { select: { domainId: true } } },
    }),

  create: (input: CreateMilestoneInput) =>
    prisma.milestone.create({
      data: {
        projectId: input.projectId,
        name: input.name,
        sequence: input.sequence,
        keyOutput: input.keyOutput ?? null,
        dueAt: input.dueAt ?? null,
      },
    }),

  update: (
    id: string,
    fields: {
      name?: string;
      keyOutput?: string;
      dueAt?: Date;
      completionPct?: number;
      status: WorkStatus;
      signedOffById: string | null;
      signedOffAt: Date | null;
    },
  ) =>
    prisma.milestone.update({
      where: { id },
      data: {
        ...(fields.name !== undefined ? { name: fields.name } : {}),
        ...(fields.keyOutput !== undefined ? { keyOutput: fields.keyOutput } : {}),
        ...(fields.dueAt !== undefined ? { dueAt: fields.dueAt } : {}),
        ...(fields.completionPct !== undefined ? { completionPct: fields.completionPct } : {}),
        status: fields.status,
        signedOffById: fields.signedOffById,
        signedOffAt: fields.signedOffAt,
      },
    }),
};

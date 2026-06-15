import { prisma } from "../../lib/db.js";
import type { DeliverableReview } from "./deliverables.state.js";
import type { SubmitDeliverableInput } from "./deliverables.schema.js";

/** Data access for deliverables. Scope `where` is built by the service. */
export const deliverablesRepo = {
  list: (where: Record<string, unknown>, take: number, skip: number) =>
    prisma.deliverable.findMany({
      where,
      orderBy: { submittedAt: "desc" },
      take,
      skip,
    }),

  findById: (id: string) =>
    prisma.deliverable.findUnique({
      where: { id },
      include: { project: { select: { id: true, teamId: true, team: { select: { domainId: true } } } } },
    }),

  projectForScope: (projectId: string) =>
    prisma.project.findUnique({
      where: { id: projectId },
      select: { id: true, teamId: true, team: { select: { domainId: true } } },
    }),

  create: (input: SubmitDeliverableInput, submittedById: string, submittedAt: Date) =>
    prisma.deliverable.create({
      data: {
        projectId: input.projectId,
        milestoneId: input.milestoneId ?? null,
        typeId: input.typeId ?? null,
        artifactUrl: input.artifactUrl,
        submittedById,
        submittedAt,
        reviewStatus: "PENDING",
      },
    }),

  applyReview: (id: string, reviewerId: string, status: DeliverableReview, feedback: string | undefined) =>
    prisma.deliverable.update({
      where: { id },
      data: { reviewStatus: status, reviewerId, feedback: feedback ?? null },
    }),
};

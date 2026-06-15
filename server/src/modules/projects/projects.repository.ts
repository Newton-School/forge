import { prisma } from "../../lib/db.js";
import type { CreateProjectInput, ProposalDecisionInput } from "./projects.schema.js";

const PROPOSAL_BY_DECISION: Record<ProposalDecisionInput["decision"], "APPROVED" | "REVISE_RESUBMIT" | "REJECTED"> = {
  APPROVED: "APPROVED",
  REVISE_RESUBMIT: "REVISE_RESUBMIT",
  REJECTED: "REJECTED",
};

/** Data access for projects. Scope `where` is built by the service. */
export const projectsRepo = {
  list: (where: Record<string, unknown>, take: number, skip: number) =>
    prisma.project.findMany({
      where,
      orderBy: { name: "asc" },
      take,
      skip,
      include: { team: { select: { id: true, name: true, domainId: true } } },
    }),

  teamById: (id: string) =>
    prisma.team.findUnique({ where: { id }, select: { id: true, domainId: true } }),

  findById: (id: string) =>
    prisma.project.findUnique({
      where: { id },
      include: { team: { select: { id: true, name: true, domainId: true, mentorId: true } } },
    }),

  create: (input: CreateProjectInput) =>
    prisma.project.create({
      data: {
        teamId: input.teamId,
        type: input.type,
        name: input.name,
        ownerId: input.ownerId ?? null,
        problemStatement: input.problemStatement ?? null,
      },
    }),

  setProposalDecision: (id: string, decision: ProposalDecisionInput["decision"]) =>
    prisma.project.update({
      where: { id },
      data: { proposalStatus: PROPOSAL_BY_DECISION[decision] },
    }),
};

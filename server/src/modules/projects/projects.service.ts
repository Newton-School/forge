import { Errors } from "../../lib/errors.js";
import { audit } from "../../lib/audit.js";
import { can, effectiveScope } from "../../rbac/policy.js";
import type { AuthContext } from "../../rbac/types.js";
import { projectsRepo } from "./projects.repository.js";
import type { CreateProjectInput, ListProjectsQuery, ProposalDecisionInput } from "./projects.schema.js";

/** Scope filter for reads: a project is visible by domain, team, or team-membership (SELF). */
function projectScope(ctx: AuthContext): Record<string, unknown> {
  const s = effectiveScope(ctx);
  if (s.global) return {};
  const or: Record<string, unknown>[] = [];
  if (s.domainIds.length) or.push({ team: { domainId: { in: s.domainIds } } });
  if (s.teamIds.length) or.push({ teamId: { in: s.teamIds } });
  if (s.self) or.push({ team: { members: { some: { userId: ctx.id } } } });
  return or.length ? (or.length === 1 ? or[0]! : { OR: or }) : { id: "__never__" };
}

export async function listProjects(ctx: AuthContext, q: ListProjectsQuery) {
  const where = {
    ...projectScope(ctx),
    ...(q.teamId ? { teamId: q.teamId } : {}),
    ...(q.type ? { type: q.type } : {}),
  };
  const items = await projectsRepo.list(where, q.take, q.skip);
  return { items };
}

export async function createProject(ctx: AuthContext, input: CreateProjectInput, ip?: string) {
  const team = await projectsRepo.teamById(input.teamId);
  if (!team) throw Errors.notFound("Team not found");
  // Layer 2: can the actor manage projects for THIS team's domain/team?
  if (!can(ctx, "project:manage", { domainId: team.domainId, teamId: team.id })) {
    throw Errors.forbidden("You cannot create a project for this team");
  }
  if (input.type === "INDIVIDUAL" && !input.ownerId) {
    throw Errors.badRequest("An individual project requires an ownerId");
  }
  const project = await projectsRepo.create(input);
  await audit(ctx, {
    action: "project:create", entityType: "Project", entityId: project.id,
    after: { teamId: input.teamId, type: input.type, name: input.name }, ip,
  });
  return project;
}

export async function decideProposal(ctx: AuthContext, id: string, input: ProposalDecisionInput, ip?: string) {
  const project = await projectsRepo.findById(id);
  if (!project) throw Errors.notFound("Project not found");
  // Faculty gate decision — domain/team scoped via the project's team.
  if (!can(ctx, "gate:decide", { domainId: project.team.domainId, teamId: project.team.id })) {
    throw Errors.forbidden("This project is outside your scope");
  }
  const updated = await projectsRepo.setProposalDecision(id, input.decision);
  await audit(ctx, {
    action: "gate:decide", entityType: "Project", entityId: id,
    before: { proposalStatus: project.proposalStatus },
    after: { proposalStatus: updated.proposalStatus, feedback: input.feedback ?? null }, ip,
  });
  return updated;
}

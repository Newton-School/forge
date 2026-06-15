import { Errors } from "../../lib/errors.js";
import { audit } from "../../lib/audit.js";
import { can, effectiveScope } from "../../rbac/policy.js";
import type { AuthContext } from "../../rbac/types.js";
import { milestonesRepo } from "./milestones.repository.js";
import { clampPct, deriveStatus } from "./milestones.logic.js";
import type { CreateMilestoneInput, ListMilestonesQuery, UpdateMilestoneInput } from "./milestones.schema.js";

/** Scope filter for reads: milestones visible by domain, team, or team-membership. */
function milestoneScope(ctx: AuthContext): Record<string, unknown> {
  const s = effectiveScope(ctx);
  if (s.global) return {};
  const or: Record<string, unknown>[] = [];
  if (s.domainIds.length) or.push({ project: { team: { domainId: { in: s.domainIds } } } });
  if (s.teamIds.length) or.push({ project: { teamId: { in: s.teamIds } } });
  if (s.self) or.push({ project: { team: { members: { some: { userId: ctx.id } } } } });
  return or.length ? (or.length === 1 ? or[0]! : { OR: or }) : { id: "__never__" };
}

export async function listMilestones(ctx: AuthContext, q: ListMilestonesQuery) {
  const where = { ...milestoneScope(ctx), ...(q.projectId ? { projectId: q.projectId } : {}) };
  const items = await milestonesRepo.list(where, q.take, q.skip);
  return { items };
}

export async function createMilestone(ctx: AuthContext, input: CreateMilestoneInput, ip?: string) {
  const project = await milestonesRepo.projectForScope(input.projectId);
  if (!project) throw Errors.notFound("Project not found");
  if (!can(ctx, "project:manage", { domainId: project.team.domainId, teamId: project.teamId })) {
    throw Errors.forbidden("You cannot add milestones to this project");
  }
  const milestone = await milestonesRepo.create(input);
  await audit(ctx, {
    action: "milestone:create", entityType: "Milestone", entityId: milestone.id,
    after: { projectId: input.projectId, name: input.name, sequence: input.sequence }, ip,
  });
  return milestone;
}

export async function updateMilestone(ctx: AuthContext, id: string, input: UpdateMilestoneInput, ip?: string) {
  const milestone = await milestonesRepo.findById(id);
  if (!milestone) throw Errors.notFound("Milestone not found");
  // Milestones are created against a project; a project-less (phase-level) milestone
  // is config-managed elsewhere and not editable through this endpoint.
  if (!milestone.project) throw Errors.forbidden("This milestone is not bound to a project");
  if (!can(ctx, "project:manage", { domainId: milestone.project.team.domainId, teamId: milestone.project.teamId })) {
    throw Errors.forbidden("This milestone is outside your scope");
  }

  // Sign-off is sticky once set, unless this request explicitly re-signs.
  const signedOff = input.signOff ?? milestone.signedOffById !== null;
  const completionPct = input.completionPct ?? milestone.completionPct;
  const status = deriveStatus(completionPct, signedOff);

  const updated = await milestonesRepo.update(id, {
    name: input.name,
    keyOutput: input.keyOutput,
    dueAt: input.dueAt,
    ...(input.completionPct !== undefined ? { completionPct: clampPct(input.completionPct) } : {}),
    status,
    signedOffById: signedOff ? milestone.signedOffById ?? ctx.id : null,
    signedOffAt: signedOff ? milestone.signedOffAt ?? new Date() : null,
  });
  await audit(ctx, {
    action: input.signOff ? "milestone:signOff" : "milestone:update",
    entityType: "Milestone", entityId: id,
    before: { status: milestone.status, completionPct: milestone.completionPct },
    after: { status: updated.status, completionPct: updated.completionPct }, ip,
  });
  return updated;
}

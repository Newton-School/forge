import { Errors } from "../../lib/errors.js";
import { audit } from "../../lib/audit.js";
import { can, effectiveScope } from "../../rbac/policy.js";
import type { AuthContext } from "../../rbac/types.js";
import { deliverablesRepo } from "./deliverables.repository.js";
import { applyReview, canReview } from "./deliverables.state.js";
import type {
  ListDeliverablesQuery, ReviewDeliverableInput, SubmitDeliverableInput,
} from "./deliverables.schema.js";

/** Scope filter for reads: deliverables visible by domain, team, or self (submitter/member). */
function deliverableScope(ctx: AuthContext): Record<string, unknown> {
  const s = effectiveScope(ctx);
  if (s.global) return {};
  const or: Record<string, unknown>[] = [];
  if (s.domainIds.length) or.push({ project: { team: { domainId: { in: s.domainIds } } } });
  if (s.teamIds.length) or.push({ project: { teamId: { in: s.teamIds } } });
  if (s.self) or.push({ project: { team: { members: { some: { userId: ctx.id } } } } });
  return or.length ? (or.length === 1 ? or[0]! : { OR: or }) : { id: "__never__" };
}

export async function listDeliverables(ctx: AuthContext, q: ListDeliverablesQuery) {
  const where = {
    ...deliverableScope(ctx),
    ...(q.projectId ? { projectId: q.projectId } : {}),
    ...(q.reviewStatus ? { reviewStatus: q.reviewStatus } : {}),
  };
  const items = await deliverablesRepo.list(where, q.take, q.skip);
  return { items };
}

export async function submitDeliverable(ctx: AuthContext, input: SubmitDeliverableInput, ip?: string) {
  const project = await deliverablesRepo.projectForScope(input.projectId);
  if (!project) throw Errors.notFound("Project not found");
  // The submitter must be able to reach this project (team membership / domain / team scope).
  if (!can(ctx, "deliverable:submit", { domainId: project.team.domainId, teamId: project.teamId })) {
    throw Errors.forbidden("You cannot submit a deliverable for this project");
  }
  const row = await deliverablesRepo.create(input, ctx.id, new Date());
  await audit(ctx, {
    action: "deliverable:submit", entityType: "Deliverable", entityId: row.id,
    after: { projectId: input.projectId, artifactUrl: input.artifactUrl }, ip,
  });
  return row;
}

export async function reviewDeliverable(ctx: AuthContext, id: string, input: ReviewDeliverableInput, ip?: string) {
  const deliverable = await deliverablesRepo.findById(id);
  if (!deliverable) throw Errors.notFound("Deliverable not found");
  if (!can(ctx, "deliverable:review", { domainId: deliverable.project.team.domainId, teamId: deliverable.project.teamId })) {
    throw Errors.forbidden("This deliverable is outside your scope");
  }
  if (!canReview(deliverable.reviewStatus)) {
    throw Errors.conflict(`Deliverable already ${deliverable.reviewStatus.toLowerCase()}`);
  }
  const next = applyReview(deliverable.reviewStatus, input.decision);
  const updated = await deliverablesRepo.applyReview(id, ctx.id, next, input.feedback);
  await audit(ctx, {
    action: "deliverable:review", entityType: "Deliverable", entityId: id,
    before: { reviewStatus: deliverable.reviewStatus },
    after: { reviewStatus: next, feedback: input.feedback ?? null }, ip,
  });
  return updated;
}

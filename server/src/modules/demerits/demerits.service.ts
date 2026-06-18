import { Errors } from "../../lib/errors.js";
import { audit } from "../../lib/audit.js";
import { effectiveScope } from "../../rbac/policy.js";
import type { AuthContext } from "../../rbac/types.js";
import { demeritsRepo } from "./demerits.repository.js";
import { emitNotification } from "../notifications/notifications.service.js";
import type { IssueDemeritInput, ListDemeritsQuery, UpdateDemeritInput } from "./demerits.schema.js";

/** Read scope: a demerit is visible by the subject's domain/team membership, or to the subject (self). */
function demeritScope(ctx: AuthContext): Record<string, unknown> {
  const s = effectiveScope(ctx);
  if (s.global) return {};
  const or: Record<string, unknown>[] = [];
  if (s.domainIds.length) or.push({ user: { teamMemberships: { some: { team: { domainId: { in: s.domainIds } } } } } });
  if (s.teamIds.length) or.push({ user: { teamMemberships: { some: { teamId: { in: s.teamIds } } } } });
  if (s.self) or.push({ userId: ctx.id });
  return or.length ? (or.length === 1 ? or[0]! : { OR: or }) : { id: "__never__" };
}

export async function listDemerits(ctx: AuthContext, q: ListDemeritsQuery) {
  const where = {
    ...demeritScope(ctx),
    ...(q.userId ? { userId: q.userId } : {}),
    ...(q.escalated !== undefined ? { escalated: q.escalated } : {}),
  };
  const rows = await demeritsRepo.list(where, q.take, q.skip);
  const issuerIds = [...new Set(rows.map((d) => d.issuedById).filter(Boolean) as string[])];
  const issuerOf = new Map((await demeritsRepo.userNames(issuerIds)).map((u) => [u.id, u.fullName]));
  const items = rows.map((d) => ({
    id: d.id,
    user: d.user.fullName,
    domainKey: d.user.teamMemberships[0]?.team.domain?.key ?? null,
    reason: d.reason,
    points: d.points,
    issuedBy: d.issuedById ? issuerOf.get(d.issuedById) ?? "—" : "—",
    escalated: d.escalated,
    createdAt: d.createdAt,
  }));
  return { items };
}

export async function issueDemerit(ctx: AuthContext, input: IssueDemeritInput, ip?: string) {
  if (!(await demeritsRepo.userExists(input.userId))) throw Errors.notFound("User not found");
  const demerit = await demeritsRepo.create(input, ctx.id);
  await audit(ctx, {
    action: "demerit:issue", entityType: "Demerit", entityId: demerit.id,
    after: { userId: input.userId, points: input.points, escalated: input.escalated, reason: input.reason }, ip,
  });
  // Notify the affected user in-app (best-effort; never blocks issuing the demerit).
  await emitNotification(input.userId, "DEMERIT_ISSUED", {
    demeritId: demerit.id, points: input.points, reason: input.reason, escalated: input.escalated,
  });
  return demerit;
}

export async function updateDemerit(ctx: AuthContext, id: string, input: UpdateDemeritInput, ip?: string) {
  // Constrain the lookup to the caller's scope — out of scope reads as not found.
  const existing = await demeritsRepo.findInScope({ id, ...demeritScope(ctx) });
  if (!existing) throw Errors.notFound("Demerit not found");
  const updated = await demeritsRepo.update(id, input);
  await audit(ctx, {
    action: "demerit:update", entityType: "Demerit", entityId: id,
    before: { points: existing.points, escalated: existing.escalated },
    after: { points: updated.points, escalated: updated.escalated }, ip,
  });
  return updated;
}

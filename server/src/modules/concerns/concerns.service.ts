import { Errors } from "../../lib/errors.js";
import { audit } from "../../lib/audit.js";
import { logger } from "../../lib/logger.js";
import { env } from "../../config/env.js";
import { scopeWhere } from "../../rbac/scope.js";
import { effectiveScope } from "../../rbac/policy.js";
import type { AuthContext } from "../../rbac/types.js";
import { emailProvider } from "../email/email.provider.js";
import { buildConcernEmail } from "../email/concern-notify.js";
import { concernsRepo, type ConcernWithEvents } from "./concerns.repository.js";
import type { CreateConcernInput, ListConcernsQuery, TransitionInput } from "./concerns.schema.js";
import { allowedTransitions, canTransition } from "./concerns.state.js";

/** Concern notifications go to the LCC; the organizing team is CC'd via env. */
const LCC_EMAIL = "learnercareercouncil@nst.rishihood.edu.in";
const concernCc = () =>
  (env.CONCERN_CC_EMAILS ?? "").split(",").map((s) => s.trim()).filter(Boolean);

function toDto(c: ConcernWithEvents) {
  return {
    id: c.id,
    title: c.title,
    description: c.anonymous ? c.description : c.description,
    category: c.category,
    severity: c.severity,
    status: c.status,
    domainId: c.domainId,
    teamId: c.teamId,
    raisedById: c.anonymous ? null : c.raisedById,
    assignedToId: c.assignedToId,
    slaDueAt: c.slaDueAt,
    resolutionNote: c.resolutionNote,
    resolvedAt: c.resolvedAt,
    createdAt: c.createdAt,
    events: c.events.map((e) => ({ from: e.fromStatus, to: e.toStatus, note: e.note, actorId: e.actorId, at: e.at })),
    allowedNext: allowedTransitions(c.status),
  };
}

/** Visible concerns for the caller (scope-filtered at the query layer). */
export async function listConcerns(ctx: AuthContext, q: ListConcernsQuery) {
  const scope = scopeWhere(ctx, { domainField: "domainId", teamField: "teamId", ownerField: "raisedById" });
  // AND filters WITH scope — spreading `?domain=` over a domain-scope `{ domainId: { in: [...] } }`
  // would overwrite it and leak another domain's concerns. AND can only narrow within scope.
  const where = {
    AND: [
      scope,
      ...(q.status ? [{ status: q.status }] : []),
      ...(q.domain ? [{ domainId: q.domain }] : []),
    ],
  };
  const [rows, total] = await Promise.all([concernsRepo.list(where, q.take, q.skip), concernsRepo.count(where)]);
  const domainIds = [...new Set(rows.map((c) => c.domainId).filter(Boolean) as string[])];
  const keyOf = new Map((await concernsRepo.domainKeys(domainIds)).map((d) => [d.id, d.key]));
  // re-fetch each with events would be N+1; list view omits events
  return {
    items: rows.map((c) => ({
      id: c.id,
      ref: `CON-${c.seq}`,
      title: c.title,
      category: c.category,
      severity: c.severity,
      status: c.status,
      // Anonymous concerns hide the raiser's identity from the list.
      raisedBy: c.anonymous ? "Anonymous" : c.raisedBy?.fullName ?? "—",
      raisedByRole: c.anonymous ? null : c.raisedBy?.roles[0]?.role ?? null,
      assignedTo: c.assignedTo?.fullName ?? null,
      domainKey: c.domainId ? keyOf.get(c.domainId) ?? null : null,
      description: c.description,
      slaDue: c.slaDueAt,
      createdAt: c.createdAt,
    })),
    total, take: q.take, skip: q.skip,
  };
}

export async function getConcern(ctx: AuthContext, id: string) {
  const c = await concernsRepo.findById(id);
  if (!c) throw Errors.notFound("Concern not found");
  assertVisible(ctx, c);
  return toDto(c);
}

/** Raise a concern. Anyone may raise; it is owned by the raiser. */
export async function raiseConcern(ctx: AuthContext, input: CreateConcernInput, ip?: string) {
  // A caller may only attribute a concern to a domain/team they actually belong to — otherwise a
  // mentee could file a concern tagged to an unrelated team/domain. Reachable = scope grants
  // (teachers/mentors) ∪ own memberships (mentees, whose grant is SELF-only). Global bypasses.
  if (input.domainId || input.teamId) {
    const s = effectiveScope(ctx);
    if (!s.global) {
      const mem = await concernsRepo.callerMemberships(ctx.id);
      const domains = new Set([...s.domainIds, ...mem.domainIds]);
      const teams = new Set([...s.teamIds, ...mem.teamIds]);
      if (input.domainId && !domains.has(input.domainId)) throw Errors.forbidden("You cannot raise a concern for that domain");
      if (input.teamId && !teams.has(input.teamId)) throw Errors.forbidden("You cannot raise a concern for that team");
    }
  }
  const created = await concernsRepo.create(input, ctx.id);
  await audit(ctx, { action: "concern:raise", entityType: "Concern", entityId: created.id, after: { category: input.category, severity: input.severity }, ip });

  // Best-effort notification to the LCC (CC: organizing team) — never block raising on email.
  const mail = buildConcernEmail({
    title: input.title,
    description: input.description,
    category: input.category,
    severity: input.severity,
    raisedBy: input.anonymous ? "Anonymous" : ctx.fullName,
    raisedByEmail: input.anonymous ? null : ctx.email,
    concernUrl: `${env.APP_BASE_URL.replace(/\/$/, "")}/concerns/${created.id}`,
  });
  const cc = concernCc();
  void emailProvider()
    .send({ to: [LCC_EMAIL], cc: cc.length ? cc : undefined, subject: mail.subject, html: mail.html, text: mail.text })
    .catch((err) => logger.warn({ err, concernId: created.id }, "concern notification email failed (recorded anyway)"));

  return toDto(created);
}

/** Advance a concern through its lifecycle (validated by the state machine). */
export async function transitionConcern(ctx: AuthContext, id: string, input: TransitionInput, ip?: string) {
  const c = await concernsRepo.findById(id);
  if (!c) throw Errors.notFound("Concern not found");
  assertVisible(ctx, c);
  if (!canTransition(c.status, input.to)) {
    throw Errors.badRequest(`Cannot move a concern from ${c.status} to ${input.to}`, { allowed: allowedTransitions(c.status) });
  }
  const resolving = input.to === "RESOLVED";
  const updated = await concernsRepo.transition(id, input.to, c.status, ctx.id, input.note, {
    resolutionNote: resolving ? input.note ?? null : null,
    resolvedAt: resolving ? new Date() : null,
  });
  await audit(ctx, { action: `concern:${input.to.toLowerCase()}`, entityType: "Concern", entityId: id, before: { status: c.status }, after: { status: input.to }, ip });
  return toDto(updated);
}

/** A user can see a concern if it's in scope or they raised it. */
function assertVisible(ctx: AuthContext, c: ConcernWithEvents): void {
  const w = scopeWhere(ctx, { domainField: "domainId", teamField: "teamId", ownerField: "raisedById" });
  if (Object.keys(w).length === 0) return; // global
  const inScope =
    c.raisedById === ctx.id ||
    (c.domainId != null && hasIdIn(w, "domainId", c.domainId)) ||
    (c.teamId != null && hasIdIn(w, "teamId", c.teamId));
  if (!inScope) throw Errors.forbidden("This concern is outside your scope");
}

function hasIdIn(where: Record<string, unknown>, field: string, value: string): boolean {
  const branches = (where.OR as Record<string, unknown>[] | undefined) ?? [where];
  return branches.some((b) => {
    const clause = b[field] as { in?: string[] } | string | undefined;
    if (typeof clause === "string") return clause === value;
    return Array.isArray(clause?.in) && clause!.in!.includes(value);
  });
}

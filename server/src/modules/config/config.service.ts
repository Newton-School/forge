import type { Prisma } from "@prisma/client";
import { Errors } from "../../lib/errors.js";
import { audit } from "../../lib/audit.js";
import { effectiveScope } from "../../rbac/policy.js";
import type { AuthContext } from "../../rbac/types.js";
import { configRepo } from "./config.repository.js";
import { canWriteConfigScope, configReadWhere, type ConfigScope } from "./config.access.js";
import type {
  CreateCycleInput, CreateDimensionInput, CreateEscalationInput, CreateGateInput,
  CreatePhaseInput, CreateRubricInput, ListConfigQuery, UpdateCycleInput, UpdateDimensionInput,
  UpdateEscalationInput, UpdateGateInput, UpdatePhaseInput, UpdateRubricInput,
} from "./config.schema.js";

// ── scope / authorization helpers ─────────────────────────────────────────────
function toConfigScope(ctx: AuthContext): ConfigScope {
  const s = effectiveScope(ctx);
  return { global: s.global, domainIds: s.domainIds };
}

/** Throw unless the caller may write config for `domainId` (null = all domains). */
function assertWrite(ctx: AuthContext, domainId: string | null): void {
  if (!canWriteConfigScope(toConfigScope(ctx), domainId)) {
    throw Errors.forbidden(
      domainId === null ? "Only Admin/LCC can configure all domains" : "That domain is outside your scope",
    );
  }
}

function readWhere(ctx: AuthContext, q: ListConfigQuery): Record<string, unknown> {
  return { ...configReadWhere(toConfigScope(ctx)), ...(q.domainId ? { domainId: q.domainId } : {}) };
}

async function activeDrive(): Promise<string> {
  const id = await configRepo.activeDriveId();
  if (!id) throw Errors.badRequest("No active drive — create one before configuring it");
  return id;
}

/** Keep only defined keys, so a partial update never clobbers fields with undefined. */
function defined<T extends Record<string, unknown>>(obj: T): Partial<T> {
  return Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== undefined)) as Partial<T>;
}

// ── Phases ─────────────────────────────────────────────────────────────────────
export async function listPhases(ctx: AuthContext, q: ListConfigQuery) {
  return { items: await configRepo.phases.list(readWhere(ctx, q)) };
}
export async function createPhase(ctx: AuthContext, input: CreatePhaseInput, ip?: string) {
  assertWrite(ctx, input.domainId);
  const row = await configRepo.phases.create(await activeDrive(), input);
  await audit(ctx, { action: "config:phase:create", entityType: "Phase", entityId: row.id, after: { name: input.name }, ip });
  return row;
}
export async function updatePhase(ctx: AuthContext, id: string, input: UpdatePhaseInput, ip?: string) {
  const existing = await configRepo.phases.findById(id);
  if (!existing) throw Errors.notFound("Phase not found");
  assertWrite(ctx, existing.domainId);
  if (input.domainId !== undefined) assertWrite(ctx, input.domainId);
  const row = await configRepo.phases.update(id, defined({
    name: input.name, sequence: input.sequence, startsAt: input.startsAt,
    endsAt: input.endsAt, theme: input.theme, domainId: input.domainId,
  }));
  await audit(ctx, { action: "config:phase:update", entityType: "Phase", entityId: id, ip });
  return row;
}

// ── Gates ─────────────────────────────────────────────────────────────────────
export async function listGates(ctx: AuthContext, q: ListConfigQuery) {
  return { items: await configRepo.gates.list(readWhere(ctx, q)) };
}
export async function createGate(ctx: AuthContext, input: CreateGateInput, ip?: string) {
  assertWrite(ctx, input.domainId);
  if (!(await configRepo.gates.phaseExists(input.phaseId))) throw Errors.badRequest("Phase not found");
  const row = await configRepo.gates.create(input);
  await audit(ctx, { action: "config:gate:create", entityType: "Gate", entityId: row.id, after: { name: input.name }, ip });
  return row;
}
export async function updateGate(ctx: AuthContext, id: string, input: UpdateGateInput, ip?: string) {
  const existing = await configRepo.gates.findById(id);
  if (!existing) throw Errors.notFound("Gate not found");
  assertWrite(ctx, existing.domainId);
  if (input.domainId !== undefined) assertWrite(ctx, input.domainId);
  const row = await configRepo.gates.update(id, defined({
    name: input.name, scheduledAt: input.scheduledAt, verdictOptions: input.verdictOptions,
    blocksProgression: input.blocksProgression, domainId: input.domainId,
  }));
  await audit(ctx, { action: "config:gate:update", entityType: "Gate", entityId: id, ip });
  return row;
}

// ── Review cycles ─────────────────────────────────────────────────────────────
export async function listCycles(ctx: AuthContext, q: ListConfigQuery) {
  return { items: await configRepo.cycles.list(readWhere(ctx, q)) };
}
export async function createCycle(ctx: AuthContext, input: CreateCycleInput, ip?: string) {
  assertWrite(ctx, input.domainId);
  const row = await configRepo.cycles.create(await activeDrive(), input);
  await audit(ctx, { action: "config:cycle:create", entityType: "ReviewCycle", entityId: row.id, after: { level: input.level }, ip });
  return row;
}
export async function updateCycle(ctx: AuthContext, id: string, input: UpdateCycleInput, ip?: string) {
  const existing = await configRepo.cycles.findById(id);
  if (!existing) throw Errors.notFound("Review cycle not found");
  assertWrite(ctx, existing.domainId);
  if (input.domainId !== undefined) assertWrite(ctx, input.domainId);
  const row = await configRepo.cycles.update(id, defined({
    level: input.level, ownerRole: input.ownerRole, intervalValue: input.intervalValue,
    intervalUnit: input.intervalUnit, anchorDay: input.anchorDay, domainId: input.domainId,
  }));
  await audit(ctx, { action: "config:cycle:update", entityType: "ReviewCycle", entityId: id, ip });
  return row;
}

// ── Escalation rules ──────────────────────────────────────────────────────────
export async function listEscalations(ctx: AuthContext, q: ListConfigQuery) {
  return { items: await configRepo.escalations.list(readWhere(ctx, q)) };
}
export async function createEscalation(ctx: AuthContext, input: CreateEscalationInput, ip?: string) {
  assertWrite(ctx, input.domainId);
  const row = await configRepo.escalations.create(await activeDrive(), input);
  await audit(ctx, { action: "config:escalation:create", entityType: "EscalationRule", entityId: row.id, after: { name: input.name }, ip });
  return row;
}
export async function updateEscalation(ctx: AuthContext, id: string, input: UpdateEscalationInput, ip?: string) {
  const existing = await configRepo.escalations.findById(id);
  if (!existing) throw Errors.notFound("Escalation rule not found");
  assertWrite(ctx, existing.domainId);
  if (input.domainId !== undefined) assertWrite(ctx, input.domainId);
  const row = await configRepo.escalations.update(id, defined({
    name: input.name,
    condition: input.condition as Prisma.InputJsonValue | undefined,
    thresholdValue: input.thresholdValue,
    thresholdUnit: input.thresholdUnit, action: input.action, targetRole: input.targetRole,
    severity: input.severity, domainId: input.domainId,
  }));
  await audit(ctx, { action: "config:escalation:update", entityType: "EscalationRule", entityId: id, ip });
  return row;
}

// ── Rubrics + dimensions ──────────────────────────────────────────────────────
export async function listRubrics(ctx: AuthContext, q: ListConfigQuery) {
  return { items: await configRepo.rubrics.list(readWhere(ctx, q)) };
}
export async function createRubric(ctx: AuthContext, input: CreateRubricInput, ip?: string) {
  assertWrite(ctx, input.domainId);
  const row = await configRepo.rubrics.create(await activeDrive(), input);
  await audit(ctx, { action: "config:rubric:create", entityType: "Rubric", entityId: row.id, after: { name: input.name }, ip });
  return row;
}
export async function updateRubric(ctx: AuthContext, id: string, input: UpdateRubricInput, ip?: string) {
  const existing = await configRepo.rubrics.findById(id);
  if (!existing) throw Errors.notFound("Rubric not found");
  assertWrite(ctx, existing.domainId);
  if (input.domainId !== undefined) assertWrite(ctx, input.domainId);
  const row = await configRepo.rubrics.update(id, defined({ name: input.name, kind: input.kind, domainId: input.domainId }));
  await audit(ctx, { action: "config:rubric:update", entityType: "Rubric", entityId: id, ip });
  return row;
}
export async function createDimension(ctx: AuthContext, rubricId: string, input: CreateDimensionInput, ip?: string) {
  const rubric = await configRepo.dimensions.rubricDomain(rubricId);
  if (!rubric) throw Errors.notFound("Rubric not found");
  assertWrite(ctx, rubric.domainId);
  const row = await configRepo.dimensions.create(rubricId, input);
  await audit(ctx, { action: "config:dimension:create", entityType: "RubricDimension", entityId: row.id, after: { name: input.name }, ip });
  return row;
}
export async function updateDimension(ctx: AuthContext, id: string, input: UpdateDimensionInput, ip?: string) {
  const existing = await configRepo.dimensions.findByIdWithRubricDomain(id);
  if (!existing) throw Errors.notFound("Rubric dimension not found");
  assertWrite(ctx, existing.rubric.domainId);
  const row = await configRepo.dimensions.update(id, defined({ name: input.name, weight: input.weight, measuredBy: input.measuredBy }));
  await audit(ctx, { action: "config:dimension:update", entityType: "RubricDimension", entityId: id, ip });
  return row;
}

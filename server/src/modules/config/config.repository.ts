import { prisma } from "../../lib/db.js";
import type { Prisma } from "@prisma/client";
import type {
  CreateCycleInput, CreateDimensionInput, CreateEscalationInput,
  CreateGateInput, CreatePhaseInput, CreateRubricInput,
} from "./config.schema.js";

/**
 * Data access for drive configuration. The service passes a scope `where` for reads
 * and a pre-validated `data` object for updates; this module is the only Prisma seam.
 */
export const configRepo = {
  /** The current active drive — config is created under it. */
  activeDriveId: async (): Promise<string | null> => {
    const d = await prisma.drive.findFirst({ where: { active: true }, select: { id: true }, orderBy: { createdAt: "desc" } });
    return d?.id ?? null;
  },

  // ── Phases ────────────────────────────────────────────────────────────────
  phases: {
    list: (where: Record<string, unknown>) => prisma.phase.findMany({ where, orderBy: { sequence: "asc" } }),
    findById: (id: string) => prisma.phase.findUnique({ where: { id }, select: { id: true, domainId: true } }),
    create: (driveId: string, input: CreatePhaseInput) =>
      prisma.phase.create({
        data: {
          driveId, name: input.name, sequence: input.sequence,
          startsAt: input.startsAt ?? null, endsAt: input.endsAt ?? null,
          theme: input.theme ?? null, domainId: input.domainId,
        },
      }),
    update: (id: string, data: Prisma.PhaseUpdateInput) => prisma.phase.update({ where: { id }, data }),
  },

  // ── Gates ─────────────────────────────────────────────────────────────────
  gates: {
    list: (where: Record<string, unknown>) => prisma.gate.findMany({ where, orderBy: { scheduledAt: "asc" } }),
    findById: (id: string) => prisma.gate.findUnique({ where: { id }, select: { id: true, domainId: true } }),
    phaseExists: async (phaseId: string): Promise<boolean> =>
      (await prisma.phase.findUnique({ where: { id: phaseId }, select: { id: true } })) !== null,
    create: (input: CreateGateInput) =>
      prisma.gate.create({
        data: {
          phaseId: input.phaseId, name: input.name, scheduledAt: input.scheduledAt ?? null,
          verdictOptions: input.verdictOptions, blocksProgression: input.blocksProgression, domainId: input.domainId,
        },
      }),
    update: (id: string, data: Prisma.GateUpdateInput) => prisma.gate.update({ where: { id }, data }),
  },

  // ── Review cycles ───────────────────────────────────────────────────────────
  cycles: {
    list: (where: Record<string, unknown>) => prisma.reviewCycle.findMany({ where, orderBy: { level: "asc" } }),
    findById: (id: string) => prisma.reviewCycle.findUnique({ where: { id }, select: { id: true, domainId: true } }),
    create: (driveId: string, input: CreateCycleInput) =>
      prisma.reviewCycle.create({
        data: {
          driveId, level: input.level, ownerRole: input.ownerRole,
          intervalValue: input.intervalValue, intervalUnit: input.intervalUnit,
          anchorDay: input.anchorDay ?? null, fieldSchema: input.fieldSchema as Prisma.InputJsonValue,
          statusEnum: input.statusEnum as Prisma.InputJsonValue, domainId: input.domainId,
        },
      }),
    update: (id: string, data: Prisma.ReviewCycleUpdateInput) => prisma.reviewCycle.update({ where: { id }, data }),
  },

  // ── Escalation rules ──────────────────────────────────────────────────────
  escalations: {
    list: (where: Record<string, unknown>) => prisma.escalationRule.findMany({ where, orderBy: { thresholdValue: "asc" } }),
    findById: (id: string) => prisma.escalationRule.findUnique({ where: { id }, select: { id: true, domainId: true } }),
    create: (driveId: string, input: CreateEscalationInput) =>
      prisma.escalationRule.create({
        data: {
          driveId, name: input.name, condition: input.condition as Prisma.InputJsonValue,
          thresholdValue: input.thresholdValue, thresholdUnit: input.thresholdUnit, action: input.action,
          targetRole: input.targetRole ?? null, severity: input.severity ?? null, domainId: input.domainId,
        },
      }),
    update: (id: string, data: Prisma.EscalationRuleUpdateInput) => prisma.escalationRule.update({ where: { id }, data }),
  },

  // ── Rubrics + dimensions ──────────────────────────────────────────────────
  rubrics: {
    list: (where: Record<string, unknown>) =>
      prisma.rubric.findMany({ where, orderBy: { name: "asc" }, include: { dimensions: true } }),
    findById: (id: string) => prisma.rubric.findUnique({ where: { id }, select: { id: true, domainId: true } }),
    create: (driveId: string, input: CreateRubricInput) =>
      prisma.rubric.create({ data: { driveId, name: input.name, kind: input.kind, domainId: input.domainId } }),
    update: (id: string, data: Prisma.RubricUpdateInput) => prisma.rubric.update({ where: { id }, data }),
  },

  dimensions: {
    /** A dimension inherits its rubric's domain for authorization. */
    findByIdWithRubricDomain: (id: string) =>
      prisma.rubricDimension.findUnique({ where: { id }, select: { id: true, rubric: { select: { domainId: true } } } }),
    rubricDomain: async (rubricId: string): Promise<{ domainId: string | null } | null> =>
      prisma.rubric.findUnique({ where: { id: rubricId }, select: { domainId: true } }),
    create: (rubricId: string, input: CreateDimensionInput) =>
      prisma.rubricDimension.create({ data: { rubricId, name: input.name, weight: input.weight, measuredBy: input.measuredBy } }),
    update: (id: string, data: Prisma.RubricDimensionUpdateInput) => prisma.rubricDimension.update({ where: { id }, data }),
  },
};

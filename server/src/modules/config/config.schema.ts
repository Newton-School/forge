import { z } from "zod";

// Shared: a config item targets all domains (null) or one domain. `undefined` → null.
const domainId = z
  .string()
  .min(1)
  .nullish()
  .transform((v) => v ?? null);

const REVIEW_LEVEL = ["L1", "L2", "L3", "L4"] as const;
const ROLE_KEY = ["ADMIN", "LCC", "TEACHER", "MENTOR", "MENTEE"] as const;
const CADENCE_UNIT = ["DAY", "WEEK", "MONTH"] as const;
const SEVERITY = ["LOW", "MEDIUM", "HIGH", "CRITICAL"] as const;
const ESCALATION_ACTION = ["FLAG", "NOTIFY", "ESCALATE"] as const;

// ── Phase ─────────────────────────────────────────────────────────────────────
export const createPhaseSchema = z.object({
  name: z.string().min(1).max(200),
  sequence: z.coerce.number().int().min(1).max(100),
  startsAt: z.coerce.date().optional(),
  endsAt: z.coerce.date().optional(),
  theme: z.string().max(500).optional(),
  domainId,
});
export const updatePhaseSchema = z
  .object({
    name: z.string().min(1).max(200).optional(),
    sequence: z.coerce.number().int().min(1).max(100).optional(),
    startsAt: z.coerce.date().optional(),
    endsAt: z.coerce.date().optional(),
    theme: z.string().max(500).optional(),
    domainId: domainId.optional(),
  })
  .refine((d) => Object.keys(d).length > 0, { message: "Provide at least one field to update" });
export type CreatePhaseInput = z.infer<typeof createPhaseSchema>;
export type UpdatePhaseInput = z.infer<typeof updatePhaseSchema>;

// ── Gate ──────────────────────────────────────────────────────────────────────
export const createGateSchema = z.object({
  phaseId: z.string().min(1),
  name: z.string().min(1).max(200),
  scheduledAt: z.coerce.date().optional(),
  verdictOptions: z.array(z.string().min(1)).min(1).default(["Approved", "Revise & Resubmit", "Rejected"]),
  blocksProgression: z.boolean().default(true),
  domainId,
});
export const updateGateSchema = z
  .object({
    name: z.string().min(1).max(200).optional(),
    scheduledAt: z.coerce.date().optional(),
    verdictOptions: z.array(z.string().min(1)).min(1).optional(),
    blocksProgression: z.boolean().optional(),
    domainId: domainId.optional(),
  })
  .refine((d) => Object.keys(d).length > 0, { message: "Provide at least one field to update" });
export type CreateGateInput = z.infer<typeof createGateSchema>;
export type UpdateGateInput = z.infer<typeof updateGateSchema>;

// ── ReviewCycle ─────────────────────────────────────────────────────────────
export const createCycleSchema = z.object({
  level: z.enum(REVIEW_LEVEL),
  ownerRole: z.enum(ROLE_KEY),
  intervalValue: z.coerce.number().int().min(1).max(365),
  intervalUnit: z.enum(CADENCE_UNIT),
  anchorDay: z.string().max(20).optional(),
  fieldSchema: z.record(z.unknown()).default({}),
  statusEnum: z.array(z.string()).default([]),
  domainId,
});
export const updateCycleSchema = z
  .object({
    level: z.enum(REVIEW_LEVEL).optional(),
    ownerRole: z.enum(ROLE_KEY).optional(),
    intervalValue: z.coerce.number().int().min(1).max(365).optional(),
    intervalUnit: z.enum(CADENCE_UNIT).optional(),
    anchorDay: z.string().max(20).nullish(),
    domainId: domainId.optional(),
  })
  .refine((d) => Object.keys(d).length > 0, { message: "Provide at least one field to update" });
export type CreateCycleInput = z.infer<typeof createCycleSchema>;
export type UpdateCycleInput = z.infer<typeof updateCycleSchema>;

// ── EscalationRule ────────────────────────────────────────────────────────────
export const createEscalationSchema = z.object({
  name: z.string().min(1).max(200),
  condition: z.record(z.unknown()).default({}),
  thresholdValue: z.coerce.number().int().min(1).max(1000),
  thresholdUnit: z.enum(["days", "updates", "hours"]),
  action: z.enum(ESCALATION_ACTION),
  targetRole: z.enum(ROLE_KEY).optional(),
  severity: z.enum(SEVERITY).optional(),
  domainId,
});
export const updateEscalationSchema = z
  .object({
    name: z.string().min(1).max(200).optional(),
    condition: z.record(z.unknown()).optional(),
    thresholdValue: z.coerce.number().int().min(1).max(1000).optional(),
    thresholdUnit: z.enum(["days", "updates", "hours"]).optional(),
    action: z.enum(ESCALATION_ACTION).optional(),
    targetRole: z.enum(ROLE_KEY).nullish(),
    severity: z.enum(SEVERITY).nullish(),
    domainId: domainId.optional(),
  })
  .refine((d) => Object.keys(d).length > 0, { message: "Provide at least one field to update" });
export type CreateEscalationInput = z.infer<typeof createEscalationSchema>;
export type UpdateEscalationInput = z.infer<typeof updateEscalationSchema>;

// ── Rubric + dimensions ───────────────────────────────────────────────────────
export const createRubricSchema = z.object({
  name: z.string().min(1).max(200),
  kind: z.enum(["GATE", "TOP_TEAM", "MENTOR"]),
  domainId,
});
export const updateRubricSchema = z
  .object({
    name: z.string().min(1).max(200).optional(),
    kind: z.enum(["GATE", "TOP_TEAM", "MENTOR"]).optional(),
    domainId: domainId.optional(),
  })
  .refine((d) => Object.keys(d).length > 0, { message: "Provide at least one field to update" });
export type CreateRubricInput = z.infer<typeof createRubricSchema>;
export type UpdateRubricInput = z.infer<typeof updateRubricSchema>;

export const createDimensionSchema = z.object({
  name: z.string().min(1).max(200),
  weight: z.coerce.number().min(0).max(100),
  measuredBy: z.string().min(1).max(500),
});
export const updateDimensionSchema = z
  .object({
    name: z.string().min(1).max(200).optional(),
    weight: z.coerce.number().min(0).max(100).optional(),
    measuredBy: z.string().min(1).max(500).optional(),
  })
  .refine((d) => Object.keys(d).length > 0, { message: "Provide at least one field to update" });
export type CreateDimensionInput = z.infer<typeof createDimensionSchema>;
export type UpdateDimensionInput = z.infer<typeof updateDimensionSchema>;

export const listConfigQuery = z.object({
  domainId: z.string().optional(),
});
export type ListConfigQuery = z.infer<typeof listConfigQuery>;

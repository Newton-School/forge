import { Router, type Request, type Response } from "express";
import { asyncHandler } from "../../lib/errors.js";
import { requirePermission } from "../../middleware/auth.js";
import { validateBody } from "../../middleware/validate.js";
import {
  createCycleSchema, createDimensionSchema, createEscalationSchema, createGateSchema,
  createPhaseSchema, createRubricSchema, listConfigQuery, updateCycleSchema, updateDimensionSchema,
  updateEscalationSchema, updateGateSchema, updatePhaseSchema, updateRubricSchema,
} from "./config.schema.js";
import * as svc from "./config.service.js";

export const configRouter = Router();

// Every config route requires config:edit; the service narrows a Teacher to their domain.
configRouter.use(requirePermission("config:edit"));

const q = (req: Request) => listConfigQuery.parse(req.query);

// ── Phases ──────────────────────────────────────────────────────────────────
configRouter.get("/phases", asyncHandler(async (req, res: Response) => res.json(await svc.listPhases(req.auth!, q(req)))));
configRouter.post("/phases", validateBody(createPhaseSchema), asyncHandler(async (req, res: Response) =>
  res.status(201).json({ phase: await svc.createPhase(req.auth!, req.body, req.ip) })));
configRouter.patch("/phases/:id", validateBody(updatePhaseSchema), asyncHandler(async (req, res: Response) =>
  res.json({ phase: await svc.updatePhase(req.auth!, req.params.id!, req.body, req.ip) })));

// ── Gates ───────────────────────────────────────────────────────────────────
configRouter.get("/gates", asyncHandler(async (req, res: Response) => res.json(await svc.listGates(req.auth!, q(req)))));
configRouter.post("/gates", validateBody(createGateSchema), asyncHandler(async (req, res: Response) =>
  res.status(201).json({ gate: await svc.createGate(req.auth!, req.body, req.ip) })));
configRouter.patch("/gates/:id", validateBody(updateGateSchema), asyncHandler(async (req, res: Response) =>
  res.json({ gate: await svc.updateGate(req.auth!, req.params.id!, req.body, req.ip) })));

// ── Review cycles ─────────────────────────────────────────────────────────────
configRouter.get("/cycles", asyncHandler(async (req, res: Response) => res.json(await svc.listCycles(req.auth!, q(req)))));
configRouter.post("/cycles", validateBody(createCycleSchema), asyncHandler(async (req, res: Response) =>
  res.status(201).json({ cycle: await svc.createCycle(req.auth!, req.body, req.ip) })));
configRouter.patch("/cycles/:id", validateBody(updateCycleSchema), asyncHandler(async (req, res: Response) =>
  res.json({ cycle: await svc.updateCycle(req.auth!, req.params.id!, req.body, req.ip) })));

// ── Escalation rules ──────────────────────────────────────────────────────────
configRouter.get("/escalations", asyncHandler(async (req, res: Response) => res.json(await svc.listEscalations(req.auth!, q(req)))));
configRouter.post("/escalations", validateBody(createEscalationSchema), asyncHandler(async (req, res: Response) =>
  res.status(201).json({ rule: await svc.createEscalation(req.auth!, req.body, req.ip) })));
configRouter.patch("/escalations/:id", validateBody(updateEscalationSchema), asyncHandler(async (req, res: Response) =>
  res.json({ rule: await svc.updateEscalation(req.auth!, req.params.id!, req.body, req.ip) })));

// ── Rubrics + dimensions ──────────────────────────────────────────────────────
configRouter.get("/rubrics", asyncHandler(async (req, res: Response) => res.json(await svc.listRubrics(req.auth!, q(req)))));
configRouter.post("/rubrics", validateBody(createRubricSchema), asyncHandler(async (req, res: Response) =>
  res.status(201).json({ rubric: await svc.createRubric(req.auth!, req.body, req.ip) })));
configRouter.patch("/rubrics/:id", validateBody(updateRubricSchema), asyncHandler(async (req, res: Response) =>
  res.json({ rubric: await svc.updateRubric(req.auth!, req.params.id!, req.body, req.ip) })));
configRouter.post("/rubrics/:rubricId/dimensions", validateBody(createDimensionSchema), asyncHandler(async (req, res: Response) =>
  res.status(201).json({ dimension: await svc.createDimension(req.auth!, req.params.rubricId!, req.body, req.ip) })));
configRouter.patch("/dimensions/:id", validateBody(updateDimensionSchema), asyncHandler(async (req, res: Response) =>
  res.json({ dimension: await svc.updateDimension(req.auth!, req.params.id!, req.body, req.ip) })));

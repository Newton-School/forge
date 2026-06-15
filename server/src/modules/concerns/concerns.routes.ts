import { Router, type Request, type Response } from "express";
import { asyncHandler } from "../../lib/errors.js";
import { requirePermission } from "../../middleware/auth.js";
import { validateBody } from "../../middleware/validate.js";
import { createConcernSchema, listConcernsQuery, transitionSchema } from "./concerns.schema.js";
import * as svc from "./concerns.service.js";

export const concernsRouter = Router();

concernsRouter.get(
  "/",
  requirePermission("concern:read"),
  asyncHandler(async (req: Request, res: Response) => {
    const q = listConcernsQuery.parse(req.query);
    res.json(await svc.listConcerns(req.auth!, q));
  }),
);

concernsRouter.post(
  "/",
  requirePermission("concern:raise"),
  validateBody(createConcernSchema),
  asyncHandler(async (req: Request, res: Response) => {
    res.status(201).json({ concern: await svc.raiseConcern(req.auth!, req.body, req.ip) });
  }),
);

concernsRouter.get(
  "/:id",
  requirePermission("concern:read"),
  asyncHandler(async (req: Request, res: Response) => {
    res.json({ concern: await svc.getConcern(req.auth!, req.params.id!) });
  }),
);

concernsRouter.post(
  "/:id/transition",
  requirePermission("concern:triage"),
  validateBody(transitionSchema),
  asyncHandler(async (req: Request, res: Response) => {
    res.json({ concern: await svc.transitionConcern(req.auth!, req.params.id!, req.body, req.ip) });
  }),
);

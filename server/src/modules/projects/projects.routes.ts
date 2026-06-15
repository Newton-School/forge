import { Router, type Request, type Response } from "express";
import { asyncHandler } from "../../lib/errors.js";
import { requirePermission } from "../../middleware/auth.js";
import { validateBody } from "../../middleware/validate.js";
import { createProjectSchema, listProjectsQuery, proposalDecisionSchema } from "./projects.schema.js";
import * as svc from "./projects.service.js";

export const projectsRouter = Router();

// List — any authenticated user; results are scope-filtered in the service.
projectsRouter.get(
  "/",
  asyncHandler(async (req: Request, res: Response) => {
    res.json(await svc.listProjects(req.auth!, listProjectsQuery.parse(req.query)));
  }),
);

// Create — mentors (own team), teachers (domain), admin/LCC.
projectsRouter.post(
  "/",
  requirePermission("project:manage"),
  validateBody(createProjectSchema),
  asyncHandler(async (req: Request, res: Response) => {
    res.status(201).json({ project: await svc.createProject(req.auth!, req.body, req.ip) });
  }),
);

// Faculty gate verdict on a project proposal.
projectsRouter.post(
  "/:id/proposal-decision",
  requirePermission("gate:decide"),
  validateBody(proposalDecisionSchema),
  asyncHandler(async (req: Request, res: Response) => {
    res.json({ project: await svc.decideProposal(req.auth!, req.params.id!, req.body, req.ip) });
  }),
);

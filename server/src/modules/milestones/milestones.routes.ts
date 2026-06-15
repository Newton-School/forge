import { Router, type Request, type Response } from "express";
import { asyncHandler } from "../../lib/errors.js";
import { requirePermission } from "../../middleware/auth.js";
import { validateBody } from "../../middleware/validate.js";
import { createMilestoneSchema, listMilestonesQuery, updateMilestoneSchema } from "./milestones.schema.js";
import * as svc from "./milestones.service.js";

export const milestonesRouter = Router();

// List — authenticated; scope-filtered in the service.
milestonesRouter.get(
  "/",
  asyncHandler(async (req: Request, res: Response) => {
    res.json(await svc.listMilestones(req.auth!, listMilestonesQuery.parse(req.query)));
  }),
);

// Create — mentors/teachers/admin.
milestonesRouter.post(
  "/",
  requirePermission("project:manage"),
  validateBody(createMilestoneSchema),
  asyncHandler(async (req: Request, res: Response) => {
    res.status(201).json({ milestone: await svc.createMilestone(req.auth!, req.body, req.ip) });
  }),
);

// Update progress / sign-off — mentors/teachers/admin.
milestonesRouter.patch(
  "/:id",
  requirePermission("project:manage"),
  validateBody(updateMilestoneSchema),
  asyncHandler(async (req: Request, res: Response) => {
    res.json({ milestone: await svc.updateMilestone(req.auth!, req.params.id!, req.body, req.ip) });
  }),
);

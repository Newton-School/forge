import { Router, type Request, type Response } from "express";
import { asyncHandler } from "../../lib/errors.js";
import { requirePermission } from "../../middleware/auth.js";
import { validateBody } from "../../middleware/validate.js";
import { listDeliverablesQuery, reviewDeliverableSchema, submitDeliverableSchema } from "./deliverables.schema.js";
import * as svc from "./deliverables.service.js";

export const deliverablesRouter = Router();

// List — authenticated; scope-filtered in the service.
deliverablesRouter.get(
  "/",
  asyncHandler(async (req: Request, res: Response) => {
    res.json(await svc.listDeliverables(req.auth!, listDeliverablesQuery.parse(req.query)));
  }),
);

// Submit — mentees/mentors.
deliverablesRouter.post(
  "/",
  requirePermission("deliverable:submit"),
  validateBody(submitDeliverableSchema),
  asyncHandler(async (req: Request, res: Response) => {
    res.status(201).json({ deliverable: await svc.submitDeliverable(req.auth!, req.body, req.ip) });
  }),
);

// Review verdict — mentors/teachers/admin.
deliverablesRouter.post(
  "/:id/review",
  requirePermission("deliverable:review"),
  validateBody(reviewDeliverableSchema),
  asyncHandler(async (req: Request, res: Response) => {
    res.json({ deliverable: await svc.reviewDeliverable(req.auth!, req.params.id!, req.body, req.ip) });
  }),
);

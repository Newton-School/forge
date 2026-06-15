import { Router, type Request, type Response } from "express";
import { asyncHandler } from "../../lib/errors.js";
import { requirePermission } from "../../middleware/auth.js";
import { validateBody } from "../../middleware/validate.js";
import { listMentorFeedbackQuery, submitMentorFeedbackSchema } from "./feedback.schema.js";
import * as svc from "./feedback.service.js";

export const feedbackRouter = Router();

// Submit a 360° mentor rating — mentee only.
feedbackRouter.post(
  "/mentor",
  requirePermission("mentorFeedback:submit"),
  validateBody(submitMentorFeedbackSchema),
  asyncHandler(async (req: Request, res: Response) => {
    res.status(201).json({ feedback: await svc.submitMentorFeedback(req.auth!, req.body, req.ip) });
  }),
);

// List 360° feedback in scope (mentor sees own; domain roles see their mentors).
feedbackRouter.get(
  "/mentor",
  asyncHandler(async (req: Request, res: Response) => {
    res.json(await svc.listMentorFeedback(req.auth!, listMentorFeedbackQuery.parse(req.query)));
  }),
);

import { Router, type Request, type Response } from "express";
import { asyncHandler } from "../../lib/errors.js";
import { requirePermission } from "../../middleware/auth.js";
import { validateBody } from "../../middleware/validate.js";
import {
  listUpdatesQuery, listWeeklyQuery, mentorStatusSchema, submitUpdateSchema, teacherDecisionSchema, weeklyReviewSchema,
} from "./reviews.schema.js";
import * as svc from "./reviews.service.js";

export const reviewsRouter = Router();

// ── L1 — mentee updates ───────────────────────────────────────────────
reviewsRouter.post(
  "/updates",
  requirePermission("menteeUpdate:submit"),
  validateBody(submitUpdateSchema),
  asyncHandler(async (req: Request, res: Response) => {
    res.status(201).json({ update: await svc.submitUpdate(req.auth!, req.body, req.ip) });
  }),
);
reviewsRouter.get(
  "/updates",
  requirePermission("review:read"),
  asyncHandler(async (req: Request, res: Response) => {
    res.json(await svc.listUpdates(req.auth!, listUpdatesQuery.parse(req.query)));
  }),
);

// ── L2 — mentor dashboard + status ────────────────────────────────────
reviewsRouter.get(
  "/mentees",
  // Read gate only — Mentor (own teams), Teacher (their domains), Admin/LCC (all) all hold
  // review:read; the actual visibility is scope-filtered inside mentorDashboard.
  requirePermission("review:read"),
  asyncHandler(async (req: Request, res: Response) => {
    res.json(await svc.mentorDashboard(req.auth!));
  }),
);
reviewsRouter.post(
  "/mentor-status",
  requirePermission("mentorStatus:submit"),
  validateBody(mentorStatusSchema),
  asyncHandler(async (req: Request, res: Response) => {
    res.status(201).json({ status: await svc.submitMentorStatus(req.auth!, req.body, req.ip) });
  }),
);

// ── L3 — mentor weekly review ─────────────────────────────────────────
reviewsRouter.get(
  "/weekly",
  requirePermission("review:read"),
  asyncHandler(async (req: Request, res: Response) => {
    res.json(await svc.listWeekly(req.auth!, listWeeklyQuery.parse(req.query)));
  }),
);
reviewsRouter.post(
  "/weekly",
  requirePermission("weeklyReview:l3Submit"),
  validateBody(weeklyReviewSchema),
  asyncHandler(async (req: Request, res: Response) => {
    res.status(201).json({ review: await svc.upsertWeekly(req.auth!, req.body, req.ip) });
  }),
);

// ── L4 — teacher decision ─────────────────────────────────────────────
reviewsRouter.post(
  "/weekly/:id/decision",
  requirePermission("weeklyReview:l4Submit"),
  validateBody(teacherDecisionSchema),
  asyncHandler(async (req: Request, res: Response) => {
    res.json({ review: await svc.setTeacherDecision(req.auth!, req.params.id!, req.body, req.ip) });
  }),
);

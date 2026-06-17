import { Router, type Request, type Response } from "express";
import { asyncHandler } from "../../lib/errors.js";
import { requirePermission } from "../../middleware/auth.js";
import { validateBody } from "../../middleware/validate.js";
import { announcementSchema, bulkSendSchema, sendEmailSchema, testOnboardingSchema } from "./email.schema.js";
import * as svc from "./email.service.js";

export const emailRouter = Router();

/**
 * PUBLIC open-tracking pixel — mounted BEFORE the auth stack (mail clients fetch it
 * with no cookie). Always returns the 1×1 PNG, even on a bad/expired token.
 */
export const emailTrackRouter = Router();
emailTrackRouter.get(
  "/:token.png",
  asyncHandler(async (req: Request, res: Response) => {
    const png = await svc.trackOpen(req.params.token!);
    res.set("Content-Type", "image/png");
    res.set("Cache-Control", "no-store, no-cache, must-revalidate, private");
    res.send(png);
  }),
);

// Direct send to explicit addresses.
emailRouter.post(
  "/send",
  requirePermission("email:send"),
  validateBody(sendEmailSchema),
  asyncHandler(async (req: Request, res: Response) =>
    res.status(201).json(await svc.sendEmail(req.auth!, req.body, req.ip))),
);

// Targeted bulk send (recipients resolved + capped server-side).
emailRouter.post(
  "/bulk",
  requirePermission("email:bulkSend"),
  validateBody(bulkSendSchema),
  asyncHandler(async (req: Request, res: Response) =>
    res.status(201).json(await svc.bulkSend(req.auth!, req.body, req.ip))),
);

// Saved templates.
emailRouter.get(
  "/templates",
  requirePermission("email:send"),
  asyncHandler(async (req: Request, res: Response) => res.json(await svc.listTemplates(req.auth!))),
);

// Send [TEST] onboarding previews to reviewers (capped, marked TEST).
emailRouter.post(
  "/test-onboarding",
  requirePermission("email:send"),
  validateBody(testOnboardingSchema),
  asyncHandler(async (req: Request, res: Response) =>
    res.status(201).json(await svc.sendTestOnboarding(req.auth!, req.body, req.ip))),
);

// Announcements — in-app fan-out (+ optional email).
emailRouter.post(
  "/announcements",
  requirePermission("announcement:send"),
  validateBody(announcementSchema),
  asyncHandler(async (req: Request, res: Response) =>
    res.status(201).json(await svc.sendAnnouncement(req.auth!, req.body, req.ip))),
);

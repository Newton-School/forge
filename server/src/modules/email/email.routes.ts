import { Router, type Request, type Response } from "express";
import { asyncHandler } from "../../lib/errors.js";
import { requirePermission } from "../../middleware/auth.js";
import { validateBody } from "../../middleware/validate.js";
import { announcementSchema, bulkSendSchema, sendEmailSchema } from "./email.schema.js";
import * as svc from "./email.service.js";

export const emailRouter = Router();

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

// Announcements — in-app fan-out (+ optional email).
emailRouter.post(
  "/announcements",
  requirePermission("announcement:send"),
  validateBody(announcementSchema),
  asyncHandler(async (req: Request, res: Response) =>
    res.status(201).json(await svc.sendAnnouncement(req.auth!, req.body, req.ip))),
);

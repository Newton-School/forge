import { Router, type Request, type Response } from "express";
import { z } from "zod";
import { asyncHandler } from "../../lib/errors.js";
import { requirePermission } from "../../middleware/auth.js";
import * as svc from "./github.service.js";

const listQuery = z.object({
  teamId: z.string().optional(),
  take: z.coerce.number().int().min(1).max(200).default(100),
  skip: z.coerce.number().int().min(0).default(0),
});

/**
 * PUBLIC webhook receiver. Mounted BEFORE the session/CSRF/auth stack — GitHub
 * authenticates with an HMAC signature, not a cookie. Verification happens in the
 * service against the raw request bytes captured by the JSON parser.
 */
export const githubWebhookRouter = Router();
githubWebhookRouter.post(
  "/",
  asyncHandler(async (req: Request, res: Response) => {
    const result = await svc.ingestWebhook(
      req.get("x-github-event"),
      req.get("x-hub-signature-256"),
      req.get("x-github-delivery"),
      req.rawBody,
      req.body,
    );
    res.json(result);
  }),
);

/** Authenticated read side (mounted after requireAuth). */
export const githubRouter = Router();

githubRouter.get(
  "/activity",
  requirePermission("review:read"),
  asyncHandler(async (req: Request, res: Response) => {
    res.json(await svc.listActivity(req.auth!, listQuery.parse(req.query)));
  }),
);

githubRouter.get(
  "/status",
  requirePermission("integration:manage"),
  asyncHandler(async (_req: Request, res: Response) => {
    res.json(svc.status());
  }),
);

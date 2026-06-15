import { Router, type Request, type Response } from "express";
import { z } from "zod";
import { asyncHandler } from "../../lib/errors.js";
import { requirePermission } from "../../middleware/auth.js";
import * as svc from "./discord.service.js";

const listQuery = z.object({
  teamId: z.string().optional(),
  take: z.coerce.number().int().min(1).max(200).default(100),
  skip: z.coerce.number().int().min(0).default(0),
});

/**
 * PUBLIC Discord interactions receiver. Mounted BEFORE session/CSRF/auth — Discord
 * authenticates with an Ed25519 signature over the raw body, not a cookie.
 */
export const discordWebhookRouter = Router();
discordWebhookRouter.post(
  "/",
  asyncHandler(async (req: Request, res: Response) => {
    const result = await svc.handleInteraction(
      req.get("x-signature-ed25519"),
      req.get("x-signature-timestamp"),
      req.rawBody,
      req.body,
      new Date(),
    );
    res.json(result);
  }),
);

/** Authenticated read side. */
export const discordRouter = Router();

discordRouter.get(
  "/activity",
  requirePermission("review:read"),
  asyncHandler(async (req: Request, res: Response) => {
    res.json(await svc.listActivity(req.auth!, listQuery.parse(req.query)));
  }),
);

discordRouter.get(
  "/status",
  requirePermission("integration:manage"),
  asyncHandler(async (_req: Request, res: Response) => {
    res.json(svc.status());
  }),
);

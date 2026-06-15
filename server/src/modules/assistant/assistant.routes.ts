import { Router, type Request, type Response } from "express";
import rateLimit from "express-rate-limit";
import { z } from "zod";
import { asyncHandler } from "../../lib/errors.js";
import { requirePermission } from "../../middleware/auth.js";
import { validateBody } from "../../middleware/validate.js";
import * as svc from "./assistant.service.js";

// AI calls are capped: a tight per-IP rate limit on top of the global limiter.
const assistantRateLimit = rateLimit({ windowMs: 60_000, max: 15, standardHeaders: true, legacyHeaders: false });

const askSchema = z.object({ prompt: z.string().min(1).max(4000) });
const summarizeSchema = z.object({ menteeId: z.string().min(1) });

export const assistantRouter = Router();
assistantRouter.use(assistantRateLimit);

assistantRouter.post(
  "/ask",
  validateBody(askSchema),
  asyncHandler(async (req: Request, res: Response) => res.json(await svc.ask(req.auth!, req.body.prompt, req.ip))),
);

assistantRouter.post(
  "/summarize",
  requirePermission("review:read"),
  validateBody(summarizeSchema),
  asyncHandler(async (req: Request, res: Response) => res.json(await svc.summarizeMentee(req.auth!, req.body.menteeId, req.ip))),
);

import { Router, type Request, type Response } from "express";
import { asyncHandler } from "../../lib/errors.js";
import { env } from "../../config/env.js";
import { logger } from "../../lib/logger.js";
import * as svc from "./public.service.js";

/**
 * PUBLIC, unauthenticated surface — mounted BEFORE the session/auth/CSRF stack.
 * It exposes ONLY aggregate landing metrics (read) and a secret-gated recompute
 * (write). No user data, no inputs on the read path.
 */
export const publicRouter = Router();

// Read-only aggregate stats for the landing page. No auth, no inputs; serves the
// single precomputed snapshot row. Short shared-cache window.
publicRouter.get(
  "/stats",
  asyncHandler(async (_req: Request, res: Response) => {
    res.set("Cache-Control", "public, max-age=300, s-maxage=300");
    res.json(await svc.getPublicStats());
  }),
);

// Recompute the snapshot. NOT public: requires the x-jobs-secret header to match
// JOBS_SECRET (set a scheduled cron to call this). Disabled when JOBS_SECRET unset.
publicRouter.post(
  "/stats/recompute",
  asyncHandler(async (req: Request, res: Response) => {
    const expected = env.JOBS_SECRET;
    const provided = req.header("x-jobs-secret");
    if (!expected || provided !== expected) {
      logger.warn({ ip: req.ip }, "rejected public stats recompute (bad/missing secret)");
      res.status(403).json({ error: { code: "forbidden", message: "Forbidden" } });
      return;
    }
    res.json(await svc.recomputePlatformStats());
  }),
);

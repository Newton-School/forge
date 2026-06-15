import { Router, type Request, type Response } from "express";
import { asyncHandler } from "../../lib/errors.js";
import { requirePermission } from "../../middleware/auth.js";
import { runAutoFlagJob } from "./jobs.service.js";

export const jobsRouter = Router();

// Manual trigger for ops/testing — Admin only. The scheduler runs the same job on a timer.
jobsRouter.post(
  "/auto-flags/run",
  requirePermission("integration:manage"),
  asyncHandler(async (_req: Request, res: Response) => {
    res.json(await runAutoFlagJob(new Date()));
  }),
);

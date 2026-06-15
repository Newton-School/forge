import { Router, type Request, type Response } from "express";
import { asyncHandler } from "../../lib/errors.js";
import { requirePermission } from "../../middleware/auth.js";
import * as svc from "./analytics.service.js";

export const analyticsRouter = Router();

// Headline KPIs — mentors and up (analytics:team); scope-filtered in the service.
analyticsRouter.get(
  "/overview",
  requirePermission("analytics:team"),
  asyncHandler(async (req: Request, res: Response) => res.json(await svc.overview(req.auth!))),
);

// Per-domain rollup — teachers and up.
analyticsRouter.get(
  "/domains",
  requirePermission("analytics:domain"),
  asyncHandler(async (req: Request, res: Response) => res.json(await svc.byDomain(req.auth!))),
);

// Per-team rollup — mentors and up.
analyticsRouter.get(
  "/teams",
  requirePermission("analytics:team"),
  asyncHandler(async (req: Request, res: Response) => res.json(await svc.byTeam(req.auth!))),
);

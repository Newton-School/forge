import { Router, type Request, type Response } from "express";
import { asyncHandler } from "../../lib/errors.js";
import { requirePermission } from "../../middleware/auth.js";
import { validateBody } from "../../middleware/validate.js";
import { issueDemeritSchema, listDemeritsQuery, updateDemeritSchema } from "./demerits.schema.js";
import * as svc from "./demerits.service.js";

export const demeritsRouter = Router();

// List — scope-filtered in the service (subject sees own; supervisors see their scope).
demeritsRouter.get(
  "/",
  requirePermission("demerit:read"),
  asyncHandler(async (req: Request, res: Response) => {
    res.json(await svc.listDemerits(req.auth!, listDemeritsQuery.parse(req.query)));
  }),
);

// Issue — Admin / LCC.
demeritsRouter.post(
  "/",
  requirePermission("demerit:manage"),
  validateBody(issueDemeritSchema),
  asyncHandler(async (req: Request, res: Response) => {
    res.status(201).json({ demerit: await svc.issueDemerit(req.auth!, req.body, req.ip) });
  }),
);

// Amend — Admin / LCC.
demeritsRouter.patch(
  "/:id",
  requirePermission("demerit:manage"),
  validateBody(updateDemeritSchema),
  asyncHandler(async (req: Request, res: Response) => {
    res.json({ demerit: await svc.updateDemerit(req.auth!, req.params.id!, req.body, req.ip) });
  }),
);

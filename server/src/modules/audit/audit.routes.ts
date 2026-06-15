import { Router, type Request, type Response } from "express";
import { asyncHandler } from "../../lib/errors.js";
import { requirePermission } from "../../middleware/auth.js";
import { listAuditQuery } from "./audit.schema.js";
import * as svc from "./audit.service.js";

export const auditRouter = Router();

// Read the immutable audit trail — Admin / LCC.
auditRouter.get(
  "/",
  requirePermission("auditLog:read"),
  asyncHandler(async (req: Request, res: Response) => {
    res.json(await svc.listAudit(req.auth!, listAuditQuery.parse(req.query)));
  }),
);

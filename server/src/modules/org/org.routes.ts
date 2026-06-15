import { Router, type Request, type Response } from "express";
import { asyncHandler } from "../../lib/errors.js";
import { requirePermission } from "../../middleware/auth.js";
import { validateBody } from "../../middleware/validate.js";
import { addMemberSchema, createDomainSchema, createTeamSchema, updateDomainSchema, updateTeamSchema } from "./org.schema.js";
import * as svc from "./org.service.js";

export const orgRouter = Router();

// ── Domains ─────────────────────────────────────────────────────────────────
orgRouter.get(
  "/domains",
  requirePermission("domain:read"),
  asyncHandler(async (req: Request, res: Response) => res.json(await svc.listDomains(req.auth!))),
);
orgRouter.post(
  "/domains",
  requirePermission("domain:manage"),
  validateBody(createDomainSchema),
  asyncHandler(async (req: Request, res: Response) =>
    res.status(201).json({ domain: await svc.createDomain(req.auth!, req.body, req.ip) })),
);
orgRouter.patch(
  "/domains/:id",
  requirePermission("domain:manage"),
  validateBody(updateDomainSchema),
  asyncHandler(async (req: Request, res: Response) =>
    res.json({ domain: await svc.updateDomain(req.auth!, req.params.id!, req.body, req.ip) })),
);

// ── Teams ───────────────────────────────────────────────────────────────────
orgRouter.get(
  "/teams",
  requirePermission("team:read"),
  asyncHandler(async (req: Request, res: Response) => res.json(await svc.listTeams(req.auth!))),
);
orgRouter.post(
  "/teams",
  requirePermission("team:manage"),
  validateBody(createTeamSchema),
  asyncHandler(async (req: Request, res: Response) =>
    res.status(201).json({ team: await svc.createTeam(req.auth!, req.body, req.ip) })),
);
orgRouter.patch(
  "/teams/:id",
  requirePermission("team:manage"),
  validateBody(updateTeamSchema),
  asyncHandler(async (req: Request, res: Response) =>
    res.json({ team: await svc.updateTeam(req.auth!, req.params.id!, req.body, req.ip) })),
);

// ── Team membership ───────────────────────────────────────────────────────────
orgRouter.post(
  "/teams/:id/members",
  requirePermission("team:manage"),
  validateBody(addMemberSchema),
  asyncHandler(async (req: Request, res: Response) =>
    res.status(201).json({ member: await svc.addMember(req.auth!, req.params.id!, req.body, req.ip) })),
);
orgRouter.delete(
  "/teams/:id/members/:userId",
  requirePermission("team:manage"),
  asyncHandler(async (req: Request, res: Response) =>
    res.json(await svc.removeMember(req.auth!, req.params.id!, req.params.userId!, req.ip))),
);

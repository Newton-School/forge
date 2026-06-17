import { Router, type Request, type Response } from "express";
import { asyncHandler } from "../../lib/errors.js";
import { requirePermission } from "../../middleware/auth.js";
import { validateBody } from "../../middleware/validate.js";
import { assignRoleSchema, createUserSchema, listUsersQuery, updateUserSchema } from "./users.schema.js";
import * as svc from "./users.service.js";

export const usersRouter = Router();

usersRouter.get(
  "/",
  requirePermission("user:read"),
  asyncHandler(async (req: Request, res: Response) => {
    const q = listUsersQuery.parse(req.query);
    res.json(await svc.listUsers(q));
  }),
);

usersRouter.post(
  "/",
  requirePermission("user:create"),
  validateBody(createUserSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const user = await svc.createUser(req.auth!, req.body, req.ip);
    res.status(201).json({ user });
  }),
);

usersRouter.get(
  "/:id",
  requirePermission("user:read"),
  asyncHandler(async (req: Request, res: Response) => {
    res.json({ user: await svc.getUser(req.params.id!) });
  }),
);

usersRouter.patch(
  "/:id",
  requirePermission("user:update"),
  validateBody(updateUserSchema),
  asyncHandler(async (req: Request, res: Response) => {
    res.json({ user: await svc.updateUser(req.auth!, req.params.id!, req.body, req.ip) });
  }),
);

usersRouter.post(
  "/:id/roles",
  requirePermission("role:assign"),
  validateBody(assignRoleSchema),
  asyncHandler(async (req: Request, res: Response) => {
    res.json({ user: await svc.assignRole(req.auth!, req.params.id!, req.body, req.ip) });
  }),
);

// Resend the onboarding invitation (reissues the token + email).
usersRouter.post(
  "/:id/resend-invite",
  requirePermission("invitation:send"),
  asyncHandler(async (req: Request, res: Response) => {
    res.json(await svc.resendInvitation(req.auth!, req.params.id!, req.ip));
  }),
);

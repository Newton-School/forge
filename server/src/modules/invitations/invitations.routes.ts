import { Router, type Request, type Response } from "express";
import { z } from "zod";
import { asyncHandler } from "../../lib/errors.js";
import { requirePermission } from "../../middleware/auth.js";
import { listInvitations, revokeInvitation } from "./invitations.service.js";

export const invitationsRouter = Router();

const listQuery = z.object({
  take: z.coerce.number().int().min(1).max(200).default(100),
  skip: z.coerce.number().int().min(0).default(0),
});

// Invitation status board for Admin/LCC (Pending / Sent / Opened / Completed / Expired).
invitationsRouter.get(
  "/",
  requirePermission("invitation:read"),
  asyncHandler(async (req: Request, res: Response) => {
    const q = listQuery.parse(req.query);
    res.json(await listInvitations(q.take, q.skip));
  }),
);

// Revoke an invitation (invalidates the token; locks out a not-yet-onboarded invitee).
invitationsRouter.delete(
  "/:id",
  requirePermission("invitation:send"),
  asyncHandler(async (req: Request, res: Response) => {
    res.json(await revokeInvitation(req.auth!, req.params.id!, req.ip));
  }),
);

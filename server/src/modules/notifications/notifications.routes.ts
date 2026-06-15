import { Router, type Request, type Response } from "express";
import { asyncHandler } from "../../lib/errors.js";
import { listNotificationsQuery } from "./notifications.schema.js";
import * as svc from "./notifications.service.js";

// All routes act on the caller's own notifications (self-scoped, no extra permission).
export const notificationsRouter = Router();

notificationsRouter.get(
  "/",
  asyncHandler(async (req: Request, res: Response) =>
    res.json(await svc.listNotifications(req.auth!, listNotificationsQuery.parse(req.query)))),
);

notificationsRouter.get(
  "/unread-count",
  asyncHandler(async (req: Request, res: Response) => res.json(await svc.unreadCount(req.auth!))),
);

notificationsRouter.post(
  "/read-all",
  asyncHandler(async (req: Request, res: Response) => res.json(await svc.markAllRead(req.auth!))),
);

notificationsRouter.post(
  "/:id/read",
  asyncHandler(async (req: Request, res: Response) => res.json(await svc.markRead(req.auth!, req.params.id!))),
);

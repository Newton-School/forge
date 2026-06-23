import { Router, type Request, type Response } from "express";
import { asyncHandler } from "../../lib/errors.js";
import { getConnections } from "./connections.service.js";

/** Per-user integration status (GitHub/Discord identity + team repo). Mounted behind requireAuth. */
export const connectionsRouter = Router();

connectionsRouter.get(
  "/",
  asyncHandler(async (req: Request, res: Response) => {
    res.json(await getConnections(req.auth!));
  }),
);

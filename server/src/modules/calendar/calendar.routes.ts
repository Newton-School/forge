import { Router, type Request, type Response } from "express";
import { asyncHandler } from "../../lib/errors.js";
import { validateBody } from "../../middleware/validate.js";
import { createEventSchema, listEventsQuery } from "./calendar.schema.js";
import * as svc from "./calendar.service.js";

// Mounted under requireAuth. Reads are scope-filtered; create is authorized per scope in the service.
export const calendarRouter = Router();

calendarRouter.get(
  "/events",
  asyncHandler(async (req: Request, res: Response) =>
    res.json(await svc.listEvents(req.auth!, listEventsQuery.parse(req.query)))),
);

calendarRouter.post(
  "/events",
  validateBody(createEventSchema),
  asyncHandler(async (req: Request, res: Response) =>
    res.status(201).json({ event: await svc.createEvent(req.auth!, req.body, req.ip) })),
);

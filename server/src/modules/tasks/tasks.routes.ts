import { Router, type Request, type Response } from "express";
import { asyncHandler } from "../../lib/errors.js";
import { requirePermission } from "../../middleware/auth.js";
import { validateBody } from "../../middleware/validate.js";
import { createTaskSchema, listTasksQuery, updateTaskSchema } from "./tasks.schema.js";
import * as svc from "./tasks.service.js";

export const tasksRouter = Router();

// List — authenticated; scope-filtered in the service.
tasksRouter.get(
  "/",
  asyncHandler(async (req: Request, res: Response) => {
    res.json(await svc.listTasks(req.auth!, listTasksQuery.parse(req.query)));
  }),
);

// Assign — mentors/teachers/admin.
tasksRouter.post(
  "/",
  requirePermission("task:assign"),
  validateBody(createTaskSchema),
  asyncHandler(async (req: Request, res: Response) => {
    res.status(201).json({ task: await svc.assignTask(req.auth!, req.body, req.ip) });
  }),
);

// Update progress/status — assignee (own) or a managing role; authorized in the service.
tasksRouter.patch(
  "/:id",
  validateBody(updateTaskSchema),
  asyncHandler(async (req: Request, res: Response) => {
    res.json({ task: await svc.updateTask(req.auth!, req.params.id!, req.body, req.ip) });
  }),
);

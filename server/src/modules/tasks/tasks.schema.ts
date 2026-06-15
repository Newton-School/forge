import { z } from "zod";

const WORK_STATUS = ["TODO", "IN_PROGRESS", "IN_REVIEW", "DONE", "RELEASED", "BLOCKED"] as const;

/** Assign a task to a contributor under a project. */
export const createTaskSchema = z.object({
  projectId: z.string().min(1),
  milestoneId: z.string().min(1).optional(),
  title: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  assigneeId: z.string().min(1).optional(),
  dueAt: z.coerce.date().optional(),
});
export type CreateTaskInput = z.infer<typeof createTaskSchema>;

/** Update progress/status on a task (assignee self-update or managing role). */
export const updateTaskSchema = z
  .object({
    title: z.string().min(1).max(200).optional(),
    description: z.string().max(2000).optional(),
    status: z.enum(WORK_STATUS).optional(),
    progressPct: z.coerce.number().int().min(0).max(100).optional(),
    nextAction: z.string().max(500).optional(),
    dueAt: z.coerce.date().optional(),
  })
  .refine((d) => Object.keys(d).length > 0, { message: "Provide at least one field to update" });
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;

export const listTasksQuery = z.object({
  projectId: z.string().optional(),
  assigneeId: z.string().optional(),
  status: z.enum(WORK_STATUS).optional(),
  take: z.coerce.number().int().min(1).max(200).default(100),
  skip: z.coerce.number().int().min(0).default(0),
});
export type ListTasksQuery = z.infer<typeof listTasksQuery>;

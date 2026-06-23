import { Errors } from "../../lib/errors.js";
import { audit } from "../../lib/audit.js";
import { can, effectiveScope } from "../../rbac/policy.js";
import type { AuthContext } from "../../rbac/types.js";
import { tasksRepo } from "./tasks.repository.js";
import type { CreateTaskInput, ListTasksQuery, UpdateTaskInput } from "./tasks.schema.js";

/** Scope filter for reads: tasks visible by domain, team, or self (assignee). */
function taskScope(ctx: AuthContext): Record<string, unknown> {
  const s = effectiveScope(ctx);
  if (s.global) return {};
  const or: Record<string, unknown>[] = [];
  if (s.domainIds.length) or.push({ project: { team: { domainId: { in: s.domainIds } } } });
  if (s.teamIds.length) or.push({ project: { teamId: { in: s.teamIds } } });
  if (s.self) or.push({ assigneeId: ctx.id });
  return or.length ? (or.length === 1 ? or[0]! : { OR: or }) : { id: "__never__" };
}

/** Display-ready task DTO — joins project + assignee/assignedBy names for the UI. */
function toTaskDto(
  t: Awaited<ReturnType<typeof tasksRepo.list>>[number],
  names: Map<string, string>,
) {
  return {
    id: t.id,
    title: t.title,
    project: t.project?.name ?? "—",
    assignee: t.assigneeId ? names.get(t.assigneeId) ?? "—" : "—",
    assignedBy: t.assignedById ? names.get(t.assignedById) ?? "—" : "—",
    status: t.status,
    progress: t.progressPct,
    due: t.dueAt,
    milestoneId: t.milestoneId,
  };
}

export async function listTasks(ctx: AuthContext, q: ListTasksQuery) {
  // AND filters WITH scope — spreading `?assigneeId=` over a self-scope `{ assigneeId: ctx.id }`
  // would overwrite it and leak another user's tasks. AND can only narrow within scope.
  const where = {
    AND: [
      taskScope(ctx),
      ...(q.projectId ? [{ projectId: q.projectId }] : []),
      ...(q.assigneeId ? [{ assigneeId: q.assigneeId }] : []),
      ...(q.status ? [{ status: q.status }] : []),
    ],
  };
  const items = await tasksRepo.list(where, q.take, q.skip);
  const ids = [...new Set(items.flatMap((t) => [t.assigneeId, t.assignedById]).filter(Boolean) as string[])];
  const names = new Map((await tasksRepo.userNames(ids)).map((u) => [u.id, u.fullName]));
  return { items: items.map((t) => toTaskDto(t, names)) };
}

export async function assignTask(ctx: AuthContext, input: CreateTaskInput, ip?: string) {
  const project = await tasksRepo.projectForScope(input.projectId);
  if (!project) throw Errors.notFound("Project not found");
  // Layer 2: may the actor assign work on this project's team/domain?
  if (!can(ctx, "task:assign", { domainId: project.team.domainId, teamId: project.teamId })) {
    throw Errors.forbidden("You cannot assign tasks on this project");
  }
  if (input.assigneeId && !(await tasksRepo.isTeamMember(project.teamId, input.assigneeId))) {
    throw Errors.badRequest("Assignee is not a member of the project's team");
  }
  const task = await tasksRepo.create(input, ctx.id);
  await audit(ctx, {
    action: "task:assign", entityType: "Task", entityId: task.id,
    after: { projectId: input.projectId, assigneeId: input.assigneeId ?? null, title: input.title }, ip,
  });
  return task;
}

export async function updateTask(ctx: AuthContext, id: string, input: UpdateTaskInput, ip?: string) {
  const task = await tasksRepo.findById(id);
  if (!task) throw Errors.notFound("Task not found");
  const isAssignee = task.assigneeId === ctx.id;
  const canManage = can(ctx, "task:assign", { domainId: task.project.team.domainId, teamId: task.project.teamId });
  // The assignee may update their own progress (task:updateOwn); managers may update any task in scope.
  if (!isAssignee && !canManage) {
    throw Errors.forbidden("You cannot update this task");
  }
  const updated = await tasksRepo.update(id, input);
  await audit(ctx, {
    action: isAssignee && !canManage ? "task:updateOwn" : "task:update",
    entityType: "Task", entityId: id,
    before: { status: task.status, progressPct: task.progressPct },
    after: { status: updated.status, progressPct: updated.progressPct }, ip,
  });
  return updated;
}

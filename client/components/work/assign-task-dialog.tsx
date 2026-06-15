"use client";

import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { FormDialog, Field } from "@/components/ui/form-dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { submit, MENTEES, MILESTONES } from "@/lib/api";

/**
 * Mentor "Assign Task" → POST /tasks. Presentation-safe via `submit` (no-op in
 * demo mode). In production the project/assignee selects come from the API.
 */
export function AssignTaskDialog() {
  const router = useRouter();

  async function assign(data: FormData) {
    await submit("/tasks", "POST", {
      projectId: String(data.get("projectId") ?? ""),
      title: String(data.get("title") ?? ""),
      description: (data.get("description") as string) || undefined,
      assigneeId: (data.get("assigneeId") as string) || undefined,
      milestoneId: (data.get("milestoneId") as string) || undefined,
      dueAt: (data.get("dueAt") as string) || undefined,
    });
    router.refresh();
  }

  return (
    <FormDialog
      trigger={
        <Button size="sm" className="gap-1.5">
          <Plus className="size-3.5" /> Assign Task
        </Button>
      }
      title="Assign task"
      submitLabel="Assign task"
      onSubmit={assign}
    >
      <Field label="Title" htmlFor="task-title">
        <Input id="task-title" name="title" placeholder="Short task title" required />
      </Field>
      <Field label="Project" htmlFor="task-project">
        <Input id="task-project" name="projectId" placeholder="Project id" required />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Assignee">
          <Select name="assigneeId">
            <SelectTrigger><SelectValue placeholder="Select a mentee" /></SelectTrigger>
            <SelectContent>
              {MENTEES.map((m) => (
                <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <Field label="Milestone">
          <Select name="milestoneId">
            <SelectTrigger><SelectValue placeholder="Select a milestone" /></SelectTrigger>
            <SelectContent>
              {MILESTONES.map((ms) => (
                <SelectItem key={ms.id} value={ms.id}>{ms.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
      </div>
      <Field label="Due date" htmlFor="task-due">
        <Input id="task-due" name="dueAt" type="date" />
      </Field>
      <Field label="Description" htmlFor="task-desc">
        <Textarea id="task-desc" name="description" rows={4} placeholder="What needs to be done?" />
      </Field>
    </FormDialog>
  );
}

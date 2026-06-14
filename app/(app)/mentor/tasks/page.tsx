import { Plus } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { SectionCard } from "@/components/dashboard/section-card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { WorkBadge } from "@/components/dashboard/status-badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { FormDialog, Field } from "@/components/ui/form-dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { TASKS, MENTEES, MILESTONES } from "@/lib/mock/data";
import { shortDate } from "@/lib/utils";

export default function TasksPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Assigned Tasks"
        description="Work you've handed to your mentees and teams."
        actions={
          <FormDialog
            trigger={
              <Button size="sm" className="gap-1.5">
                <Plus className="size-3.5" /> Assign Task
              </Button>
            }
            title="Assign task"
            submitLabel="Assign task"
          >
            <Field label="Title" htmlFor="task-title">
              <Input id="task-title" placeholder="Short task title" />
            </Field>
            <Field label="Project" htmlFor="task-project">
              <Input id="task-project" placeholder="Project name" />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Assignee">
                <Select>
                  <SelectTrigger><SelectValue placeholder="Select a mentee" /></SelectTrigger>
                  <SelectContent>
                    {MENTEES.map((m) => (
                      <SelectItem key={m.id} value={m.name}>{m.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Milestone">
                <Select>
                  <SelectTrigger><SelectValue placeholder="Select a milestone" /></SelectTrigger>
                  <SelectContent>
                    {MILESTONES.map((ms) => (
                      <SelectItem key={ms.id} value={ms.name}>{ms.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            </div>
            <Field label="Due date" htmlFor="task-due">
              <Input id="task-due" type="date" />
            </Field>
            <Field label="Description" htmlFor="task-desc">
              <Textarea id="task-desc" rows={4} placeholder="What needs to be done?" />
            </Field>
          </FormDialog>
        }
      />

      <SectionCard title="All tasks" description={`${TASKS.length} tasks assigned`}>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Task</TableHead>
              <TableHead>Project</TableHead>
              <TableHead>Assignee</TableHead>
              <TableHead className="w-40">Progress</TableHead>
              <TableHead>Due</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {TASKS.map((t) => (
              <TableRow key={t.id}>
                <TableCell className="font-medium">{t.title}</TableCell>
                <TableCell className="text-muted-foreground">{t.project}</TableCell>
                <TableCell className="text-muted-foreground">{t.assignee}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Progress
                      value={t.progress}
                      className="w-24"
                      tone={t.status === "BLOCKED" ? "danger" : t.progress === 100 ? "success" : "primary"}
                    />
                    <span className="text-xs tabular-nums text-muted-foreground">{t.progress}%</span>
                  </div>
                </TableCell>
                <TableCell className="text-muted-foreground">{shortDate(t.due)}</TableCell>
                <TableCell>
                  <WorkBadge v={t.status} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </SectionCard>
    </div>
  );
}

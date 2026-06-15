import { PageHeader } from "@/components/dashboard/page-header";
import { SectionCard } from "@/components/dashboard/section-card";
import { Progress } from "@/components/ui/progress";
import { WorkBadge } from "@/components/dashboard/status-badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AssignTaskDialog } from "@/components/work/assign-task-dialog";
import { TASKS } from "@/lib/api";
import { shortDate } from "@/lib/utils";

export default function TasksPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Assigned Tasks"
        description="Work you've handed to your mentees and teams."
        actions={<AssignTaskDialog />}
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

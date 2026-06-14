import { ClipboardList } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { SectionCard } from "@/components/dashboard/section-card";
import { EmptyState } from "@/components/dashboard/empty-state";
import { WorkBadge } from "@/components/dashboard/status-badge";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { TASKS } from "@/lib/mock/data";
import { shortDate } from "@/lib/utils";

export default function MenteeTasksPage() {
  const mine = TASKS.filter((t) => t.assignee === "Sneha Iyer");
  const tasks = mine.length ? mine : TASKS;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="My Tasks" description="Tasks assigned to you across your individual and group projects." />

      <SectionCard title="Tasks" description={`${tasks.length} assigned`}>
        {tasks.length === 0 ? (
          <div className="p-4">
            <EmptyState icon={<ClipboardList />} title="No tasks assigned" description="New tasks from your mentor will appear here." />
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Task</TableHead>
                <TableHead>Project</TableHead>
                <TableHead className="w-44">Progress</TableHead>
                <TableHead>Due</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tasks.map((t) => (
                <TableRow key={t.id}>
                  <TableCell className="font-medium">{t.title}</TableCell>
                  <TableCell className="text-muted-foreground">{t.project}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Progress
                        value={t.progress}
                        className="w-24"
                        tone={t.progress === 100 ? "success" : t.status === "BLOCKED" ? "danger" : "primary"}
                      />
                      <span className="text-xs tabular-nums text-muted-foreground">{t.progress}%</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{shortDate(t.due)}</TableCell>
                  <TableCell><WorkBadge v={t.status} /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </SectionCard>
    </div>
  );
}

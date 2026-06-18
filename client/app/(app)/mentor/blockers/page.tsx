import { OctagonAlert, Clock } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { Card } from "@/components/ui/card";
import { SeverityBadge, ConcernBadge, WorkBadge } from "@/components/dashboard/status-badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { FormDialog, Field } from "@/components/ui/form-dialog";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { api } from "@/lib/api";
import { timeAgo, cn } from "@/lib/utils";
import type { Severity } from "@/lib/types";

const TODAY = new Date("2026-06-15");
const MENTOR = "Aryan Sharma";

function daysBetween(a: Date, b: Date) {
  return Math.round((a.getTime() - b.getTime()) / 86_400_000);
}

/** SLA label relative to today, with a danger flag when overdue / due today. */
function sla(due: string): { label: string; danger: boolean } {
  const diff = daysBetween(new Date(due), TODAY);
  if (diff < 0) return { label: `overdue ${Math.abs(diff)}d`, danger: true };
  if (diff === 0) return { label: "due today", danger: true };
  if (diff === 1) return { label: "due in 1d", danger: false };
  return { label: `due in ${diff}d`, danger: false };
}

interface Row {
  id: string;
  item: string;
  sub: string;
  raisedBy: string;
  severity: Severity;
  age: string;
  slaDue: string;
  statusNode: React.ReactNode;
}

export default async function Blockers() {
  const [TASKS, CONCERNS] = await Promise.all([api.tasks(), api.concerns()]);

  const blockedTasks: Row[] = TASKS.filter((t) => t.status === "BLOCKED").map((t) => ({
    id: t.id,
    item: t.title,
    sub: t.project,
    raisedBy: t.assignee,
    severity: "HIGH",
    age: timeAgo(t.due),
    slaDue: t.due,
    statusNode: <WorkBadge v={t.status} />,
  }));

  const criticalConcerns: Row[] = CONCERNS
    .filter((c) => c.severity === "HIGH" || c.severity === "CRITICAL")
    .map((c) => ({
      id: c.id,
      item: c.title,
      sub: c.ref,
      raisedBy: c.raisedBy,
      severity: c.severity,
      age: timeAgo(c.createdAt),
      slaDue: c.slaDue,
      statusNode: <ConcernBadge v={c.status} />,
    }));

  const ROWS = [...blockedTasks, ...criticalConcerns];

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Blockers & SLA"
        description={`Active blockers and high-severity concerns for ${MENTOR}'s team.`}
      />

      <Card className="flex items-start gap-3 border-warning bg-warning-bg/40 p-4">
        <Clock className="mt-0.5 size-4 shrink-0 text-warning" />
        <p className="text-sm text-foreground">
          <span className="font-medium">SDSE SLA:</span>{" "}
          <span className="text-muted-foreground">
            blocker → notify lead within 4h, escalate if unresolved &gt; 1 day.
          </span>
        </p>
      </Card>

      <Card className="overflow-hidden">
        <div className="flex items-center gap-2 border-b border-border px-4 py-3">
          <OctagonAlert className="size-4 text-danger" />
          <h2 className="text-sm font-semibold tracking-tight">Open blockers</h2>
          <span className="ml-auto text-xs text-muted-foreground">{ROWS.length} items</span>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Item</TableHead>
              <TableHead>Raised By</TableHead>
              <TableHead>Severity</TableHead>
              <TableHead>Age</TableHead>
              <TableHead>SLA</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {ROWS.map((r) => {
              const s = sla(r.slaDue);
              return (
                <TableRow key={r.id}>
                  <TableCell>
                    <p className="text-sm font-medium">{r.item}</p>
                    <p className="font-mono text-xs text-muted-foreground">{r.sub}</p>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{r.raisedBy}</TableCell>
                  <TableCell><SeverityBadge v={r.severity} /></TableCell>
                  <TableCell className="text-muted-foreground">{r.age}</TableCell>
                  <TableCell>
                    <span className={cn("text-sm font-medium", s.danger ? "text-danger" : "text-muted-foreground")}>
                      {s.label}
                    </span>
                  </TableCell>
                  <TableCell>{r.statusNode}</TableCell>
                  <TableCell className="text-right">
                    <FormDialog
                      trigger={<Button variant="ghost" size="sm">Resolve / escalate</Button>}
                      title="Update blocker"
                      submitLabel="Update"
                    >
                      <Field label="Action">
                        <Select>
                          <SelectTrigger><SelectValue placeholder="Select an action" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="RESOLVED">Mark resolved</SelectItem>
                            <SelectItem value="ESCALATE_TEACHER">Escalate to Teacher</SelectItem>
                            <SelectItem value="ESCALATE_LCC">Escalate to LCC</SelectItem>
                          </SelectContent>
                        </Select>
                      </Field>
                      <Field label="Note" htmlFor={`blocker-note-${r.id}`}>
                        <Textarea id={`blocker-note-${r.id}`} rows={4} placeholder="Resolution detail or escalation reason" />
                      </Field>
                    </FormDialog>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}

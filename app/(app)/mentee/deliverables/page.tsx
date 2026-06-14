import { Package, Send } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { SectionCard } from "@/components/dashboard/section-card";
import { StatusBadge } from "@/components/dashboard/status-badge";
import { Button } from "@/components/ui/button";
import { FormDialog, Field } from "@/components/ui/form-dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DELIVERABLES } from "@/lib/mock/data";
import { shortDate } from "@/lib/utils";
import type { BadgeTone } from "@/lib/labels";

const STATUS: Record<string, { text: string; tone: BadgeTone }> = {
  PENDING: { text: "Pending", tone: "warning" },
  APPROVED: { text: "Approved", tone: "success" },
  REJECTED: { text: "Rejected", tone: "danger" },
};

export default function MenteeDeliverablesPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Deliverables"
        description="Reports, decks, videos and code submitted for review."
        actions={
          <FormDialog
            trigger={
              <Button size="sm" className="gap-1.5">
                <Send className="size-3.5" /> Submit Deliverable
              </Button>
            }
            title="Submit Deliverable"
            submitLabel="Submit"
          >
            <Field label="Deliverable type" htmlFor="del-type">
              <Select>
                <SelectTrigger id="del-type">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="source-code">Source Code</SelectItem>
                  <SelectItem value="technical-report">Technical Report</SelectItem>
                  <SelectItem value="presentation">Presentation</SelectItem>
                  <SelectItem value="demo-video">Demo Video</SelectItem>
                  <SelectItem value="data-pipeline">Data Pipeline</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <Field label="Project" htmlFor="del-project">
              <Input id="del-project" placeholder="e.g. EngageIQ" />
            </Field>
            <Field label="Link" htmlFor="del-link">
              <Input id="del-link" placeholder="https://…" />
            </Field>
            <Field label="Attachment" htmlFor="del-file">
              <Input id="del-file" type="file" />
            </Field>
            <Field label="Notes" htmlFor="del-notes">
              <Textarea id="del-notes" placeholder="Anything reviewers should know?" />
            </Field>
          </FormDialog>
        }
      />

      <SectionCard title="Submissions" description={`${DELIVERABLES.length} total`} action={<Package className="size-4 text-muted-foreground" />}>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Project</TableHead>
              <TableHead>Submitted</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {DELIVERABLES.map((d) => (
              <TableRow key={d.id}>
                <TableCell className="font-medium">{d.name}</TableCell>
                <TableCell className="text-muted-foreground">{d.type}</TableCell>
                <TableCell className="text-muted-foreground">{d.project}</TableCell>
                <TableCell className="text-muted-foreground">{shortDate(d.submittedAt)}</TableCell>
                <TableCell><StatusBadge {...STATUS[d.status]} /></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </SectionCard>
    </div>
  );
}

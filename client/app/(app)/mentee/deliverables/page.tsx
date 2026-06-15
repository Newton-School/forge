import { Package } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { SectionCard } from "@/components/dashboard/section-card";
import { StatusBadge } from "@/components/dashboard/status-badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { SubmitDeliverableDialog } from "@/components/work/submit-deliverable-dialog";
import { DELIVERABLES } from "@/lib/api";
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
        actions={<SubmitDeliverableDialog />}
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

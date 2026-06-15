import { Package } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { SectionCard } from "@/components/dashboard/section-card";
import { StatusBadge } from "@/components/dashboard/status-badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DeliverableReviewActions } from "@/components/work/deliverable-review-actions";
import { DELIVERABLES } from "@/lib/api";
import { shortDate } from "@/lib/utils";

const STATUS_TONE = {
  PENDING: { text: "Pending", tone: "warning" as const },
  APPROVED: { text: "Approved", tone: "success" as const },
  REJECTED: { text: "Rejected", tone: "danger" as const },
};

export default function DeliverablesPage() {
  const pending = DELIVERABLES.filter((d) => d.status === "PENDING").length;
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Deliverables"
        description="Submissions from your mentees and teams awaiting review."
      />

      <SectionCard
        title="Submissions"
        description={`${DELIVERABLES.length} total · ${pending} pending review`}
        action={
          <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Package className="size-3.5" /> {DELIVERABLES.length} items
          </span>
        }
      >
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Project</TableHead>
              <TableHead>Submitted By</TableHead>
              <TableHead>Submitted</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {DELIVERABLES.map((d) => (
              <TableRow key={d.id}>
                <TableCell className="font-medium">{d.name}</TableCell>
                <TableCell className="text-muted-foreground">{d.type}</TableCell>
                <TableCell className="text-muted-foreground">{d.project}</TableCell>
                <TableCell className="text-muted-foreground">{d.submittedBy}</TableCell>
                <TableCell className="text-muted-foreground">{shortDate(d.submittedAt)}</TableCell>
                <TableCell>
                  <StatusBadge {...STATUS_TONE[d.status]} />
                </TableCell>
                <TableCell className="text-right">
                  {d.status === "PENDING" ? (
                    <DeliverableReviewActions deliverableId={d.id} />
                  ) : (
                    <span className="text-xs text-subtle-foreground">—</span>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </SectionCard>
    </div>
  );
}

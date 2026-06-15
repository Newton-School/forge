import { PageHeader } from "@/components/dashboard/page-header";
import { SectionCard } from "@/components/dashboard/section-card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DomainFilter } from "@/components/dashboard/domain-filter";
import { IssueDemeritDialog } from "@/components/demerits/issue-demerit-dialog";
import { EditDemeritDialog } from "@/components/demerits/edit-demerit-dialog";
import { parseDomains, inDomains } from "@/lib/domains";
import { DEMERITS } from "@/lib/api";
import { shortDate } from "@/lib/utils";

export default async function DemeritsPage({
  searchParams,
}: {
  searchParams: Promise<{ domain?: string }>;
}) {
  const sp = await searchParams;
  const selected = parseDomains(sp.domain);
  const demerits = DEMERITS.filter((d) => inDomains(d.domainKey, selected));

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Demerits"
        description="Disciplinary points issued for missed obligations"
        actions={
          <div className="flex items-center gap-2">
            <DomainFilter />
            <IssueDemeritDialog />
          </div>
        }
      />

      <SectionCard title="Issued demerits" description={`${demerits.length} records`}>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Domain</TableHead>
              <TableHead>Reason</TableHead>
              <TableHead className="text-right">Points</TableHead>
              <TableHead>Issued By</TableHead>
              <TableHead>Escalated</TableHead>
              <TableHead>When</TableHead>
              <TableHead className="text-right">Edit</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {demerits.map((d) => (
              <TableRow key={d.id}>
                <TableCell className="font-medium">{d.user}</TableCell>
                <TableCell><Badge tone="info">{d.domainKey}</Badge></TableCell>
                <TableCell className="text-muted-foreground">{d.reason}</TableCell>
                <TableCell className="text-right">
                  <span className="font-medium tabular-nums text-danger">{d.points}</span>
                </TableCell>
                <TableCell className="text-muted-foreground">{d.issuedBy}</TableCell>
                <TableCell>
                  <Badge tone={d.escalated ? "danger" : "neutral"}>
                    {d.escalated ? "Escalated" : "No"}
                  </Badge>
                </TableCell>
                <TableCell className="text-muted-foreground">{shortDate(d.when)}</TableCell>
                <TableCell className="text-right">
                  <EditDemeritDialog
                    id={d.id}
                    user={d.user}
                    reason={d.reason}
                    points={d.points}
                    escalated={d.escalated}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </SectionCard>
    </div>
  );
}

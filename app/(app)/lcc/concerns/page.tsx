import Link from "next/link";
import { PageHeader } from "@/components/dashboard/page-header";
import { SectionCard } from "@/components/dashboard/section-card";
import { SeverityBadge, ConcernBadge } from "@/components/dashboard/status-badge";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DomainFilter } from "@/components/dashboard/domain-filter";
import { parseDomains, inDomains } from "@/lib/domains";
import { CONCERNS, CONCERN_CATEGORIES } from "@/lib/mock/data";
import { shortDate, cn } from "@/lib/utils";
import type { Severity } from "@/lib/types";

const SEVERITY_RANK: Record<Severity, number> = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
const CATEGORY_LABEL = Object.fromEntries(CONCERN_CATEGORIES.map((c) => [c.value, c.label]));
const NOW = new Date("2026-06-15");

export default async function ConcernQueuePage({
  searchParams,
}: {
  searchParams: Promise<{ domain?: string }>;
}) {
  const sp = await searchParams;
  const selected = parseDomains(sp.domain);
  const concerns = CONCERNS.filter((c) => inDomains(c.domainKey, selected));

  const open = concerns.filter((c) => !["RESOLVED", "CLOSED"].includes(c.status));
  const escalated = concerns.filter((c) => c.status === "ESCALATED");

  const sorted = [...concerns].sort((a, b) => {
    const sev = SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity];
    if (sev !== 0) return sev;
    return new Date(a.slaDue).getTime() - new Date(b.slaDue).getTime();
  });

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Concern Queue"
        description="Triage and resolve concerns raised across the drive"
        actions={
          <div className="flex items-center gap-2">
            <Badge tone="info">{open.length} open</Badge>
            <Badge tone="danger">{escalated.length} escalated</Badge>
            <DomainFilter />
          </div>
        }
      />

      <SectionCard title="Concerns" description="Sorted by severity, then SLA due">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Ref</TableHead>
              <TableHead>Title</TableHead>
              <TableHead>Domain</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Severity</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Raised By</TableHead>
              <TableHead>Assigned To</TableHead>
              <TableHead className="text-right">SLA</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sorted.map((c) => {
              const overdue =
                new Date(c.slaDue) < NOW && !["RESOLVED", "CLOSED"].includes(c.status);
              return (
                <TableRow key={c.id}>
                  <TableCell>
                    <Link href={`/concerns/${c.id}`} className="font-mono text-xs text-primary hover:underline">
                      {c.ref}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <Link href={`/concerns/${c.id}`} className="font-medium hover:underline">
                      {c.title}
                    </Link>
                  </TableCell>
                  <TableCell><Badge tone="info">{c.domainKey}</Badge></TableCell>
                  <TableCell className="text-muted-foreground">{CATEGORY_LABEL[c.category] ?? c.category}</TableCell>
                  <TableCell><SeverityBadge v={c.severity} /></TableCell>
                  <TableCell><ConcernBadge v={c.status} /></TableCell>
                  <TableCell>
                    <p className="text-sm">{c.raisedBy}</p>
                    <p className="text-xs text-muted-foreground">{c.raisedByRole}</p>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{c.assignedTo}</TableCell>
                  <TableCell className="text-right">
                    <span className={cn("text-sm tabular-nums", overdue ? "font-medium text-danger" : "text-muted-foreground")}>
                      {shortDate(c.slaDue)}
                    </span>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </SectionCard>
    </div>
  );
}

import { PageHeader } from "@/components/dashboard/page-header";
import { SectionCard } from "@/components/dashboard/section-card";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DomainFilter } from "@/components/dashboard/domain-filter";
import { parseDomains, inDomains } from "@/lib/domains";
import { DOMAINS } from "@/lib/mock/data";

export default async function DomainsPage({
  searchParams,
}: {
  searchParams: Promise<{ domain?: string }>;
}) {
  const sp = await searchParams;
  const selected = parseDomains(sp.domain);
  const domains = DOMAINS.filter((d) => inDomains(d.key, selected));

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Domains"
        description="Compare AI, ML and SDSE across the drive"
        actions={<DomainFilter />}
      />

      <SectionCard title="Domain comparison" description={`${domains.length} domains`}>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Domain</TableHead>
              <TableHead>Teacher</TableHead>
              <TableHead className="text-right">Teams</TableHead>
              <TableHead className="text-right">Students</TableHead>
              <TableHead className="text-right">Mentors</TableHead>
              <TableHead className="w-48">Completion</TableHead>
              <TableHead className="text-right">At Risk</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {domains.map((d) => (
              <TableRow key={d.id}>
                <TableCell>
                  <p className="font-medium">{d.name}</p>
                  <p className="font-mono text-xs text-muted-foreground">{d.key}</p>
                </TableCell>
                <TableCell className="text-muted-foreground">{d.teacher}</TableCell>
                <TableCell className="text-right tabular-nums">{d.teams}</TableCell>
                <TableCell className="text-right tabular-nums">{d.students}</TableCell>
                <TableCell className="text-right tabular-nums">{d.mentors}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Progress
                      value={d.completion}
                      tone={d.completion >= 70 ? "success" : d.completion >= 60 ? "primary" : "warning"}
                    />
                    <span className="w-9 shrink-0 text-right text-xs font-medium tabular-nums">{d.completion}%</span>
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <span className="font-medium tabular-nums text-danger">{d.atRisk}</span>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </SectionCard>
    </div>
  );
}

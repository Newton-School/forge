import { PageHeader } from "@/components/dashboard/page-header";
import { DomainFilter } from "@/components/dashboard/domain-filter";
import { SectionCard } from "@/components/dashboard/section-card";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DomainDialog } from "@/components/org/domain-dialog";
import { api } from "@/lib/api";
import { parseDomains, inDomains } from "@/lib/domains";

export default async function AdminDomainsPage({
  searchParams,
}: {
  searchParams: Promise<{ domain?: string }>;
}) {
  const sp = await searchParams;
  const selected = parseDomains(sp.domain);
  const [allDomains, allUsers] = await Promise.all([api.domains(), api.users()]);
  const teachers = allUsers.filter((u) => u.role === "TEACHER");
  const domains = allDomains.filter((d) => inDomains(d.key, selected));

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Domains"
        description="Top-level tracks that group teams, teachers and students."
        actions={
          <>
            <DomainFilter />
            <DomainDialog teachers={teachers} />
          </>
        }
      />

      <SectionCard title="All domains" description={`${domains.length} domains`} bodyClassName="px-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="pl-4">Domain</TableHead>
              <TableHead>Key</TableHead>
              <TableHead>Teacher</TableHead>
              <TableHead className="text-right">Teams</TableHead>
              <TableHead className="text-right">Students</TableHead>
              <TableHead className="w-48">Completion</TableHead>
              <TableHead className="pr-4 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {domains.map((d) => (
              <TableRow key={d.id}>
                <TableCell className="pl-4 font-medium text-foreground">{d.name}</TableCell>
                <TableCell>
                  <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs text-muted-foreground">{d.key}</code>
                </TableCell>
                <TableCell className="text-muted-foreground">{d.teacher}</TableCell>
                <TableCell className="text-right tabular-nums">{d.teams}</TableCell>
                <TableCell className="text-right tabular-nums">{d.students}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Progress value={d.completion} tone={d.completion >= 70 ? "success" : "primary"} className="w-28" />
                    <span className="w-9 text-right text-xs tabular-nums text-muted-foreground">{d.completion}%</span>
                  </div>
                </TableCell>
                <TableCell className="pr-4 text-right">
                  <DomainDialog domain={d} teachers={teachers} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </SectionCard>
    </div>
  );
}

import { PageHeader } from "@/components/dashboard/page-header";
import { SectionCard } from "@/components/dashboard/section-card";
import { L3Badge } from "@/components/dashboard/status-badge";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { DomainFilter } from "@/components/dashboard/domain-filter";
import { parseDomains, inDomains } from "@/lib/domains";
import { TEAMS } from "@/lib/mock/data";

export default async function TeamsPage({
  searchParams,
}: {
  searchParams: Promise<{ domain?: string }>;
}) {
  const sp = await searchParams;
  const selected = parseDomains(sp.domain);
  const teams = TEAMS.filter((t) => inDomains(t.domainKey, selected));

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Teams"
        description="All project teams across every domain"
        actions={<DomainFilter />}
      />

      <SectionCard title="All teams" description={`${teams.length} teams`}>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Team</TableHead>
              <TableHead>Domain</TableHead>
              <TableHead>Mentor</TableHead>
              <TableHead className="text-right">Members</TableHead>
              <TableHead className="w-48">Completion</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {teams.map((t) => (
              <TableRow key={t.id}>
                <TableCell>
                  <p className="font-medium">{t.name}</p>
                  <p className="text-xs text-muted-foreground">{t.squad} · {t.alias}</p>
                </TableCell>
                <TableCell><Badge tone="info">{t.domainKey}</Badge></TableCell>
                <TableCell className="text-muted-foreground">{t.mentor}</TableCell>
                <TableCell className="text-right tabular-nums">{t.members}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Progress
                      value={t.completion}
                      tone={t.completion >= 75 ? "success" : t.completion >= 60 ? "primary" : "warning"}
                    />
                    <span className="w-9 shrink-0 text-right text-xs font-medium tabular-nums">{t.completion}%</span>
                  </div>
                </TableCell>
                <TableCell><L3Badge v={t.status} /></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </SectionCard>
    </div>
  );
}

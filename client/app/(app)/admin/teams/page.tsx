import { PageHeader } from "@/components/dashboard/page-header";
import { DomainFilter } from "@/components/dashboard/domain-filter";
import { SectionCard } from "@/components/dashboard/section-card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { TeamDialog } from "@/components/org/team-dialog";
import { api } from "@/lib/api";
import { parseDomains, inDomains } from "@/lib/domains";

export default async function AdminTeamsPage({
  searchParams,
}: {
  searchParams: Promise<{ domain?: string }>;
}) {
  const sp = await searchParams;
  const selected = parseDomains(sp.domain);
  const [allTeams, domains, allUsers] = await Promise.all([api.teams(), api.domains(), api.users()]);
  const mentors = allUsers.filter((u) => u.role === "MENTOR");
  const teams = allTeams.filter((t) => inDomains(t.domainKey, selected));

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Teams"
        description="Pods, groups and squads that students collaborate within."
        actions={
          <>
            <DomainFilter />
            <TeamDialog domains={domains} mentors={mentors} />
          </>
        }
      />

      <SectionCard title="All teams" description={`${teams.length} teams`} bodyClassName="px-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="pl-4">Team</TableHead>
              <TableHead>Domain</TableHead>
              <TableHead>Alias</TableHead>
              <TableHead>Mentor (Team Lead)</TableHead>
              <TableHead className="text-right">Members</TableHead>
              <TableHead className="pr-4 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {teams.map((t) => (
              <TableRow key={t.id}>
                <TableCell className="pl-4 font-medium text-foreground">{t.name}</TableCell>
                <TableCell>
                  <Badge tone="info">{t.domainKey}</Badge>
                </TableCell>
                <TableCell>
                  <Badge tone="neutral">{t.alias}</Badge>
                </TableCell>
                <TableCell className="text-muted-foreground">{t.mentor}</TableCell>
                <TableCell className="text-right tabular-nums">{t.members}</TableCell>
                <TableCell className="pr-4 text-right">
                  <TeamDialog team={t} domains={domains} mentors={mentors} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </SectionCard>
    </div>
  );
}

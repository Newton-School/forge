import { PageHeader } from "@/components/dashboard/page-header";
import { SectionCard } from "@/components/dashboard/section-card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { L3Badge } from "@/components/dashboard/status-badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { EmptyState } from "@/components/dashboard/empty-state";
import { DomainFilter } from "@/components/dashboard/domain-filter";
import { parseDomains } from "@/lib/domains";
import { getCurrentUser } from "@/lib/session";
import { TEAMS } from "@/lib/api";

export default async function TeacherTeamsPage({
  searchParams,
}: {
  searchParams: Promise<{ domain?: string }>;
}) {
  const user = await getCurrentUser();
  const myDomains = user.domainKeys ?? [];
  const sp = await searchParams;
  const picked = parseDomains(sp.domain);
  const active = picked.length ? picked.filter((d) => myDomains.includes(d)) : myDomains;

  const teams = TEAMS.filter((t) => active.includes(t.domainKey));
  const single = active.length === 1;
  const scope = single ? `the ${active[0]} domain` : active.join(", ");

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Teams"
        description={`${teams.length} groups in ${scope} · led by ${user.fullName}`}
        actions={<DomainFilter options={myDomains} />}
      />

      <SectionCard title="Teams" description="Group, mentor, squad and completion">
        {teams.length === 0 ? (
          <div className="p-4">
            <EmptyState title="No teams yet" description="Teams will appear once groups are formed." />
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Team</TableHead>
                <TableHead>Domain</TableHead>
                <TableHead>Alias</TableHead>
                <TableHead>Mentor</TableHead>
                <TableHead>Squad</TableHead>
                <TableHead className="text-right">Members</TableHead>
                <TableHead className="w-48">Completion</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {teams.map((t) => (
                <TableRow key={t.id}>
                  <TableCell className="font-medium">{t.name}</TableCell>
                  <TableCell><Badge tone="info">{t.domainKey}</Badge></TableCell>
                  <TableCell className="text-muted-foreground">{t.alias}</TableCell>
                  <TableCell className="text-muted-foreground">{t.mentor}</TableCell>
                  <TableCell className="text-muted-foreground">{t.squad}</TableCell>
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
        )}
      </SectionCard>
    </div>
  );
}

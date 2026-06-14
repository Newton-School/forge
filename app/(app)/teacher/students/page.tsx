import { PageHeader } from "@/components/dashboard/page-header";
import { SectionCard } from "@/components/dashboard/section-card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { L2Badge } from "@/components/dashboard/status-badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { EmptyState } from "@/components/dashboard/empty-state";
import { DomainFilter } from "@/components/dashboard/domain-filter";
import { parseDomains } from "@/lib/domains";
import { getCurrentUser } from "@/lib/session";
import { MENTEES } from "@/lib/mock/data";

export default async function TeacherStudentsPage({
  searchParams,
}: {
  searchParams: Promise<{ domain?: string }>;
}) {
  const user = await getCurrentUser();
  const myDomains = user.domainKeys ?? [];
  const sp = await searchParams;
  const picked = parseDomains(sp.domain);
  const active = picked.length ? picked.filter((d) => myDomains.includes(d)) : myDomains;

  const students = MENTEES.filter((m) => active.includes(m.domainKey));
  const single = active.length === 1;
  const scope = single ? `${active[0]} domain teams` : `${active.join(", ")} teams`;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Students"
        description={`${students.length} students across ${scope}`}
        actions={<DomainFilter options={myDomains} />}
      />

      <SectionCard title="Students" description="Progress and weekly status by mentee">
        {students.length === 0 ? (
          <div className="p-4">
            <EmptyState title="No students yet" description="Students will appear once enrolled." />
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student</TableHead>
                <TableHead>Domain</TableHead>
                <TableHead>Squad</TableHead>
                <TableHead>Team</TableHead>
                <TableHead>Mentor</TableHead>
                <TableHead className="w-48">Completion</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">GitHub Commits</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {students.map((m) => (
                <TableRow key={m.id}>
                  <TableCell className="font-medium">{m.name}</TableCell>
                  <TableCell><Badge tone="info">{m.domainKey}</Badge></TableCell>
                  <TableCell className="text-muted-foreground">{m.squad}</TableCell>
                  <TableCell className="text-muted-foreground">{m.team}</TableCell>
                  <TableCell className="text-muted-foreground">{m.mentor}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Progress
                        value={m.completion}
                        tone={m.completion >= 75 ? "success" : m.completion >= 60 ? "primary" : "warning"}
                      />
                      <span className="w-9 shrink-0 text-right text-xs font-medium tabular-nums">{m.completion}%</span>
                    </div>
                  </TableCell>
                  <TableCell><L2Badge v={m.statusL2} /></TableCell>
                  <TableCell className="text-right tabular-nums">{m.githubCommits}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </SectionCard>
    </div>
  );
}

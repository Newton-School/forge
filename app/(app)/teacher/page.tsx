import Link from "next/link";
import { Users, GraduationCap, UserCheck, ClipboardCheck, CircleCheck, CircleAlert, Flag } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { StatCard, StatGrid } from "@/components/dashboard/stat-card";
import { SectionCard } from "@/components/dashboard/section-card";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { L3Badge, FlagBadge } from "@/components/dashboard/status-badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DomainFilter } from "@/components/dashboard/domain-filter";
import { parseDomains, domainName } from "@/lib/domains";
import { getCurrentUser } from "@/lib/session";
import { DOMAINS, TEAMS, WEEKLY_REVIEWS } from "@/lib/mock/data";

const gates = [
  { name: "Gate 1 — Proposal", verdict: "Approved", icon: <CircleCheck />, iconClass: "text-success", chipClass: "bg-success-bg text-success" },
  { name: "Gate 2 — Milestone 1", verdict: "Pending", icon: <CircleAlert />, iconClass: "text-warning", chipClass: "bg-warning-bg text-warning" },
  { name: "Gate 3 — Panel", verdict: "Upcoming", icon: <Flag />, iconClass: "text-info", chipClass: "bg-info-bg text-info" },
];

export default async function TeacherDomainOverview({
  searchParams,
}: {
  searchParams: Promise<{ domain?: string }>;
}) {
  const user = await getCurrentUser();
  const myDomains = user.domainKeys ?? [];
  const sp = await searchParams;
  const picked = parseDomains(sp.domain);
  const active = picked.length ? picked.filter((d) => myDomains.includes(d)) : myDomains;

  const domains = DOMAINS.filter((d) => active.includes(d.key));
  const teams = TEAMS.filter((t) => active.includes(t.domainKey));
  const reviews = WEEKLY_REVIEWS.filter((r) => active.includes(r.domainKey));
  const pendingL4 = reviews.filter((r) => r.teacherDecision === null);

  const totalTeams = domains.reduce((s, d) => s + d.teams, 0);
  const totalStudents = domains.reduce((s, d) => s + d.students, 0);
  const totalMentors = domains.reduce((s, d) => s + d.mentors, 0);
  const totalAtRisk = domains.reduce((s, d) => s + d.atRisk, 0);
  const onTrack = totalStudents - totalAtRisk;

  const single = active.length === 1;
  const title = single ? `${active[0]} Domain` : `My Domains — ${active.join(", ")}`;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={title}
        description={`${user.fullName} · ${totalTeams} teams · ${totalStudents} students`}
        actions={<DomainFilter options={myDomains} />}
      />

      <StatGrid>
        <StatCard label="Teams" value={totalTeams} sub={single ? `${active[0]} domain groups` : `${active.length} domains`} icon={<Users />} />
        <StatCard label="Students" value={totalStudents} sub={`${totalMentors} mentors`} icon={<GraduationCap />} />
        <StatCard
          label="On Track / At Risk"
          value={`${onTrack} / ${totalAtRisk}`}
          sub="students by status"
          delta={{ value: `${totalAtRisk}`, direction: "up", good: false }}
          icon={<UserCheck />}
        />
        <StatCard
          label="Pending L4 Reviews"
          value={pendingL4.length}
          sub="awaiting teacher decision"
          icon={<ClipboardCheck />}
        />
      </StatGrid>

      <SectionCard
        title="Groups"
        description={single ? `Teams in the ${domainName(active[0])} domain` : "Teams across your domains"}
        action={
          <Link href="/teacher/teams" className="text-xs text-primary hover:underline">
            View all teams
          </Link>
        }
        bodyClassName="grid grid-cols-1 gap-3 p-4 sm:grid-cols-2 lg:grid-cols-3"
      >
        {teams.map((t) => (
          <Card key={t.id} className="flex flex-col gap-3 p-4">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{t.name}</p>
                <p className="truncate text-xs text-muted-foreground">{t.mentor}</p>
              </div>
              <L3Badge v={t.status} />
            </div>
            <div className="flex flex-col gap-1">
              <div className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-2 text-muted-foreground">
                  Completion
                  {!single ? <Badge tone="info">{t.domainKey}</Badge> : null}
                </span>
                <span className="font-medium tabular-nums">{t.completion}%</span>
              </div>
              <Progress
                value={t.completion}
                tone={t.completion >= 75 ? "success" : t.completion >= 60 ? "primary" : "warning"}
              />
            </div>
          </Card>
        ))}
      </SectionCard>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <SectionCard
          title="L4 review queue"
          description="Weekly reviews awaiting teacher decision"
          className="lg:col-span-2"
          action={
            <Link href="/teacher/reviews" className="text-xs text-primary hover:underline">
              Open queue
            </Link>
          }
        >
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Mentee</TableHead>
                <TableHead>Domain</TableHead>
                <TableHead>Mentor</TableHead>
                <TableHead>Flag</TableHead>
                <TableHead>Mentor Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reviews.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="font-medium">{r.mentee}</TableCell>
                  <TableCell><Badge tone="info">{r.domainKey}</Badge></TableCell>
                  <TableCell className="text-muted-foreground">{r.mentor}</TableCell>
                  <TableCell><FlagBadge v={r.autoFlag} /></TableCell>
                  <TableCell><L3Badge v={r.mentorStatus} /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </SectionCard>

        <SectionCard title="Faculty Gates" description="Project gate verdicts" bodyClassName="flex flex-col divide-y divide-border">
          {gates.map((g) => (
            <div key={g.name} className="flex items-center justify-between gap-2 px-4 py-3">
              <div className="flex items-center gap-2">
                <span className={`[&_svg]:size-4 ${g.iconClass}`}>{g.icon}</span>
                <span className="text-sm">{g.name}</span>
              </div>
              <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${g.chipClass}`}>
                {g.verdict}
              </span>
            </div>
          ))}
        </SectionCard>
      </div>
    </div>
  );
}

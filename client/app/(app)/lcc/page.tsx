import Link from "next/link";
import { Users, Boxes, ChartBar, Activity, OctagonAlert, ShieldAlert, CalendarClock } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { StatCard, StatGrid } from "@/components/dashboard/stat-card";
import { SectionCard } from "@/components/dashboard/section-card";
import { BarChart } from "@/components/dashboard/bar-chart";
import { SeverityBadge, ConcernBadge } from "@/components/dashboard/status-badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { DomainFilter } from "@/components/dashboard/domain-filter";
import { parseDomains, inDomains } from "@/lib/domains";
import { DRIVE_HEALTH, DOMAINS, CONCERNS, TEAMS } from "@/lib/api";
import type { Severity } from "@/lib/types";

const SEVERITY_RANK: Record<Severity, number> = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };

export default async function GlobalDashboard({
  searchParams,
}: {
  searchParams: Promise<{ domain?: string }>;
}) {
  const sp = await searchParams;
  const selected = parseDomains(sp.domain);
  const h = DRIVE_HEALTH;

  const domains = DOMAINS.filter((d) => inDomains(d.key, selected));

  const domainBars = domains.map((d) => ({
    label: d.key,
    value: d.completion,
    tone: (d.completion >= 70 ? "success" : d.completion >= 60 ? "primary" : "warning") as
      | "success"
      | "primary"
      | "warning",
  }));

  const openConcerns = CONCERNS.filter(
    (c) => !["RESOLVED", "CLOSED"].includes(c.status) && inDomains(c.domainKey, selected),
  ).sort((a, b) => SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity]);

  const inactiveTeams = TEAMS.filter(
    (t) => t.status !== "ON_TRACK" && inDomains(t.domainKey, selected),
  );

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Drive Command Center"
        description="Cross-domain health for the Profile Building Drive"
        actions={<DomainFilter />}
      />

      <StatGrid className="lg:grid-cols-4 xl:grid-cols-4">
        <StatCard label="Students" value={h.totalStudents} sub={`${h.totalDomains} domains`} icon={<Users />} />
        <StatCard label="Mentors" value={h.totalMentors} sub="active mentors" icon={<Users />} />
        <StatCard label="Teams" value={h.totalTeams} sub="across all domains" icon={<Boxes />} />
        <StatCard
          label="Completion"
          value={`${h.completionRate}%`}
          sub="drive-wide average"
          delta={{ value: "4%", direction: "up", good: true }}
          icon={<ChartBar />}
        />
        <StatCard
          label="Active Blockers"
          value={h.activeBlockers}
          sub="reported this week"
          icon={<Activity />}
        />
        <StatCard
          label="Open Concerns"
          value={h.openConcerns}
          sub={`${h.escalatedConcerns} escalated`}
          delta={{ value: `${h.escalatedConcerns}`, direction: "up", good: false }}
          icon={<OctagonAlert />}
        />
        <StatCard
          label="Inactive Teams"
          value={h.inactiveTeams}
          sub="no activity 7d+"
          icon={<ShieldAlert />}
        />
        <StatCard
          label="Update Compliance"
          value={`${h.weeklyUpdateCompliance}%`}
          sub="bi-daily logs"
          delta={{ value: "2%", direction: "up", good: true }}
          icon={<CalendarClock />}
        />
      </StatGrid>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <SectionCard
          title="Domain comparison"
          description="Completion rate by domain"
          className="lg:col-span-2"
          bodyClassName="p-4"
        >
          <BarChart data={domainBars} />
        </SectionCard>

        <SectionCard title="Attention" description="Items needing LCC follow-up" bodyClassName="flex flex-col divide-y divide-border">
          <div className="flex items-center justify-between px-4 py-3">
            <span className="flex items-center gap-2 text-sm">
              <ShieldAlert className="size-4 text-warning" />
              Inactive teams
            </span>
            <span className="text-sm font-semibold tabular-nums text-warning">{h.inactiveTeams}</span>
          </div>
          <div className="flex items-center justify-between px-4 py-3">
            <span className="flex items-center gap-2 text-sm">
              <CalendarClock className="size-4 text-danger" />
              Delayed deliverables
            </span>
            <span className="text-sm font-semibold tabular-nums text-danger">{h.delayedDeliverables}</span>
          </div>
          <div className="flex items-center justify-between px-4 py-3">
            <span className="flex items-center gap-2 text-sm">
              <OctagonAlert className="size-4 text-danger" />
              Escalated concerns
            </span>
            <span className="text-sm font-semibold tabular-nums text-danger">{h.escalatedConcerns}</span>
          </div>
          <div className="flex items-center justify-between px-4 py-3">
            <span className="flex items-center gap-2 text-sm">
              <Activity className="size-4 text-warning" />
              Active blockers
            </span>
            <span className="text-sm font-semibold tabular-nums text-warning">{h.activeBlockers}</span>
          </div>
        </SectionCard>
      </div>

      <SectionCard
        title="Open concerns"
        description="Highest-severity first"
        action={
          <Link href="/lcc/concerns" className="text-xs text-primary hover:underline">
            View queue
          </Link>
        }
      >
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Ref</TableHead>
              <TableHead>Title</TableHead>
              <TableHead>Domain</TableHead>
              <TableHead>Severity</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Assigned To</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {openConcerns.map((c) => (
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
                <TableCell><SeverityBadge v={c.severity} /></TableCell>
                <TableCell><ConcernBadge v={c.status} /></TableCell>
                <TableCell className="text-muted-foreground">{c.assignedTo}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </SectionCard>

      <SectionCard title="Teams needing discussion" description="Off-track teams across domains">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Team</TableHead>
              <TableHead>Domain</TableHead>
              <TableHead>Mentor</TableHead>
              <TableHead className="text-right">Completion</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {inactiveTeams.map((t) => (
              <TableRow key={t.id}>
                <TableCell className="font-medium">{t.name}</TableCell>
                <TableCell><Badge tone="info">{t.domainKey}</Badge></TableCell>
                <TableCell className="text-muted-foreground">{t.mentor}</TableCell>
                <TableCell className="text-right tabular-nums">{t.completion}%</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </SectionCard>
    </div>
  );
}

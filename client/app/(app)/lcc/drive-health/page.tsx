import { Users, Boxes, ChartBar, Activity, OctagonAlert, CalendarClock } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { StatCard, StatGrid } from "@/components/dashboard/stat-card";
import { SectionCard } from "@/components/dashboard/section-card";
import { BarChart } from "@/components/dashboard/bar-chart";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { DomainFilter } from "@/components/dashboard/domain-filter";
import { parseDomains, inDomains } from "@/lib/domains";
import { DRIVE_HEALTH, DOMAINS } from "@/lib/api";

export default async function DriveHealthPage({
  searchParams,
}: {
  searchParams: Promise<{ domain?: string }>;
}) {
  const sp = await searchParams;
  const selected = parseDomains(sp.domain);
  const h = DRIVE_HEALTH;

  const domains = DOMAINS.filter((d) => inDomains(d.key, selected));

  const completionBars = domains.map((d) => ({
    label: d.key,
    value: d.completion,
    tone: (d.completion >= 70 ? "success" : d.completion >= 60 ? "primary" : "warning") as
      | "success"
      | "primary"
      | "warning",
  }));

  // Fabricated plausible per-domain rollups derived from DOMAINS.
  const complianceBars = domains.map((d) => ({
    label: d.key,
    value: Math.min(100, Math.round(d.completion + 16)),
    tone: "primary" as const,
  }));

  const concernBars = domains.map((d) => ({
    label: d.key,
    value: Math.max(1, Math.round(d.atRisk / 2)),
    tone: (d.atRisk >= 10 ? "danger" : "warning") as "danger" | "warning",
  }));

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Drive Health"
        description="Detailed rollups across every domain in the drive"
        actions={<DomainFilter />}
      />

      <StatGrid>
        <StatCard label="Students" value={h.totalStudents} sub={`${h.totalTeams} teams`} icon={<Users />} />
        <StatCard label="Mentors" value={h.totalMentors} sub={`${h.totalDomains} domains`} icon={<Boxes />} />
        <StatCard label="Completion" value={`${h.completionRate}%`} sub="drive-wide" icon={<ChartBar />} />
        <StatCard label="Update Compliance" value={`${h.weeklyUpdateCompliance}%`} sub="bi-daily logs" icon={<CalendarClock />} />
        <StatCard label="Active Blockers" value={h.activeBlockers} sub="this week" icon={<Activity />} />
        <StatCard label="Open Concerns" value={h.openConcerns} sub={`${h.escalatedConcerns} escalated`} icon={<OctagonAlert />} />
        <StatCard label="Inactive Teams" value={h.inactiveTeams} sub="no activity 7d+" icon={<Boxes />} />
        <StatCard label="Onboarding" value={`${h.onboardingComplete}%`} sub="accounts active" icon={<Users />} />
      </StatGrid>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <SectionCard title="Completion by domain" description="Average project completion" bodyClassName="p-4">
          <BarChart data={completionBars} />
        </SectionCard>
        <SectionCard title="Update compliance by domain" description="Bi-daily log submission" bodyClassName="p-4">
          <BarChart data={complianceBars} />
        </SectionCard>
        <SectionCard title="Concern volume by domain" description="Open concerns (count)" bodyClassName="p-4">
          <BarChart data={concernBars} suffix="" />
        </SectionCard>
      </div>

      <SectionCard title="Domain breakdown" description="Completion and at-risk counts per domain">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Domain</TableHead>
              <TableHead>Teacher</TableHead>
              <TableHead className="text-right">Teams</TableHead>
              <TableHead className="text-right">Students</TableHead>
              <TableHead className="w-48">Completion</TableHead>
              <TableHead className="text-right">At Risk</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {domains.map((d) => (
              <TableRow key={d.id}>
                <TableCell>
                  <Badge tone="info">{d.key}</Badge>
                  <span className="ml-2 text-xs text-muted-foreground">{d.name}</span>
                </TableCell>
                <TableCell className="text-muted-foreground">{d.teacher}</TableCell>
                <TableCell className="text-right tabular-nums">{d.teams}</TableCell>
                <TableCell className="text-right tabular-nums">{d.students}</TableCell>
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

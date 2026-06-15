import { ChartBar, OctagonAlert, Activity, CalendarClock } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { StatCard, StatGrid } from "@/components/dashboard/stat-card";
import { SectionCard } from "@/components/dashboard/section-card";
import { BarChart } from "@/components/dashboard/bar-chart";
import { DomainFilter } from "@/components/dashboard/domain-filter";
import { parseDomains, inDomains } from "@/lib/domains";
import { DRIVE_HEALTH, DOMAINS } from "@/lib/api";

export default async function AnalyticsPage({
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

  // Fabricated resolution-rate and engagement series derived from DOMAINS.
  const resolutionBars = domains.map((d) => ({
    label: d.key,
    value: Math.min(100, Math.round(100 - d.atRisk * 3)),
    tone: "success" as const,
  }));

  const engagementBars = domains.map((d) => ({
    label: d.key,
    value: Math.min(100, Math.round(d.completion + 10)),
    tone: "primary" as const,
  }));

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Analytics"
        description="Headline KPIs and trends across the drive"
        actions={<DomainFilter />}
      />

      <StatGrid>
        <StatCard label="Avg Completion" value={`${h.completionRate}%`} sub="drive-wide" delta={{ value: "4%", direction: "up", good: true }} icon={<ChartBar />} />
        <StatCard label="Update Compliance" value={`${h.weeklyUpdateCompliance}%`} sub="bi-daily logs" delta={{ value: "2%", direction: "up", good: true }} icon={<CalendarClock />} />
        <StatCard label="Open Concerns" value={h.openConcerns} sub={`${h.escalatedConcerns} escalated`} icon={<OctagonAlert />} />
        <StatCard label="Active Blockers" value={h.activeBlockers} sub="this week" icon={<Activity />} />
      </StatGrid>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <SectionCard title="Completion by domain" description="Average project completion" bodyClassName="p-4">
          <BarChart data={completionBars} />
        </SectionCard>
        <SectionCard title="Concern resolution rate" description="Closed vs raised" bodyClassName="p-4">
          <BarChart data={resolutionBars} />
        </SectionCard>
        <SectionCard title="Engagement" description="Activity index by domain" bodyClassName="p-4">
          <BarChart data={engagementBars} />
        </SectionCard>
      </div>
    </div>
  );
}

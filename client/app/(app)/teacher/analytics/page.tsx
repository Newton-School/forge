import { Users, GraduationCap, ChartBar, ShieldCheck } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { StatCard, StatGrid } from "@/components/dashboard/stat-card";
import { SectionCard } from "@/components/dashboard/section-card";
import { BarChart } from "@/components/dashboard/bar-chart";
import { DomainFilter } from "@/components/dashboard/domain-filter";
import { parseDomains } from "@/lib/domains";
import { getCurrentUser } from "@/lib/session";
import { DOMAINS, TEAMS, MENTEES } from "@/lib/api";

type ChartTone = "success" | "primary" | "warning";

function completionTone(value: number): ChartTone {
  return value >= 75 ? "success" : value >= 60 ? "primary" : "warning";
}

export default async function TeacherAnalyticsPage({
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
  const students = MENTEES.filter((m) => active.includes(m.domainKey));

  const single = active.length === 1;

  const totalTeams = domains.reduce((s, d) => s + d.teams, 0);
  const totalStudents = domains.reduce((s, d) => s + d.students, 0);
  const totalMentors = domains.reduce((s, d) => s + d.mentors, 0);
  const totalAtRisk = domains.reduce((s, d) => s + d.atRisk, 0);
  const avgCompletion = domains.length
    ? Math.round(domains.reduce((s, d) => s + d.completion, 0) / domains.length)
    : 0;

  const teamCompletion = teams.map((t) => ({
    label: single ? t.name : `${t.domainKey} · ${t.name}`,
    value: t.completion,
    tone: completionTone(t.completion),
  }));

  // Per-domain average completion (the cross-domain view); falls back to team
  // completion when the teacher is scoped to a single domain.
  const domainCompletion = domains.map((d) => ({
    label: d.key,
    value: d.completion,
    tone: completionTone(d.completion),
  }));

  const avgCommits = students.length
    ? Math.round(students.reduce((s, m) => s + m.githubCommits, 0) / students.length)
    : 0;

  const scope = single ? `${active[0]} domain` : `${active.join(", ")} domains`;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Domain Analytics"
        description={`${scope} — completion, compliance and engagement KPIs`}
        actions={<DomainFilter options={myDomains} />}
      />

      <StatGrid>
        <StatCard label="Avg Completion" value={`${avgCompletion}%`} sub={`across ${scope}`} icon={<ChartBar />} />
        <StatCard label="Teams" value={totalTeams} sub={`${totalMentors} mentors`} icon={<Users />} />
        <StatCard label="Students" value={totalStudents} sub={`${totalAtRisk} at risk`} icon={<GraduationCap />} />
        <StatCard label="Avg GitHub Commits" value={avgCommits} sub="per active student" icon={<ShieldCheck />} />
      </StatGrid>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <SectionCard
          title="Team completion %"
          description={single ? `Completion by ${active[0]} team` : "Completion by team across your domains"}
          bodyClassName="p-4"
        >
          <BarChart data={teamCompletion} />
        </SectionCard>

        <SectionCard
          title={single ? "Update compliance by squad" : "Completion by domain"}
          description={single ? "Weekly bi-daily update compliance" : "Average completion per domain"}
          bodyClassName="p-4"
        >
          {single ? (
            <BarChart
              data={[
                { label: "Alpha", value: 92, tone: "primary" },
                { label: "Beta", value: 74, tone: "primary" },
                { label: "Gamma", value: 81, tone: "primary" },
              ]}
            />
          ) : (
            <BarChart data={domainCompletion} />
          )}
        </SectionCard>
      </div>
    </div>
  );
}

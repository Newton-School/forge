import { getActiveDomain, getOrgRoster, getOrgAnalytics } from "@/lib/session";
import { RepoDomainDashboard as RepoView } from "@/components/github/repo/views";
import { PageHeader } from "@/components/dashboard/page-header";
import { SectionCard } from "@/components/dashboard/section-card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { OrgMentorsLive } from "@/components/github/org-mentors-live";
import { allMentorAnalytics } from "@/lib/api";

const HEALTH = { Healthy: "success", Watch: "warning", "At risk": "danger" } as const;

export default async function TeacherMentorPerformance() {
  const activeDomain = await getActiveDomain();
  if (activeDomain !== "AI") return <RepoView domain={activeDomain} basePath="/teacher/github" />;

  // Production: real mentor roster + per-repo throughput. Presentation/offline/empty: mock below.
  const roster = await getOrgRoster();
  if (roster && roster.teams.length > 0) {
    const org = await getOrgAnalytics();
    return (
      <div className="flex flex-col gap-6">
        <PageHeader title="Mentor Performance" description="Each team's mentor and their repo's live throughput" />
        <SectionCard title="Mentors" description={`${roster.teams.filter((t) => t.mentor || t.mentors.length).length} mentors`} bodyClassName="p-0">
          <OrgMentorsLive roster={roster} org={org} />
        </SectionCard>
      </div>
    );
  }

  const mentors = allMentorAnalytics();
  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Mentor Performance" description="Review throughput and team health per mentor" />
      <SectionCard title="Mentors" description={`${mentors.length} mentors`} bodyClassName="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Mentor</TableHead>
              <TableHead>Team</TableHead>
              <TableHead className="text-right">Reviews</TableHead>
              <TableHead className="text-right">PRs reviewed</TableHead>
              <TableHead className="text-right">Team commits</TableHead>
              <TableHead className="text-right">Merge rate</TableHead>
              <TableHead>Team health</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {mentors.map((m) => (
              <TableRow key={m.userId}>
                <TableCell className="font-medium">{m.name}</TableCell>
                <TableCell className="text-muted-foreground">{m.teamName}</TableCell>
                <TableCell className="text-right tabular-nums">{m.reviewsCompleted}</TableCell>
                <TableCell className="text-right tabular-nums">{m.prsReviewed}</TableCell>
                <TableCell className="text-right tabular-nums">{m.teamCommits}</TableCell>
                <TableCell className="text-right tabular-nums">{m.teamMergeRate}%</TableCell>
                <TableCell><Badge tone={HEALTH[m.teamHealth]}>{m.teamHealth}</Badge></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </SectionCard>
    </div>
  );
}
